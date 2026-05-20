# Architecture

```mermaid
flowchart LR
  UI["Next.js 14 UI"] --> API["FastAPI Backend"]
  API --> Service["SchedulerService Adapter"]
  Service --> GA["utils/genetic.py"]
  Service --> Greedy["utils/greedy.py"]
  Service --> Constraints["utils/constraints.py"]
  Service --> Loader["utils/data_loader.py"]
  Loader --> Data["data/*.csv"]
  Service --> Outputs["outputs/* and backend/storage"]
  API --> SQLite["SQLite run history"]
```

The production app keeps the original project logic intact and wraps it in a typed API. The backend adds shared scoring, upload normalization, live progress streaming, analytics shaping, exports, and persistence.

The frontend consumes structured JSON and renders a premium AI scheduling console with comparison cards, Recharts analytics, constraint chips, and an interactive Gantt timeline.

