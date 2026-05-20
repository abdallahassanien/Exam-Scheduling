import type { AlgorithmResult, DatasetSummary, GAParameters, StudentScheduleResult, StudentSearchResult } from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {})
    }
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail ?? `Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const api = {
  baseUrl: API_URL,
  dataset: () => request<DatasetSummary>("/api/dataset"),
  runGreedy: () => request<AlgorithmResult>("/api/run-greedy", { method: "POST" }),
  runGa: (params: GAParameters) =>
    request<AlgorithmResult>("/api/run-ga", {
      method: "POST",
      body: JSON.stringify(params)
    }),
  compare: () =>
    request<{ winner: string; ga: AlgorithmResult; greedy: AlgorithmResult; deltas: Record<string, number> }>(
      "/api/compare",
      { method: "POST" }
    ),
  schedule: (algorithm: "ga" | "greedy") => request<AlgorithmResult>(`/api/schedule?algorithm=${algorithm}`),
  analytics: (algorithm: "ga" | "greedy") => request(`/api/analytics?algorithm=${algorithm}`),
  simulate: (payload: Record<string, number>) =>
    request<{ message: string; summary: DatasetSummary }>("/api/simulate", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  exportUrl: (algorithm: "ga" | "greedy", format: "csv" | "pdf") =>
    `${API_URL}/api/export?algorithm=${algorithm}&format=${format}`,
  liveGaUrl: () => `${API_URL.replace(/^http/, "ws")}/api/run-ga/live`,
  studentSchedule: (studentId: string, algorithm: "ga" | "greedy" = "ga") =>
    request<StudentScheduleResult>(`/api/student/${encodeURIComponent(studentId)}?algorithm=${algorithm}`),
  studentSearch: (query: string) =>
    request<StudentSearchResult[]>(`/api/student/search?query=${encodeURIComponent(query)}`),
  studentExportUrl: (studentId: string, format: "csv" | "pdf", algorithm: "ga" | "greedy" = "ga") =>
    `${API_URL}/api/student/export/${encodeURIComponent(studentId)}?format=${format}&algorithm=${algorithm}`
};

export async function uploadDataset(file: File, datasetType = "auto") {
  const form = new FormData();
  form.append("file", file);
  form.append("dataset_type", datasetType);
  const response = await fetch(`${API_URL}/api/upload`, {
    method: "POST",
    body: form
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail ?? "Upload failed");
  }
  return response.json();
}

