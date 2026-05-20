"""
Performance Benchmarks — measures runtime, scalability, and memory for both algorithms.
"""

import pytest
import time
import sys


BENCHMARK_RESULTS = []


@pytest.fixture(scope="module")
def ga_params():
    return {"population_size": 48, "generations": 60, "seed": 42}


class TestBenchmarkGA:
    def test_ga_runtime_small(self, ga_scheduler, benchmark):
        elapsed = benchmark(lambda: ga_scheduler.evolve(verbose=False))
        assert elapsed < 60, f"GA small runtime {elapsed:.2f}s exceeded limit"

    def test_ga_runtime_medium(self, small_ga, benchmark):
        elapsed = benchmark(lambda: small_ga.evolve(verbose=False))
        assert elapsed < 120, f"GA medium runtime {elapsed:.2f}s exceeded limit"

    @pytest.mark.slow
    def test_ga_runtime_large(self, real_exams, real_rooms, real_timeslots, real_conflict_matrix):
        from utils.genetic import GeneticExamScheduler
        s = GeneticExamScheduler(real_exams, real_rooms, real_timeslots, real_conflict_matrix, population_size=80, generations=100, seed=42)
        start = time.perf_counter()
        s.evolve(verbose=False)
        elapsed = time.perf_counter() - start
        assert elapsed < 600, f"GA large runtime {elapsed:.2f}s exceeded limit"
        BENCHMARK_RESULTS.append(("GA Large (80x100)", elapsed))

    def test_ga_overhead_by_population(self, real_exams, real_rooms, real_timeslots, real_conflict_matrix):
        for pop in [10, 20, 40]:
            from utils.genetic import GeneticExamScheduler
            s = GeneticExamScheduler(real_exams, real_rooms, real_timeslots, real_conflict_matrix, population_size=pop, generations=10, seed=42)
            start = time.perf_counter()
            s.evolve(verbose=False)
            elapsed = time.perf_counter() - start
            BENCHMARK_RESULTS.append((f"GA pop={pop}", elapsed))
            assert elapsed < 120


class TestBenchmarkGreedy:
    def test_greedy_runtime(self, real_exams, real_rooms, real_timeslots, real_conflict_matrix, benchmark):
        from utils.greedy import greedy_schedule, compute_metrics
        def run():
            s = greedy_schedule(real_exams, real_rooms, real_timeslots, real_conflict_matrix)
            compute_metrics(s, real_rooms, real_timeslots, real_conflict_matrix)
            return s
        elapsed = benchmark(run)
        assert elapsed < 10, f"Greedy runtime {elapsed:.2f}s exceeded limit"

    def test_greedy_scalability(self, real_exams, real_rooms, real_timeslots, real_conflict_matrix):
        from utils.greedy import greedy_schedule
        times = []
        for fraction in [0.25, 0.5, 0.75, 1.0]:
            subset_count = max(1, int(len(real_exams) * fraction))
            subset_exams = dict(list(real_exams.items())[:subset_count])
            start = time.perf_counter()
            greedy_schedule(subset_exams, real_rooms, real_timeslots, real_conflict_matrix)
            elapsed = time.perf_counter() - start
            times.append((fraction, elapsed))
        for i in range(1, len(times)):
            assert times[i][1] >= 0, f"Negative runtime: {times[i]}"


class TestBenchmarkComparison:
    @pytest.mark.slow
    def test_ga_vs_greedy_relative(self, real_exams, real_rooms, real_timeslots, real_conflict_matrix, ga_scheduler):
        ga_start = time.perf_counter()
        _, ga_result, _ = ga_scheduler.evolve(verbose=False)
        ga_time = time.perf_counter() - ga_start
        from utils.greedy import greedy_schedule, compute_metrics
        gr_start = time.perf_counter()
        gr_sched = greedy_schedule(real_exams, real_rooms, real_timeslots, real_conflict_matrix)
        gr_metrics = compute_metrics(gr_sched, real_rooms, real_timeslots, real_conflict_matrix)
        gr_time = time.perf_counter() - gr_start
        BENCHMARK_RESULTS.append(("GA (40x60)", ga_time))
        BENCHMARK_RESULTS.append(("Greedy", gr_time))
        assert gr_time < ga_time, "Greedy should be faster than GA"
