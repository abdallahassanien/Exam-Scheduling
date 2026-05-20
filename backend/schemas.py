from __future__ import annotations

from pydantic import BaseModel, Field


class GAParameters(BaseModel):
    population_size: int = Field(default=60, ge=8, le=400)
    generations: int = Field(default=80, ge=1, le=600)
    mutation_rate: float = Field(default=0.08, ge=0, le=1)
    crossover_rate: float = Field(default=0.85, ge=0, le=1)
    elitism_percentage: float = Field(default=0.08, ge=0, le=0.5)
    tournament_size: int = Field(default=4, ge=2, le=32)
    seed: int | None = 42
    early_stop_rounds: int = Field(default=24, ge=0, le=200)


class SimulationRequest(BaseModel):
    exams: int = Field(default=80, ge=10, le=500)
    students: int = Field(default=1200, ge=100, le=20000)
    rooms: int = Field(default=20, ge=4, le=80)
    enrollment_density: float = Field(default=0.055, ge=0.01, le=0.35)
    seed: int | None = 101


class ExportRequest(BaseModel):
    algorithm: str = "ga"
    format: str = "csv"

