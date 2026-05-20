"use client";

import { useMemo, useState } from "react";
import { CalendarRange, Download, Filter, Search, ZoomIn } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { api } from "@/lib/api";
import type { AlgorithmResult, ScheduleRow } from "@/lib/types";

export function GanttChart({
  ga,
  greedy,
  selected,
  onSelected
}: {
  ga?: AlgorithmResult | null;
  greedy?: AlgorithmResult | null;
  selected: "ga" | "greedy";
  onSelected: (algorithm: "ga" | "greedy") => void;
}) {
  const [query, setQuery] = useState("");
  const [zoom, setZoom] = useState(1);

  const handleDownload = () => {
    const anchor = document.createElement("a");
    anchor.href = api.exportUrl(selected, "csv");
    anchor.download = `${selected}_schedule.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  };

  const filtered = useMemo(() => {
    const rows = selected === "ga" ? ga?.schedule ?? [] : greedy?.schedule ?? [];
    return rows.filter((row) => {
      const value = `${row.exam} ${row.room ?? row.room_id ?? ""} ${row.date} ${row.time}`.toLowerCase();
      return value.includes(query.toLowerCase());
    });
  }, [selected, ga?.schedule, greedy?.schedule, query]);
  const slots = useMemo(() => uniqueSlots(filtered), [filtered]);
  const rooms = useMemo(() => uniqueRooms(filtered).slice(0, 26), [filtered]);
  const byRoom = useMemo(() => {
    const map = new Map<string, ScheduleRow[]>();
    for (const row of filtered) {
      const room = String(row.room ?? row.room_id ?? "Unassigned");
      if (!map.has(room)) map.set(room, []);
      map.get(room)?.push(row);
    }
    return map;
  }, [filtered]);

  return (
    <Card id="schedule" className="overflow-hidden">
      <CardHeader>
        <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarRange className="h-5 w-5 text-blue-300" />
              Interactive Gantt Schedule
            </CardTitle>
            <CardDescription>Time slots, rooms, high-priority exams, and conflict indicators.</CardDescription>
          </div>
          <div className="grid gap-2 sm:grid-cols-[150px_220px_160px_80px]">
            <Select value={selected} onChange={(event) => onSelected(event.target.value as "ga" | "greedy")}>
              <option value="ga">GA result</option>
              <option value="greedy">Greedy result</option>
            </Select>
            <label className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500" />
              <Input className="pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter exam or room" />
            </label>
            <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3">
              <ZoomIn className="h-4 w-4 text-slate-400" />
              <input
                type="range"
                min="0.8"
                max="1.8"
                step="0.1"
                value={zoom}
                onChange={(event) => setZoom(Number(event.target.value))}
                className="w-full accent-blue-400"
              />
            </label>
            <Button variant="secondary" size="sm" onClick={handleDownload} title="Download schedule as CSV">
              <Download className="mr-1 h-3.5 w-3.5" />
              CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
          <Badge tone="green">Scheduled</Badge>
          <Badge tone="red">Conflict</Badge>
          <Badge tone="yellow">High priority</Badge>
          <span className="inline-flex items-center gap-1">
            <Filter className="h-3.5 w-3.5" />
            Showing {filtered.length.toLocaleString()} room assignments
          </span>
        </div>
        <div className="timeline-scroll overflow-auto rounded-lg border border-white/10 bg-slate-950/50">
          <div
            className="min-w-[960px]"
            style={{
              width: `${Math.max(980, slots.length * 84 * zoom)}px`
            }}
          >
            <div className="sticky top-0 z-10 grid grid-cols-[120px_1fr] border-b border-white/10 bg-slate-950/95">
              <div className="border-r border-white/10 px-3 py-3 text-xs font-medium text-slate-400">Room</div>
              <div className="grid" style={{ gridTemplateColumns: `repeat(${slots.length || 1}, minmax(70px, 1fr))` }}>
                {slots.map((slot) => (
                  <div key={slot.key} className="border-r border-white/5 px-2 py-2 text-[11px] text-slate-400">
                    <p className="truncate text-slate-200">{slot.date.slice(5)}</p>
                    <p className="truncate">{slot.time}</p>
                  </div>
                ))}
              </div>
            </div>
            {rooms.map((room) => (
              <div key={room} className="grid min-h-14 grid-cols-[120px_1fr] border-b border-white/5">
                <div className="flex items-center border-r border-white/10 px-3 text-xs font-medium text-slate-300">{room}</div>
                <div className="relative grid" style={{ gridTemplateColumns: `repeat(${slots.length || 1}, minmax(70px, 1fr))` }}>
                  {slots.map((slot) => (
                    <div key={slot.key} className="min-h-14 border-r border-white/5" />
                  ))}
                  {(byRoom.get(room) ?? []).map((item, index) => {
                    const slotIndex = Math.max(0, slots.findIndex((slot) => slot.key === slotKey(item)));
                    const color =
                      item.status === "conflict"
                        ? "border-red-300/40 bg-red-500/25 text-red-50"
                        : item.priority === "high"
                          ? "border-amber-300/40 bg-amber-400/25 text-amber-50"
                          : "border-emerald-300/[0.35] bg-emerald-400/[0.18] text-emerald-50";
                    return (
                      <div
                        key={`${item.exam}-${index}-${slotIndex}`}
                        title={`${item.exam} | ${item.date} ${item.time} | ${item["students in room"] ?? 0} students`}
                        className={`absolute top-2 h-10 overflow-hidden rounded-md border px-2 py-1 text-[11px] shadow-lg backdrop-blur ${color}`}
                        style={{
                          left: `${(slotIndex / Math.max(1, slots.length)) * 100}%`,
                          width: `${Math.max(100 / Math.max(1, slots.length), 5.8)}%`
                        }}
                      >
                        <p className="truncate font-medium">{item.exam}</p>
                        <p className="truncate opacity-70">{item["students in room"] ?? 0} seats</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            {!filtered.length && <div className="p-8 text-center text-sm text-slate-500">Run an algorithm to render the Gantt schedule.</div>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function slotKey(row: ScheduleRow) {
  return `${row.date}|${row.time}`;
}

function uniqueSlots(rows: ScheduleRow[]) {
  const map = new Map<string, { key: string; date: string; time: string }>();
  for (const row of rows) map.set(slotKey(row), { key: slotKey(row), date: row.date, time: row.time });
  return Array.from(map.values()).sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
}

function uniqueRooms(rows: ScheduleRow[]) {
  return Array.from(new Set(rows.map((row) => String(row.room ?? row.room_id ?? "Unassigned")))).sort((a, b) => a.localeCompare(b));
}
