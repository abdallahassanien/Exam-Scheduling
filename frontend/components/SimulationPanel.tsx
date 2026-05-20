"use client";

import { DatabaseZap, Shuffle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import type { DatasetSummary } from "@/lib/types";

export function SimulationPanel({
  onSummary,
  onToast
}: {
  onSummary: (summary: DatasetSummary) => void;
  onToast: (message: string, type?: "success" | "error" | "info") => void;
}) {
  const [form, setForm] = useState({ exams: 80, students: 1200, rooms: 20, enrollment_density: 0.055, seed: 101 });
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    try {
      const result = await api.simulate(form);
      onSummary(result.summary);
      onToast("Simulation dataset generated");
    } catch (error) {
      onToast(error instanceof Error ? error.message : "Simulation failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card id="simulation">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DatabaseZap className="h-5 w-5 text-blue-300" />
          Simulation Mode
        </CardTitle>
        <CardDescription>Generate random workloads, stress-test constraints, and benchmark multiple runs.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            ["Exams", "exams", 10, 500, 1],
            ["Students", "students", 100, 20000, 50],
            ["Rooms", "rooms", 4, 80, 1],
            ["Density", "enrollment_density", 0.01, 0.35, 0.005],
            ["Seed", "seed", 0, 9999, 1]
          ].map(([label, key, min, max, step]) => (
            <label key={String(key)} className="rounded-lg border border-white/10 bg-white/5 p-3">
              <span className="text-xs text-slate-500">{label}</span>
              <Input
                className="mt-2"
                type="number"
                min={Number(min)}
                max={Number(max)}
                step={Number(step)}
                value={form[key as keyof typeof form]}
                onChange={(event) => setForm({ ...form, [key as string]: Number(event.target.value) })}
              />
            </label>
          ))}
        </div>
        <Button onClick={run} disabled={loading} className="mt-4">
          <Shuffle className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
          Generate Dataset
        </Button>
      </CardContent>
    </Card>
  );
}

