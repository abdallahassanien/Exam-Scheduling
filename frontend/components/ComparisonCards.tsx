"use client";

import { Award, Clock3, Gauge, ShieldAlert, UsersRound } from "lucide-react";
import { motion } from "framer-motion";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AlgorithmResult } from "@/lib/types";
import { api } from "@/lib/api";

export function ComparisonCards({
  ga,
  greedy,
  winner
}: {
  ga?: AlgorithmResult | null;
  greedy?: AlgorithmResult | null;
  winner?: string;
}) {
  const chartData = [
    { metric: "Quality", GA: ga?.metrics.quality_score ?? 0, Greedy: greedy?.metrics.quality_score ?? 0 },
    { metric: "Utilization", GA: ga?.metrics.utilization_percentage ?? 0, Greedy: greedy?.metrics.utilization_percentage ?? 0 },
    { metric: "Conflicts", GA: ga ? Math.max(0, 100 - ga.metrics.total_conflicts / 8) : 0, Greedy: greedy ? Math.max(0, 100 - greedy.metrics.total_conflicts / 8) : 0 },
    { metric: "Runtime", GA: ga ? Math.max(0, 100 - ga.metrics.runtime_seconds * 8) : 0, Greedy: greedy ? Math.max(0, 100 - greedy.metrics.runtime_seconds * 8) : 0 }
  ];

  return (
    <section id="compare" className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-2xl font-semibold text-white">Algorithm Comparison</h2>
          <p className="mt-1 text-sm text-slate-400">GA is scored against greedy using the same constraints and quality model.</p>
        </div>
        {winner && <Badge tone={winner.includes("Genetic") ? "green" : "yellow"}>{winner} wins</Badge>}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr_1.1fr]">
        <AlgorithmCard result={ga} title="Genetic Algorithm" winner={winner?.includes("Genetic") ?? false} />
        <AlgorithmCard result={greedy} title="Greedy Algorithm" winner={winner?.includes("Greedy") ?? false} />
        <Card>
          <CardHeader>
            <CardTitle>Animated Metric Bars</CardTitle>
            <CardDescription>Higher is better; conflicts and runtime are inverted for readability.</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 18 }}>
                <CartesianGrid stroke="rgba(148,163,184,0.12)" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} stroke="#64748b" tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="metric" width={76} stroke="#94a3b8" tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.04)" }}
                  contentStyle={{ background: "#020617", border: "1px solid rgba(148,163,184,0.2)", borderRadius: 8 }}
                />
                <Bar dataKey="GA" radius={[0, 6, 6, 0]} fill="#3b82f6" />
                <Bar dataKey="Greedy" radius={[0, 6, 6, 0]} fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function AlgorithmCard({
  result,
  title,
  winner
}: {
  result?: AlgorithmResult | null;
  title: string;
  winner: boolean;
}) {
  const metrics = result?.metrics;
  const exportAlgorithm = title.toLowerCase().startsWith("genetic") ? "ga" : "greedy";
  const items = [
    { label: "Conflicts", value: metrics?.total_conflicts ?? "-", icon: ShieldAlert, tone: "text-red-300" },
    { label: "Quality", value: metrics ? `${metrics.quality_score.toFixed(1)}%` : "-", icon: Award, tone: "text-emerald-300" },
    { label: "Runtime", value: metrics ? `${metrics.runtime_seconds.toFixed(2)}s` : "-", icon: Clock3, tone: "text-blue-300" },
    { label: "Jobs", value: metrics ? `${metrics.jobs_scheduled}/${metrics.jobs_total}` : "-", icon: UsersRound, tone: "text-slate-200" },
    { label: "Utilization", value: metrics ? `${metrics.utilization_percentage.toFixed(1)}%` : "-", icon: Gauge, tone: "text-cyan-300" }
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
      <Card className={winner ? "border-emerald-400/[0.35] shadow-success" : ""}>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{title.startsWith("Genetic") ? "Evolutionary search, repair, elitism" : "Earliest-slot baseline heuristic"}</CardDescription>
            </div>
            {winner && (
              <Badge tone="green">
                <Award className="h-3.5 w-3.5" />
                Winner
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="rounded-lg bg-white/5 p-3">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Icon className={`h-3.5 w-3.5 ${item.tone}`} />
                    {item.label}
                  </div>
                  <p className="mt-2 text-xl font-semibold text-white">{item.value}</p>
                </div>
              );
            })}
          </div>
          <div className="mt-4 rounded-lg border border-white/10 bg-slate-950/50 p-3">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Pros</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              {title.startsWith("Genetic")
                ? "Searches the solution space, repairs invalid room assignments, tracks convergence, and preserves high-fitness schedules."
                : "Fast deterministic baseline that reveals why local earliest-slot decisions struggle with global constraints."}
            </p>
          </div>
          {result && (
            <div className="mt-4 flex gap-2">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => window.open(api.exportUrl(exportAlgorithm as "ga" | "greedy", "csv"), "_blank")}
              >
                CSV
              </Button>
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => window.open(api.exportUrl(exportAlgorithm as "ga" | "greedy", "pdf"), "_blank")}
              >
                PDF
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
