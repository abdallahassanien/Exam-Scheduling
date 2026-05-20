"use client";

import { useRef, useState } from "react";
import { FileSpreadsheet, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { uploadDataset } from "@/lib/api";
import type { DatasetSummary } from "@/lib/types";

export function UploadPanel({
  summary,
  onSummary,
  onToast
}: {
  summary?: DatasetSummary | null;
  onSummary: (summary: DatasetSummary) => void;
  onToast: (message: string, type?: "success" | "error" | "info") => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [datasetType, setDatasetType] = useState("auto");
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (file?: File) => {
    if (!file) return;
    setIsUploading(true);
    try {
      const result = await uploadDataset(file, datasetType);
      onSummary(result.summary);
      onToast(`${result.dataset_type} dataset uploaded`);
    } catch (error) {
      onToast(error instanceof Error ? error.message : "Upload failed", "error");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card id="upload" className="overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-blue-300" />
          Dataset Intake
        </CardTitle>
        <CardDescription>Upload CSV or Excel files for exams, rooms, or student registries.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              handleUpload(event.dataTransfer.files?.[0]);
            }}
            className="flex min-h-52 flex-col items-center justify-center rounded-lg border border-dashed border-blue-300/30 bg-blue-400/[0.07] p-6 text-center transition hover:bg-blue-400/10"
          >
            <UploadCloud className="h-10 w-10 text-blue-200" />
            <p className="mt-3 text-sm font-medium text-white">Drop scheduling data here</p>
            <p className="mt-1 text-xs text-slate-500">CSV, XLSX, or XLS files</p>
            <div className="mt-5 flex w-full max-w-xs gap-2">
              <Select value={datasetType} onChange={(event) => setDatasetType(event.target.value)}>
                <option value="auto">Auto detect</option>
                <option value="exams">Exam data</option>
                <option value="rooms">Rooms</option>
                <option value="students">Students</option>
              </Select>
              <Button variant="secondary" onClick={() => inputRef.current?.click()} disabled={isUploading}>
                {isUploading ? "Uploading" : "Browse"}
              </Button>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={(event) => handleUpload(event.target.files?.[0])}
            />
          </div>

          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ["Rows", summary?.rows_count ?? 0],
                ["Courses", summary?.courses_count ?? 0],
                ["Rooms", summary?.rooms_count ?? 0],
                ["Students", summary?.students_count ?? 0]
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg bg-slate-950/60 p-3">
                  <p className="text-xs text-slate-500">{label}</p>
                  <p className="mt-1 text-lg font-semibold text-white">{Number(value).toLocaleString()}</p>
                </div>
              ))}
            </div>
            <div className="thin-scroll mt-4 max-h-64 overflow-auto rounded-lg border border-white/10">
              <table className="min-w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400">
                  <tr>
                    {Object.keys(summary?.preview?.[0] ?? { Subject: "", num: "", IDs: "" }).map((key) => (
                      <th key={key} className="px-3 py-2 font-medium">{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(summary?.preview ?? []).map((row, index) => (
                    <tr key={index} className="border-t border-white/5 text-slate-300">
                      {Object.values(row).map((value, cell) => (
                        <td key={cell} className="max-w-[260px] truncate px-3 py-2">{String(value)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
