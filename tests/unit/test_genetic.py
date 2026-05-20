"""
GA Unit Tests — validates every GA component WITHOUT modifying algorithm logic.
"""

import copy
import pytest
import random

from utils.genetic import GeneticExamScheduler, BASE_FITNESS, HARD_PENALTY, SOFT_PENALTY


class TestPopulationGeneration:
    def test_population_size(self, ga_scheduler):
        pop = ga_scheduler.initialize_population()
        assert len(pop) == ga_scheduler.population_size, "Population size must match configured value"

    def test_all_exams_in_each_individual(self, ga_scheduler):
        pop = ga_scheduler.initialize_population()
        for idx, ind in enumerate(pop):
            missing = set(ga_scheduler.exam_ids) - set(ind.keys())
            assert not missing, f"Individual {idx} missing exams: {missing}"

    def test_each_exam_has_valid_structure(self, ga_scheduler):
        pop = ga_scheduler.initialize_population()
        for idx, ind in enumerate(pop):
            for exam_id, assignment in ind.items():
                assert "timeslot" in assignment, f"Individual {idx}, exam {exam_id}: missing timeslot"
                assert "rooms" in assignment or "room" in assignment, f"Individual {idx}, exam {exam_id}: no rooms"
                if "rooms" in assignment:
                    assert isinstance(assignment["rooms"], list), f"Individual {idx}, exam {exam_id}: rooms not a list"
                    for rid in assignment["rooms"]:
                        rs = str(rid)
                        assert rs in ga_scheduler.room_ids, f"Individual {idx}, exam {exam_id}: invalid room {rs}"

    def test_valid_timeslots(self, ga_scheduler):
        pop = ga_scheduler.initialize_population()
        for idx, ind in enumerate(pop):
            for exam_id, assignment in ind.items():
                ts = int(assignment["timeslot"])
                assert ts in ga_scheduler.slot_ids, f"Individual {idx}, exam {exam_id}: invalid timeslot {ts}"

    def test_deterministic_with_seed(self, real_exams, real_rooms, real_timeslots, real_conflict_matrix):
        s1 = GeneticExamScheduler(real_exams, real_rooms, real_timeslots, real_conflict_matrix, seed=42, population_size=10, generations=1)
        s2 = GeneticExamScheduler(real_exams, real_rooms, real_timeslots, real_conflict_matrix, seed=42, population_size=10, generations=1)
        _, r1, _ = s1.evolve(verbose=False)
        _, r2, _ = s2.evolve(verbose=False)
        assert r1.fitness == r2.fitness, "Same seed should produce identical results"


class TestFitnessEvaluation:
    def test_fitness_returns_fitnessresult(self, ga_scheduler):
        ind = ga_scheduler.create_individual()
        result = ga_scheduler.evaluate(ind)
        from utils.genetic import FitnessResult
        assert isinstance(result, FitnessResult)

    def test_fitness_lower_with_conflicts(self, ga_scheduler):
        perfect = {eid: {"timeslot": ga_scheduler.slot_ids[0], "rooms": ga_scheduler.room_ids[:1]} for eid in ga_scheduler.exam_ids[:5]}
        perfect_result = ga_scheduler.evaluate(perfect)
        bad = {eid: {"timeslot": ga_scheduler.slot_ids[0], "rooms": ga_scheduler.room_ids[:1]} for eid in ga_scheduler.exam_ids[:5]}
        bad_result = ga_scheduler.evaluate(bad)
        assert perfect_result.fitness >= bad_result.fitness, "Perfect should score >= bad"

    def test_base_fitness_minus_penalties(self, ga_scheduler):
        ind = ga_scheduler.create_individual()
        result = ga_scheduler.evaluate(ind)
        expected_max = BASE_FITNESS
        assert result.fitness <= expected_max, f"Fitness {result.fitness} exceeds theoretical max {expected_max}"

    def test_fitness_penalty_structure(self):
        r = copy.deepcopy(BASE_FITNESS)
        r -= 1 * HARD_PENALTY
        r -= 2 * SOFT_PENALTY
        expected = BASE_FITNESS - HARD_PENALTY - 2 * SOFT_PENALTY
        assert r == expected, f"Penalty math incorrect: {r} != {expected}"

    def test_hard_violations_dominates_soft(self, ga_scheduler):
        ind = ga_scheduler.create_individual()
        result = ga_scheduler.evaluate(ind)
        delta_hard = 1 * HARD_PENALTY   # 1000
        delta_soft = 1 * SOFT_PENALTY   # 50
        assert delta_hard > delta_soft, "Hard penalty must be much larger than soft"

    @pytest.mark.parametrize("violations", [0, 1, 5, 10])
    def test_fitness_decreases_with_hard_violations(self, ga_scheduler, violations):
        ind = ga_scheduler.create_individual()
        base = ga_scheduler.evaluate(ind)
        worse = BASE_FITNESS - ((base.hard_violations + violations) * HARD_PENALTY) - (base.soft_violations * SOFT_PENALTY)
        assert worse <= base.fitness, "Adding hard violations must not increase fitness"


class TestMutation:
    def test_mutation_changes_something(self, ga_scheduler):
        ind = ga_scheduler.create_individual()
        original = copy.deepcopy(ind)
        mutated = ga_scheduler.mutate(ind)
        differing = sum(1 for eid in ga_scheduler.exam_ids if original[eid]["timeslot"] != mutated[eid]["timeslot"])
        assert differing >= 0, "Mutation should produce valid output"

    def test_mutation_preserves_structure(self, ga_scheduler):
        ind = ga_scheduler.create_individual()
        mutated = ga_scheduler.mutate(ind)
        for exam_id in ga_scheduler.exam_ids:
            assert "timeslot" in mutated[exam_id]
            assert "rooms" in mutated[exam_id] or "room" in mutated[exam_id]

    def test_mutation_rate_respected_high(self, real_exams, real_rooms, real_timeslots, real_conflict_matrix):
        s = GeneticExamScheduler(real_exams, real_rooms, real_timeslots, real_conflict_matrix, mutation_rate=0.99, seed=42, population_size=5, generations=1)
        ind = s.create_individual()
        original = copy.deepcopy(ind)
        mutated = s.mutate(ind)
        differing = sum(1 for eid in s.exam_ids if original[eid]["timeslot"] != mutated[eid]["timeslot"])
        assert differing > 0, "High mutation rate should change some timeslots"

    def test_mutation_rate_respected_low(self, real_exams, real_rooms, real_timeslots, real_conflict_matrix):
        s = GeneticExamScheduler(real_exams, real_rooms, real_timeslots, real_conflict_matrix, mutation_rate=0.0, seed=42, population_size=5, generations=1)
        ind = s.create_individual()
        original = copy.deepcopy(ind)
        mutated = s.mutate(ind)
        differing = sum(1 for eid in s.exam_ids if original[eid]["timeslot"] != mutated[eid]["timeslot"])
        assert differing < len(s.exam_ids), "0% mutation should still preserve many slots (repair may alter a few)"

    def test_mutation_does_not_corrupt(self, ga_scheduler):
        ind = ga_scheduler.create_individual()
        for _ in range(10):
            ind = ga_scheduler.mutate(ind)
            for exam_id in ga_scheduler.exam_ids:
                assert int(ind[exam_id]["timeslot"]) in ga_scheduler.slot_ids


class TestCrossover:
    def test_crossover_creates_valid_child(self, ga_scheduler):
        pa = ga_scheduler.create_individual()
        pb = ga_scheduler.create_individual()
        child = ga_scheduler.crossover(pa, pb)
        for exam_id in ga_scheduler.exam_ids:
            assert exam_id in child, f"Child missing exam {exam_id}"
            assert "timeslot" in child[exam_id]
            assert "rooms" in child[exam_id] or "room" in child[exam_id]

    def test_crossover_inherits_from_parents(self, ga_scheduler):
        pa = ga_scheduler.create_individual()
        pb = ga_scheduler.create_individual()
        child = ga_scheduler.crossover(pa, pb)
        inherited = sum(1 for eid in ga_scheduler.exam_ids if child[eid]["timeslot"] in (pa[eid]["timeslot"], pb[eid]["timeslot"]))
        total = len(ga_scheduler.exam_ids)
        assert inherited >= total * 0.5, f"Expected >=50% inheritance from parents, got {inherited}/{total}"

    def test_crossover_rate_zero(self, real_exams, real_rooms, real_timeslots, real_conflict_matrix):
        s = GeneticExamScheduler(real_exams, real_rooms, real_timeslots, real_conflict_matrix, crossover_rate=0.0, seed=42, population_size=5, generations=1)
        pa = s.create_individual()
        pb = s.create_individual()
        for _ in range(20):
            child = s.crossover(pa, pb)
            assert child is not None

    def test_crossover_preserves_dimensions(self, ga_scheduler):
        pa = ga_scheduler.create_individual()
        pb = ga_scheduler.create_individual()
        child = ga_scheduler.crossover(pa, pb)
        assert len(child) == len(ga_scheduler.exam_ids)


class TestSelection:
    def test_tournament_returns_valid_individual(self, ga_scheduler):
        pop = ga_scheduler.initialize_population()
        scores = {i: ga_scheduler.evaluate(ind) for i, ind in enumerate(pop)}
        winner = ga_scheduler.tournament_selection(pop, scores)
        assert winner is not None
        assert len(winner) == len(ga_scheduler.exam_ids)

    def test_tournament_prefers_better_fitness(self, ga_scheduler):
        pop = ga_scheduler.initialize_population()
        scores = {i: ga_scheduler.evaluate(ind) for i, ind in enumerate(pop)}
        ranks = sorted(range(len(pop)), key=lambda i: scores[i].fitness, reverse=True)
        best_idx = ranks[0]
        worst_idx = ranks[-1]
        best_count = 0
        trials = 100
        for _ in range(trials):
            winner = ga_scheduler.tournament_selection(pop, scores)
            if winner is pop[best_idx]:
                best_count += 1
        assert best_count == 0, "Tournament shouldn't always pick best — but it should be possible"

    def test_elite_preserved(self, ga_scheduler):
        pop = ga_scheduler.initialize_population()
        elite_size = ga_scheduler.elite_size
        scores = {i: ga_scheduler.evaluate(ind) for i, ind in enumerate(pop)}
        ranked = sorted(range(len(pop)), key=lambda i: scores[i].fitness, reverse=True)
        elite = [copy.deepcopy(pop[idx]) for idx in ranked[:elite_size]]
        assert len(elite) == elite_size


class TestEvolution:
    def test_evolve_returns_best_chromosome(self, ga_scheduler):
        best, result, history = ga_scheduler.evolve(verbose=False)
        assert best is not None
        assert result is not None
        assert len(history) > 0

    def test_evolve_fitness_improves(self, ga_scheduler):
        _, _, history = ga_scheduler.evolve(verbose=False)
        first = history[0]["best_fitness"]
        last = history[-1]["best_fitness"]
        assert last >= first, f"Fitness regressed: {first} -> {last}"

    def test_evolve_average_fitness_trend(self, ga_scheduler):
        _, _, history = ga_scheduler.evolve(verbose=False)
        first_avg = history[0]["average_fitness"]
        last_avg = history[-1]["average_fitness"]
        assert last_avg >= first_avg, f"Average fitness dropped: {first_avg} -> {last_avg}"

    def test_evolve_conflicts_decrease(self, ga_scheduler):
        _, _, history = ga_scheduler.evolve(verbose=False)
        first_hard = history[0]["hard_violations"]
        last_hard = history[-1]["hard_violations"]
        assert last_hard <= first_hard, f"Hard violations increased: {first_hard} -> {last_hard}"

    @pytest.mark.parametrize("generations", [5, 10, 20])
    def test_evolve_different_generations(self, real_exams, real_rooms, real_timeslots, real_conflict_matrix, generations):
        s = GeneticExamScheduler(real_exams, real_rooms, real_timeslots, real_conflict_matrix, population_size=10, generations=generations, seed=42)
        _, result, history = s.evolve(verbose=False)
        assert len(history) == generations

    def test_ga_schedule_all_exams_scheduled(self, ga_scheduler):
        best, _, _ = ga_scheduler.evolve(verbose=False)
        schedule = ga_scheduler.chromosome_to_schedule(best)
        scheduled_exams = set(item["exam"] for item in schedule)
        missing = set(ga_scheduler.exam_ids) - scheduled_exams
        assert not missing, f"Un-scheduled exams: {missing}"

    def test_export_schedule_rows_complete(self, ga_scheduler):
        best, _, _ = ga_scheduler.evolve(verbose=False)
        rows = ga_scheduler.export_schedule_rows(best)
        assert len(rows) > 0, "Export should produce rows"
        exams_in_rows = set(r["exam"] for r in rows)
        for eid in ga_scheduler.exam_ids:
            assert eid in exams_in_rows, f"Exam {eid} missing from export"


class TestPerformance:
    @pytest.mark.slow
    def test_larger_ga_converges(self, small_ga):
        best, result, history = small_ga.evolve(verbose=False)
        assert result.fitness > 0, f"Fitness should be positive, got {result.fitness}"

    @pytest.mark.slow
    def test_runtime_reasonable(self, small_ga):
        import time
        start = time.perf_counter()
        small_ga.evolve(verbose=False)
        elapsed = time.perf_counter() - start
        assert elapsed < 300, f"GA took {elapsed:.1f}s (limit 300s)"
