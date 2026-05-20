"use client";

import { BarChart3, Download } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AlgorithmResult } from "@/lib/types";
import { api } from "@/lib/api";

export function AnalyticsCharts({ result }: { result?: AlgorithmResult | null }) {
  const analytics = result?.analytics;
  const fitness = result?.history?.length ? result.history : analytics?.fitness_history ?? [];
  const room = analytics?.room_utilization ?? [];
  const day = analytics?.day_distribution ?? [];

  return (
    <section id="analytics" className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-semibold text-white">
            <BarChart3 className="h-6 w-6 text-blue-300" />
            Analytics
          </h2>
          <p className="mt-1 text-sm text-slate-400">Fitness convergence, conflict reduction, room utilization, and daily load.</p>
        </div>
        {result && (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => window.open(api.exportUrl(result.algorithm, "csv"), "_blank")}>
              <Download className="h-4 w-4" />
              CSV
            </Button>
            <Button variant="secondary" onClick={() => window.open(api.exportUrl(result.algorithm, "pdf"), "_blank")}>
              <Download className="h-4 w-4" />
              PDF
            </Button>
          </div>
        )}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Fitness Over Generations" description="Best and average population fitness.">
          <ResponsiveContainer width="100%" height={310}>
            <LineChart data={fitness}>
              <CartesianGrid stroke="rgba(148,163,184,0.12)" />
              <XAxis dataKey="generation" stroke="#64748b" tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" tickLine={false} axisLine={false} width={76} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend />
              <Line type="monotone" dataKey="best_fitness" stroke="#60a5fa" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="average_fitness" stroke="#21d07a" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Conflict Reduction" description="Hard and soft conflict pressure while evolving.">
          <ResponsiveContainer width="100%" height={310}>
            <AreaChart data={fitness}>
              <defs>
                <linearGradient id="conflicts" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff5166" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#ff5166" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(148,163,184,0.12)" />
              <XAxis dataKey="generation" stroke="#64748b" tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="conflicts" stroke="#ff5166" fill="url(#conflicts)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Room Utilization" description="Most-used rooms in the current schedule.">
          <ResponsiveContainer width="100%" height={310}>
            <BarChart data={room}>
              <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
              <XAxis dataKey="room" stroke="#64748b" tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="assignments" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Daily Exam Load" description="Distribution across academic exam days.">
          <ResponsiveContainer width="100%" height={310}>
            <BarChart data={day}>
              <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
              <XAxis dataKey="day" stroke="#64748b" tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="exams" fill="#21d07a" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </section>
  );
}

function ChartCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

const tooltipStyle = {
  background: "#020617",
  border: "1px solid rgba(148,163,184,0.2)",
  borderRadius: 8,
  color: "#e2e8f0"
};

