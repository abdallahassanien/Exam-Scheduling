# OptiSchedule AI API

Base URL: `http://localhost:8000`

## Endpoints

- `GET /api/health` returns service status and active dataset summary.
- `GET /api/dataset` returns row counts, course/job count, room count, conflict pairs, and previews.
- `POST /api/upload` accepts `multipart/form-data` with `file` and optional `dataset_type`.
- `POST /api/run-ga` runs the integrated `utils.genetic.GeneticExamScheduler`.
- `POST /api/run-greedy` runs the integrated `utils.greedy.greedy_schedule`.
- `POST /api/compare` compares latest GA and Greedy runs with shared metrics.
- `GET /api/schedule?algorithm=ga|greedy` returns the selected schedule.
- `GET /api/constraints?algorithm=ga|greedy` returns constraint chips and conflict reasons.
- `GET /api/analytics?algorithm=ga|greedy` returns chart-ready analytics.
- `GET /api/export?algorithm=ga|greedy&format=csv|pdf` exports reports.
- `POST /api/simulate` creates a synthetic dataset for benchmark mode.
- `WS /api/run-ga/live` streams generation-level GA progress.

## GA Parameters

```json
{
  "population_size": 60,
  "generations": 80,
  "mutation_rate": 0.08,
  "crossover_rate": 0.85,
  "elitism_percentage": 0.08,
  "tournament_size": 4,
  "seed": 42,
  "early_stop_rounds": 24
}
```

