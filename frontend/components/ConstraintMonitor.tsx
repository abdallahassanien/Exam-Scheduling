"use client";

import { Activity, CheckCircle2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { AlgorithmResult } from "@/lib/types";

const INSTRUCTOR_KEYWORDS = ["instructor", " teacher ", " faculty "];

function hasInstructor(text: string): boolean {
  const lower = text.toLowerCase();
  return INSTRUCTOR_KEYWORDS.some((kw) => lower.includes(kw));
}

export function ConstraintMonitor({ result }: { result?: AlgorithmResult | null }) {
  const constraints = (result?.constraints?.items ?? []).filter(
    (item) => !hasInstructor(item.name) && !hasInstructor(item.description)
  );
  const reasons = (result?.constraints?.conflict_reasons ?? []).filter(
    (r) => !hasInstructor(r.type) && !hasInstructor(r.message)
  );
  return (
    <Card id="constraints">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-300" />
          Constraint Monitor
        </CardTitle>
        <CardDescription>Hard and soft rule validation powered by the original constraints module.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-3">
            {constraints.map((item) => (
              <div key={item.name} className="rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      {item.satisfied ? <CheckCircle2 className="h-4 w-4 text-emerald-300" /> : <XCircle className="h-4 w-4 text-red-300" />}
                      <p className="text-sm font-medium text-white">{item.name}</p>
                      <Badge tone={item.severity === "hard" ? "red" : "yellow"}>{item.severity}</Badge>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{item.description}</p>
                  </div>
                  <p className={item.satisfied ? "text-sm text-emerald-300" : "text-sm text-red-300"}>{item.violations}</p>
                </div>
                <Progress value={item.percentage} className="mt-3" />
              </div>
            ))}
            {!constraints.length && <p className="rounded-lg border border-white/10 bg-white/5 p-5 text-sm text-slate-500">Run GA or Greedy to inspect constraint satisfaction.</p>}
          </div>
          <div className="rounded-lg border border-white/10 bg-slate-950/50 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-white">Conflict Reasons</p>
              <Badge tone={reasons.length ? "yellow" : "green"}>{reasons.length} surfaced</Badge>
            </div>
            <div className="thin-scroll mt-4 max-h-[452px] space-y-3 overflow-auto pr-1">
              {reasons.slice(0, 18).map((reason, index) => (
                <div key={`${reason.message}-${index}`} className="rounded-lg border border-white/10 bg-white/5 p-3">
                  <Badge tone={reason.type === "capacity" ? "yellow" : reason.type === "student" ? "red" : "blue"}>{reason.type}</Badge>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{reason.message}</p>
                </div>
              ))}
              {!reasons.length && <p className="text-sm leading-6 text-slate-500">No detailed conflicts available for the current schedule.</p>}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

