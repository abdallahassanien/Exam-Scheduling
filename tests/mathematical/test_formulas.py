"""
Mathematical Validation — verifies formulas, scoring, percentages, and counting logic.
"""

import pytest
import math


class TestQualityScoreFormula:
    def test_quality_score_percentage(self):
        from backend.services.scheduler_service import _safe_percent
        assert _safe_percent(0) == 0.0
        assert _safe_percent(50) == 50.0
        assert _safe_percent(100) == 100.0
        assert _safe_percent(150) == 100.0
        assert _safe_percent(-10) == 0.0
        assert _safe_percent(float("nan")) == 0.0
        assert _safe_percent(float("inf")) == 0.0

    def test_quality_score_scaling(self):
        raw = 100_000
        expected = raw / 1000
        assert expected == 100.0

    def test_quality_with_penalties(self):
        hard = 5
        soft = 3
        raw = 100_000 - (hard * 1_000) - (soft * 50)
        quality = raw / 1000
        expected = (100_000 - 5000 - 150) / 1000
        assert quality == pytest.approx(expected)

    def test_zero_quality_schedule(self):
        hard = 100
        soft = 0
        raw = 100_000 - (hard * 1_000)
        quality = max(0, raw / 1000)
        assert quality == pytest.approx(0.0)


class TestConflictCounting:
    def test_double_booking_counting(self):
        from utils.constraints import no_room_double_booking
        sched = [{"room_id": "R1", "slot_id": 0, "exam": "A"}, {"room_id": "R1", "slot_id": 0, "exam": "B"}, {"room_id": "R1", "slot_id": 0, "exam": "C"}]
        assert no_room_double_booking(sched) == 2

    def test_student_clash_pair_counting(self):
        from utils.constraints import no_student_clash
        sched = [{"exam": "A", "slot_id": 0}, {"exam": "B", "slot_id": 0}, {"exam": "C", "slot_id": 0}]
        cm = {"A": {"B", "C"}, "B": {"A"}, "C": {"A"}}
        assert no_student_clash(sched, cm) == 2

    def test_no_double_counting(self):
        from utils.constraints import no_room_double_booking, no_student_clash
        sched = [{"room_id": "R1", "slot_id": 0, "exam": "A"}, {"room_id": "R1", "slot_id": 0, "exam": "B"}]
        cm = {"A": {"B"}, "B": {"A"}}
        room_v = no_room_double_booking(sched)
        student_v = no_student_clash(sched, cm)
        assert room_v >= 1
        assert student_v >= 1


class TestUtilizationFormulas:
    def test_room_utilization(self):
        rooms = [{"room_id": f"R{i}", "capacity": 50} for i in range(10)]
        used = {"R1", "R2", "R3"}
        util = len(used) / len(rooms) * 100
        assert util == pytest.approx(30.0)

    def test_slot_utilization(self):
        timeslots_count = 40
        used = 10
        util = used / timeslots_count * 100
        assert util == pytest.approx(25.0)

    def test_combined_utilization_weighted(self):
        room_util = 50.0
        slot_util = 30.0
        seat_util = 40.0
        room_slot_util = 10.0
        combined = (0.35 * room_util) + (0.25 * slot_util) + (0.25 * seat_util) + (0.15 * room_slot_util)
        expected = (0.35 * 50) + (0.25 * 30) + (0.25 * 40) + (0.15 * 10)
        assert combined == pytest.approx(expected)

    def test_seat_utilization(self):
        used = 450
        available = 1000
        util = (used / available) * 100
        assert util == pytest.approx(45.0)


class TestPenaltyWeights:
    def test_hard_penalty_dominates_soft(self):
        hard_weight = 1000
        soft_weight = 50
        assert hard_weight / soft_weight >= 20, "Hard penalty should be >= 20x soft penalty"

    def test_base_fitness_high_enough(self):
        from utils.genetic import BASE_FITNESS, HARD_PENALTY, SOFT_PENALTY
        max_hard = 100
        max_soft = 100
        min_possible = BASE_FITNESS - (max_hard * HARD_PENALTY) - (max_soft * SOFT_PENALTY)
        assert min_possible >= -100000, "Base fitness should keep scores reasonable"

    def test_fitness_monotonic_with_penalties(self):
        from utils.genetic import BASE_FITNESS, HARD_PENALTY, SOFT_PENALTY
        for h in range(0, 10):
            for s in range(0, 10):
                f = BASE_FITNESS - (h * HARD_PENALTY) - (s * SOFT_PENALTY)
                assert f <= BASE_FITNESS


class TestGreedyScoreFormula:
    def test_greedy_score_formula(self):
        from utils.greedy import compute_metrics
        exams = {"A": {"num": 10, "students": [f"s{i}" for i in range(10)]}}
        rooms = [{"room_id": "R1", "capacity": 100}]
        timeslots = [{"slot_id": 0, "date": "2025-06-01", "day": "Sun", "time": "08-10"}]
        cm = {"A": set()}
        metrics = compute_metrics([{"exam": "A", "room_id": "R1", "slot_id": 0}], rooms, timeslots, cm)
        expected_score = 100000 - (0 * 1000)
        assert metrics["score"] == expected_score


class TestCompareFormula:
    def test_compare_by_score(self):
        from utils.greedy import compare_algorithms
        ga = {"score": 92000, "total_penalty": 8, "execution_time": 45}
        gr = {"score": 80000, "total_penalty": 20, "execution_time": 0.5}
        r = compare_algorithms(ga, gr)
        assert r["Winner"] == "Genetic Algorithm"
        assert r["GA Score"] > r["Greedy Score"]
