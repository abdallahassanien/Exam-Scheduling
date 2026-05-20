"use client";

import {
  Activity,
  BarChart3,
  BrainCircuit,
  CalendarRange,
  Gauge,
  GitCompareArrows,
  GraduationCap,
  LayoutDashboard
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "compare", label: "Compare", icon: GitCompareArrows },
  { id: "schedule", label: "Gantt", icon: CalendarRange },
  { id: "constraints", label: "Constraints", icon: Activity },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "ai-explainer", label: "AI Explain", icon: Gauge },
  { id: "student-portal", label: "Student Portal", icon: GraduationCap, href: "/student-portal" }
];

export function AppShell({
  active,
  onNavigate
}: {
  active: string;
  onNavigate: (id: string) => void;
}) {
  return (
    <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-white/10 bg-slate-950/70 p-5 backdrop-blur-xl lg:block">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-500 shadow-glow">
          <BrainCircuit className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="font-semibold text-white">OptiSchedule AI</p>
          <p className="text-xs text-slate-500">Optimization Console</p>
        </div>
      </div>
      <div className="mt-8 space-y-1">
        {nav.map((item) => {
          const Icon = item.icon;
          if ("href" in item) {
            return (
              <a
                key={item.id}
                href={item.href as string}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition",
                  "text-slate-400 hover:bg-white/[0.07] hover:text-white"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </a>
            );
          }
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition",
                active === item.id
                  ? "bg-blue-500/15 text-blue-100"
                  : "text-slate-400 hover:bg-white/[0.07] hover:text-white"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </div>
      <div className="absolute bottom-5 left-5 right-5 rounded-lg border border-emerald-400/20 bg-emerald-400/10 p-4">
        <p className="text-sm font-medium text-emerald-100">System online</p>
        <p className="mt-1 text-xs leading-5 text-emerald-200/70">FastAPI backend, original Python GA, and live metrics are connected.</p>
      </div>
    </aside>
  );
}
