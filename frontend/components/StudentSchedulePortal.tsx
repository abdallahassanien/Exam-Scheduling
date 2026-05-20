"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  Download,
  GraduationCap,
  MapPin,
  Printer,
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  BookOpen,
  Cpu,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import type { StudentScheduleEntry, StudentScheduleResult, StudentSearchResult } from "@/lib/types";

type Algorithm = "ga" | "greedy";
type ViewMode = "table" | "weekly" | "timeline";
const DAY_ORDER = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"];

export function StudentSchedulePortal({ algorithm: initialAlgo = "ga" }: { algorithm?: Algorithm }) {
  const [studentId, setStudentId] = useState("");
  const [result, setResult] = useState<StudentScheduleResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [searched, setSearched] = useState(false);
  const [suggestions, setSuggestions] = useState<StudentSearchResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [algorithm, setAlgorithm] = useState<Algorithm>(initialAlgo);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const doSearch = useCallback(async (id?: string) => {
    const sid = (id ?? studentId).trim();
    if (!sid) {
      setError("Please enter a Student ID.");
      return;
    }
    setLoading(true);
    setError("");
    setSearched(true);
    setShowSuggestions(false);
    try {
      const data = await api.studentSchedule(sid, algorithm);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lookup failed. Check the ID and try again.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [studentId, algorithm]);

  const handleChange = useCallback((value: string) => {
    setStudentId(value);
    setError("");
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (value.trim().length >= 2) {
      searchTimeout.current = setTimeout(async () => {
        try {
          const results = await api.studentSearch(value.trim());
          setSuggestions(results);
          setShowSuggestions(results.length > 0);
        } catch { /* ignore */ }
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, []);

  const handleKey = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") doSearch();
  }, [doSearch]);

  const conflictCount = result?.conflicts?.length ?? 0;
  const highPriority = result?.schedule?.filter((e) => e.priority === "high").length ?? 0;
  const noSchedule = result && result.schedule_generated === false;

  const exportCsv = () => {
    if (result?.found) window.open(api.studentExportUrl(result.student_id, "csv", algorithm), "_blank");
  };
  const exportPdf = () => {
    if (result?.found) window.open(api.studentExportUrl(result.student_id, "pdf", algorithm), "_blank");
  };
  const printSchedule = () => window.print();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-[#0a0e1a] to-slate-900 text-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

        {/* HERO SEARCH */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative mb-8 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-blue-600/20 via-indigo-600/10 to-purple-600/20 p-6 sm:p-8 shadow-xl"
        >
          <div className="absolute right-0 top-0 h-56 w-56 translate-x-12 -translate-y-12 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="relative z-10">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20 shadow">
                <GraduationCap className="h-5 w-5 text-blue-300" />
              </div>
              <div className="flex-1">
                <h1 className="text-xl font-bold sm:text-2xl">Find Your Schedule Instantly</h1>
                <p className="mt-0.5 text-sm text-slate-400">Enter your Student ID to view your personalized exam schedule</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex overflow-hidden rounded-lg border border-white/10">
                  <button
                    onClick={() => setAlgorithm("ga")}
                    className={`px-3 py-1.5 text-xs font-medium transition ${algorithm === "ga" ? "bg-blue-500/20 text-blue-300" : "bg-transparent text-slate-500 hover:text-white"}`}
                  >
                    GA
                  </button>
                  <button
                    onClick={() => setAlgorithm("greedy")}
                    className={`px-3 py-1.5 text-xs font-medium transition ${algorithm === "greedy" ? "bg-amber-500/20 text-amber-300" : "bg-transparent text-slate-500 hover:text-white"}`}
                  >
                    Greedy
                  </button>
                </div>
              </div>
            </div>
            <div className="flex gap-2 sm:gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  ref={inputRef}
                  type="text"
                  value={studentId}
                  onChange={(e) => handleChange(e.target.value)}
                  onKeyDown={handleKey}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder="Enter Student ID (e.g. 241002046)"
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-white placeholder:text-slate-600 focus:border-blue-400/50 focus:outline-none focus:ring-2 focus:ring-blue-400/20"
                  disabled={loading}
                />
                {showSuggestions && (
                  <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-white/10 bg-slate-900 shadow-2xl">
                    {suggestions.map((s) => (
                      <button
                        key={s.student_id}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
                        onMouseDown={() => { setStudentId(s.student_id); setShowSuggestions(false); doSearch(s.student_id); }}
                      >
                        <GraduationCap className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                        <span className="font-mono">{s.student_id}</span>
                        <span className="ml-auto text-xs text-slate-500">{s.courses_count} courses</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => doSearch()}
                disabled={loading}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-sm font-medium text-white shadow transition hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 shrink-0"
              >
                {loading ? (
                  <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />Search</>
                ) : (
                  <><Search className="h-4 w-4" />Find</>
                )}
              </button>
            </div>
            {error && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mt-3 flex items-center gap-2 rounded-lg border border-red-400/20 bg-red-400/10 px-4 py-2.5 text-sm text-red-300">
                <XCircle className="h-4 w-4 shrink-0" />{error}
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* CONTENT */}
        <AnimatePresence mode="wait">
          {loading && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              {[1,2,3].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl border border-white/5 bg-white/[0.03]" />)}
            </motion.div>
          )}

          {!loading && searched && noSchedule && (
            <motion.div key="no-schedule" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center rounded-2xl border border-yellow-400/20 bg-yellow-400/5 px-6 py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-800/50"><AlertTriangle className="h-7 w-7 text-yellow-500" /></div>
              <h3 className="text-lg font-semibold">No Schedule Generated</h3>
              <p className="mt-1 text-sm text-slate-500">{result?.message || "Please generate a schedule first."}</p>
              <p className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                <Cpu className="h-3.5 w-3.5" />
                <span className={`font-medium ${algorithm === "ga" ? "text-blue-300" : "text-amber-300"}`}>
                  {algorithm === "ga" ? "Genetic Algorithm" : "Greedy Algorithm"}
                </span>
              </p>
            </motion.div>
          )}

          {!loading && searched && result && !noSchedule && !result.found && (
            <motion.div key="not-found" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center rounded-2xl border border-white/10 bg-white/[0.02] px-6 py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-800/50"><Search className="h-7 w-7 text-slate-600" /></div>
              <h3 className="text-lg font-semibold">Schedule Not Found</h3>
              <p className="mt-1 text-sm text-slate-500">{result.message || "No schedule found for this ID."}</p>
              <div className="mt-4 rounded-lg border border-white/5 bg-white/[0.02] p-3 text-left text-xs text-slate-500">
                <p className="font-medium text-slate-400">Tips:</p>
                <ul className="mt-1 space-y-0.5"><li>• Check for typos</li><li>• Try your full university ID</li><li>• Ask registrar for correct format</li></ul>
              </div>
            </motion.div>
          )}

          {!loading && searched && result?.found && (
            <motion.div key="results" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {/* STATUS BAR */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <GraduationCap className="h-3.5 w-3.5 text-blue-400" />
                    ID: <span className="font-mono text-white">{result.student_id}</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <BookOpen className="h-3.5 w-3.5 text-green-400" />
                    {result.found_courses}/{result.total_courses} courses
                  </span>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${algorithm === "ga" ? "bg-blue-400/15 text-blue-300" : "bg-amber-400/15 text-amber-300"}`}>
                    <Cpu className="h-3 w-3" />
                    {algorithm === "ga" ? "GA" : "Greedy"}
                  </span>
                  {conflictCount > 0 && (
                    <span className="flex items-center gap-1.5 text-red-400"><AlertTriangle className="h-3.5 w-3.5" />{conflictCount} conflict(s)</span>
                  )}
                  {highPriority > 0 && (
                    <span className="flex items-center gap-1.5 text-yellow-400"><AlertTriangle className="h-3.5 w-3.5" />{highPriority} high priority</span>
                  )}
                </div>
                <div className="flex gap-1.5">
                  {(["table","weekly","timeline"] as const).map((m) => (
                    <button key={m} onClick={() => setViewMode(m)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${viewMode === m ? "bg-blue-500/20 text-blue-300" : "text-slate-500 hover:bg-white/5 hover:text-white"}`}
                    >{m === "table" ? "Table" : m === "weekly" ? "Weekly" : "Timeline"}</button>
                  ))}
                  <span className="mx-1 w-px bg-white/10" />
                  <button onClick={exportCsv} className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-slate-400 transition hover:bg-white/5 hover:text-white"><Download className="h-3.5 w-3.5" />CSV</button>
                  <button onClick={exportPdf} className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-slate-400 transition hover:bg-white/5 hover:text-white"><Download className="h-3.5 w-3.5" />PDF</button>
                  <button onClick={printSchedule} className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-slate-400 transition hover:bg-white/5 hover:text-white"><Printer className="h-3.5 w-3.5" />Print</button>
                </div>
              </div>

              {/* TABLE VIEW */}
              {viewMode === "table" && <TableView entries={result.schedule} />}
              {viewMode === "weekly" && <WeeklyView entries={result.schedule} />}
              {viewMode === "timeline" && <TimelineView entries={result.schedule} />}

              {result.missing_courses?.length > 0 && (
                <div className="rounded-xl border border-yellow-400/20 bg-yellow-400/5 p-4 text-sm">
                  <p className="font-medium text-yellow-300">{result.missing_courses.length} course(s) not scheduled:</p>
                  <p className="mt-1 text-xs text-yellow-400/70">{result.missing_courses.join(", ")}</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* === TABLE VIEW === */
function TableView({ entries }: { entries: StudentScheduleEntry[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.04]">
              <th className="px-4 py-3 font-medium text-slate-400">Course</th>
              <th className="px-4 py-3 font-medium text-slate-400">Day</th>
              <th className="px-4 py-3 font-medium text-slate-400">Date</th>
              <th className="px-4 py-3 font-medium text-slate-400">Time</th>
              <th className="px-4 py-3 font-medium text-slate-400">Room</th>
              <th className="px-4 py-3 font-medium text-slate-400">Capacity</th>
              <th className="px-4 py-3 font-medium text-slate-400">Status</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, i) => {
              const isConflict = entry.status === "conflict";
              const isHigh = entry.priority === "high";
              return (
                <tr key={`${entry.course}-${i}`} className={`border-b border-white/[0.03] transition hover:bg-white/[0.03] ${isConflict ? "bg-red-400/5" : ""} ${isHigh ? "bg-yellow-400/[0.03]" : ""}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 shrink-0 rounded-full ${isConflict ? "bg-red-400" : isHigh ? "bg-yellow-400" : "bg-blue-400"}`} />
                      <span className="font-medium text-white">{entry.course}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{entry.day}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-400">{entry.date}</td>
                  <td className="px-4 py-3"><span className="flex items-center gap-1 text-slate-300"><Clock className="h-3 w-3 text-slate-500 shrink-0" />{entry.time}</span></td>
                  <td className="px-4 py-3"><span className="flex items-center gap-1 text-slate-300"><MapPin className="h-3 w-3 text-slate-500 shrink-0" />{entry.room}</span></td>
                  <td className="px-4 py-3 text-slate-300">{entry.students_seated}/{entry.capacity}</td>
                  <td className="px-4 py-3">
                    {isConflict ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-400/10 px-2.5 py-0.5 text-xs font-medium text-red-300"><AlertTriangle className="h-3 w-3" />Conflict</span>
                    ) : isHigh ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-yellow-400/10 px-2.5 py-0.5 text-xs font-medium text-yellow-300">High Priority</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-400/10 px-2.5 py-0.5 text-xs font-medium text-green-300"><CheckCircle2 className="h-3 w-3" />Scheduled</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* === WEEKLY VIEW === */
function WeeklyView({ entries }: { entries: StudentScheduleEntry[] }) {
  const timeSlots = ["08:00", "10:00", "12:00", "14:00"];
  const grid: Record<string, Record<string, StudentScheduleEntry[]>> = {};
  for (const day of DAY_ORDER) {
    grid[day] = {};
    for (const ts of timeSlots) grid[day][ts] = [];
  }
  for (const e of entries) {
    if (grid[e.day] && grid[e.day][e.start_time]) grid[e.day][e.start_time].push(e);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
      <div className="overflow-x-auto p-3">
        <div className="grid min-w-[700px] grid-cols-[70px_repeat(6,1fr)] gap-px">
          <div />
          {DAY_ORDER.map((d) => <div key={d} className="bg-white/[0.03] px-2 py-2.5 text-center text-xs font-medium text-slate-400">{d.slice(0, 3)}</div>)}
          {timeSlots.map((ts) => (
            <>
              <div key={ts} className="flex items-center justify-end pr-2 text-xs text-slate-500">{ts}</div>
              {DAY_ORDER.map((day) => {
                const items = grid[day]?.[ts] ?? [];
                return (
                  <div key={`${day}-${ts}`} className="min-h-[70px] border border-white/[0.03] bg-white/[0.01] p-1 transition hover:bg-white/[0.03]">
                    {items.map((entry, i) => (
                      <div key={i}
                        className={`mb-1 rounded px-1.5 py-1 text-[10px] leading-tight ${
                          entry.status === "conflict" ? "border border-red-400/30 bg-red-400/10 text-red-200"
                          : entry.priority === "high" ? "border border-yellow-400/30 bg-yellow-400/10 text-yellow-200"
                          : "border border-blue-400/30 bg-blue-400/10 text-blue-200"
                        }`}
                      >
                        <p className="font-medium truncate">{entry.course}</p>
                        <p className="opacity-70 truncate">{entry.room}</p>
                      </div>
                    ))}
                  </div>
                );
              })}
            </>
          ))}
        </div>
      </div>
    </div>
  );
}

/* === TIMELINE VIEW === */
function TimelineView({ entries }: { entries: StudentScheduleEntry[] }) {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time));
  const maxDuration = 8;

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
      <div className="overflow-x-auto p-4">
        {sorted.map((entry, i) => {
          const startHour = parseInt(entry.start_time.split(":")[0] || "8", 10);
          const endHour = parseInt(entry.end_time.split(":")[0] || "10", 10);
          const duration = Math.max(1, endHour - startHour);
          const left = ((startHour - 8) / maxDuration) * 100;
          const width = (duration / maxDuration) * 100;
          const isConflict = entry.status === "conflict";
          const isHigh = entry.priority === "high";
          return (
            <div key={`${entry.course}-${i}`} className="mb-2 rounded-lg border border-white/[0.05] bg-white/[0.02] p-3 transition hover:bg-white/[0.04]">
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-white">{entry.course}</span>
                  <span className="text-slate-500">{entry.day} {entry.date}</span>
                  <span className="flex items-center gap-1 text-slate-400"><Clock className="h-3 w-3" />{entry.time}</span>
                </div>
                <div className="flex items-center gap-2"><MapPin className="h-3 w-3 text-slate-500" />{entry.room}</div>
              </div>
              <div className="relative h-5 w-full rounded bg-white/[0.04]">
                <div
                  className={`absolute top-0 h-full rounded transition-all ${
                    isConflict ? "bg-gradient-to-r from-red-500/40 to-red-500/20"
                    : isHigh ? "bg-gradient-to-r from-yellow-500/40 to-yellow-500/20"
                    : "bg-gradient-to-r from-blue-500/40 to-blue-500/20"
                  }`}
                  style={{ left: `${left}%`, width: `${width}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
