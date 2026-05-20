"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, BarChart3, CalendarCheck2, Database, Gauge, UsersRound, type LucideIcon } from "lucide-react";
import { AlgorithmControls } from "@/components/AlgorithmControls";
import { AiExplanation } from "@/components/AiExplanation";
import { AnalyticsCharts } from "@/components/AnalyticsCharts";
import { AppShell } from "@/components/AppShell";
import { ComparisonCards } from "@/components/ComparisonCards";
import { ConstraintMonitor } from "@/components/ConstraintMonitor";
import { GanttChart } from "@/components/GanttChart";
import { LandingHero } from "@/components/LandingHero";
import { MetricCard } from "@/components/MetricCard";
import { StudentQuickLookup } from "@/components/StudentQuickLookup";
import { Button } from "@/components/ui/button";
import { Toast, type ToastState } from "@/components/ui/toast";
import { api } from "@/lib/api";
import type { AlgorithmResult, DatasetSummary, GAParameters, HistoryPoint } from "@/lib/types";

const defaultParams: GAParameters = {
  population_size: 60,
  generations: 80,
  mutation_rate: 0.08,
  crossover_rate: 0.85,
  elitism_percentage: 0.08,
  tournament_size: 4,
  seed: 42,
  early_stop_rounds: 24
};

export default function Home() {
  const [summary, setSummary] = useState<DatasetSummary | null>(null);
  const [ga, setGa] = useState<AlgorithmResult | null>(null);
  const [greedy, setGreedy] = useState<AlgorithmResult | null>(null);
  const [winner, setWinner] = useState<string>("");
  const [params, setParams] = useState<GAParameters>(defaultParams);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [liveHistory, setLiveHistory] = useState<HistoryPoint[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<"ga" | "greedy">("ga");
  const [toast, setToast] = useState<ToastState>(null);
  const [active, setActive] = useState("dashboard");

  const currentResult = selectedSchedule === "ga" ? ga : greedy;
  const latestPoint = liveHistory.at(-1);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 4200);
  };

  useEffect(() => {
    api
      .dataset()
      .then(setSummary)
      .catch((error) => showToast(error instanceof Error ? error.message : "Backend is offline", "error"));
  }, []);

  const dashboardMetrics = useMemo(() => {
    const best = ga?.metrics ?? greedy?.metrics;
    return [
      {
        label: "Quality Score",
        value: best ? `${best.quality_score.toFixed(1)}%` : "--",
        delta: "Shared scoring: hard penalties + soft spread",
        icon: Gauge,
        tone: "green" as const
      },
      {
        label: "Conflicts",
        value: best?.total_conflicts ?? "--",
        delta: "Room, student, day, capacity, unscheduled",
        icon: AlertTriangle,
        tone: best && best.total_conflicts > 0 ? ("yellow" as const) : ("green" as const)
      },
      {
        label: "Jobs Scheduled",
        value: best ? `${best.jobs_scheduled}/${best.jobs_total}` : summary?.courses_count ?? "--",
        delta: "Loaded from the original exam dataset",
        icon: CalendarCheck2,
        tone: "blue" as const
      },
      {
        label: "Utilization",
        value: best ? `${best.utilization_percentage.toFixed(1)}%` : "--",
        delta: "Room, slot, seat, and room-slot usage",
        icon: BarChart3,
        tone: "blue" as const
      }
    ];
  }, [ga, greedy, summary]);

  const navigate = (id: string) => {
    setActive(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const runGreedy = async () => {
    setRunning(true);
    try {
      const result = await api.runGreedy();
      setGreedy(result);
      setSelectedSchedule("greedy");
      showToast("Greedy baseline completed");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Greedy run failed", "error");
    } finally {
      setRunning(false);
    }
  };

  const runGaLive = () => {
    setRunning(true);
    setProgress(0);
    setLiveHistory([]);
    const socket = new WebSocket(api.liveGaUrl());

    socket.addEventListener("open", () => socket.send(JSON.stringify(params)));
    socket.addEventListener("message", (event) => {
      const payload = JSON.parse(event.data);
      if (payload.event === "generation") {
        setProgress(payload.progress ?? 0);
        setLiveHistory((history) => [...history, payload]);
      }
      if (payload.event === "complete") {
        setGa(payload.result);
        setSelectedSchedule("ga");
        setProgress(100);
        setRunning(false);
        showToast("Genetic Algorithm completed");
        socket.close();
      }
      if (payload.event === "error") {
        setRunning(false);
        showToast(payload.message ?? "GA run failed", "error");
        socket.close();
      }
    });
    socket.addEventListener("error", async () => {
      try {
        const result = await api.runGa(params);
        setGa(result);
        setSelectedSchedule("ga");
        setProgress(100);
        showToast("Genetic Algorithm completed");
      } catch (error) {
        showToast(error instanceof Error ? error.message : "GA run failed", "error");
      } finally {
        setRunning(false);
      }
    });
  };

  const compare = async () => {
    setRunning(true);
    try {
      const result = await api.compare();
      setGa(result.ga);
      setGreedy(result.greedy);
      setWinner(result.winner);
      setSelectedSchedule("ga");
      showToast(`${result.winner} is leading`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Comparison failed", "error");
    } finally {
      setRunning(false);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <Toast toast={toast} />
      <LandingHero summary={summary} onLaunch={() => navigate("dashboard")} />
      <div className="flex border-t border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.18),transparent_34%),#050713]">
        <AppShell active={active} onNavigate={navigate} />
        <div className="min-w-0 flex-1">
          <div className="sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-slate-950/75 px-4 py-3 backdrop-blur-xl lg:hidden">
            <p className="font-semibold text-white">OptiSchedule AI</p>
            <Button variant="secondary" size="sm" onClick={() => navigate("compare")}>Compare</Button>
          </div>

          <div className="mx-auto max-w-7xl space-y-7 px-4 py-7 sm:px-6 lg:px-8">
            <section id="dashboard" className="space-y-4">
              <div className="rounded-lg border border-white/10 bg-dashboard-grid bg-[length:28px_28px] p-5">
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-blue-200">AI Optimization Platform</p>
                    <h2 className="mt-2 text-3xl font-semibold text-white">Scheduling Command Center</h2>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                      Run the existing Genetic Algorithm and Greedy scheduler, compare metrics, inspect constraints,
                      and export schedules from one polished web application.
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <MiniStat label="Rooms" value={summary?.rooms_count ?? 0} icon={Database} />
                    <MiniStat label="Students" value={summary?.students_count ?? 0} icon={UsersRound} />
                    <MiniStat label="Conflicts" value={summary?.conflict_pairs ?? 0} icon={Activity} />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {dashboardMetrics.map((metric) => (
                  <MetricCard key={metric.label} {...metric} />
                ))}
              </div>
            </section>

            <StudentQuickLookup
              selectedAlgorithm={selectedSchedule}
              gaExists={ga !== null}
              greedyExists={greedy !== null}
            />

            <AlgorithmControls
              params={params}
              setParams={setParams}
              running={running}
              progress={progress}
              latestPoint={latestPoint}
              onRunGa={runGaLive}
              onRunGreedy={runGreedy}
              onCompare={compare}
            />
            <ComparisonCards ga={ga} greedy={greedy} winner={winner} />
            <GanttChart ga={ga} greedy={greedy} selected={selectedSchedule} onSelected={setSelectedSchedule} />
            <ConstraintMonitor result={currentResult} />
            <AnalyticsCharts result={currentResult ?? ga ?? greedy} />
            <AiExplanation />
          </div>
        </div>
      </div>
    </main>
  );
}

function MiniStat({
  label,
  value,
  icon: Icon
}: {
  label: string;
  value: number;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-slate-950/60 p-3">
      <Icon className="mx-auto h-4 w-4 text-blue-200" />
      <p className="mt-2 text-lg font-semibold text-white">{value.toLocaleString()}</p>
      <p className="text-[11px] text-slate-500">{label}</p>
    </div>
  );
}
