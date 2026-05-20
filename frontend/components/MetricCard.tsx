"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  delta,
  icon: Icon,
  tone = "blue"
}: {
  label: string;
  value: string | number;
  delta?: string;
  icon: LucideIcon;
  tone?: "blue" | "green" | "yellow" | "red";
}) {
  const tones = {
    blue: "from-blue-500/[0.18] to-cyan-400/[0.06] text-blue-200",
    green: "from-emerald-500/[0.18] to-green-400/[0.06] text-emerald-200",
    yellow: "from-amber-500/[0.18] to-yellow-400/[0.06] text-amber-200",
    red: "from-red-500/[0.18] to-rose-400/[0.06] text-red-200"
  };

  return (
    <div className="rounded-lg border border-white/10 bg-slate-950/[0.52] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
        </div>
        <div className={cn("rounded-lg bg-gradient-to-br p-3", tones[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {delta && <p className="mt-3 text-xs text-slate-400">{delta}</p>}
    </div>
  );
}
