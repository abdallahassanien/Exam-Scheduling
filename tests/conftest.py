"""
Shared fixtures and test utilities for algorithm validation.

DO NOT modify any algorithm logic — only test/validate/report.
"""

import sys
import os
import pytest
import random
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from utils.data_loader import load_exams, load_rooms, load_timeslots, build_conflict_matrix


# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
DATA_DIR = ROOT / "data"
OUTPUTS_DIR = ROOT / "outputs"


def _load_real_data():
    exams = load_exams(str(DATA_DIR / "data.csv"))
    rooms = load_rooms(str(DATA_DIR / "rooms.csv"))
    timeslots = load_timeslots()
    cm_path = OUTPUTS_DIR / "conflict_matrix.pkl"
    if cm_path.exists():
        import pickle
        with open(str(cm_path), "rb") as f:
            conflict_matrix = pickle.load(f)
    else:
        conflict_matrix = build_conflict_matrix(exams, str(cm_path))
    return exams, rooms, timeslots, conflict_matrix


@pytest.fixture(scope="session")
def real_data():
    return _load_real_data()


@pytest.fixture(scope="session")
def real_exams(real_data):
    return real_data[0]


@pytest.fixture(scope="session")
def real_rooms(real_data):
    return real_data[1]


@pytest.fixture(scope="session")
def real_timeslots(real_data):
    return real_data[2]


@pytest.fixture(scope="session")
def real_conflict_matrix(real_data):
    return real_data[3]


# ---------------------------------------------------------------------------
# Synthetic minimal data for unit / edge-case tests
# ---------------------------------------------------------------------------
@pytest.fixture
def minimal_exams():
    return {
        "EXAM_A": {"num": 30, "students": [f"s{i}" for i in range(30)]},
        "EXAM_B": {"num": 20, "students": [f"s{i}" for i in range(20, 40)]},
    }


@pytest.fixture
def single_exam():
    return {
        "EXAM_X": {"num": 50, "students": [f"t{i}" for i in range(50)]},
    }


@pytest.fixture
def minimal_rooms():
    return [
        {"room_id": "R1", "building": "A", "capacity": 80},
        {"room_id": "R2", "building": "A", "capacity": 40},
    ]


@pytest.fixture
def single_room():
    return [
        {"room_id": "SR1", "building": "B", "capacity": 200},
    ]


@pytest.fixture
def synthetic_timeslots():
    return [
        {"slot_id": 0, "date": "2025-06-01", "day": "Sunday", "time": "08:00-10:00"},
        {"slot_id": 1, "date": "2025-06-01", "day": "Sunday", "time": "10:00-12:00"},
        {"slot_id": 2, "date": "2025-06-02", "day": "Monday", "time": "08:00-10:00"},
        {"slot_id": 3, "date": "2025-06-02", "day": "Monday", "time": "10:00-12:00"},
    ]


@pytest.fixture
def minimal_timeslots():
    return [
        {"slot_id": 0, "date": "2025-06-01", "day": "Sunday", "time": "08:00-10:00"},
        {"slot_id": 1, "date": "2025-06-01", "day": "Sunday", "time": "10:00-12:00"},
    ]


@pytest.fixture
def conflict_free():
    return {"EXAM_A": set(), "EXAM_B": set()}


@pytest.fixture
def conflicting_exams():
    return {"EXAM_A": {"EXAM_B"}, "EXAM_B": {"EXAM_A"}}


@pytest.fixture
def ga_scheduler(real_exams, real_rooms, real_timeslots, real_conflict_matrix):
    from utils.genetic import GeneticExamScheduler
    return GeneticExamScheduler(
        real_exams, real_rooms, real_timeslots, real_conflict_matrix,
        population_size=20, generations=30, mutation_rate=0.08,
        crossover_rate=0.85, elite_size=2, tournament_size=3, seed=42,
    )


@pytest.fixture
def small_ga(real_exams, real_rooms, real_timeslots, real_conflict_matrix):
    from utils.genetic import GeneticExamScheduler
    return GeneticExamScheduler(
        real_exams, real_rooms, real_timeslots, real_conflict_matrix,
        population_size=40, generations=60, mutation_rate=0.08,
        crossover_rate=0.85, elite_size=4, tournament_size=3, seed=42,
    )
