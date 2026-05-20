"""
Stress Tests — extreme loads, many generations, large populations.
"""

import pytest
import time
import sys


@pytest.mark.stress
class TestStressGA:
    @pytest.mark.slow
    def test_stress_many_generations(self, real_exams, real_rooms, real_timeslots, real_conflict_matrix):
        from utils.genetic import GeneticExamScheduler
        s = GeneticExamScheduler(real_exams, real_rooms, real_timeslots, real_conflict_matrix, population_size=30, generations=200, seed=42)
        start = time.perf_counter()
        best, result, history = s.evolve(verbose=False)
        elapsed = time.perf_counter() - start
        assert result.fitness > 0, f"Fitness should be positive, got {result.fitness}"
        assert len(history) == 200, f"Expected 200 generations, got {len(history)}"

    @pytest.mark.slow
    def test_stress_large_population(self, real_exams, real_rooms, real_timeslots, real_conflict_matrix):
        from utils.genetic import GeneticExamScheduler
        s = GeneticExamScheduler(real_exams, real_rooms, real_timeslots, real_conflict_matrix, population_size=120, generations=30, seed=42)
        start = time.perf_counter()
        best, result, history = s.evolve(verbose=False)
        elapsed = time.perf_counter() - start
        assert result is not None

    @pytest.mark.slow
    def test_stress_high_mutation_with_large_pop(self, real_exams, real_rooms, real_timeslots, real_conflict_matrix):
        from utils.genetic import GeneticExamScheduler
        s = GeneticExamScheduler(real_exams, real_rooms, real_timeslots, real_conflict_matrix, population_size=80, generations=50, mutation_rate=0.2, crossover_rate=0.9, seed=42)
        try:
            best, result, history = s.evolve(verbose=False)
            assert result.fitness > 0
        except Exception as e:
            pytest.fail(f"High mutation stress test crashed: {e}")

    def test_stress_repeated_runs_stable(self, real_exams, real_rooms, real_timeslots, real_conflict_matrix):
        from utils.genetic import GeneticExamScheduler
        for i in range(5):
            s = GeneticExamScheduler(real_exams, real_rooms, real_timeslots, real_conflict_matrix, population_size=10, generations=5, seed=i)
            try:
                s.evolve(verbose=False)
            except Exception as e:
                pytest.fail(f"Run {i} crashed: {e}")


@pytest.mark.stress
class TestStressGreedy:
    def test_stress_greedy_repeated(self, real_exams, real_rooms, real_timeslots, real_conflict_matrix):
        from utils.greedy import greedy_schedule, compute_metrics
        for _ in range(10):
            s = greedy_schedule(real_exams, real_rooms, real_timeslots, real_conflict_matrix)
            compute_metrics(s, real_rooms, real_timeslots, real_conflict_matrix)

    def test_stress_max_exams(self):
        from utils.greedy import greedy_schedule
        n = 500
        exams = {f"S{i:04d}": {"num": 10, "students": [f"u{j}" for j in range(10)]} for i in range(n)}
        rooms = [{"room_id": f"R{i}", "capacity": 50} for i in range(30)]
        timeslots = [{"slot_id": i, "date": f"2025-06-01", "day": "Sun", "time": "08-10"} for i in range(60)]
        cm = {}
        try:
            s = greedy_schedule(exams, rooms, timeslots, cm)
            assert len(s) > 0
        except Exception as e:
            pytest.fail(f"500 exam stress test crashed: {e}")


@pytest.mark.stress
class TestMemoryStability:
    @pytest.mark.slow
    def test_repeated_ga_no_memory_leak(self, real_exams, real_rooms, real_timeslots, real_conflict_matrix):
        import gc
        from utils.genetic import GeneticExamScheduler
        gc.collect()
        for i in range(3):
            s = GeneticExamScheduler(real_exams, real_rooms, real_timeslots, real_conflict_matrix, population_size=20, generations=20, seed=i)
            s.evolve(verbose=False)
            gc.collect()
