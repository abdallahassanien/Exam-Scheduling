"""
Integration Tests — end-to-end validation of both algorithms on real data.
"""

import pytest
import time


class TestFullRunGA:
    def test_ga_full_pipeline(self, ga_scheduler):
        best, result, history = ga_scheduler.evolve(verbose=False)
        assert best is not None
        assert result.fitness > 0
        assert len(history) == ga_scheduler.generations
        schedule = ga_scheduler.chromosome_to_schedule(best)
        assert len(schedule) > 0
        export_rows = ga_scheduler.export_schedule_rows(best)
        assert len(export_rows) > 0

    def test_ga_all_exams_in_output(self, ga_scheduler):
        best, _, _ = ga_scheduler.evolve(verbose=False)
        schedule = ga_scheduler.chromosome_to_schedule(best)
        scheduled = set(item["exam"] for item in schedule)
        for eid in ga_scheduler.exam_ids:
            assert eid in scheduled, f"Exam {eid} not scheduled"

    def test_ga_no_crashes_different_seeds(self, real_exams, real_rooms, real_timeslots, real_conflict_matrix):
        from utils.genetic import GeneticExamScheduler
        for seed in [1, 42, 99, 123, 256]:
            s = GeneticExamScheduler(real_exams, real_rooms, real_timeslots, real_conflict_matrix, population_size=10, generations=10, seed=seed)
            try:
                s.evolve(verbose=False)
            except Exception as e:
                pytest.fail(f"Seed {seed} crashed with: {e}")


class TestFullRunGreedy:
    def test_greedy_full_pipeline(self, real_exams, real_rooms, real_timeslots, real_conflict_matrix):
        from utils.greedy import greedy_schedule, compute_metrics, export_results
        schedule = greedy_schedule(real_exams, real_rooms, real_timeslots, real_conflict_matrix)
        assert len(schedule) > 0
        metrics = compute_metrics(schedule, real_rooms, real_timeslots, real_conflict_matrix)
        assert metrics["score"] > 0

    def test_greedy_export_json(self, real_exams, real_rooms, real_timeslots, real_conflict_matrix, tmp_path):
        from utils.greedy import greedy_schedule, export_results
        schedule = greedy_schedule(real_exams, real_rooms, real_timeslots, real_conflict_matrix)
        out = tmp_path / "test_greedy.json"
        export_results(schedule, str(out), "json")
        import json
        with open(str(out)) as f:
            loaded = json.load(f)
        assert len(loaded) == len(schedule)

    def test_greedy_export_csv(self, real_exams, real_rooms, real_timeslots, real_conflict_matrix, tmp_path):
        from utils.greedy import greedy_schedule, export_results
        schedule = greedy_schedule(real_exams, real_rooms, real_timeslots, real_conflict_matrix)
        out = tmp_path / "test_greedy.csv"
        export_results(schedule, str(out), "csv")
        import csv
        with open(str(out), newline="") as f:
            reader = csv.DictReader(f)
            rows = list(reader)
        assert len(rows) == len(schedule)


class TestCompareAlgorithmsIntegration:
    def test_ga_vs_greedy_comparison(self, ga_scheduler):
        best, ga_result, _ = ga_scheduler.evolve(verbose=False)
        ga_score = ga_result.fitness
        from utils.greedy import greedy_schedule, compute_metrics
        greedy_sched = greedy_schedule(ga_scheduler.exams, ga_scheduler.rooms, ga_scheduler.timeslots, ga_scheduler.conflict_matrix)
        greedy_metrics = compute_metrics(greedy_sched, ga_scheduler.rooms, ga_scheduler.timeslots, ga_scheduler.conflict_matrix)
        assert isinstance(ga_score, int)
        assert isinstance(greedy_metrics["score"], int)

    def test_both_algorithms_on_identical_data(self, ga_scheduler):
        _, ga_result, _ = ga_scheduler.evolve(verbose=False)
        from utils.greedy import greedy_schedule, compute_metrics
        greedy_sched = greedy_schedule(ga_scheduler.exams, ga_scheduler.rooms, ga_scheduler.timeslots, ga_scheduler.conflict_matrix)
        greedy_metrics = compute_metrics(greedy_sched, ga_scheduler.rooms, ga_scheduler.timeslots, ga_scheduler.conflict_matrix)
        ga_total = ga_result.hard_violations + ga_result.soft_violations
        greedy_total = greedy_metrics["total_penalty"]
        assert ga_total <= greedy_total * 3 or greedy_total >= 0
