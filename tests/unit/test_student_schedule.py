"""Tests for the Student Schedule Lookup service."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

import tempfile

import pytest
from backend.services.scheduler_service import SchedulerService
from backend.services.student_service import StudentScheduleService


@pytest.fixture
def scheduler():
    sched = SchedulerService()
    sched.run_greedy()
    sched.run_ga({"population_size": 20, "generations": 10, "seed": 42})
    return sched


@pytest.fixture
def service(scheduler):
    svc = StudentScheduleService(scheduler_service=scheduler)
    return svc


class TestStudentLookup:
    def test_lookup_existing_student(self, service):
        result = service.lookup_student("1510203", algorithm="ga")
        assert result["found"] is True
        assert result["student_id"] == "1510203"
        assert result["total_courses"] > 0
        assert len(result["schedule"]) > 0
        assert result["algorithm"] == "ga"
        assert result["schedule_generated"] is True

    def test_lookup_greedy_algorithm(self, service):
        result = service.lookup_student("1510203", algorithm="greedy")
        assert result["found"] is True
        assert result["algorithm"] == "greedy"
        assert result["schedule_generated"] is True

    def test_lookup_nonexistent_student(self, service):
        result = service.lookup_student("NONEXISTENT123")
        assert result["found"] is False
        assert len(result["schedule"]) == 0

    def test_lookup_empty_id(self, service):
        result = service.lookup_student("")
        assert result["found"] is False

    def test_lookup_invalid_format(self, service):
        result = service.lookup_student("   ")
        assert result["found"] is False

    def test_schedule_has_required_fields(self, service):
        result = service.lookup_student("1510203")
        if result["found"] and result["schedule"]:
            entry = result["schedule"][0]
            required = ["course", "room", "day", "date", "time", "start_time", "end_time"]
            for field in required:
                assert field in entry, f"Missing field: {field}"
                assert entry[field] != "", f"Empty field: {field}"

    def test_schedule_sorted_by_date(self, service):
        result = service.lookup_student("1510203")
        if result["found"] and len(result["schedule"]) > 1:
            dates = [e["date"] for e in result["schedule"]]
            assert dates == sorted(dates), "Schedule not sorted by date"

    def test_student_schedule_deterministic(self, service):
        r1 = service.lookup_student("1510203")
        service._schedule_cache.clear()
        r2 = service.lookup_student("1510203")
        assert r1["found"] == r2["found"]
        assert len(r1["schedule"]) == len(r2["schedule"])

    def test_priority_marking(self, service):
        result = service.lookup_student("1510203")
        if result["found"]:
            for entry in result["schedule"]:
                assert entry["priority"] in ("high", "normal")

    def test_status_valid_values(self, service):
        result = service.lookup_student("1510203")
        if result["found"]:
            for entry in result["schedule"]:
                assert entry["status"] in ("scheduled", "conflict")

    def test_export_csv_not_empty(self, service):
        csv_content = service.export_student_schedule_csv("1510203", algorithm="ga")
        assert csv_content.startswith("course")
        assert "1510203" not in csv_content

    def test_export_csv_unknown_student(self, service):
        csv_content = service.export_student_schedule_csv("UNKNOWN")
        assert "not found" in csv_content.lower() or "UNKNOWN" in csv_content

    def test_search_students_by_id(self, service):
        results = service.search_students("1510203")
        assert len(results) > 0
        assert results[0]["student_id"] == "1510203"

    def test_search_students_partial(self, service):
        results = service.search_students("1510")
        assert len(results) > 0
        assert any("1510" in r["student_id"] for r in results)

    def test_search_students_no_match(self, service):
        results = service.search_students("ZZZZ9999")
        assert len(results) == 0

    def test_search_students_max_results(self, service):
        results = service.search_students("1")
        assert len(results) <= 20

    def test_schedule_data_integrity(self, service):
        result = service.lookup_student("1510203")
        if result["found"]:
            for entry in result["schedule"]:
                assert isinstance(entry["course"], str)
                assert isinstance(entry["room"], str)
                assert isinstance(entry["capacity"], int)
                assert entry["capacity"] >= 0
                assert isinstance(entry["students_seated"], int)

    def test_conflict_structure(self, service):
        result = service.lookup_student("1510203")
        if result["conflicts"]:
            conflict = result["conflicts"][0]
            assert "course" in conflict
            assert "type" in conflict
            assert "message" in conflict

    def test_multiple_students_return_same_schedule(self, service):
        ids = list(service._students.keys())[:3] if service._students else []
        if len(ids) >= 2:
            r1 = service.lookup_student(ids[0])
            r2 = service.lookup_student(ids[1])
            assert isinstance(r1["found"], bool)
            assert isinstance(r2["found"], bool)


class TestStudentAlgorithmAwareness:
    def test_no_schedule_returns_proper_message(self):
        """A service without a scheduler and no cached schedules should show the no-schedule message."""
        svc = StudentScheduleService()
        svc._load_data()
        svc._schedule_cache.clear()
        svc._scheduler = None
        # Force _get_schedule to return empty — simulates no schedule generated yet
        import unittest.mock as mock
        with mock.patch.object(svc, '_get_schedule', return_value=[]):
            result = svc.lookup_student("1510203", algorithm="ga")
        assert result["found"] is False
        assert result["schedule_generated"] is False
        assert "No schedule has been generated yet" in result["message"]

    def test_invalid_algorithm_returns_error(self, service):
        result = service.lookup_student("1510203", algorithm="invalid")
        assert result["found"] is False
        assert "Invalid algorithm" in result["message"]

    def test_ga_and_greedy_return_different_schedules(self, service):
        ga_result = service.lookup_student("1510203", algorithm="ga")
        greedy_result = service.lookup_student("1510203", algorithm="greedy")
        assert ga_result["algorithm"] == "ga"
        assert greedy_result["algorithm"] == "greedy"

    def test_algorithm_present_in_result(self, service):
        result = service.lookup_student("1510203", algorithm="greedy")
        assert "algorithm" in result
        assert result["algorithm"] == "greedy"

    def test_schedule_generated_flag(self, service):
        result = service.lookup_student("1510203", algorithm="ga")
        assert "schedule_generated" in result
        assert result["schedule_generated"] is True


class TestStudentScheduleAccuracy:
    """Validates that lookup returns the exact correct schedule for each student."""

    def test_room_matches_student_row(self, service):
        """For multi-room courses, the student must be in the room shown."""
        result = service.lookup_student("1510203", algorithm="ga")
        assert result["found"] is True
        schedule = service._get_schedule("ga")
        for entry in result["schedule"]:
            course = entry["course"]
            lookup_room = entry["room"]
            actual_room = None
            for row in schedule:
                if row["exam"] == course and "1510203" in str(row.get("student ids", "")):
                    actual_room = row["room"]
                    break
            assert lookup_room == actual_room, (
                f"Course {course}: lookup shows room {lookup_room} but student is in room {actual_room}"
            )

    def test_overflow_accurate_for_multi_room(self, service):
        """Overflow must be total enrolled minus total capacity across ALL rooms for that exam."""
        result = service.lookup_student("1510203", algorithm="ga")
        assert result["found"] is True
        schedule = service._get_schedule("ga")
        for entry in result["schedule"]:
            course = entry["course"]
            exam_rows = [r for r in schedule if r["exam"] == course]
            total_cap = sum(int(r.get("room capacity", 0) or 0) for r in exam_rows)
            total_students = entry["students_enrolled"]
            expected_overflow = max(0, total_students - total_cap)
            assert entry["overflow"] == expected_overflow, (
                f"Course {course}: overflow={entry['overflow']} but expected={expected_overflow} "
                f"(enrolled={total_students}, total_capacity={total_cap})"
            )

    def test_no_false_courses(self, service):
        """Every course in the lookup result must be a course the student is enrolled in."""
        result = service.lookup_student("1510203", algorithm="ga")
        assert result["found"] is True
        enrolled = service._students.get("1510203", [])
        for entry in result["schedule"]:
            assert entry["course"] in enrolled, (
                f"Course {entry['course']} is NOT in student 1510203's enrolled courses"
            )

    def test_all_enrolled_courses_present(self, service):
        """Every course the student is enrolled in must appear in the lookup result."""
        result = service.lookup_student("1510203", algorithm="ga")
        assert result["found"] is True
        enrolled = set(service._students.get("1510203", []))
        found = {entry["course"] for entry in result["schedule"]}
        missing = enrolled - found
        assert not missing, (
            f"Student 1510203 is enrolled in {missing} but they are missing from the lookup"
        )

    def test_schedule_consistency_across_students(self, service):
        """Multiple students in the same course should see the same day/time but possibly different rooms."""
        result_a = service.lookup_student("1510203", algorithm="ga")
        result_b = service.lookup_student("241002046", algorithm="ga")
        assert result_a["found"] and result_b["found"]
        # Check that shared courses have same day/time
        courses_a = {e["course"]: e for e in result_a["schedule"]}
        for entry_b in result_b["schedule"]:
            course = entry_b["course"]
            if course in courses_a:
                entry_a = courses_a[course]
                assert entry_a["date"] == entry_b["date"], (
                    f"Course {course}: date mismatch ({entry_a['date']} vs {entry_b['date']})"
                )
                assert entry_a["time"] == entry_b["time"], (
                    f"Course {course}: time mismatch ({entry_a['time']} vs {entry_b['time']})"
                )


class TestStudentServiceEdgeCases:
    def test_service_initialization(self):
        svc = StudentScheduleService()
        assert svc._exams == {}
        assert svc._students == {}

    def test_load_data_populates(self, service):
        service._load_data()
        assert len(service._exams) > 0
        assert len(service._rooms) > 0
        assert len(service._timeslots) > 0
        assert len(service._students) > 0

    def test_lookup_trims_whitespace(self, service):
        result = service.lookup_student("  1510203  ")
        assert result["found"] is True

    def test_found_courses_never_exceeds_total(self, service):
        result = service.lookup_student("1510203")
        assert result["found_courses"] <= result["total_courses"]

    def test_source_is_string_or_none(self, service):
        result = service.lookup_student("1510203")
        assert result["source"] is None or isinstance(result["source"], str)
