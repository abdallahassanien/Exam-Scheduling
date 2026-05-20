"""
Constraint Unit Tests — validates each constraint independently with valid AND invalid cases.
"""

import pytest


# ============================================================================
# CT1: No Room Double Booking
# ============================================================================
class TestNoRoomDoubleBooking:
    def test_valid_no_conflicts(self):
        from utils.constraints import no_room_double_booking
        schedule = [
            {"room_id": "R1", "slot_id": 0, "exam": "A"},
            {"room_id": "R2", "slot_id": 0, "exam": "B"},
            {"room_id": "R1", "slot_id": 1, "exam": "C"},
        ]
        assert no_room_double_booking(schedule) == 0

    def test_one_double_booking(self):
        from utils.constraints import no_room_double_booking
        schedule = [
            {"room_id": "R1", "slot_id": 0, "exam": "A"},
            {"room_id": "R1", "slot_id": 0, "exam": "B"},
        ]
        assert no_room_double_booking(schedule) == 1

    def test_multiple_double_bookings(self):
        from utils.constraints import no_room_double_booking
        schedule = [
            {"room_id": "R1", "slot_id": 0, "exam": "A"},
            {"room_id": "R1", "slot_id": 0, "exam": "B"},
            {"room_id": "R2", "slot_id": 1, "exam": "C"},
            {"room_id": "R2", "slot_id": 1, "exam": "D"},
        ]
        assert no_room_double_booking(schedule) == 2

    def test_empty_schedule(self):
        from utils.constraints import no_room_double_booking
        assert no_room_double_booking([]) == 0

    def test_same_room_different_slot(self):
        from utils.constraints import no_room_double_booking
        schedule = [
            {"room_id": "R1", "slot_id": 0, "exam": "A"},
            {"room_id": "R1", "slot_id": 1, "exam": "B"},
        ]
        assert no_room_double_booking(schedule) == 0

    def test_different_room_same_slot(self):
        from utils.constraints import no_room_double_booking
        schedule = [
            {"room_id": "R1", "slot_id": 0, "exam": "A"},
            {"room_id": "R2", "slot_id": 0, "exam": "B"},
        ]
        assert no_room_double_booking(schedule) == 0


# ============================================================================
# CT2: No Student Clash
# ============================================================================
class TestNoStudentClash:
    def test_no_conflicts(self):
        from utils.constraints import no_student_clash
        schedule = [{"exam": "A", "slot_id": 0}, {"exam": "B", "slot_id": 1}]
        cm = {"A": set(), "B": set()}
        assert no_student_clash(schedule, cm) == 0

    def test_one_conflict_pair(self):
        from utils.constraints import no_student_clash
        schedule = [{"exam": "A", "slot_id": 0}, {"exam": "B", "slot_id": 0}]
        cm = {"A": {"B"}, "B": {"A"}}
        assert no_student_clash(schedule, cm) == 1

    def test_multiple_conflicts_same_slot(self):
        from utils.constraints import no_student_clash
        schedule = [{"exam": "A", "slot_id": 0}, {"exam": "B", "slot_id": 0}, {"exam": "C", "slot_id": 0}]
        cm = {"A": {"B", "C"}, "B": {"A"}, "C": {"A"}}
        assert no_student_clash(schedule, cm) == 2

    def test_no_conflicts_different_slots(self):
        from utils.constraints import no_student_clash
        schedule = [{"exam": "A", "slot_id": 0}, {"exam": "B", "slot_id": 1}]
        cm = {"A": {"B"}, "B": {"A"}}
        assert no_student_clash(schedule, cm) == 0

    def test_empty_schedule(self):
        from utils.constraints import no_student_clash
        assert no_student_clash([], {}) == 0

    def test_single_exam_no_conflict(self):
        from utils.constraints import no_student_clash
        schedule = [{"exam": "A", "slot_id": 0}]
        cm = {"A": set()}
        assert no_student_clash(schedule, cm) == 0


# ============================================================================
# CT2b: One Exam Per Student Per Day
# ============================================================================
class TestOneExamPerStudentPerDay:
    def test_no_same_day_conflicts(self):
        from utils.constraints import one_exam_per_student_per_day
        schedule = [{"exam": "A", "slot_id": 0}, {"exam": "B", "slot_id": 2}]
        cm = {"A": {"B"}, "B": {"A"}}
        timeslots = [{"slot_id": 0, "date": "2025-06-01"}, {"slot_id": 2, "date": "2025-06-02"}]
        assert one_exam_per_student_per_day(schedule, cm, timeslots) == 0

    def test_one_same_day_conflict(self):
        from utils.constraints import one_exam_per_student_per_day
        schedule = [{"exam": "A", "slot_id": 0}, {"exam": "B", "slot_id": 1}]
        cm = {"A": {"B"}, "B": {"A"}}
        timeslots = [{"slot_id": 0, "date": "2025-06-01"}, {"slot_id": 1, "date": "2025-06-01"}]
        assert one_exam_per_student_per_day(schedule, cm, timeslots) == 1

    def test_no_conflict_but_same_day(self):
        from utils.constraints import one_exam_per_student_per_day
        schedule = [{"exam": "A", "slot_id": 0}, {"exam": "B", "slot_id": 1}]
        cm = {"A": set(), "B": set()}
        timeslots = [{"slot_id": 0, "date": "2025-06-01"}, {"slot_id": 1, "date": "2025-06-01"}]
        assert one_exam_per_student_per_day(schedule, cm, timeslots) == 0

    def test_empty_schedule(self):
        from utils.constraints import one_exam_per_student_per_day
        assert one_exam_per_student_per_day([], {}, []) == 0


# ============================================================================
# CT3: Exams Spread Evenly (Soft Constraint)
# ============================================================================
class TestExamsSpreadEvenly:
    def test_perfectly_even(self):
        from utils.constraints import exams_spread_evenly
        timeslots = [
            {"slot_id": 0, "date": "2025-06-01"},
            {"slot_id": 1, "date": "2025-06-01"},
            {"slot_id": 2, "date": "2025-06-02"},
            {"slot_id": 3, "date": "2025-06-02"},
        ]
        schedule = [{"exam": "A", "slot_id": 0}, {"exam": "B", "slot_id": 2}]
        assert exams_spread_evenly(schedule, timeslots) == 0

    def test_clustered_day(self):
        from utils.constraints import exams_spread_evenly
        timeslots = [
            {"slot_id": 0, "date": "2025-06-01"},
            {"slot_id": 1, "date": "2025-06-01"},
            {"slot_id": 2, "date": "2025-06-02"},
            {"slot_id": 3, "date": "2025-06-02"},
        ]
        schedule = [
            {"exam": "A", "slot_id": 0},
            {"exam": "B", "slot_id": 1},
            {"exam": "C", "slot_id": 0},
            {"exam": "D", "slot_id": 1},
            {"exam": "E", "slot_id": 0},
        ]
        v = exams_spread_evenly(schedule, timeslots)
        assert v >= 1, "Clustered exams should trigger violation"

    def test_empty_schedule(self):
        from utils.constraints import exams_spread_evenly
        timeslots = [{"slot_id": 0, "date": "2025-06-01"}]
        assert exams_spread_evenly([], timeslots) == 0

    def test_single_exam(self):
        from utils.constraints import exams_spread_evenly
        timeslots = [{"slot_id": 0, "date": "2025-06-01"}]
        schedule = [{"exam": "A", "slot_id": 0}]
        assert exams_spread_evenly(schedule, timeslots) == 0


# ============================================================================
# CT4: Assign Rooms to Exam
# ============================================================================
class TestAssignRoomsToExam:
    def test_fits_one_room(self):
        from utils.constraints import assign_rooms_to_exam
        exams = {"EX1": {"num": 50, "students": [f"s{i}" for i in range(50)]}}
        rooms = [{"room_id": "R1", "capacity": 100}]
        result = assign_rooms_to_exam("EX1", exams, rooms)
        assert len(result) == 1
        assert len(result[0]["students"]) == 50
        assert result[0]["room_id"] == "R1"

    def test_splits_across_multiple_rooms(self):
        from utils.constraints import assign_rooms_to_exam
        exams = {"EX1": {"num": 100, "students": [f"s{i}" for i in range(100)]}}
        rooms = [{"room_id": "R1", "capacity": 60}, {"room_id": "R2", "capacity": 60}]
        result = assign_rooms_to_exam("EX1", exams, rooms)
        assert len(result) >= 2

    def test_not_enough_capacity_raises(self):
        from utils.constraints import assign_rooms_to_exam
        exams = {"EX1": {"num": 200, "students": [f"s{i}" for i in range(200)]}}
        rooms = [{"room_id": "R1", "capacity": 80}]
        with pytest.raises(ValueError, match="Not enough room capacity"):
            assign_rooms_to_exam("EX1", exams, rooms)

    def test_no_rooms_returns_empty(self):
        from utils.constraints import assign_rooms_to_exam
        exams = {"EX1": {"num": 50, "students": [f"s{i}" for i in range(50)]}}
        result = assign_rooms_to_exam("EX1", exams, [])
        assert result == []

    def test_rooms_used_in_capacity_order(self):
        from utils.constraints import assign_rooms_to_exam
        exams = {"EX1": {"num": 100, "students": [f"s{i}" for i in range(100)]}}
        rooms = [{"room_id": "R_small", "capacity": 30}, {"room_id": "R_big", "capacity": 80}]
        result = assign_rooms_to_exam("EX1", exams, rooms)
        assert result[0]["room_id"] == "R_big", "Largest room should be used first"


# ============================================================================
# Hard violations
# ============================================================================
class TestHardViolations:
    def test_perfect_schedule_zero_hard(self):
        from utils.constraints import hard_violations
        schedule = []
        assert hard_violations(schedule, {}, {}, []) == 0

    def test_double_booked_detected(self):
        from utils.constraints import hard_violations
        schedule = [
            {"room_id": "R1", "slot_id": 0, "exam": "A"},
            {"room_id": "R1", "slot_id": 0, "exam": "B"},
        ]
        v = hard_violations(schedule, {}, {}, [{"room_id": "R1", "capacity": 100}])
        assert v >= 1


# ============================================================================
# Soft violations
# ============================================================================
class TestSoftViolations:
    def test_perfect_schedule_zero_soft(self):
        from utils.constraints import soft_violations
        timeslots = [{"slot_id": 0, "date": "2025-06-01"}]
        schedule = [{"exam": "A", "slot_id": 0}]
        cm = {"A": set()}
        assert soft_violations(schedule, cm, timeslots) == 0


class TestExplainViolations:
    def test_explain_runs_without_error(self, real_exams, real_rooms, real_timeslots, real_conflict_matrix):
        from utils.constraints import explain_violations
        from utils.greedy import greedy_schedule
        schedule = greedy_schedule(real_exams, real_rooms, real_timeslots, real_conflict_matrix)
        explain_violations(schedule, real_conflict_matrix, real_exams, real_rooms, real_timeslots)
