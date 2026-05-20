"""
Genetic Algorithm exam scheduler with multi-room exam allocation.

Chromosomes are represented as:

    {
        "EXAM_ID": {"timeslot": 0, "rooms": ["330A", "330B", ...]},
        ...
    }

If an exam has more registered students than one room can hold, the scheduler
assigns multiple rooms in the same timeslot and splits the student IDs across
those rooms for CSV export.
"""

from __future__ import annotations

import copy
import random
from dataclasses import dataclass
from typing import Dict, Iterable, List, Optional, Tuple

from utils import constraints


POPULATION_SIZE = 80
GENERATIONS = 150
MUTATION_RATE = 0.08
CROSSOVER_RATE = 0.85
ELITE_SIZE = 4
TOURNAMENT_SIZE = 4

BASE_FITNESS = 100_000
HARD_PENALTY = 1_000
SOFT_PENALTY = 50


Assignment = Dict[str, object]
Chromosome = Dict[str, Assignment]
Schedule = List[Dict[str, object]]


@dataclass(frozen=True)
class FitnessResult:
    fitness: int
    hard_violations: int
    soft_violations: int
    room_double_bookings: int
    student_clashes: int
    room_capacity_violations: int
    same_day_student_clashes: int
    uneven_day_distribution: int


class GeneticExamScheduler:
    """GA implementation adapted to this project's data structures."""

    def __init__(
        self,
        exams: Dict[str, Dict[str, object]],
        rooms: List[Dict[str, object]],
        timeslots: List[Dict[str, object]],
        conflict_matrix: Dict[str, set],
        population_size: int = POPULATION_SIZE,
        generations: int = GENERATIONS,
        mutation_rate: float = MUTATION_RATE,
        crossover_rate: float = CROSSOVER_RATE,
        elite_size: int = ELITE_SIZE,
        tournament_size: int = TOURNAMENT_SIZE,
        seed: Optional[int] = None,
    ) -> None:
        if not exams:
            raise ValueError("No exams loaded.")
        if not rooms:
            raise ValueError("No usable rooms loaded.")
        if not timeslots:
            raise ValueError("No timeslots loaded.")

        self.exams = exams
        self.rooms = rooms
        self.timeslots = timeslots
        self.conflict_matrix = conflict_matrix
        self.population_size = population_size
        self.generations = generations
        self.mutation_rate = mutation_rate
        self.crossover_rate = crossover_rate
        self.elite_size = min(elite_size, population_size)
        self.tournament_size = min(tournament_size, population_size)
        self.random = random.Random(seed)

        self.exam_ids = list(exams.keys())
        self.room_ids = [str(room["room_id"]) for room in rooms]
        self.slot_ids = [int(slot["slot_id"]) for slot in timeslots]
        self.room_by_id = {str(room["room_id"]): room for room in rooms}
        self.timeslot_by_id = {int(slot["slot_id"]): slot for slot in timeslots}
        self.slot_date = {int(slot["slot_id"]): slot["date"] for slot in timeslots}
        self.rooms_by_capacity_desc = sorted(
            rooms, key=lambda room: int(room["capacity"]), reverse=True
        )
        self.history: List[Dict[str, int]] = []

    def _student_chunks_for_exam(self, exam_id: str, room_ids: List[str]) -> List[Dict[str, object]]:
        students = list(self.exams[exam_id]["students"])
        chunks = []
        start = 0

        for room_id in room_ids:
            capacity = int(self.room_by_id[str(room_id)]["capacity"])
            end = min(start + capacity, len(students))
            room_students = students[start:end]
            chunks.append(
                {
                    "room_id": str(room_id),
                    "room_capacity": capacity,
                    "students": room_students,
                    "students_in_room": len(room_students),
                }
            )
            start = end

        return chunks

    def _compact_exam_schedule(self, schedule: Schedule) -> Schedule:
        compact = []
        seen = set()
        for assignment in schedule:
            key = assignment['exam']
            if key in seen:
                continue
            seen.add(key)
            compact.append({
                'exam': assignment['exam'],
                'room_id': assignment['room_id'],
                'slot_id': assignment['slot_id'],
            })
        return compact

    def _room_capacity_violations(self, schedule: Schedule) -> int:
        violations = 0
        room_capacity = {str(r['room_id']): int(r['capacity']) for r in self.rooms}
        assigned_counts = {}
        for assignment in schedule:
            room_id = str(assignment['room_id'])
            students_in_room = int(assignment.get('students_in_room', 0))
            if students_in_room > room_capacity.get(room_id, 0):
                violations += 1
            exam = assignment['exam']
            assigned_counts[exam] = assigned_counts.get(exam, 0) + students_in_room
        for exam_id, info in self.exams.items():
            expected = len(info['students'])
            if assigned_counts.get(exam_id, 0) != expected:
                violations += 1
        return violations

    def chromosome_to_schedule(self, chromosome: Chromosome) -> Schedule:
        schedule = []

        for exam_id, assignment in chromosome.items():
            slot_id = int(assignment["timeslot"])
            room_ids = [str(room_id) for room_id in assignment.get("rooms", [])]
            if not room_ids and "room" in assignment:
                room_ids = [str(assignment["room"])]

            for chunk in self._student_chunks_for_exam(exam_id, room_ids):
                schedule.append(
                    {
                        "exam": exam_id,
                        "slot_id": slot_id,
                        "room_id": chunk["room_id"],
                        "students_in_room": chunk["students_in_room"],
                        "student_ids": chunk["students"],
                    }
                )

        return schedule

    def evaluate(self, chromosome: Chromosome) -> FitnessResult:
        schedule = self.chromosome_to_schedule(chromosome)

        room_double = constraints.no_room_double_booking(schedule)
        compact = self._compact_exam_schedule(schedule)
        student_clash = constraints.no_student_clash(compact, self.conflict_matrix)
        room_capacity = self._room_capacity_violations(schedule)
        same_day = constraints.one_exam_per_student_per_day(
            compact, self.conflict_matrix, self.timeslots
        )
        spread = constraints.exams_spread_evenly(compact, self.timeslots)

        hard = room_double + student_clash + room_capacity + same_day
        soft = spread
        fit = BASE_FITNESS - (hard * HARD_PENALTY) - (soft * SOFT_PENALTY)

        return FitnessResult(
            fitness=fit,
            hard_violations=hard,
            soft_violations=soft,
            room_double_bookings=room_double,
            student_clashes=student_clash,
            room_capacity_violations=room_capacity,
            same_day_student_clashes=same_day,
            uneven_day_distribution=spread,
        )

    def _allocate_rooms_for_exam(
        self, exam_id: str, slot_id: int, used_room_slots: Optional[set] = None
    ) -> List[str]:
        required = len(self.exams[exam_id]["students"])
        remaining = required
        selected = []

        available_rooms = []
        fallback_rooms = []
        for room in self.rooms_by_capacity_desc:
            room_id = str(room["room_id"])
            if used_room_slots is None or (room_id, slot_id) not in used_room_slots:
                available_rooms.append(room)
            else:
                fallback_rooms.append(room)

        for room in available_rooms + fallback_rooms:
            room_id = str(room["room_id"])
            if room_id in selected:
                continue
            selected.append(room_id)
            remaining -= int(room["capacity"])
            if remaining <= 0:
                break

        if remaining > 0:
            raise ValueError(
                f"Total room capacity cannot fit exam {exam_id} with {required} students."
            )

        return selected

    def _conflicts_with_slot_or_day(
        self, exam_id: str, slot_id: int, assignments: Chromosome
    ) -> bool:
        date = self.slot_date[slot_id]
        conflicts = self.conflict_matrix.get(exam_id, set())
        for other_exam, assignment in assignments.items():
            if other_exam not in conflicts:
                continue
            other_slot = int(assignment["timeslot"])
            if other_slot == slot_id or self.slot_date[other_slot] == date:
                return True
        return False

    def _random_assignment(
        self, exam_id: str, used_room_slots: Optional[set] = None
    ) -> Assignment:
        slot_id = self.random.choice(self.slot_ids)
        room_ids = self._allocate_rooms_for_exam(exam_id, slot_id, used_room_slots)
        return {"timeslot": slot_id, "rooms": room_ids}

    def create_individual(self) -> Chromosome:
        chromosome: Chromosome = {}
        used_room_slots = set()
        ordered_exams = sorted(
            self.exam_ids,
            key=lambda e: (len(self.conflict_matrix.get(e, set())), self.exams[e]["num"]),
            reverse=True,
        )

        for exam_id in ordered_exams:
            assignment = None
            shuffled_slots = self.slot_ids[:]
            self.random.shuffle(shuffled_slots)

            for slot_id in shuffled_slots:
                if self._conflicts_with_slot_or_day(exam_id, slot_id, chromosome):
                    continue
                room_ids = self._allocate_rooms_for_exam(exam_id, slot_id, used_room_slots)
                if all((room_id, slot_id) not in used_room_slots for room_id in room_ids):
                    assignment = {"timeslot": slot_id, "rooms": room_ids}
                    break

            if assignment is None:
                assignment = self._random_assignment(exam_id, used_room_slots)

            chromosome[exam_id] = assignment
            slot_id = int(assignment["timeslot"])
            for room_id in assignment["rooms"]:
                used_room_slots.add((str(room_id), slot_id))

        return chromosome

    def initialize_population(self) -> List[Chromosome]:
        return [self.create_individual() for _ in range(self.population_size)]

    def tournament_selection(
        self, population: List[Chromosome], scores: Dict[int, FitnessResult]
    ) -> Chromosome:
        competitors = self.random.sample(range(len(population)), self.tournament_size)
        winner_idx = max(competitors, key=lambda idx: scores[idx].fitness)
        return copy.deepcopy(population[winner_idx])

    def crossover(self, parent_a: Chromosome, parent_b: Chromosome) -> Chromosome:
        if self.random.random() > self.crossover_rate:
            return copy.deepcopy(parent_a)

        child: Chromosome = {}
        for exam_id in self.exam_ids:
            source = parent_a if self.random.random() < 0.5 else parent_b
            child[exam_id] = copy.deepcopy(source[exam_id])
        return self.repair(child)

    def mutate(self, chromosome: Chromosome) -> Chromosome:
        mutated = copy.deepcopy(chromosome)
        for exam_id in self.exam_ids:
            if self.random.random() >= self.mutation_rate:
                continue

            mutated[exam_id]["timeslot"] = self.random.choice(self.slot_ids)

        return self.repair(mutated)

    def repair(self, chromosome: Chromosome) -> Chromosome:
        repaired: Chromosome = {}
        used_room_slots = set()

        ordered_exams = sorted(
            self.exam_ids,
            key=lambda e: (len(self.conflict_matrix.get(e, set())), self.exams[e]["num"]),
            reverse=True,
        )

        for exam_id in ordered_exams:
            assignment = chromosome.get(exam_id, {})
            slot = assignment.get("timeslot")
            if slot not in self.slot_ids:
                slot = self.random.choice(self.slot_ids)
            slot = int(slot)

            if self._conflicts_with_slot_or_day(exam_id, slot, repaired):
                shuffled = self.slot_ids[:]
                self.random.shuffle(shuffled)
                found = False
                for alt_slot in shuffled:
                    if not self._conflicts_with_slot_or_day(exam_id, alt_slot, repaired):
                        slot = alt_slot
                        found = True
                        break
                if not found:
                    slot = shuffled[0]

            room_ids = self._allocate_rooms_for_exam(exam_id, slot, used_room_slots)
            repaired[exam_id] = {"timeslot": slot, "rooms": room_ids}
            for room_id in room_ids:
                used_room_slots.add((str(room_id), slot))

        return repaired

    def evolve(self, verbose: bool = True) -> Tuple[Chromosome, FitnessResult, List[Dict[str, int]]]:
        population = self.initialize_population()
        best_chromosome = None
        best_result = None

        for generation in range(1, self.generations + 1):
            scores = {idx: self.evaluate(individual) for idx, individual in enumerate(population)}
            ranked = sorted(
                range(len(population)),
                key=lambda idx: scores[idx].fitness,
                reverse=True,
            )

            generation_best = population[ranked[0]]
            generation_result = scores[ranked[0]]
            avg_fitness = int(
                sum(result.fitness for result in scores.values()) / len(scores)
            )

            if best_result is None or generation_result.fitness > best_result.fitness:
                best_chromosome = copy.deepcopy(generation_best)
                best_result = generation_result

            self.history.append(
                {
                    "generation": generation,
                    "best_fitness": generation_result.fitness,
                    "average_fitness": avg_fitness,
                    "hard_violations": generation_result.hard_violations,
                    "soft_violations": generation_result.soft_violations,
                }
            )

            if verbose and (generation == 1 or generation % 10 == 0):
                print(
                    f"Generation {generation:>4}: "
                    f"best={generation_result.fitness:>7} "
                    f"avg={avg_fitness:>7} "
                    f"hard={generation_result.hard_violations:>4} "
                    f"soft={generation_result.soft_violations:>3}"
                )

            next_population = [
                copy.deepcopy(population[idx]) for idx in ranked[: self.elite_size]
            ]
            while len(next_population) < self.population_size:
                parent_a = self.tournament_selection(population, scores)
                parent_b = self.tournament_selection(population, scores)
                child = self.crossover(parent_a, parent_b)
                child = self.mutate(child)
                next_population.append(child)

            population = next_population

        assert best_chromosome is not None
        assert best_result is not None
        return best_chromosome, best_result, self.history

    def export_schedule_rows(self, chromosome: Chromosome) -> List[Dict[str, object]]:
        return export_schedule_rows(chromosome, self.exams, self.rooms, self.timeslots)


def export_schedule_rows(
    chromosome: Chromosome,
    exams: Dict[str, Dict[str, object]],
    rooms: List[Dict[str, object]],
    timeslots: Iterable[Dict[str, object]],
) -> List[Dict[str, object]]:
    room_by_id = {str(room["room_id"]): room for room in rooms}
    timeslot_by_id = {int(slot["slot_id"]): slot for slot in timeslots}
    rows = []

    for exam_id, assignment in chromosome.items():
        slot_id = int(assignment["timeslot"])
        slot = timeslot_by_id[slot_id]
        students = list(exams[exam_id]["students"])
        total_students = len(students)
        start = 0

        room_ids = [str(room_id) for room_id in assignment.get("rooms", [])]
        if not room_ids and "room" in assignment:
            room_ids = [str(assignment["room"])]

        for room_index, room_id in enumerate(room_ids):
            room = room_by_id[room_id]
            capacity = int(room["capacity"])
            end = min(start + capacity, len(students))
            room_students = students[start:end]
            rows.append(
                {
                    "exam": exam_id,
                    "total students": total_students,
                    "room": room_id,
                    "room capacity": capacity,
                    "students in room": len(room_students),
                    "student ids": "+".join(room_students),
                    "date": slot["date"],
                    "day": slot["day"],
                    "time": slot["time"],
                    "_sort_date": slot["date"],
                    "_sort_time": slot["time"],
                    "_room_index": room_index,
                }
            )
            start = end

    sorted_rows = sorted(
        rows,
        key=lambda row: (
            row["_sort_date"],
            row["_sort_time"],
            row["exam"],
            row["_room_index"],
        ),
    )
    for row in sorted_rows:
        row.pop("_sort_date", None)
        row.pop("_sort_time", None)
        row.pop("_room_index", None)
    return sorted_rows


def format_schedule_table(
    chromosome: Chromosome, timeslots: Optional[Iterable[Dict[str, object]]] = None
) -> List[Tuple[str, object, object]]:
    slot_lookup = {}
    if timeslots is not None:
        slot_lookup = {
            int(ts["slot_id"]): f"{ts['slot_id']} ({ts['date']} {ts['time']})"
            for ts in timeslots
        }

    keyed_rows = []
    for exam_id, assignment in chromosome.items():
        slot_id = int(assignment["timeslot"])
        room_ids = ", ".join(str(room_id) for room_id in assignment.get("rooms", []))
        keyed_rows.append((slot_id, exam_id, slot_lookup.get(slot_id, slot_id), room_ids))

    return [
        (exam_id, timeslot, rooms)
        for _, exam_id, timeslot, rooms in sorted(
            keyed_rows, key=lambda row: (row[0], row[1])
        )
    ]
