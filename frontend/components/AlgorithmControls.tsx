"use client";

import { Play, RefreshCw, SlidersHorizontal, WandSparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import type { GAParameters, HistoryPoint } from "@/lib/types";

export function AlgorithmControls({
  params,
  setParams,
  running,
  progress,
  latestPoint,
  onRunGa,
  onRunGreedy,
  onCompare
}: {
  params: GAParameters;
  setParams: (params: GAParameters) => void;
  running: boolean;
  progress: number;
  latestPoint?: HistoryPoint;
  onRunGa: () => void;
  onRunGreedy: () => void;
  onCompare: () => void;
}) {
  const update = (key: keyof GAParameters, value: number) => setParams({ ...params, [key]: value });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SlidersHorizontal className="h-5 w-5 text-blue-300" />
          Optimization Controls
        </CardTitle>
        <CardDescription>Tune the evolutionary engine and run the greedy baseline.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <Param label="Population" value={params.population_size} min={8} max={400} onChange={(v) => update("population_size", v)} />
          <Param label="Generations" value={params.generations} min={1} max={600} onChange={(v) => update("generations", v)} />
          <Param label="Mutation" value={params.mutation_rate} min={0} max={1} step={0.01} onChange={(v) => update("mutation_rate", v)} />
          <Param label="Crossover" value={params.crossover_rate} min={0} max={1} step={0.01} onChange={(v) => update("crossover_rate", v)} />
          <Param label="Elitism" value={params.elitism_percentage} min={0} max={0.5} step={0.01} onChange={(v) => update("elitism_percentage", v)} />
          <Param label="Early stop" value={params.early_stop_rounds} min={0} max={200} onChange={(v) => update("early_stop_rounds", v)} />
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_360px]">
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-white">Live GA Progress</p>
                <p className="text-xs text-slate-500">
                  {latestPoint
                    ? `Generation ${latestPoint.generation}: best fitness ${latestPoint.best_fitness.toLocaleString()}`
                    : "Ready to evolve a schedule"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-semibold text-white">{Math.round(progress)}%</p>
                <p className="text-xs text-slate-500">complete</p>
              </div>
            </div>
            <Progress value={progress} className="mt-4" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Button onClick={onRunGa} disabled={running} className="h-full flex-col py-4">
              {running ? <RefreshCw className="h-4 w-4 animate-spin" /> : <WandSparkles className="h-4 w-4" />}
              GA
            </Button>
            <Button variant="secondary" onClick={onRunGreedy} disabled={running} className="h-full flex-col py-4">
              <Play className="h-4 w-4" />
              Greedy
            </Button>
            <Button variant="secondary" onClick={onCompare} disabled={running} className="h-full flex-col py-4">
              <RefreshCw className="h-4 w-4" />
              Compare
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Param({
  label,
  value,
  min,
  max,
  step = 1,
  onChange
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="rounded-lg border border-white/10 bg-white/5 p-3">
      <span className="text-xs text-slate-500">{label}</span>
      <Input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-2"
      />
    </label>
  );
}

