"use client";

import { motion } from "framer-motion";
import { BadgeCheck, Dna, GitBranch, RotateCcw, Trophy } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const steps = [
  {
    title: "Population",
    icon: Dna,
    text: "Each chromosome is a complete exam schedule: exam, timeslot, and one or more rooms."
  },
  {
    title: "Fitness",
    icon: Trophy,
    text: "Hard conflicts are heavily penalized, while soft load-balancing penalties shape cleaner schedules."
  },
  {
    title: "Crossover",
    icon: GitBranch,
    text: "High-quality schedule segments are preserved by mixing parent assignments into a repaired child."
  },
  {
    title: "Mutation",
    icon: RotateCcw,
    text: "Selected exams move to new slots, then the repair step reallocates rooms and reduces invalid states."
  }
];

export function AiExplanation() {
  return (
    <section id="ai-explainer" className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold text-white">AI Explanation</h2>
        <p className="mt-1 text-sm text-slate-400">Why the Genetic Algorithm outperforms a locally greedy scheduler.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <CardTitle>Evolutionary Scheduling Loop</CardTitle>
            <CardDescription>Productionized directly from the original Python GA engine.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative grid grid-cols-2 gap-3">
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <motion.div
                    key={step.title}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.08 }}
                    viewport={{ once: true }}
                    className="rounded-lg border border-white/10 bg-white/5 p-4"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/[0.16] text-blue-200">
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="mt-3 text-sm font-medium text-white">{step.title}</p>
                    <p className="mt-2 text-xs leading-5 text-slate-400">{step.text}</p>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>GA vs Greedy</CardTitle>
            <CardDescription>Global search beats earliest-slot assignment when constraints interact.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                ["Search strategy", "Greedy makes the first acceptable move; GA explores many complete schedules."],
                ["Room allocation", "GA supports multi-room exam splitting and capacity repair; greedy uses a simple room pick."],
                ["Constraint pressure", "GA evaluates room overlap, student clashes, same-day conflicts, capacity, and spread."],
                ["Convergence", "Best and average fitness reveal whether the population is improving or stagnating."]
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-white/10 bg-slate-950/50 p-4">
                  <div className="flex items-center gap-2">
                    <BadgeCheck className="h-4 w-4 text-emerald-300" />
                    <p className="text-sm font-medium text-white">{label}</p>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{value}</p>
                </div>
              ))}
              <Badge tone="green">Constraint-aware repair is the secret sauce</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
