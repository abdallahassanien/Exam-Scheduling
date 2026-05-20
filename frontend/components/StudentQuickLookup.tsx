"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Clock, GraduationCap, MapPin, Search, AlertTriangle, CheckCircle2, XCircle, BookOpen, Cpu } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { api } from "@/lib/api";
import type { StudentScheduleResult } from "@/lib/types";

type Algorithm = "ga" | "greedy";

export function StudentQuickLookup({
  selectedAlgorithm,
  gaExists,
  greedyExists,
}: {
  selectedAlgorithm: Algorithm;
  gaExists: boolean;
  greedyExists: boolean;
}) {
  const [activeAlgo, setActiveAlgo] = useState<Algorithm>(selectedAlgorithm);
  const [studentId, setStudentId] = useState("");
  const [result, setResult] = useState<StudentScheduleResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const scheduleExists = activeAlgo === "ga" ? gaExists : greedyExists;

  const switchAlgo = (algo: Algorithm) => {
    setActiveAlgo(algo);
    setResult(null);
    setError("");
    setSearched(false);
  };

  const doSearch = useCallback(async (id?: string) => {
    const sid = (id ?? studentId).trim();
    if (!sid) { setError("Please enter a Student ID."); return; }

    if (!scheduleExists) {
      setError(`No schedule has been generated yet for ${activeAlgo === "ga" ? "Genetic Algorithm" : "Greedy Algorithm"}.`);
      return;
    }

    setLoading(true);
    setError("");
    setSearched(true);
    try {
      const data = await api.studentSchedule(sid, activeAlgo);
      setResult(data);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lookup failed.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [studentId, activeAlgo, scheduleExists]);

  const handleKey = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") doSearch();
  }, [doSearch]);

  const conflictCount = result?.conflicts?.length ?? 0;
  const highPriority = result?.schedule?.filter((e) => e.priority === "high").length ?? 0;

  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-blue-600/15 via-indigo-600/8 to-purple-600/12 p-5 sm:p-6 shadow-xl">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/20">
          <GraduationCap className="h-4.5 w-4.5 text-blue-300" />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-semibold text-white">Quick Student Lookup</h3>
          <p className="text-xs text-slate-400">Enter a Student ID to find their exam schedule</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded-lg border border-white/10">
            <button
              onClick={() => switchAlgo("ga")}
              className={`px-2.5 py-1 text-[11px] font-medium transition ${activeAlgo === "ga" ? "bg-blue-500/20 text-blue-300" : "bg-transparent text-slate-500 hover:text-white"}`}
            >
              GA
            </button>
            <button
              onClick={() => switchAlgo("greedy")}
              className={`px-2.5 py-1 text-[11px] font-medium transition ${activeAlgo === "greedy" ? "bg-amber-500/20 text-amber-300" : "bg-transparent text-slate-500 hover:text-white"}`}
            >
              Greedy
            </button>
          </div>
          {scheduleExists ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-400/10 px-2.5 py-1 text-[11px] font-medium text-green-300">
              <CheckCircle2 className="h-3 w-3" />Generated
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-yellow-400/10 px-2.5 py-1 text-[11px] font-medium text-yellow-300">
              <AlertTriangle className="h-3 w-3" />No Schedule
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          <input
            ref={inputRef}
            type="text"
            value={studentId}
            onChange={(e) => { setStudentId(e.target.value); setError(""); }}
            onKeyDown={handleKey}
            placeholder="e.g. 241002046"
            className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-8 pr-3 text-sm text-white placeholder:text-slate-600 focus:border-blue-400/50 focus:outline-none focus:ring-2 focus:ring-blue-400/20"
            disabled={loading}
          />
        </div>
        <button
          onClick={() => doSearch()}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white shadow transition hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 shrink-0"
        >
          {loading ? <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Search className="h-3.5 w-3.5" />}
          {loading ? "..." : "Find"}
        </button>
      </div>

      {!scheduleExists && !loading && !searched && (
        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="mt-3 flex items-center gap-1.5 rounded-lg border border-yellow-400/20 bg-yellow-400/10 px-3 py-2 text-xs text-yellow-300">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          No schedule has been generated yet for {activeAlgo === "ga" ? "Genetic Algorithm" : "Greedy Algorithm"}.
        </motion.div>
      )}

      {error && (
        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="mt-3 flex items-center gap-1.5 rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-xs text-red-300">
          <XCircle className="h-3.5 w-3.5 shrink-0" />{error}
        </motion.div>
      )}

      <AnimatePresence>
        {loading && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-4 space-y-2">
            {[1,2,3].map((i) => <div key={i} className="h-8 animate-pulse rounded-lg border border-white/5 bg-white/[0.03]" />)}
          </motion.div>
        )}

        {!loading && searched && result && !result.schedule_generated && (
          <motion.div key="no-schedule" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="mt-4 flex flex-col items-center rounded-xl border border-white/5 bg-white/[0.02] px-4 py-8 text-center">
            <AlertTriangle className="mb-2 h-6 w-6 text-yellow-500" />
            <p className="text-sm text-slate-400">{result.message}</p>
          </motion.div>
        )}

        {!loading && searched && result && result.schedule_generated && !result.found && (
          <motion.div key="not-found" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="mt-4 flex flex-col items-center rounded-xl border border-white/5 bg-white/[0.02] px-4 py-8 text-center">
            <Search className="mb-2 h-6 w-6 text-slate-600" />
            <p className="text-sm text-slate-400">{result.message || "Student not found."}</p>
            <p className="mt-1 text-xs text-slate-600">Check the ID for typos or try a different format.</p>
          </motion.div>
        )}

        {!loading && searched && result?.found && (
          <motion.div ref={resultsRef} key="results" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 space-y-3">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-slate-400"><GraduationCap className="h-3 w-3 text-blue-400" />ID: <span className="font-mono text-white">{result.student_id}</span></span>
              <span className="flex items-center gap-1 text-slate-400"><BookOpen className="h-3 w-3 text-green-400" />{result.found_courses}/{result.total_courses} courses</span>
              {conflictCount > 0 && <span className="flex items-center gap-1 text-red-400"><AlertTriangle className="h-3 w-3" />{conflictCount} conflict(s)</span>}
              {highPriority > 0 && <span className="flex items-center gap-1 text-yellow-400"><AlertTriangle className="h-3 w-3" />{highPriority} high priority</span>}
              <a href={`/student-portal?algorithm=${activeAlgo}`} className="ml-auto text-blue-400 hover:text-blue-300 underline underline-offset-2">Full portal →</a>
            </div>
            <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
              <table className="w-full text-left text-xs">
                <thead><tr className="border-b border-white/10 bg-white/[0.04]">
                  <th className="px-3 py-2 font-medium text-slate-400">Course</th>
                  <th className="px-3 py-2 font-medium text-slate-400">Day</th>
                  <th className="px-3 py-2 font-medium text-slate-400">Time</th>
                  <th className="px-3 py-2 font-medium text-slate-400">Room</th>
                  <th className="px-3 py-2 font-medium text-slate-400">Status</th>
                </tr></thead>
                <tbody>
                  {result.schedule.map((entry, i) => {
                    const isConflict = entry.status === "conflict";
                    const isHigh = entry.priority === "high";
                    return (
                      <tr key={i} className={`border-b border-white/[0.03] transition hover:bg-white/[0.03] ${isConflict ? "bg-red-400/5" : ""} ${isHigh ? "bg-yellow-400/[0.03]" : ""}`}>
                        <td className="px-3 py-2"><div className="flex items-center gap-1.5"><div className={`h-1.5 w-1.5 shrink-0 rounded-full ${isConflict ? "bg-red-400" : isHigh ? "bg-yellow-400" : "bg-blue-400"}`} /><span className="font-medium text-white">{entry.course}</span></div></td>
                        <td className="px-3 py-2 text-slate-300">{entry.day}</td>
                        <td className="px-3 py-2"><span className="flex items-center gap-1 text-slate-300"><Clock className="h-3 w-3 text-slate-500 shrink-0" />{entry.time}</span></td>
                        <td className="px-3 py-2"><span className="flex items-center gap-1 text-slate-300"><MapPin className="h-3 w-3 text-slate-500 shrink-0" />{entry.room}</span></td>
                        <td className="px-3 py-2">
                          {isConflict ? <span className="inline-flex items-center gap-1 rounded-full bg-red-400/10 px-2 py-0.5 text-[10px] font-medium text-red-300"><AlertTriangle className="h-2.5 w-2.5" />Conflict</span>
                          : isHigh ? <span className="inline-flex items-center gap-1 rounded-full bg-yellow-400/10 px-2 py-0.5 text-[10px] font-medium text-yellow-300">High</span>
                          : <span className="inline-flex items-center gap-1 rounded-full bg-green-400/10 px-2 py-0.5 text-[10px] font-medium text-green-300"><CheckCircle2 className="h-2.5 w-2.5" />OK</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
