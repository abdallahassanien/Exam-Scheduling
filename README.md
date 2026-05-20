# OptiSchedule AI

OptiSchedule AI is a full-stack exam/job scheduling optimization platform built around the original Python Genetic Algorithm and Greedy scheduling project. It turns the notebook-style implementation into a modern SaaS-style MVP with a FastAPI backend, Next.js dashboard, live GA progress, Gantt visualization, constraint monitoring, analytics, simulation, and exportable reports.

## What Is Integrated

The app directly reuses the uploaded project assets:

- `utils/genetic.py` for the main Genetic Algorithm scheduler.
- `utils/greedy.py` for the baseline scheduler.
- `utils/constraints.py` for hard and soft constraint validation.
- `utils/data_loader.py` for CSV loading, timeslot generation, and conflict matrix logic.
- `data/*.csv` for exams, rooms, and student registry data.
- `outputs/*` for the existing conflict matrix and generated schedules.
- `legacy/Exam-Scheduling/*` keeps the extracted original ZIP for audit/reference.

## Features

- Premium landing page and AI optimization dashboard.
- Upload CSV/XLSX exam, room, and student datasets.
- Run GA with population, mutation, crossover, generation, elitism, and early-stop controls.
- WebSocket live GA progress with generation, fitness, conflicts, and convergence.
- Run Greedy baseline and compare against GA with shared scoring.
- Interactive Gantt chart by room and timeslot.
- Constraint chips for room overlap, student overlap, capacity, same-day conflicts, load balancing, and scheduled jobs.
- Recharts analytics for fitness, conflicts, room utilization, and daily exam load.
- Simulation mode for random benchmark datasets.
- CSV and PDF exports.
- SQLite run history.
- Docker and docker-compose support.

## Quick Start

### Backend

```bash
pip install -r requirements.txt
uvicorn main:app --reload
```

The API runs at `http://localhost:8000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The web app runs at `http://localhost:3000`.

## API

See [docs/API.md](docs/API.md).

Key endpoints:

- `POST /api/run-ga`
- `POST /api/run-greedy`
- `POST /api/compare`
- `GET /api/schedule`
- `GET /api/constraints`
- `GET /api/analytics`
- `GET /api/export`
- `WS /api/run-ga/live`

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

The backend does not replace the original algorithms. It imports and orchestrates them through `SchedulerService`, adds a shared metrics layer, and shapes results for the frontend.

## Algorithm Summary

The Genetic Algorithm represents each schedule as a chromosome:

```python
{
  "EXAM_ID": {
    "timeslot": 0,
    "rooms": ["330A", "330B"]
  }
}
```

Fitness starts from `100000` and penalizes:

- Room double bookings.
- Student clashes in the same timeslot.
- Room capacity violations.
- Same-day student conflicts.
- Uneven day distribution.

GA uses tournament selection, crossover, mutation, elitism, and repair. The repair step reallocates rooms and adjusts invalid/conflicting assignments, which is why GA generally outperforms the Greedy baseline on global schedule quality.

## Docker

```bash
docker compose up --build
```

Backend: `http://localhost:8000`

Frontend: `http://localhost:3000`

## Screenshots

Validated screenshots are stored in `docs/`:

- `docs/optischedule-dashboard.png`
- `docs/optischedule-comparison.png`
- `docs/optischedule-mobile.png`
