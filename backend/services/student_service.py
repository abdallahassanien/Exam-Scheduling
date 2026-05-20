"""Student schedule lookup service.

Reads generated schedules and student data to provide
instant schedule lookup without modifying any algorithm logic.
"""

from __future__ import annotations

import csv
import io
import sys
from datetime import datetime
from pathlib import Path
from typing import Any

ROOT_DIR = Path(__file__).resolve().parents[2]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from utils.data_loader import load_exams, load_students, load_rooms, load_timeslots
from utils.greedy import compute_metrics, greedy_schedule


class StudentScheduleService:
    def __init__(self, scheduler_service: Any | None = None) -> None:
        self.data_dir = ROOT_DIR / "data"
        self.output_dir = ROOT_DIR / "outputs"
        self._scheduler = scheduler_service
        self._exams: dict[str, Any] = {}
        self._students: dict[str, list[str]] = {}
        self._rooms: list[dict[str, Any]] = []
        self._timeslots: list[dict[str, Any]] = []
        self._schedule_cache: dict[str, list[dict[str, Any]]] = {}

    def _load_data(self) -> None:
        exams_path = self.data_dir / "data.csv"
        rooms_path = self.data_dir / "rooms.csv"
        students_path = self.data_dir / "IDs.csv"
        if not self._exams:
            self._exams = load_exams(str(exams_path))
        if not self._rooms:
            self._rooms = load_rooms(str(rooms_path))
        if not self._timeslots:
            self._timeslots = load_timeslots()
        if not self._students:
            try:
                self._students = load_students(str(students_path))
            except Exception:
                self._students = self._build_student_index()

    def _build_student_index(self) -> dict[str, list[str]]:
        index: dict[str, list[str]] = {}
        for exam_name, info in self._exams.items():
            for sid in info["students"]:
                index.setdefault(sid, []).append(exam_name)
        return index

    def _normalize_id(self, raw_id: str) -> list[str]:
        """Normalize a student ID into all plausible formats for lookup."""
        raw = str(raw_id).strip().lower()
        candidates = [raw]
        if raw.endswith(".0"):
            candidates.append(raw[:-2])
        if raw.isdigit():
            candidates.append(str(int(raw)))
            candidates.append(str(int(raw)).strip())
        return list(set(candidates))

    def lookup_student(self, student_id: str, algorithm: str = "ga") -> dict[str, Any]:
        self._load_data()

        if algorithm not in ("ga", "greedy"):
            return {
                "found": False,
                "student_id": student_id,
                "message": f"Invalid algorithm '{algorithm}'. Must be 'ga' or 'greedy'.",
                "schedule": [],
                "total_courses": 0,
                "found_courses": 0,
                "source": None,
                "algorithm": algorithm,
                "schedule_generated": False,
            }

        schedule_rows = self._get_schedule(algorithm)
        if not schedule_rows:
            return {
                "found": False,
                "student_id": student_id,
                "message": "No schedule has been generated yet. Please run GA or Greedy first.",
                "schedule": [],
                "total_courses": 0,
                "found_courses": 0,
                "source": None,
                "algorithm": algorithm,
                "schedule_generated": False,
            }

        raw_id = student_id
        student_id = str(student_id).strip()

        enrolled_courses: list[str] = []
        source = None
        candidates = self._normalize_id(student_id)

        for cid in candidates:
            if cid in self._students:
                enrolled_courses = self._students[cid]
                source = "ids_csv"
                student_id = cid
                break

        if not enrolled_courses:
            for cid in candidates:
                enrolled_courses = self._scan_schedule_for_student(cid, algorithm)
                if enrolled_courses:
                    source = "schedule_scan"
                    student_id = cid
                    break

        if not enrolled_courses:
            for cid in candidates:
                enrolled_courses = self._scan_exams_for_student(cid)
                if enrolled_courses:
                    source = "exam_data"
                    student_id = cid
                    break

        if not enrolled_courses:
            return {
                "found": False,
                "student_id": raw_id,
                "message": f"No courses found for student ID '{raw_id}'.",
                "schedule": [],
                "total_courses": 0,
                "found_courses": 0,
                "source": None,
                "algorithm": algorithm,
                "schedule_generated": True,
            }

        matched_schedule: list[dict[str, Any]] = []
        conflicts: list[dict[str, Any]] = []
        not_found: list[str] = []

        # Pre-index schedule rows by exam for fast lookup
        rows_by_exam: dict[str, list[dict[str, Any]]] = {}
        for row in schedule_rows:
            exam = str(row.get("exam", ""))
            rows_by_exam.setdefault(exam, []).append(row)

        for course in enrolled_courses:
            exam_rows = rows_by_exam.get(course)
            if not exam_rows:
                not_found.append(course)
                continue

            # Find the specific row whose "student ids" contain this student
            student_row = None
            for row in exam_rows:
                ids_field = str(row.get("student ids", row.get("student_ids", "")))
                for raw in ids_field.split("+"):
                    if str(raw).strip() in candidates:
                        student_row = row
                        break
                if student_row is not None:
                    break

            row = student_row or exam_rows[0]
            slot_id = int(row.get("slot_id", 0))
            slot_info = self._timeslots[slot_id] if slot_id < len(self._timeslots) else {}
            room_id = str(row.get("room", row.get("room_id", "")))
            room_info = next((r for r in self._rooms if str(r["room_id"]) == room_id), None)
            students_in_room = int(row.get("students in room", row.get("students_in_room", 0)))
            total_students = int(row.get("total students", 0))
            priority = "high" if total_students >= 160 else "normal"

            # Calculate actual overflow: total enrolled minus total capacity across ALL rooms for this exam
            total_capacity_for_exam = sum(
                int(r.get("room capacity", 0) or 0) for r in exam_rows
            )
            real_overflow = max(0, total_students - total_capacity_for_exam)

            date_val = row.get("date") or slot_info.get("date") or ""
            day_val = row.get("day") or slot_info.get("day") or ""
            time_val = row.get("time") or slot_info.get("time") or ""

            entry = {
                "course": course,
                "room": room_id,
                "building": room_info["building"] if room_info else "",
                "capacity": room_info["capacity"] if room_info else 0,
                "date": str(date_val).strip(),
                "day": str(day_val).strip(),
                "time": str(time_val).strip(),
                "start_time": (time_val.split("-")[0].strip()) if time_val else "",
                "end_time": (time_val.split("-")[1].strip()) if time_val else "",
                "students_enrolled": total_students,
                "students_seated": students_in_room,
                "priority": priority,
                "status": row.get("status", "scheduled"),
                "overflow": real_overflow,
            }
            matched_schedule.append(entry)

            if entry["status"] == "conflict":
                conflicts.append({
                    "course": course,
                    "type": "conflict",
                    "message": f"{course} has a scheduling conflict.",
                })
            if entry["overflow"] > 0:
                conflicts.append({
                    "course": course,
                    "type": "capacity",
                    "message": f"{course} exceeds total room capacity by {entry['overflow']} students.",
                })

        matched_schedule.sort(key=lambda x: (x["date"], x["start_time"]))

        return {
            "found": True,
            "student_id": student_id,
            "message": f"Found {len(matched_schedule)} course(s) for student {student_id}.",
            "schedule": matched_schedule,
            "total_courses": len(enrolled_courses),
            "found_courses": len(matched_schedule),
            "missing_courses": not_found,
            "conflicts": conflicts,
            "source": source,
            "algorithm": algorithm,
            "schedule_generated": True,
        }

    def _scan_schedule_for_student(self, student_id: str, algorithm: str = "ga") -> list[str]:
        courses: list[str] = []
        seen: set[str] = set()
        sid = str(student_id).strip()
        candidates = set(self._normalize_id(sid))
        rows = self._get_schedule(algorithm)
        if not rows:
            return courses
        for row in rows:
            ids_field = str(row.get("student ids", row.get("student_ids", "")))
            for raw in ids_field.split("+"):
                if str(raw).strip() in candidates:
                    exam = str(row.get("exam", ""))
                    if exam not in seen:
                        courses.append(exam)
                        seen.add(exam)
                    break
        return courses

    def _scan_exams_for_student(self, student_id: str) -> list[str]:
        courses: list[str] = []
        sid = str(student_id).strip()
        candidates = set(self._normalize_id(sid))
        for exam_name, info in self._exams.items():
            for enrolled_sid in info["students"]:
                if str(enrolled_sid).strip() in candidates:
                    courses.append(exam_name)
                    break
        return courses

    def _get_schedule(self, algorithm: str = "ga") -> list[dict[str, Any]]:
        cache_key = f"schedule_{algorithm}"
        if cache_key in self._schedule_cache:
            return self._schedule_cache[cache_key]

        if self._scheduler:
            last = self._scheduler.last_results.get(algorithm)
            if last:
                rows = last.get("schedule", [])
                self._schedule_cache[cache_key] = rows
                return rows

        csv_path2 = ROOT_DIR / "backend" / "storage" / "exports" / f"{algorithm}_latest_schedule.csv"
        if csv_path2.exists():
            import pandas as pd
            df = pd.read_csv(csv_path2).fillna("")
            rows = df.to_dict(orient="records")
            self._schedule_cache[cache_key] = rows
            return rows

        csv_path = self.output_dir / f"{algorithm}_schedule.csv"
        if csv_path.exists():
            import pandas as pd
            df = pd.read_csv(csv_path).fillna("")
            rows = df.to_dict(orient="records")
            self._schedule_cache[cache_key] = rows
            return rows

        return []

    def export_student_schedule_csv(self, student_id: str, algorithm: str = "ga") -> str:
        result = self.lookup_student(student_id, algorithm)
        if not result.get("found"):
            return f"Student ID '{student_id}' not found."

        output = io.StringIO()
        fieldnames = ["course", "day", "date", "time", "room", "building", "priority", "status"]
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()
        for entry in result["schedule"]:
            writer.writerow({k: entry.get(k, "") for k in fieldnames})
        return output.getvalue()

    def search_students(self, query: str) -> list[dict[str, Any]]:
        self._load_data()
        query = query.lower().strip()
        results: list[dict[str, Any]] = []
        seen: set[str] = set()

        for sid, courses in self._students.items():
            if query in sid.lower():
                if sid not in seen:
                    results.append({"student_id": sid, "courses_count": len(courses)})
                    seen.add(sid)

        for sid in list(self._students.keys()):
            if len(results) >= 20:
                break
            if sid not in seen and any(query in c.lower() for c in self._students[sid]):
                results.append({"student_id": sid, "courses_count": len(self._students[sid])})
                seen.add(sid)

        return results[:20]
