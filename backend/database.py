from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


DB_PATH = Path(__file__).resolve().parent / "storage" / "exam_optimizer.sqlite3"


def _connect() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with _connect() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS uploads (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                filename TEXT NOT NULL,
                dataset_type TEXT NOT NULL,
                path TEXT NOT NULL,
                rows_count INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS algorithm_runs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                algorithm TEXT NOT NULL,
                metrics_json TEXT NOT NULL,
                schedule_path TEXT,
                created_at TEXT NOT NULL
            )
            """
        )
        conn.commit()


def record_upload(filename: str, dataset_type: str, path: str, rows_count: int) -> int:
    with _connect() as conn:
        cur = conn.execute(
            """
            INSERT INTO uploads (filename, dataset_type, path, rows_count, created_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                filename,
                dataset_type,
                path,
                rows_count,
                datetime.now(timezone.utc).isoformat(),
            ),
        )
        conn.commit()
        return int(cur.lastrowid)


def record_run(algorithm: str, metrics: dict[str, Any], schedule_path: str | None) -> int:
    with _connect() as conn:
        cur = conn.execute(
            """
            INSERT INTO algorithm_runs (algorithm, metrics_json, schedule_path, created_at)
            VALUES (?, ?, ?, ?)
            """,
            (
                algorithm,
                json.dumps(metrics, default=str),
                schedule_path,
                datetime.now(timezone.utc).isoformat(),
            ),
        )
        conn.commit()
        return int(cur.lastrowid)


def latest_runs(limit: int = 12) -> list[dict[str, Any]]:
    with _connect() as conn:
        rows = conn.execute(
            """
            SELECT id, algorithm, metrics_json, schedule_path, created_at
            FROM algorithm_runs
            ORDER BY id DESC
            LIMIT ?
            """,
            (limit,),
        ).fetchall()

    result = []
    for row in rows:
        result.append(
            {
                "id": row["id"],
                "algorithm": row["algorithm"],
                "metrics": json.loads(row["metrics_json"]),
                "schedule_path": row["schedule_path"],
                "created_at": row["created_at"],
            }
        )
    return result

