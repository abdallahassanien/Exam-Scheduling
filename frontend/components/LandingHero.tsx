"use client";

import { motion } from "framer-motion";
import { ArrowRight, BrainCircuit, Gauge, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ParticleField } from "@/components/ParticleField";
import type { DatasetSummary } from "@/lib/types";

export function LandingHero({ summary, onLaunch }: { summary?: DatasetSummary | null; onLaunch: () => void }) {
  const stats = [
    { label: "Courses optimized", value: summary?.courses_count ?? 235 },
    { label: "Conflict pairs", value: summary?.conflict_pairs ?? 2702 },
    { label: "Exam slots", value: summary?.timeslots_count ?? 60 }
  ];

  return (
    <section className="relative min-h-[720px] overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
      <ParticleField />
      <nav className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500 shadow-glow">
            <BrainCircuit className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">OptiSchedule AI</p>
            <p className="text-xs text-slate-500">GA scheduling platform</p>
          </div>
        </div>
        <Button variant="secondary" onClick={onLaunch}>
          Open Dashboard <ArrowRight className="h-4 w-4" />
        </Button>
      </nav>

      <div className="mx-auto grid max-w-7xl gap-10 pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.75 }}>
          <Badge tone="blue" className="mb-5">
            <Sparkles className="h-3.5 w-3.5" />
            Genetic Algorithm optimization engine
          </Badge>
          <h1 className="max-w-4xl text-5xl font-semibold leading-[1.02] text-white sm:text-6xl lg:text-7xl">
            Optimize Schedules with Genetic Algorithms
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
            A premium AI scheduling dashboard that compares evolutionary optimization against a greedy baseline,
            visualizes constraints, and exports presentation-ready schedules.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" onClick={onLaunch}>
              Launch optimizer <Zap className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="secondary" onClick={() => document.getElementById("ai-explainer")?.scrollIntoView()}>
              Learn the algorithm <Gauge className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-10 grid max-w-2xl grid-cols-3 gap-3">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-lg border border-white/10 bg-white/[0.06] p-4 backdrop-blur-xl">
                <p className="text-2xl font-semibold text-white">{stat.value.toLocaleString()}</p>
                <p className="mt-1 text-xs text-slate-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.85, delay: 0.1 }}
          className="glass relative overflow-hidden rounded-lg p-5 shadow-glow"
        >
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">Live Optimization Map</p>
              <p className="text-xs text-slate-500">Rooms x time slots x conflict pressure</p>
            </div>
            <Badge tone="green">GA winner</Badge>
          </div>
          <div className="grid grid-cols-8 gap-2">
            {Array.from({ length: 96 }).map((_, index) => {
              const hot = [7, 18, 27, 42, 61].includes(index);
              const optimized = index % 5 === 0 || index % 7 === 0;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0.2, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.006 }}
                  className={`h-7 rounded-md border ${
                    hot
                      ? "border-red-400/40 bg-red-500/30 shadow-[0_0_18px_rgba(255,81,102,0.22)]"
                      : optimized
                        ? "border-emerald-400/30 bg-emerald-400/20"
                        : "border-blue-400/[0.14] bg-blue-400/10"
                  }`}
                />
              );
            })}
          </div>
          <div className="mt-5 grid grid-cols-3 gap-3">
            {[
              ["Conflicts", "down 94%", "text-emerald-300"],
              ["Utilization", "71.8%", "text-blue-200"],
              ["Fitness", "92.7k", "text-white"]
            ].map(([label, value, color]) => (
              <div key={label} className="rounded-lg bg-white/[0.06] p-3">
                <p className="text-xs text-slate-500">{label}</p>
                <p className={`mt-1 text-lg font-semibold ${color}`}>{value}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
