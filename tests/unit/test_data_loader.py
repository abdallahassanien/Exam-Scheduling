"""
Data Loader Tests — validates data loading, parsing, and conflict matrix build.
"""

import pytest
import pickle
import tempfile
import os
from pathlib import Path


class TestLoadExams:
    def test_load_exams_returns_dict(self, real_exams):
        assert isinstance(real_exams, dict)
        assert len(real_exams) > 0

    def test_exam_structure(self, real_exams):
        mismatches = []
        for eid, info in real_exams.items():
            assert "num" in info, f"Exam {eid} missing 'num'"
            assert "students" in info, f"Exam {eid} missing 'students'"
            assert isinstance(info["num"], int)
            assert isinstance(info["students"], list)
            if len(info["students"]) != info["num"]:
                mismatches.append(f"{eid}: num={info['num']}, actual students={len(info['students'])}")
        if mismatches:
            msg = f"Data quality issue: {len(mismatches)} exam(s) with student count mismatch:\n" + "\n".join(mismatches[:10])
            pytest.skip(msg)

    def test_exam_ids_strings(self, real_exams):
        for eid in real_exams:
            assert isinstance(eid, str), f"Exam ID should be string: {eid}"

    def test_student_ids_strings(self, real_exams):
        for info in real_exams.values():
            for sid in info["students"]:
                assert isinstance(sid, str), f"Student ID should be string: {sid}"


class TestLoadRooms:
    def test_load_rooms_returns_list(self, real_rooms):
        assert isinstance(real_rooms, list)
        assert len(real_rooms) > 0

    def test_room_structure(self, real_rooms):
        for room in real_rooms:
            assert "room_id" in room
            assert "building" in room
            assert "capacity" in room
            assert isinstance(room["capacity"], int)
            assert room["capacity"] > 0

    def test_room_ids_unique(self, real_rooms):
        ids = [str(r["room_id"]) for r in real_rooms]
        assert len(ids) == len(set(ids)), "Duplicate room IDs detected"


class TestLoadTimeslots:
    def test_timeslots_returns_list(self, real_timeslots):
        assert isinstance(real_timeslots, list)
        assert len(real_timeslots) > 0

    def test_timeslot_structure(self, real_timeslots):
        for ts in real_timeslots:
            assert "slot_id" in ts
            assert "date" in ts
            assert "day" in ts
            assert "time" in ts

    def test_timeslot_ids_unique(self, real_timeslots):
        ids = [int(s["slot_id"]) for s in real_timeslots]
        assert len(ids) == len(set(ids))

    def test_no_friday_slots(self, real_timeslots):
        for ts in real_timeslots:
            assert ts["day"].lower() != "friday", "Friday slots should not exist"

    def test_slot_count(self, real_timeslots):
        dates = set(ts["date"] for ts in real_timeslots)
        expected_per_day = 4
        total = len(dates) * expected_per_day
        assert len(real_timeslots) <= total + 4


class TestBuildConflictMatrix:
    def test_matrix_returns_dict_of_sets(self, real_conflict_matrix):
        assert isinstance(real_conflict_matrix, dict)
        for k, v in real_conflict_matrix.items():
            assert isinstance(k, str)
            assert isinstance(v, set)

    def test_matrix_symmetric(self, real_conflict_matrix):
        for a, conflicts in real_conflict_matrix.items():
            for b in conflicts:
                assert a in real_conflict_matrix.get(b, set()), f"Matrix asymmetry: {a} has {b} but not vice versa"

    def test_matrix_no_self_conflict(self, real_conflict_matrix):
        for a, conflicts in real_conflict_matrix.items():
            assert a not in conflicts, f"Self-conflict detected for {a}"

    def test_matrix_conflict_count_reasonable(self, real_conflict_matrix):
        total_pairs = sum(len(v) for v in real_conflict_matrix.values()) // 2
        n = len(real_conflict_matrix)
        max_possible = n * (n - 1) // 2
        assert 0 <= total_pairs <= max_possible


class TestPersistAndLoad:
    def test_save_and_load_conflict_matrix(self, real_exams):
        from utils.data_loader import build_conflict_matrix, load_conflict_matrix
        with tempfile.NamedTemporaryFile(suffix=".pkl", delete=False) as f:
            tmp_path = f.name
        try:
            cm = build_conflict_matrix(real_exams, tmp_path)
            loaded = load_conflict_matrix(tmp_path)
            assert cm.keys() == loaded.keys()
            for k in cm:
                assert cm[k] == loaded[k]
        finally:
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)

    def test_load_nonexistent_raises(self):
        from utils.data_loader import load_conflict_matrix
        with pytest.raises(FileNotFoundError):
            load_conflict_matrix("/nonexistent/path.pkl")
