from __future__ import annotations

import asyncio
import json
import os
from pathlib import Path

from fastapi import FastAPI, File, Form, HTTPException, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.database import init_db, record_upload
from backend.schemas import ExportRequest, GAParameters, SimulationRequest
from backend.services.export_service import csv_response, pdf_response
from backend.services.scheduler_service import SchedulerService
from backend.services.student_service import StudentScheduleService


app = FastAPI(
    title="OptiSchedule AI API",
    description="Genetic Algorithm and Greedy exam/job scheduling optimizer.",
    version="1.0.0",
)

origins = os.getenv("BACKEND_CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in origins if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

service = SchedulerService()
student_service = StudentScheduleService(scheduler_service=service)


@app.on_event("startup")
def on_startup() -> None:
    init_db()


@app.get("/")
def root() -> dict[str, str]:
    return {"name": "OptiSchedule AI", "status": "online", "docs": "/docs"}


@app.get("/api/health")
def health() -> dict[str, object]:
    return {"status": "healthy", "summary": service.dataset_summary()}


@app.get("/api/dataset")
def dataset() -> dict[str, object]:
    return service.dataset_summary()


@app.post("/api/upload")
async def upload_dataset(
    file: UploadFile = File(...),
    dataset_type: str = Form("auto"),
) -> dict[str, object]:
    try:
        suffix = Path(file.filename or "dataset.csv").suffix or ".csv"
        target = service.upload_dir / f"raw_{dataset_type}_{os.urandom(4).hex()}{suffix}"
        content = await file.read()
        target.write_bytes(content)
        result = service.ingest_upload(target, file.filename or target.name, dataset_type)
        try:
            result["upload_id"] = record_upload(
                result["filename"],
                result["dataset_type"],
                result["path"],
                result["rows_count"],
            )
        except Exception as persistence_error:
            result["upload_id"] = None
            result["storage_warning"] = f"Upload accepted, but SQLite history was not recorded: {persistence_error}"
        return result
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/api/run-ga")
def run_ga(params: GAParameters) -> dict[str, object]:
    try:
        return service.run_ga(params.model_dump())
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/api/run-greedy")
def run_greedy() -> dict[str, object]:
    try:
        return service.run_greedy()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/api/compare")
def compare() -> dict[str, object]:
    try:
        return service.compare()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/api/schedule")
def schedule(algorithm: str = "ga") -> dict[str, object]:
    if algorithm not in {"ga", "greedy"}:
        raise HTTPException(status_code=400, detail="algorithm must be ga or greedy")
    return service.schedule(algorithm)


@app.get("/api/constraints")
def constraints(algorithm: str = "ga") -> dict[str, object]:
    return service.constraints_endpoint(algorithm)


@app.get("/api/analytics")
def analytics(algorithm: str = "ga") -> dict[str, object]:
    return service.analytics_endpoint(algorithm)


@app.post("/api/simulate")
def simulate(request: SimulationRequest) -> dict[str, object]:
    try:
        return service.simulate_dataset(request.model_dump())
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/api/export")
def export_get(algorithm: str = "ga", format: str = "csv"):
    return _export(algorithm, format)


@app.post("/api/export")
def export_post(request: ExportRequest):
    return _export(request.algorithm, request.format)


def _export(algorithm: str, format: str):
    if algorithm not in {"ga", "greedy"}:
        raise HTTPException(status_code=400, detail="algorithm must be ga or greedy")
    metrics, rows = service.export_payload(algorithm)
    if format.lower() == "pdf":
        return pdf_response(f"{algorithm.upper()} Schedule Optimization Report", metrics, rows, f"{algorithm}_schedule_report.pdf")
    if format.lower() != "csv":
        raise HTTPException(status_code=400, detail="format must be csv or pdf")
    return csv_response(rows, f"{algorithm}_schedule.csv")


@app.get("/api/student/{student_id}")
def student_schedule(student_id: str, algorithm: str = "ga") -> dict[str, object]:
    if algorithm not in ("ga", "greedy"):
        raise HTTPException(status_code=400, detail="algorithm must be ga or greedy")
    try:
        return student_service.lookup_student(student_id, algorithm)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/api/student-schedule")
def student_schedule_query(student_id: str, algorithm: str = "ga") -> dict[str, object]:
    if algorithm not in ("ga", "greedy"):
        raise HTTPException(status_code=400, detail="algorithm must be ga or greedy")
    try:
        return student_service.lookup_student(student_id, algorithm)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/api/student/search")
def student_search(query: str = "") -> list[dict[str, object]]:
    try:
        return student_service.search_students(query)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/api/student/export/{student_id}")
def student_export(student_id: str, format: str = "csv", algorithm: str = "ga"):
    if algorithm not in ("ga", "greedy"):
        raise HTTPException(status_code=400, detail="algorithm must be ga or greedy")
    try:
        if format == "csv":
            content = student_service.export_student_schedule_csv(student_id, algorithm)
            from fastapi.responses import Response
            return Response(
                content=content,
                media_type="text/csv",
                headers={"Content-Disposition": f'attachment; filename="student_{student_id}_{algorithm}_schedule.csv"'},
            )
        result = student_service.lookup_student(student_id, algorithm)
        metrics = {
            "Student ID": student_id,
            "Total Courses": result.get("total_courses", 0),
            "Found Courses": result.get("found_courses", 0),
            "Conflicts": len(result.get("conflicts", [])),
        }
        rows = result.get("schedule", [])
        from backend.services.export_service import pdf_response
        return pdf_response(f"Student Schedule — {student_id}", metrics, rows, f"student_{student_id}_schedule.pdf")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.websocket("/api/run-ga/live")
async def run_ga_live(websocket: WebSocket) -> None:
    await websocket.accept()
    try:
        raw = await websocket.receive_text()
        params = GAParameters(**json.loads(raw)).model_dump()
        queue: asyncio.Queue[dict[str, object]] = asyncio.Queue()

        def on_progress(payload: dict[str, object]) -> None:
            queue.put_nowait(payload)

        async def runner() -> None:
            try:
                await asyncio.to_thread(service.run_ga, params, on_progress)
            except Exception as exc:
                queue.put_nowait({"event": "error", "message": str(exc)})

        task = asyncio.create_task(runner())
        while True:
            payload = await queue.get()
            await websocket.send_text(json.dumps(payload, default=str))
            if payload.get("event") in {"complete", "error"}:
                break
        await task
    except WebSocketDisconnect:
        return
    except Exception as exc:
        await websocket.send_text(json.dumps({"event": "error", "message": str(exc)}))
    finally:
        await websocket.close()


@app.exception_handler(Exception)
async def unhandled_exception_handler(_, exc: Exception):
    return JSONResponse(status_code=500, content={"detail": str(exc)})
