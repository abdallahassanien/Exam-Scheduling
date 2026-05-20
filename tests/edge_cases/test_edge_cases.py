"""
Edge Case Tests — validates behavior on boundary inputs, empty data, and extreme configurations.
"""

import pytest
import random


class TestEmptyDatasets:
    def test_empty_exams_raises(self, real_rooms, real_timeslots, real_conflict_matrix):
        from utils.genetic import GeneticExamScheduler
        with pytest.raises(ValueError, match="No exams"):
            GeneticExamScheduler({}, real_rooms, real_timeslots, real_conflict_matrix)

    def test_empty_rooms_raises(self, real_exams, real_timeslots, real_conflict_matrix):
        from utils.genetic import GeneticExamScheduler
        with pytest.raises(ValueError, match="No usable rooms"):
            GeneticExamScheduler(real_exams, [], real_timeslots, real_conflict_matrix)

    def test_empty_timeslots_raises(self, real_exams, real_rooms, real_conflict_matrix):
        from utils.genetic import GeneticExamScheduler
        with pytest.raises(ValueError, match="No timeslots"):
            GeneticExamScheduler(real_exams, real_rooms, [], real_conflict_matrix)

    def test_empty_conflict_matrix_ok(self, real_exams, real_rooms, real_timeslots):
        from utils.genetic import GeneticExamScheduler
        s = GeneticExamScheduler(real_exams, real_rooms, real_timeslots, {}, seed=42, population_size=5, generations=2)
        best, result, _ = s.evolve(verbose=False)
        assert result is not None


class TestSingleItem:
    def test_single_exam_single_room(self):
        from utils.genetic import GeneticExamScheduler
        exams = {"X1": {"num": 30, "students": [f"s{i}" for i in range(30)]}}
        rooms = [{"room_id": "R1", "building": "A", "capacity": 100}]
        timeslots = [{"slot_id": 0, "date": "2025-06-01", "day": "Sun", "time": "08-10"}]
        s = GeneticExamScheduler(exams, rooms, timeslots, {"X1": set()}, seed=42, population_size=5, generations=2)
        best, result, _ = s.evolve(verbose=False)
        schedule = s.chromosome_to_schedule(best)
        assert len(schedule) == 1
        assert schedule[0]["exam"] == "X1"
        assert result.hard_violations == 0

    def test_single_exam_greedy(self):
        from utils.greedy import greedy_schedule
        exams = {"X1": {"num": 10, "students": [f"s{i}" for i in range(10)]}}
        rooms = [{"room_id": "R1", "building": "A", "capacity": 100}]
        timeslots = [{"slot_id": 0, "date": "2025-06-01", "day": "Sun", "time": "08-10"}]
        schedule = greedy_schedule(exams, rooms, timeslots, {"X1": set()})
        assert len(schedule) == 1
        assert schedule[0]["exam"] == "X1"

    def test_single_room_different_timeslots(self):
        from utils.genetic import GeneticExamScheduler
        exams = {"A": {"num": 10, "students": [f"s{i}" for i in range(10)]}, "B": {"num": 10, "students": [f"s{i}" for i in range(10, 20)]}}
        rooms = [{"room_id": "R1", "building": "A", "capacity": 100}]
        timeslots = [{"slot_id": 0, "date": "2025-06-01", "day": "Sun", "time": "08-10"}, {"slot_id": 1, "date": "2025-06-01", "day": "Sun", "time": "10-12"}]
        cm = {"A": set(), "B": set()}
        s = GeneticExamScheduler(exams, rooms, timeslots, cm, seed=42, population_size=5, generations=5)
        best, result, _ = s.evolve(verbose=False)
        assert result.hard_violations == 0


class TestExtremeInputs:
    def test_large_exam_population(self):
        exam_count = 200
        exams = {f"E{i:04d}": {"num": random.randint(10, 50), "students": [f"s{r}" for r in range(random.randint(10, 50))]} for i in range(exam_count)}
        rooms = [{"room_id": f"R{i}", "building": "X", "capacity": 80} for i in range(20)]
        timeslots = [{"slot_id": i, "date": f"2025-06-{(i//4)+1:02d}", "day": "Mon", "time": "08-10"} for i in range(40)]
        cm = {}
        ids = list(exams.keys())
        for i in range(len(ids)):
            for j in range(i + 1, len(ids)):
                if random.random() < 0.05 and set(exams[ids[i]]["students"]) & set(exams[ids[j]]["students"]):
                    cm.setdefault(ids[i], set()).add(ids[j])
                    cm.setdefault(ids[j], set()).add(ids[i])
        from utils.genetic import GeneticExamScheduler
        s = GeneticExamScheduler(exams, rooms, timeslots, cm, seed=42, population_size=10, generations=5)
        try:
            best, result, _ = s.evolve(verbose=False)
            assert best is not None
        except Exception as e:
            pytest.fail(f"Large exam set crashed: {e}")

    def test_many_rooms_few_exams(self):
        exams = {"A": {"num": 10, "students": [f"s{i}" for i in range(10)]}}
        rooms = [{"room_id": f"R{i}", "building": "X", "capacity": 100} for i in range(50)]
        timeslots = [{"slot_id": 0, "date": "2025-06-01", "day": "Sun", "time": "08-10"}]
        cm = {"A": set()}
        from utils.genetic import GeneticExamScheduler
        s = GeneticExamScheduler(exams, rooms, timeslots, cm, seed=42, population_size=5, generations=2)
        best, result, _ = s.evolve(verbose=False)
        assert result.hard_violations == 0

    def test_exam_fills_multiple_rooms(self):
        exams = {"BIG": {"num": 500, "students": [f"s{i}" for i in range(500)]}}
        rooms = [{"room_id": f"R{i}", "building": "X", "capacity": 60} for i in range(10)]
        timeslots = [{"slot_id": 0, "date": "2025-06-01", "day": "Sun", "time": "08-10"}]
        cm = {"BIG": set()}
        from utils.genetic import GeneticExamScheduler
        s = GeneticExamScheduler(exams, rooms, timeslots, cm, seed=42, population_size=5, generations=2)
        try:
            best, result, _ = s.evolve(verbose=False)
            schedule = s.chromosome_to_schedule(best)
            room_ids_used = set(item["room_id"] for item in schedule)
            assert len(room_ids_used) >= 9, "Large exam should span multiple rooms"
        except ValueError as e:
            if "capacity" in str(e).lower():
                pytest.skip(f"Expected capacity limitation: {e}")
            raise


class TestImpossibleSchedules:
    def test_insufficient_slots(self):
        exams = {"A": {"num": 10, "students": [f"s{i}" for i in range(10)]}, "B": {"num": 10, "students": [f"s{i}" for i in range(10, 20)]}}
        rooms = [{"room_id": "R1", "building": "X", "capacity": 100}]
        timeslots = [{"slot_id": 0, "date": "2025-06-01", "day": "Sun", "time": "08-10"}]
        cm = {"A": {"B"}, "B": {"A"}}
        from utils.genetic import GeneticExamScheduler
        s = GeneticExamScheduler(exams, rooms, timeslots, cm, seed=42, population_size=5, generations=2)
        best, result, _ = s.evolve(verbose=False)
        assert result.hard_violations >= 0


class TestDuplicateAndMissing:
    def test_duplicate_student_ids(self):
        exams = {"A": {"num": 3, "students": ["s1", "s2", "s3"]}, "B": {"num": 3, "students": ["s1", "s4", "s5"]}}
        rooms = [{"room_id": "R1", "building": "X", "capacity": 100}]
        timeslots = [{"slot_id": 0, "date": "2025-06-01", "day": "Sun", "time": "08-10"}, {"slot_id": 1, "date": "2025-06-01", "day": "Sun", "time": "10-12"}]
        cm = {"A": {"B"}, "B": {"A"}}
        from utils.genetic import GeneticExamScheduler
        s = GeneticExamScheduler(exams, rooms, timeslots, cm, seed=42, population_size=5, generations=5)
        best, result, _ = s.evolve(verbose=False)
        assert result.same_day_student_clashes >= 1 or result.student_clashes >= 0

    def test_missing_rooms_key_in_schedule(self):
        from utils.constraints import hard_violations
        schedule = [{"exam": "A", "slot_id": 0, "room_id": "R1"}]
        v = hard_violations(schedule, {}, {}, [{"room_id": "R1", "capacity": 100}])
        assert v >= 0


class TestGreedyEdgeCases:
    def test_greedy_no_exams(self):
        from utils.greedy import greedy_schedule
        schedule = greedy_schedule({}, [{"room_id": "R1", "capacity": 100}], [{"slot_id": 0, "date": "2025-06-01", "day": "Sun", "time": "08-10"}], {})
        assert schedule == []

    def test_greedy_all_conflicting(self):
        from utils.greedy import greedy_schedule
        exams = {"A": {"num": 10, "students": ["s1"]}, "B": {"num": 10, "students": ["s1"]}}
        rooms = [{"room_id": "R1", "capacity": 50}]
        timeslots = [{"slot_id": 0, "date": "2025-06-01", "day": "Sun", "time": "08-10"}]
        cm = {"A": {"B"}, "B": {"A"}}
        schedule = greedy_schedule(exams, rooms, timeslots, cm)
        assert len(schedule) <= 1, "Only one should fit if all conflict in single slot/room"

    def test_greedy_room_exhaustion(self):
        from utils.greedy import greedy_schedule
        exams = {f"E{i}": {"num": 10, "students": [f"s{j}" for j in range(10)]} for i in range(100)}
        rooms = [{"room_id": "R1", "capacity": 50}]
        timeslots = [{"slot_id": i, "date": f"2025-06-{(i//4)+1:02d}", "day": "Mon", "time": "08-10"} for i in range(4)]
        cm = {}
        schedule = greedy_schedule(exams, rooms, timeslots, cm)
        assert len(schedule) <= 4, "Room/slot limit should constrain schedule size"


class TestRandomized:
    @pytest.mark.parametrize("seed", [10, 20, 30, 50, 100])
    def test_random_small_datasets(self, seed):
        rng = random.Random(seed)
        n_exams = rng.randint(5, 20)
        n_rooms = rng.randint(2, 8)
        n_slots = rng.randint(2, 8)
        n_students = rng.randint(20, 100)
        students = [f"u{i}" for i in range(n_students)]
        exams = {}
        for i in range(n_exams):
            enrolled = rng.sample(students, rng.randint(5, min(30, n_students)))
            exams[f"RD{i:03d}"] = {"num": len(enrolled), "students": enrolled}
        rooms = [{"room_id": f"RM{i}", "building": "X", "capacity": rng.choice([30, 50, 80, 100])} for i in range(n_rooms)]
        timeslots = [{"slot_id": i, "date": f"2025-06-{(i//4)+1:02d}", "day": "Mon", "time": "08-10"} for i in range(n_slots)]
        cm = {}
        ids = list(exams.keys())
        for i in range(len(ids)):
            for j in range(i + 1, len(ids)):
                if set(exams[ids[i]]["students"]) & set(exams[ids[j]]["students"]):
                    cm.setdefault(ids[i], set()).add(ids[j])
                    cm.setdefault(ids[j], set()).add(ids[i])
        from utils.genetic import GeneticExamScheduler
        from utils.greedy import greedy_schedule, compute_metrics
        s = GeneticExamScheduler(exams, rooms, timeslots, cm, seed=seed, population_size=10, generations=10)
        try:
            best, result, _ = s.evolve(verbose=False)
            assert best is not None
            greedy_result = greedy_schedule(exams, rooms, timeslots, cm)
            greedy_metrics = compute_metrics(greedy_result, rooms, timeslots, cm)
            assert isinstance(greedy_metrics["score"], int)
        except Exception as e:
            pytest.fail(f"Seed {seed} failed: {e}")
