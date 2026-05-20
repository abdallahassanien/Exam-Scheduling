# GA Exam Scheduler - Project Map

## Structure
```
├── GA.ipynb                    # Main GA runner notebook
├── 01_prepare_data.ipynb       # Data preparation
├── 02_constraints.ipynb        # Constraint testing
├── Data/
│   ├── data.csv                # Exam enrollment data
│   ├── IDs.csv                 # Student ID registry
│   └── rooms.csv               # Room inventory
├── outputs/
│   ├── conflict_matrix.pkl     # Precomputed exam conflict pairs
│   └── ga_schedule.csv         # Latest GA schedule output
└── utils/
    ├── data_loader.py          # CSV loading, timeslot generation, conflict matrix
    ├── constraints.py          # Hard/soft constraint functions
    └── GA.py                   # Genetic algorithm engine
```

## Key Modules

### `utils/data_loader.py`
- `load_exams()` — reads data.csv into `{code: {num, students}}`
- `load_students()` — reads IDs.csv into `{student_id: [courses]}`
- `load_rooms()` — reads rooms.csv, skips rooms with missing capacity
- `load_timeslots()` — generates 60 slots (15 days × 4), dates in `YYYY-MM-DD`, skips Fridays
- `build_conflict_matrix()` / `load_conflict_matrix()` — exam conflict pairs

### `utils/constraints.py`
- `no_room_double_booking()` — hard: no two exams in same room+slot
- `no_student_clash()` — hard: no student in two same-slot exams
- `one_exam_per_student_per_day()` — hard: max one exam per student per day
- `exams_spread_evenly()` — soft: penalizes overloaded days
- `assign_rooms_to_exam()` — splits students across rooms
- `hard_violations()` / `soft_violations()` — aggregated counters
- `explain_violations()` — human-readable violation report

### `utils/GA.py`
- `GeneticExamScheduler` — GA engine with chromosome `{exam: {timeslot, rooms}}`
- `evaluate()` — computes fitness from constraint functions + local helpers
- `repair()` — reassigns rooms, now also checks slot/day conflicts
- `export_schedule_rows()` — converts chromosome to DataFrame-ready rows
- Chromosome uses multi-room allocation for exams larger than any single room

## Dates
- Timeslots: `YYYY-MM-DD` format, generated in `data_loader.py:186`
- CSV export: uses `encoding='utf-8-sig'` (BOM) + `quoting=csv.QUOTE_NONNUMERIC` to prevent Excel auto-parsing
- Export cell in `GA.ipynb` casts date column to `str` before save

## Current State (May 17, 2026)
- GA fitness: ~92,750 (80 gens), ~7 hard violations, ~5 soft violations
- All constraint functions stable in `constraints.py`
- `repair()` now conflict-aware (fix applied)
- CSV date column writes `YYYY-MM-DD` strings, quoted as text for Excel compatibility
