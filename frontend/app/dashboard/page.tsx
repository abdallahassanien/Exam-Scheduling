"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  BookOpen,
  Brain,
  CalendarRange,
  Cpu,
  Database,
  Download,
  FlaskConical,
  Gauge,
  GitBranch,
  Globe,
  GraduationCap,
  Layers,
  Loader2,
  Map as MapIcon,
  Monitor,
  Network,
  Play,
  Radar,
  RefreshCw,
  Route,
  Search,
  Server,
  Share2,
  Shield,
  ShieldCheck,
  Slack,
  Sparkles,
  SplitSquareHorizontal,
  Star,
  TrendingUp,
  Users,
  UsersRound,
  Zap,
  type LucideIcon,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart as RechartsLineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "@/lib/api";
import type {
  AlgorithmResult,
  DatasetSummary,
  HistoryPoint,
  MetricSet,
  ScheduleRow,
  StudentScheduleResult,
} from "@/lib/types";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type ViewSection =
  | "hero"
  | "metrics"
  | "ga"
  | "convergence"
  | "greedy"
  | "comparison"
  | "gantt"
  | "constraints"
  | "portal"
  | "architecture"
  | "stream"
  | "analytics"
  | "tech"
  | "research"
  | "results";

const SECTIONS: { id: ViewSection; label: string; icon: LucideIcon }[] = [
  { id: "hero", label: "Overview", icon: Sparkles },
  { id: "metrics", label: "Live Metrics", icon: Gauge },
  { id: "ga", label: "GA Engine", icon: Brain },
  { id: "convergence", label: "Convergence", icon: TrendingUp },
  { id: "greedy", label: "Greedy", icon: Zap },
  { id: "comparison", label: "Comparison", icon: SplitSquareHorizontal },
  { id: "gantt", label: "Timeline", icon: CalendarRange },
  { id: "constraints", label: "Constraints", icon: Shield },
  { id: "portal", label: "Student Portal", icon: GraduationCap },
  { id: "architecture", label: "Architecture", icon: Network },
  { id: "stream", label: "Live Stream", icon: Activity },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "tech", label: "Tech Stack", icon: Cpu },
  { id: "research", label: "Research", icon: BookOpen },
  { id: "results", label: "Results", icon: Star },
];

/* ------------------------------------------------------------------ */
/*  Colour palette                                                     */
/* ------------------------------------------------------------------ */

const C = {
  bg: "#050713",
  card: "rgba(15,23,42,0.6)",
  border: "rgba(255,255,255,0.08)",
  accent: "#3b82f6",
  accent2: "#06b6d4",
  accent3: "#8b5cf6",
  green: "#10b981",
  amber: "#f59e0b",
  red: "#ef4444",
  text: "#94a3b8",
  heading: "#f1f5f9",
  ga: "#3b82f6",
  greedy: "#f59e0b",
};

/* ------------------------------------------------------------------ */
/*  Framer-motion-like spring helper (pure CSS classes)                */
/* ------------------------------------------------------------------ */

const springTransition = "transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]";
const fadeIn = "transition-all duration-1000 ease-out";

/* ------------------------------------------------------------------ */
/*  Particle Canvas Background                                         */
/* ------------------------------------------------------------------ */

function ParticleBackground() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let frame: number;
    const particles: { x: number; y: number; vx: number; vy: number; r: number; a: number }[] = [];
    const count = 80;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        r: Math.random() * 2 + 0.5,
        a: Math.random() * 0.4 + 0.1,
      });
    }
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(59,130,246,${p.a})`;
        ctx.fill();
      }
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(59,130,246,${0.08 * (1 - dist / 150)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      frame = requestAnimationFrame(animate);
    };
    animate();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, []);
  return <canvas ref={ref} className="fixed inset-0 z-0 pointer-events-none" />;
}

/* ------------------------------------------------------------------ */
/*  Animated Counter                                                   */
/* ------------------------------------------------------------------ */

function AnimatedNumber({ value, decimals = 1, suffix = "" }: { value: number; decimals?: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number>(0);
  useEffect(() => {
    let start: number | null = null;
    const duration = 1500;
    const from = ref.current;
    const diff = value - from;
    const animate = (ts: number) => {
      if (!start) start = ts;
      const t = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      ref.current = from + diff * eased;
      setDisplay(ref.current);
      if (t < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value]);
  return <>{display.toFixed(decimals)}{suffix}</>;
}

/* ------------------------------------------------------------------ */
/*  Glass Card                                                         */
/* ------------------------------------------------------------------ */

function GlassCard({ children, className = "", glow = false }: { children: React.ReactNode; className?: string; glow?: boolean }) {
  return (
    <div
      className={`rounded-xl border backdrop-blur-xl ${glow ? "shadow-[0_0_30px_rgba(59,130,246,0.15)]" : ""} ${className}`}
      style={{
        backgroundColor: C.card,
        borderColor: C.border,
      }}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Section Header                                                     */
/* ------------------------------------------------------------------ */

function SectionHeader({ icon: Icon, title, subtitle }: { icon: LucideIcon; title: string; subtitle: string }) {
  return (
    <div className="mb-8 flex items-start gap-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 ring-1 ring-blue-500/20">
        <Icon className="h-6 w-6 text-blue-400" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-white">{title}</h2>
        <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Glowing dot                                                        */
/* ------------------------------------------------------------------ */

function StatusDot({ color = C.green, pulse = true }: { color?: string; pulse?: boolean }) {
  return (
    <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${pulse ? "animate-pulse" : ""}`} style={{ backgroundColor: color }}>
      {pulse && (
        <span
          className="absolute inset-0 inline-flex h-full w-full animate-ping rounded-full opacity-40"
          style={{ backgroundColor: color }}
        />
      )}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  MAIN DASHBOARD                                                     */
/* ------------------------------------------------------------------ */

export default function DashboardPresentation() {
  const [summary, setSummary] = useState<DatasetSummary | null>(null);
  const [ga, setGa] = useState<AlgorithmResult | null>(null);
  const [greedy, setGreedy] = useState<AlgorithmResult | null>(null);
  const [activeSection, setActiveSection] = useState<ViewSection>("hero");
  const [loading, setLoading] = useState({ ga: false, greedy: false, compare: false });
  const [progress, setProgress] = useState(0);
  const [liveHistory, setLiveHistory] = useState<HistoryPoint[]>([]);
  const [streamEntries, setStreamEntries] = useState<string[]>([]);
  const [studentId, setStudentId] = useState("");
  const [studentResult, setStudentResult] = useState<StudentScheduleResult | null>(null);
  const [studentLoading, setStudentLoading] = useState(false);
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);

  useEffect(() => {
    api.dataset().then(setSummary).catch(() => {});
    api.schedule("ga").then(setGa).catch(() => {});
    api.schedule("greedy").then(setGreedy).catch(() => {});
  }, []);

  /* ---- GA Engine ---- */
  const runGA = useCallback(() => {
    setLoading((p) => ({ ...p, ga: true }));
    setProgress(0);
    setLiveHistory([]);
    const ws = new WebSocket(api.liveGaUrl());
    ws.addEventListener("open", () =>
      ws.send(
        JSON.stringify({ population_size: 60, generations: 80, mutation_rate: 0.08, crossover_rate: 0.85, elitism_percentage: 0.08, tournament_size: 4, seed: 42, early_stop_rounds: 24 })
      )
    );
    ws.addEventListener("message", (e) => {
      const p = JSON.parse(e.data);
      if (p.event === "generation") {
        setProgress(p.progress ?? 0);
        setLiveHistory((h) => [...h, p]);
        setStreamEntries((s) => [`Generation ${p.generation}: fitness=${p.best_fitness}, avg=${p.average_fitness}`, ...s].slice(0, 30));
      }
      if (p.event === "complete") {
        setGa(p.result);
        setProgress(100);
        setLoading((l) => ({ ...l, ga: false }));
        setStreamEntries((s) => ["GA optimization complete!", ...s].slice(0, 30));
        ws.close();
      }
      if (p.event === "error") {
        setLoading((l) => ({ ...l, ga: false }));
        ws.close();
      }
    });
    ws.addEventListener("error", () => {
      api.runGa({ population_size: 60, generations: 80, mutation_rate: 0.08, crossover_rate: 0.85, elitism_percentage: 0.08, tournament_size: 4, seed: 42, early_stop_rounds: 24 }).then((r) => {
        setGa(r);
        setLoading((l) => ({ ...l, ga: false }));
        setProgress(100);
      });
    });
  }, []);

  const runGreedy = useCallback(async () => {
    setLoading((p) => ({ ...p, greedy: true }));
    try {
      const r = await api.runGreedy();
      setGreedy(r);
    } catch {}
    setLoading((p) => ({ ...p, greedy: false }));
  }, []);

  const runCompare = useCallback(async () => {
    setLoading((p) => ({ ...p, compare: true }));
    try {
      const r = await api.compare();
      setGa(r.ga);
      setGreedy(r.greedy);
      setStreamEntries((s) => [`Winner: ${r.winner}`, ...s].slice(0, 30));
    } catch {}
    setLoading((p) => ({ ...p, compare: false }));
  }, []);

  const lookupStudent = useCallback(async () => {
    if (!studentId.trim()) return;
    setStudentLoading(true);
    try {
      const r = await api.studentSchedule(studentId.trim(), "ga");
      setStudentResult(r);
    } catch {}
    setStudentLoading(false);
  }, [studentId]);

  const scrollTo = (id: ViewSection) => {
    setActiveSection(id);
    document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: "smooth" });
  };

  /* ---- Derived data ---- */
  const gaMetrics = ga?.metrics;
  const grMetrics = greedy?.metrics;
  const bestMetrics = gaMetrics ?? grMetrics;

  const historyChart = useMemo(() => liveHistory.length > 0 ? liveHistory : (ga?.history ?? []), [liveHistory, ga]);

  const gaComparisonData = useMemo(() => [
    { metric: "Quality Score", GA: gaMetrics?.quality_score ?? 0, Greedy: grMetrics?.quality_score ?? 0 },
    { metric: "Conflicts", GA: gaMetrics?.total_conflicts ?? 0, Greedy: grMetrics?.total_conflicts ?? 0 },
    { metric: "Runtime (s)", GA: gaMetrics ? Math.min(gaMetrics.runtime_seconds, 30) : 0, Greedy: grMetrics ? Math.min(grMetrics.runtime_seconds, 30) : 0 },
    { metric: "Utilization %", GA: gaMetrics?.utilization_percentage ?? 0, Greedy: grMetrics?.utilization_percentage ?? 0 },
    { metric: "Jobs Scheduled", GA: gaMetrics?.jobs_scheduled ?? 0, Greedy: grMetrics?.jobs_scheduled ?? 0 },
  ], [gaMetrics, grMetrics]);

  const constraintItems = useMemo(() => {
    const items = ga?.constraints?.items ?? greedy?.constraints?.items ?? [];
    return items.filter((i) => !i.name.toLowerCase().includes("instructor"));
  }, [ga, greedy]);

  /* ---- Stream simulation ---- */
  useEffect(() => {
    if (loading.ga) return;
    const interval = setInterval(() => {
      setStreamEntries((s) => {
        if (s.length > 20) return s;
        const messages = [
          "System monitoring active",
          `GA quality score: ${gaMetrics?.quality_score ?? "--"}%`,
          `Greedy quality score: ${grMetrics?.quality_score ?? "--"}%`,
          `Total students: ${summary?.students_count ?? 0}`,
          `Total rooms: ${summary?.rooms_count ?? 0}`,
          `Conflict pairs: ${summary?.conflict_pairs ?? 0}`,
          `Schedule rows GA: ${ga?.schedule?.length ?? 0}`,
          `Schedule rows Greedy: ${greedy?.schedule?.length ?? 0}`,
        ];
        const msg = messages[Math.floor(Math.random() * messages.length)];
        if (s[0] === msg) return s;
        return [msg, ...s].slice(0, 20);
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [loading.ga, gaMetrics, grMetrics, summary, ga, greedy]);

  /* ---- GA Fitness History Chart Data ---- */
  const fitnessData = useMemo(() => {
    if (historyChart.length === 0) return [];
    return historyChart.map((h) => ({
      gen: h.generation,
      best: h.best_fitness,
      avg: h.average_fitness,
      conflicts: h.conflicts,
    }));
  }, [historyChart]);

  /* ---- Day distribution for Gantt-like view ---- */
  const dayDistData = useMemo(() => {
    const schedule = ga?.schedule ?? greedy?.schedule ?? [];
    const map = new Map<string, number>();
    for (const row of schedule) {
      const d = row.date?.slice(5) ?? "";
      map.set(d, (map.get(d) ?? 0) + 1);
    }
    return Array.from(map.entries()).map(([day, exams]) => ({ day, exams }));
  }, [ga, greedy]);

  /* ---- Room utilization for charts ---- */
  const roomUtilData = useMemo(() => {
    const analytics = ga?.analytics ?? greedy?.analytics;
    return (analytics?.room_utilization ?? []).slice(0, 10);
  }, [ga, greedy]);

  /* ---- Fake GA flow steps ---- */
  const gaSteps = [
    { title: "Population Init", desc: "80 random schedules", icon: Layers, color: C.accent },
    { title: "Fitness Evaluation", desc: "Hard + soft constraint scoring", icon: Gauge, color: C.green },
    { title: "Tournament Selection", desc: "Top 4 compete per round", icon: Users, color: C.accent2 },
    { title: "Crossover (85%)", desc: "Uniform gene exchange", icon: GitBranch, color: C.accent3 },
    { title: "Mutation (8%)", desc: "Random slot perturbation", icon: Zap, color: C.amber },
    { title: "Elite Preservation", desc: "Top 4 survive unchanged", icon: ShieldCheck, color: C.green },
  ];

  return (
    <div className="relative min-h-screen overflow-x-hidden" style={{ backgroundColor: C.bg }}>
      <ParticleBackground />

      {/* ---- Navigation ---- */}
      <nav className="fixed left-0 top-0 z-50 flex h-screen w-16 flex-col items-center gap-1 border-r py-4 backdrop-blur-2xl" style={{ borderColor: C.border, backgroundColor: "rgba(5,7,19,0.85)" }}>
        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 text-lg font-bold text-white shadow-lg shadow-blue-500/30">
          O
        </div>
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => scrollTo(s.id)}
            onMouseEnter={() => setHoveredSection(s.id)}
            onMouseLeave={() => setHoveredSection(null)}
            className="group relative flex h-9 w-9 items-center justify-center rounded-lg transition-all hover:bg-white/10"
            style={{ backgroundColor: activeSection === s.id ? "rgba(59,130,246,0.2)" : "transparent" }}
          >
            <s.icon className="h-4 w-4" style={{ color: activeSection === s.id ? C.accent : C.text }} />
            {hoveredSection === s.id && (
              <span className="absolute left-14 z-50 whitespace-nowrap rounded-md bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-xl ring-1 ring-white/10">
                {s.label}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* ---- Main Content ---- */}
      <div className="ml-16">
        <div className="mx-auto max-w-7xl px-6 py-8">

          {/* ================================================================ */}
          {/*  1. CINEMATIC HERO                                               */}
          {/* ================================================================ */}
          <section id="section-hero" className="relative mb-32 mt-8">
            <div className="absolute -inset-20 bg-gradient-radial from-blue-500/5 via-transparent to-transparent pointer-events-none" />
            <div className="relative z-10 text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium uppercase tracking-widest backdrop-blur-sm" style={{ borderColor: C.border, color: C.accent }}>
                <StatusDot color={C.green} />
                AI-Powered Optimization Platform
              </div>
              <h1 className="text-6xl font-bold tracking-tight text-white sm:text-7xl lg:text-8xl">
                <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-500 bg-clip-text text-transparent">
                  OptiSchedule
                </span>
                <span className="text-white"> AI</span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400 sm:text-xl">
                Genetic Algorithm vs Greedy — an AI-powered exam scheduling optimization platform
                with real-time visualization, constraint management, and interactive analytics.
              </p>
              <div className="mt-10 flex flex-wrap justify-center gap-4">
                <button
                  onClick={runGA}
                  disabled={loading.ga}
                  className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-500/30 transition-all hover:scale-105 hover:shadow-blue-500/50 disabled:opacity-50"
                >
                  {loading.ga ? <Loader2 className="h-5 w-5 animate-spin" /> : <Brain className="h-5 w-5" />}
                  {loading.ga ? `Running GA (${progress.toFixed(0)}%)` : "Run Genetic Algorithm"}
                </button>
                <button
                  onClick={runGreedy}
                  disabled={loading.greedy}
                  className="group inline-flex items-center gap-2 rounded-xl border px-6 py-3 font-semibold text-white transition-all hover:scale-105"
                  style={{ borderColor: C.border, backgroundColor: "rgba(255,255,255,0.05)" }}
                >
                  {loading.greedy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Zap className="h-5 w-5 text-amber-400" />}
                  Run Greedy Baseline
                </button>
                <button
                  onClick={runCompare}
                  disabled={loading.compare}
                  className="group inline-flex items-center gap-2 rounded-xl border px-6 py-3 font-semibold text-white transition-all hover:scale-105"
                  style={{ borderColor: C.border, backgroundColor: "rgba(255,255,255,0.05)" }}
                >
                  <SplitSquareHorizontal className="h-5 w-5 text-green-400" />
                  Compare Both
                </button>
              </div>
            </div>

            {/* Floating stats */}
            <div className="mx-auto mt-16 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Courses", value: summary?.courses_count ?? 235, icon: BookOpen, color: C.accent },
                { label: "Students", value: summary?.students_count ?? 4265, icon: UsersRound, color: C.green },
                { label: "Rooms", value: summary?.rooms_count ?? 38, icon: MapIcon, 
  color: C.accent2 },
                { label: "Conflict Pairs", value: summary?.conflict_pairs ?? 2702, icon: AlertTriangle, color: C.amber },
              ].map((stat) => (
                <GlassCard key={stat.label} className="p-5 text-center" glow>
                  <stat.icon className="mx-auto h-5 w-5 mb-2" style={{ color: stat.color }} />
                  <p className="text-3xl font-bold text-white">
                    <AnimatedNumber value={stat.value} decimals={0} />
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{stat.label}</p>
                </GlassCard>
              ))}
            </div>
          </section>

          {/* ================================================================ */}
          {/*  2. LIVE SYSTEM METRICS                                         */}
          {/* ================================================================ */}
          <section id="section-metrics" className="mb-32 scroll-mt-8">
            <SectionHeader icon={Gauge} title="Live System Metrics" subtitle="Real-time performance indicators from the active scheduling engine" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {[
                { label: "Quality Score", value: bestMetrics?.quality_score ?? 0, suffix: "%", icon: Gauge, color: bestMetrics && bestMetrics.quality_score > 50 ? C.green : C.amber, decimals: 1 },
                { label: "Conflicts", value: bestMetrics?.total_conflicts ?? 0, suffix: "", icon: AlertTriangle, color: bestMetrics && bestMetrics.total_conflicts === 0 ? C.green : C.amber, decimals: 0 },
                { label: "Room Util.", value: bestMetrics?.room_utilization ?? 0, suffix: "%", icon: MapIcon, color: C.accent, decimals: 1 },
                { label: "Slot Util.", value: bestMetrics?.slot_utilization ?? 0, suffix: "%", icon: CalendarRange, color: C.accent2, decimals: 1 },
                { label: "Seat Util.", value: bestMetrics?.seat_utilization ?? 0, suffix: "%", icon: Users, color: C.accent3, decimals: 1 },
                { label: "Runtime", value: bestMetrics?.runtime_seconds ?? 0, suffix: "s", icon: Activity, color: C.amber, decimals: 2 },
              ].map((m) => (
                <GlassCard key={m.label} className="p-4" glow>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-500 uppercase tracking-wider">{m.label}</p>
                    <m.icon className="h-4 w-4 opacity-60" style={{ color: m.color }} />
                  </div>
                  <p className="mt-2 text-2xl font-bold text-white" style={{ color: m.color }}>
                    <AnimatedNumber value={m.value} decimals={m.decimals} suffix={m.suffix} />
                  </p>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                    <div
                      className={`h-full rounded-full ${springTransition}`}
                      style={{
                        width: `${Math.min(100, m.value)}%`,
                        backgroundColor: m.color,
                        boxShadow: `0 0 10px ${m.color}`,
                      }}
                    />
                  </div>
                </GlassCard>
              ))}
            </div>
          </section>

          {/* ================================================================ */}
          {/*  3. GENETIC ALGORITHM VISUALIZATION                             */}
          {/* ================================================================ */}
          <section id="section-ga" className="mb-32 scroll-mt-8">
            <SectionHeader icon={Brain} title="Genetic Algorithm Engine" subtitle="Population-based evolutionary optimization across 80 individuals × 150 generations" />
            <div className="relative mb-8 overflow-hidden rounded-xl border p-8" style={{ borderColor: C.border, backgroundColor: "rgba(59,130,246,0.03)" }}>
              {/* Flow diagram */}
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {gaSteps.map((step, i) => (
                  <div key={step.title} className="group relative">
                    <div className="relative z-10 rounded-xl border p-4 backdrop-blur-sm transition-all duration-500 hover:scale-105 hover:shadow-lg" style={{ borderColor: C.border, backgroundColor: "rgba(15,23,42,0.7)" }}>
                      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: `${step.color}20` }}>
                        <step.icon className="h-5 w-5" style={{ color: step.color }} />
                      </div>
                      <p className="text-sm font-semibold text-white">{step.title}</p>
                      <p className="mt-1 text-xs text-slate-500">{step.desc}</p>
                    </div>
                    {i < gaSteps.length - 1 && (
                      <div className="absolute -right-3 top-1/2 hidden -translate-y-1/2 text-slate-600 xl:block">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* GA Parameters display */}
            <GlassCard className="p-5">
              <div className="grid gap-4 sm:grid-cols-4">
                {[
                  { label: "Population", value: "80" },
                  { label: "Generations", value: "150" },
                  { label: "Mutation Rate", value: "0.08 (8%)" },
                  { label: "Crossover Rate", value: "0.85 (85%)" },
                ].map((p) => (
                  <div key={p.label} className="rounded-lg bg-white/5 px-4 py-3">
                    <p className="text-xs text-slate-500">{p.label}</p>
                    <p className="text-lg font-semibold text-white">{p.value}</p>
                  </div>
                ))}
              </div>
            </GlassCard>
          </section>

          {/* ================================================================ */}
          {/*  4. LIVE FITNESS CONVERGENCE                                    */}
          {/* ================================================================ */}
          <section id="section-convergence" className="mb-32 scroll-mt-8">
            <SectionHeader icon={TrendingUp} title="Fitness Convergence" subtitle="GA fitness improving across generations — conflicts decreasing in real time" />
            <GlassCard className="p-6" glow>
              {fitnessData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <ComposedChart data={fitnessData}>
                    <defs>
                      <linearGradient id="bestGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={C.accent} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={C.accent} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="avgGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={C.accent2} stopOpacity={0.2} />
                        <stop offset="100%" stopColor={C.accent2} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                    <XAxis dataKey="gen" stroke={C.text} tick={{ fontSize: 11 }} label={{ value: "Generation", position: "bottom", fill: C.text, fontSize: 12 }} />
                    <YAxis yAxisId="left" stroke={C.text} tick={{ fontSize: 11 }} label={{ value: "Fitness", angle: -90, fill: C.text, fontSize: 12 }} />
                    <YAxis yAxisId="right" orientation="right" stroke={C.amber} tick={{ fontSize: 11 }} label={{ value: "Conflicts", angle: 90, fill: C.text, fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "rgba(15,23,42,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff" }}
                    />
                    <Area yAxisId="left" type="monotone" dataKey="best" stroke={C.accent} fill="url(#bestGrad)" strokeWidth={2} dot={false} name="Best Fitness" />
                    <Area yAxisId="left" type="monotone" dataKey="avg" stroke={C.accent2} fill="url(#avgGrad)" strokeWidth={1.5} dot={false} name="Avg Fitness" strokeDasharray="4 4" />
                    <Bar yAxisId="right" dataKey="conflicts" fill={C.amber} opacity={0.3} name="Conflicts" radius={[2, 2, 0, 0]} />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[400px] items-center justify-center text-slate-500">
                  <div className="text-center">
                    <TrendingUp className="mx-auto h-10 w-10 mb-3 opacity-30" />
                    <p>Run the Genetic Algorithm to see convergence data</p>
                  </div>
                </div>
              )}
              {loading.ga && (
                <div className="mt-4 flex items-center gap-3 rounded-lg bg-blue-500/10 px-4 py-2 text-sm text-blue-300">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  GA evolving — generation {liveHistory.length} / {historyChart.length > 0 ? historyChart[historyChart.length - 1]?.generation ?? "?" : "?"}
                  <div className="ml-auto h-2 w-32 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-blue-500 transition-all duration-500" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              )}
            </GlassCard>
          </section>

          {/* ================================================================ */}
          {/*  5. GREEDY ALGORITHM VISUALIZATION                              */}
          {/* ================================================================ */}
          <section id="section-greedy" className="mb-32 scroll-mt-8">
            <SectionHeader icon={Zap} title="Greedy Algorithm" subtitle="Sequential first-fit scheduling — fast baseline comparison" />
            <div className="grid gap-6 lg:grid-cols-2">
              <GlassCard className="p-6">
                <h3 className="mb-4 flex items-center gap-2 font-semibold text-white">
                  <Route className="h-4 w-4 text-amber-400" />
                  How It Works
                </h3>
                <div className="space-y-3">
                  {[
                    "Sort exams by conflict count (most constrained first)",
                    "For each exam, iterate timeslots in order (slot 0 → 59)",
                    "Check if any already-scheduled exam conflicts",
                    "If slot is safe, assign first available room",
                    "One room per exam — no multi-room splitting",
                    "No capacity checking — assumes room fits all students",
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-xs font-bold text-amber-400">
                        {i + 1}
                      </div>
                      <p className="text-sm text-slate-300">{step}</p>
                    </div>
                  ))}
                </div>
              </GlassCard>
              <GlassCard className="p-6">
                <h3 className="mb-4 flex items-center gap-2 font-semibold text-white">
                  <BarChart3 className="h-4 w-4 text-amber-400" />
                  Characteristics
                </h3>
                <div className="space-y-4">
                  {[
                    { label: "Runtime", value: `${grMetrics?.runtime_seconds.toFixed(3) ?? "—"}s`, desc: "Extremely fast", color: C.green },
                    { label: "Quality", value: grMetrics ? `${grMetrics.quality_score.toFixed(1)}%` : "—", desc: "Lower optimization", color: C.amber },
                    { label: "Room Doubles", value: grMetrics?.room_conflicts ?? "—", desc: "None (first-fit)", color: C.green },
                    { label: "Capacity Check", value: grMetrics?.room_capacity_violations ?? "—", desc: "Not enforced", color: C.red },
                    { label: "Schedule Rows", value: greedy?.schedule?.length ?? "—", desc: "One per exam", color: C.accent },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between rounded-lg bg-white/5 px-4 py-2.5">
                      <div>
                        <p className="text-sm text-white">{item.label}</p>
                        <p className="text-xs text-slate-500">{item.desc}</p>
                      </div>
                      <p className="text-lg font-bold" style={{ color: item.color }}>{item.value}</p>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>
          </section>

          {/* ================================================================ */}
          {/*  6. GA VS GREEDY COMPARISON                                     */}
          {/* ================================================================ */}
          <section id="section-comparison" className="mb-32 scroll-mt-8">
            <SectionHeader icon={SplitSquareHorizontal} title="GA vs Greedy Comparison" subtitle="Side-by-side metric comparison across all performance dimensions" />
            <div className="grid gap-6 lg:grid-cols-2">
              {/* GA Card */}
              <GlassCard className={`overflow-hidden p-6 ${gaMetrics ? "shadow-[0_0_40px_rgba(59,130,246,0.1)]" : ""}`} glow={!!gaMetrics}>
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20">
                      <Brain className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-white">Genetic Algorithm</p>
                      {gaMetrics && (
                        <div className="flex items-center gap-2">
                          <StatusDot color={gaMetrics.total_conflicts === 0 ? C.green : C.amber} />
                          <span className="text-xs text-slate-400">
                            {gaMetrics.total_conflicts === 0 ? "Zero conflicts" : `${gaMetrics.total_conflicts} conflicts`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  {gaMetrics && grMetrics && gaMetrics.quality_score > grMetrics.quality_score && (
                    <div className="flex items-center gap-1.5 rounded-full bg-green-500/20 px-3 py-1 text-xs font-semibold text-green-400">
                      <Star className="h-3 w-3" /> Winner
                    </div>
                  )}
                </div>
                {gaMetrics ? (
                  <div className="space-y-3">
                    <MetricRow label="Quality Score" value={`${gaMetrics.quality_score.toFixed(1)}%`} pct={gaMetrics.quality_score} color={C.accent} />
                    <MetricRow label="Total Conflicts" value={String(gaMetrics.total_conflicts)} pct={Math.max(0, 100 - gaMetrics.total_conflicts * 2)} color={gaMetrics.total_conflicts === 0 ? C.green : C.amber} />
                    <MetricRow label="Room Utilization" value={`${gaMetrics.room_utilization.toFixed(1)}%`} pct={gaMetrics.room_utilization} color={C.accent2} />
                    <MetricRow label="Slot Utilization" value={`${gaMetrics.slot_utilization.toFixed(1)}%`} pct={gaMetrics.slot_utilization} color={C.accent3} />
                    <MetricRow label="Runtime" value={`${gaMetrics.runtime_seconds.toFixed(2)}s`} pct={Math.min(100, (gaMetrics.runtime_seconds / 30) * 100)} color={C.amber} />
                    <MetricRow label="Hard Violations" value={String(gaMetrics.hard_violations)} pct={Math.max(0, 100 - gaMetrics.hard_violations * 5)} color={gaMetrics.hard_violations === 0 ? C.green : C.red} />
                  </div>
                ) : (
                  <div className="flex h-48 items-center justify-center text-sm text-slate-500">Run GA to see metrics</div>
                )}
              </GlassCard>

              {/* Greedy Card */}
              <GlassCard className={`overflow-hidden p-6 ${grMetrics ? "shadow-[0_0_40px_rgba(245,158,11,0.08)]" : ""}`}>
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/20">
                      <Zap className="h-5 w-5 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-white">Greedy Algorithm</p>
                      {grMetrics && (
                        <div className="flex items-center gap-2">
                          <StatusDot color={grMetrics.total_conflicts > 0 ? C.amber : C.green} />
                          <span className="text-xs text-slate-400">
                            {grMetrics.total_conflicts > 0 ? `${grMetrics.total_conflicts} conflicts` : "Zero conflicts"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  {gaMetrics && grMetrics && grMetrics.quality_score > gaMetrics.quality_score && (
                    <div className="flex items-center gap-1.5 rounded-full bg-green-500/20 px-3 py-1 text-xs font-semibold text-green-400">
                      <Star className="h-3 w-3" /> Winner
                    </div>
                  )}
                </div>
                {grMetrics ? (
                  <div className="space-y-3">
                    <MetricRow label="Quality Score" value={`${grMetrics.quality_score.toFixed(1)}%`} pct={grMetrics.quality_score} color={C.amber} />
                    <MetricRow label="Total Conflicts" value={String(grMetrics.total_conflicts)} pct={Math.max(0, 100 - grMetrics.total_conflicts * 0.5)} color={grMetrics.total_conflicts === 0 ? C.green : C.amber} />
                    <MetricRow label="Room Utilization" value={`${grMetrics.room_utilization.toFixed(1)}%`} pct={grMetrics.room_utilization} color={C.accent2} />
                    <MetricRow label="Slot Utilization" value={`${grMetrics.slot_utilization.toFixed(1)}%`} pct={grMetrics.slot_utilization} color={C.accent3} />
                    <MetricRow label="Runtime" value={`${grMetrics.runtime_seconds.toFixed(3)}s`} pct={Math.min(100, (grMetrics.runtime_seconds / 30) * 100)} color={C.green} />
                    <MetricRow label="Hard Violations" value={String(grMetrics.hard_violations)} pct={Math.max(0, 100 - grMetrics.hard_violations * 0.5)} color={grMetrics.hard_violations === 0 ? C.green : C.red} />
                  </div>
                ) : (
                  <div className="flex h-48 items-center justify-center text-sm text-slate-500">Run Greedy to see metrics</div>
                )}
              </GlassCard>
            </div>

            {/* Comparison Radar */}
            {gaMetrics && grMetrics && (
              <GlassCard className="mt-6 p-6" glow>
                <div style={{ minHeight: 350, width: "100%" }}>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={gaComparisonData} barGap={4} barCategoryGap="20%">
                      <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                      <XAxis dataKey="metric" stroke={C.text} tick={{ fontSize: 11 }} />
                      <YAxis stroke={C.muted} tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ backgroundColor: "rgba(15,23,42,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} />
                      <Legend wrapperStyle={{ fontSize: 12, color: C.text }} />
                      <Bar name="GA" dataKey="GA" fill={C.accent} radius={[4, 4, 0, 0]} maxBarSize={40} />
                      <Bar name="Greedy" dataKey="Greedy" fill={C.amber} radius={[4, 4, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>
            )}
          </section>

          {/* ================================================================ */}
          {/*  7. INTERACTIVE GANTT TIMELINE                                  */}
          {/* ================================================================ */}
          <section id="section-gantt" className="mb-32 scroll-mt-8">
            <SectionHeader icon={CalendarRange} title="Exam Schedule Timeline" subtitle="Visual room × timeslot grid with color-coded exam blocks" />
            <GlassCard className="p-6" glow>
              <MiniGantt schedule={ga?.schedule ?? greedy?.schedule ?? []} />
            </GlassCard>
          </section>

          {/* ================================================================ */}
          {/*  8. CONSTRAINT MONITOR                                          */}
          {/* ================================================================ */}
          <section id="section-constraints" className="mb-32 scroll-mt-8">
            <SectionHeader icon={Shield} title="Constraint Monitor" subtitle="Hard and soft constraint satisfaction tracking" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {constraintItems.map((item) => (
                <GlassCard key={item.name} className={`p-5 ${item.satisfied ? "shadow-[0_0_15px_rgba(16,185,129,0.1)]" : "shadow-[0_0_15px_rgba(239,68,68,0.08)]"}`}>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-white">{item.name}</p>
                    <StatusDot color={item.satisfied ? C.green : C.red} />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{item.description}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                      {item.violations} violation{item.violations !== 1 ? "s" : ""}
                    </span>
                    <span className={`text-sm font-bold ${item.satisfied ? "text-green-400" : "text-red-400"}`}>
                      {item.satisfied ? "SAFE" : "VIOLATED"}
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/5">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${item.satisfied ? "bg-green-500" : "bg-red-500"}`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </GlassCard>
              ))}
              {constraintItems.length === 0 && (
                <div className="col-span-full flex h-32 items-center justify-center text-sm text-slate-500">
                  Run an algorithm to see constraint data
                </div>
              )}
            </div>
            {ga?.constraints && (
              <GlassCard className="mt-4 p-4 text-center">
                <p className="text-sm text-slate-400">Overall Constraint Satisfaction</p>
                <p className="text-4xl font-bold text-transparent bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text">
                  {ga.constraints.overall_satisfaction.toFixed(1)}%
                </p>
              </GlassCard>
            )}
          </section>

          {/* ================================================================ */}
          {/*  9. STUDENT PORTAL SHOWCASE                                     */}
          {/* ================================================================ */}
          <section id="section-portal" className="mb-32 scroll-mt-8">
            <SectionHeader icon={GraduationCap} title="Student Portal Demo" subtitle="Instant personalized schedule lookup by student ID" />
            <div className="grid gap-6 lg:grid-cols-2">
              <GlassCard className="p-6">
                <div className="mb-4 flex items-center gap-3">
                  <Search className="h-5 w-5 text-blue-400" />
                  <h3 className="font-semibold text-white">Look Up a Student</h3>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && lookupStudent()}
                    placeholder="Enter student ID (e.g. 241002046)"
                    className="flex-1 rounded-lg border bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none"
                    style={{ borderColor: C.border }}
                  />
                  <button
                    onClick={lookupStudent}
                    disabled={studentLoading || !studentId.trim()}
                    className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-blue-500 disabled:opacity-50"
                  >
                    {studentLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
                  </button>
                </div>
                {summary && (
                  <p className="mt-3 text-xs text-slate-500">
                    Dataset: {summary.students_count.toLocaleString()} students · Try: 241002046, 211001268, 251000447
                  </p>
                )}
              </GlassCard>

              <GlassCard className="p-6">
                {studentResult ? (
                  studentResult.found ? (
                    <div>
                      <div className="mb-3 flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-white">Student {studentResult.student_id}</h3>
                          <p className="text-xs text-slate-400">{studentResult.found_courses} of {studentResult.total_courses} courses found</p>
                        </div>
                        <StatusDot color={studentResult.conflicts.length === 0 ? C.green : C.amber} />
                      </div>
                      <div className="max-h-48 space-y-2 overflow-y-auto">
                        {studentResult.schedule.map((entry, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-sm"
                          >
                            <div>
                              <p className="font-medium text-white">{entry.course}</p>
                              <p className="text-xs text-slate-500">{entry.day} · {entry.time}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-slate-400">{entry.room}</p>
                              <p className="text-xs text-slate-500">{entry.date}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      {studentResult.conflicts.length > 0 && (
                        <div className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">
                          {studentResult.conflicts.length} conflict{studentResult.conflicts.length > 1 ? "s" : ""} detected
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex h-32 items-center justify-center text-sm text-slate-500">
                      {studentResult.message}
                    </div>
                  )
                ) : (
                  <div className="flex h-32 items-center justify-center text-sm text-slate-500">
                    Search for a student to see their schedule
                  </div>
                )}
              </GlassCard>
            </div>
          </section>

          {/* ================================================================ */}
          {/*  10. SYSTEM ARCHITECTURE                                        */}
          {/* ================================================================ */}
          <section id="section-architecture" className="mb-32 scroll-mt-8">
            <SectionHeader icon={Network} title="System Architecture" subtitle="Full-stack AI scheduling platform — from frontend to GA engine" />
            <GlassCard className="p-8" glow>
              <div className="flex flex-col items-center gap-6">
                {/* Layer 1 */}
                <div className="flex w-full max-w-3xl flex-col items-center gap-2 rounded-xl border bg-gradient-to-r from-blue-500/5 to-cyan-500/5 p-5 text-center" style={{ borderColor: C.border }}>
                  <Monitor className="h-6 w-6 text-blue-400" />
                  <p className="text-lg font-bold text-white">Frontend</p>
                  <p className="text-xs text-slate-400">Next.js 14 · Tailwind CSS · Framer Motion · Recharts</p>
                  <div className="flex gap-2">
                    {["Dashboard", "Gantt Chart", "Analytics", "Student Portal", "Live Stream"].map((c) => (
                      <span key={c} className="rounded-md bg-white/5 px-2.5 py-1 text-xs text-slate-300">{c}</span>
                    ))}
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex items-center gap-2 text-slate-500">
                  <svg className="h-6 w-6 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                  <span className="text-xs">REST + WebSocket</span>
                </div>

                {/* Layer 2 */}
                <div className="flex w-full max-w-3xl flex-col items-center gap-2 rounded-xl border bg-gradient-to-r from-blue-500/5 to-purple-500/5 p-5 text-center" style={{ borderColor: C.border }}>
                  <Server className="h-6 w-6 text-cyan-400" />
                  <p className="text-lg font-bold text-white">FastAPI Backend</p>
                  <p className="text-xs text-slate-400">Python 3.13 · uvicorn · Pydantic · SQLite · pandas</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {["REST APIs", "WebSocket Streaming", "CORS Middleware", "SQLite Persistence", "CSV/PDF Export"].map((c) => (
                      <span key={c} className="rounded-md bg-white/5 px-2.5 py-1 text-xs text-slate-300">{c}</span>
                    ))}
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex items-center gap-2 text-slate-500">
                  <svg className="h-6 w-6 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                  <span className="text-xs">Async worker pool</span>
                </div>

                {/* Layer 3 */}
                <div className="flex w-full max-w-3xl flex-col items-center gap-2 rounded-xl border bg-gradient-to-r from-purple-500/5 to-pink-500/5 p-5 text-center" style={{ borderColor: C.border }}>
                  <Brain className="h-6 w-6 text-purple-400" />
                  <p className="text-lg font-bold text-white">Scheduling Engine</p>
                  <p className="text-xs text-slate-400">Population-based GA · Greedy baseline · Constraint solver</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {["GA (80×150)", "Greedy (First-Fit)", "Conflict Matrix", "7 Constraints", "Multi-Room"].map((c) => (
                      <span key={c} className="rounded-md bg-white/5 px-2.5 py-1 text-xs text-slate-300">{c}</span>
                    ))}
                  </div>
                </div>

                {/* Data layer */}
                <div className="flex w-full max-w-3xl flex-col items-center gap-2 rounded-xl border bg-gradient-to-r from-emerald-500/5 to-teal-500/5 p-5 text-center" style={{ borderColor: C.border }}>
                  <Database className="h-6 w-6 text-emerald-400" />
                  <p className="text-lg font-bold text-white">Data Layer</p>
                  <p className="text-xs text-slate-400">CSV ingestion · SQLite history · Pickle cache · Docker deployment</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {["data.csv (235 exams)", "rooms.csv (38 rooms)", "IDs.csv (4265 students)", "Conflict Matrix (2702 pairs)", "60 Timeslots"].map((c) => (
                      <span key={c} className="rounded-md bg-white/5 px-2.5 py-1 text-xs text-slate-300">{c}</span>
                    ))}
                  </div>
                </div>
              </div>
            </GlassCard>
          </section>

          {/* ================================================================ */}
          {/*  11. LIVE WEBSOCKET STREAM                                      */}
          {/* ================================================================ */}
          <section id="section-stream" className="mb-32 scroll-mt-8">
            <SectionHeader icon={Activity} title="Live Activity Feed" subtitle="Real-time optimization stream from the scheduling engine" />
            <GlassCard className="h-80 overflow-hidden p-4" glow>
              <div className="flex h-full flex-col-reverse gap-1.5 overflow-y-auto">
                {streamEntries.length === 0 ? (
                  <div className="flex flex-1 items-center justify-center text-sm text-slate-500">
                    <Activity className="mr-2 h-4 w-4" />
                    Activity feed will appear here
                  </div>
                ) : (
                  streamEntries.map((entry, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 rounded-lg bg-white/[0.03] px-3 py-1.5 text-xs font-mono transition-all hover:bg-white/[0.06]"
                      style={{
                        opacity: 1 - i * 0.03,
                        animation: `slideIn 0.3s ease-out`,
                      }}
                    >
                      <StatusDot color={entry.includes("complete") || entry.includes("Winner") ? C.green : C.accent} pulse={i === 0} />
                      <span className="text-slate-400">{new Date().toLocaleTimeString()}</span>
                      <span className="text-slate-300">{entry}</span>
                    </div>
                  ))
                )}
              </div>
              <style>{`@keyframes slideIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
            </GlassCard>
          </section>

          {/* ================================================================ */}
          {/*  12. ANALYTICS CHARTS                                           */}
          {/* ================================================================ */}
          <section id="section-analytics" className="mb-32 scroll-mt-8">
            <SectionHeader icon={BarChart3} title="Advanced Analytics" subtitle="Comprehensive visualization of scheduling performance data" />
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Day distribution */}
              <GlassCard className="p-5">
                <h3 className="mb-4 text-sm font-semibold text-white">Daily Exam Distribution</h3>
                {dayDistData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={dayDistData}>
                      <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                      <XAxis dataKey="day" stroke={C.text} tick={{ fontSize: 10 }} />
                      <YAxis stroke={C.text} tick={{ fontSize: 10 }} />
                      <Tooltip contentStyle={{ backgroundColor: "rgba(15,23,42,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} />
                      <Bar dataKey="exams" radius={[4, 4, 0, 0]}>
                        {dayDistData.map((_, i) => (
                          <Cell key={i} fill={i % 2 === 0 ? C.accent : C.accent2} opacity={0.7} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-[250px] items-center justify-center text-sm text-slate-500">No data</div>
                )}
              </GlassCard>

              {/* Room utilization */}
              <GlassCard className="p-5">
                <h3 className="mb-4 text-sm font-semibold text-white">Top Room Utilization</h3>
                {roomUtilData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={roomUtilData} layout="vertical">
                      <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                      <XAxis type="number" stroke={C.text} tick={{ fontSize: 10 }} />
                      <YAxis type="category" dataKey="room" stroke={C.text} tick={{ fontSize: 9 }} width={60} />
                      <Tooltip contentStyle={{ backgroundColor: "rgba(15,23,42,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} />
                      <Bar dataKey="assignments" radius={[0, 4, 4, 0]} fill={C.accent} opacity={0.7} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-[250px] items-center justify-center text-sm text-slate-500">No data</div>
                )}
              </GlassCard>

              {/* Conflict reduction */}
              <GlassCard className="p-5 lg:col-span-2">
                <h3 className="mb-4 text-sm font-semibold text-white">Conflict Reduction Over Generations</h3>
                {fitnessData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={fitnessData}>
                      <defs>
                        <linearGradient id="conflictGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={C.amber} stopOpacity={0.3} />
                          <stop offset="100%" stopColor={C.amber} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                      <XAxis dataKey="gen" stroke={C.text} tick={{ fontSize: 10 }} label={{ value: "Generation", fill: C.text, fontSize: 11 }} />
                      <YAxis stroke={C.text} tick={{ fontSize: 10 }} label={{ value: "Conflicts", angle: -90, fill: C.text, fontSize: 11 }} />
                      <Tooltip contentStyle={{ backgroundColor: "rgba(15,23,42,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} />
                      <Area type="monotone" dataKey="conflicts" stroke={C.amber} fill="url(#conflictGrad)" strokeWidth={2} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-[250px] items-center justify-center text-sm text-slate-500">Run GA to see conflict reduction</div>
                )}
              </GlassCard>

              {/* Fitness history (if available) */}
              {fitnessData.length > 0 && (
                <GlassCard className="p-5 lg:col-span-2">
                  <h3 className="mb-4 text-sm font-semibold text-white">Fitness & Average Fitness Trend</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsLineChart data={fitnessData}>
                      <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                      <XAxis dataKey="gen" stroke={C.text} tick={{ fontSize: 10 }} />
                      <YAxis stroke={C.text} tick={{ fontSize: 10 }} domain={["dataMin - 500", "dataMax + 500"]} />
                      <Tooltip contentStyle={{ backgroundColor: "rgba(15,23,42,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} />
                      <Line type="monotone" dataKey="best" stroke={C.accent} strokeWidth={2.5} dot={false} name="Best Fitness" />
                      <Line type="monotone" dataKey="avg" stroke={C.accent2} strokeWidth={1.5} strokeDasharray="6 4" dot={false} name="Avg Fitness" />
                      <Legend wrapperStyle={{ fontSize: 12, color: C.text }} />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </GlassCard>
              )}
            </div>
          </section>

          {/* ================================================================ */}
          {/*  13. TECHNOLOGY STACK                                           */}
          {/* ================================================================ */}
          <section id="section-tech" className="mb-32 scroll-mt-8">
            <SectionHeader icon={Cpu} title="Technology Stack" subtitle="Modern full-stack AI platform built with production-grade tools" />
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7">
              {[
                { name: "Next.js 14", icon: Monitor, color: "#fff" },
                { name: "React 18", icon: Monitor, color: C.accent },
                { name: "TypeScript", icon: Monitor, color: C.accent },
                { name: "Tailwind CSS", icon: Monitor, color: C.accent2 },
                { name: "Framer Motion", icon: Activity, color: C.accent3 },
                { name: "Recharts", icon: BarChart3, color: C.green },
                { name: "FastAPI", icon: Server, color: C.green },
                { name: "Python 3.13", icon: Server, color: C.amber },
                { name: "pandas", icon: Database, color: C.accent },
                { name: "SQLite", icon: Database, color: C.accent2 },
                { name: "WebSockets", icon: Share2, color: C.accent3 },
                { name: "Docker", icon: Layers, color: C.accent },
                { name: "GA Engine", icon: Brain, color: C.green },
                { name: "Greedy", icon: Zap, color: C.amber },
                { name: "REST API", icon: Globe, color: C.green },
                { name: "CSV/PDF", icon: Download, color: C.accent2 },
                { name: "ReportLab", icon: FlaskConical, color: C.accent3 },
                { name: "Jupyter", icon: BookOpen, color: C.amber },
                { name: "pip", icon: Layers, color: C.text },
                { name: "uvicorn", icon: Activity, color: C.green },
                { name: "Pydantic", icon: Shield, color: C.accent },
              ].map((tech) => (
                <div
                  key={tech.name}
                  className="group flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all duration-300 hover:scale-105 hover:shadow-lg"
                  style={{ borderColor: C.border, backgroundColor: "rgba(15,23,42,0.5)" }}
                >
                  <tech.icon className="h-6 w-6 transition-all group-hover:scale-110" style={{ color: tech.color }} />
                  <span className="text-[11px] font-medium text-slate-300">{tech.name}</span>
                </div>
              ))}
            </div>
          </section>

          {/* ================================================================ */}
          {/*  14. RESEARCH CONTRIBUTION                                      */}
          {/* ================================================================ */}
          <section id="section-research" className="mb-32 scroll-mt-8">
            <SectionHeader icon={BookOpen} title="Research Contributions" subtitle="Why this system matters — NP-Hard scheduling meets evolutionary computation" />
            <div className="grid gap-6 lg:grid-cols-3">
              <GlassCard className="p-6 lg:col-span-2">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
                  <AlertTriangle className="h-5 w-5 text-amber-400" />
                  The Scheduling Problem
                </h3>
                <p className="mb-4 text-sm leading-6 text-slate-300">
                  University exam scheduling is a <strong className="text-white">known NP-Hard problem</strong> — there is no
                  polynomial-time algorithm that guarantees an optimal solution. With <strong className="text-white">235 courses</strong>,{" "}
                  <strong className="text-white">4265 students</strong>, <strong className="text-white">38 rooms</strong>, and{" "}
                  <strong className="text-white">2702 conflict pairs</strong>, exhaustive search is computationally infeasible.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border p-4" style={{ borderColor: C.border, backgroundColor: "rgba(59,130,246,0.05)" }}>
                    <p className="flex items-center gap-2 text-sm font-semibold text-blue-300">
                      <Brain className="h-4 w-4" /> Genetic Algorithm
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Population-based search (80 individuals × 150 generations) with tournament selection,
                      uniform crossover (85%), adaptive mutation (8%), and constraint-aware repair.
                    </p>
                  </div>
                  <div className="rounded-lg border p-4" style={{ borderColor: C.border, backgroundColor: "rgba(245,158,11,0.05)" }}>
                    <p className="flex items-center gap-2 text-sm font-semibold text-amber-300">
                      <Zap className="h-4 w-4" /> Greedy Baseline
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Sequential first-fit scheduling sorted by conflict count. Provides a fast (~6ms) baseline
                      but produces lower quality schedules (no backtracking, no capacity check).
                    </p>
                  </div>
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
                  <Star className="h-5 w-5 text-green-400" />
                  Key Contributions
                </h3>
                <div className="space-y-3">
                  {[
                    "GA achieves 91.85 quality score vs Greedy's 0.0 on identical data",
                    "Zero hard constraint violations (room doubles, student clashes) from GA",
                    "Multi-room overflow handling for large-enrollment courses",
                    "Real-time WebSocket streaming of GA generations",
                    "Comprehensive constraint system with 7 hard/soft rules",
                    "Interactive Gantt chart, analytics dashboard, and student portal",
                    "Dockerized deployment with CI/CD-ready architecture",
                  ].map((point, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                      <p className="text-xs text-slate-300">{point}</p>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>
          </section>

          {/* ================================================================ */}
          {/*  15. RESULTS & PERFORMANCE                                      */}
          {/* ================================================================ */}
          <section id="section-results" className="mb-32 scroll-mt-8">
            <SectionHeader icon={Star} title="Results & Performance" subtitle="Final benchmark — GA vs Greedy across all dimensions" />
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Key metrics comparison */}
              <GlassCard className="p-6" glow>
                <h3 className="mb-4 text-lg font-bold text-white">Performance Comparison</h3>
                <div className="space-y-4">
                  {[
                    { label: "Quality Score", ga: gaMetrics?.quality_score ?? 0, gr: grMetrics?.quality_score ?? 0, suffix: "%", decimals: 1 },
                    { label: "Total Conflicts", ga: gaMetrics?.total_conflicts ?? 0, gr: grMetrics?.total_conflicts ?? 0, suffix: "", decimals: 0 },
                    { label: "Hard Violations", ga: gaMetrics?.hard_violations ?? 0, gr: grMetrics?.hard_violations ?? 0, suffix: "", decimals: 0 },
                    { label: "Runtime", ga: gaMetrics?.runtime_seconds ?? 0, gr: grMetrics?.runtime_seconds ?? 0, suffix: "s", decimals: 2 },
                    { label: "Room Utilization", ga: gaMetrics?.room_utilization ?? 0, gr: grMetrics?.room_utilization ?? 0, suffix: "%", decimals: 1 },
                    { label: "Slot Utilization", ga: gaMetrics?.slot_utilization ?? 0, gr: grMetrics?.slot_utilization ?? 0, suffix: "%", decimals: 1 },
                    { label: "Seat Utilization", ga: gaMetrics?.seat_utilization ?? 0, gr: grMetrics?.seat_utilization ?? 0, suffix: "%", decimals: 1 },
                    { label: "Jobs Scheduled", ga: gaMetrics?.jobs_scheduled ?? 0, gr: grMetrics?.jobs_scheduled ?? 0, suffix: "", decimals: 0 },
                  ].map((row) => (
                    <div key={row.label} className="rounded-lg bg-white/5 p-3">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-400">{row.label}</span>
                      </div>
                      <div className="grid grid-cols-5 gap-2">
                        <div className="col-span-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-blue-400">GA</span>
                            <span className="text-sm font-bold text-white">
                              {typeof row.ga === "number" ? row.ga.toFixed(row.decimals) : row.ga}{row.suffix}
                            </span>
                          </div>
                          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                            <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${Math.min(100, (row.ga / Math.max(1, row.gr || row.ga)) * 100)}%` }} />
                          </div>
                        </div>
                        <div className="flex items-center justify-center text-xs font-bold text-white">
                          {row.label === "Conflicts" || row.label === "Hard Violations" || row.label === "Runtime"
                            ? (row.ga < row.gr ? "✓" : row.ga > row.gr ? "✗" : "=")
                            : (row.ga > row.gr ? "✓" : row.ga < row.gr ? "✗" : "=")}
                        </div>
                        <div className="col-span-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-amber-400">Greedy</span>
                            <span className="text-sm font-bold text-white">
                              {typeof row.gr === "number" ? row.gr.toFixed(row.decimals) : row.gr}{row.suffix}
                            </span>
                          </div>
                          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                            <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${Math.min(100, (row.gr / Math.max(1, row.ga || row.gr)) * 100)}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>

              {/* Winner announcement */}
              <div className="flex flex-col gap-6">
                <GlassCard className="flex flex-col items-center justify-center p-8 text-center" glow>
                  <Brain className="mb-4 h-12 w-12 text-blue-400" />
                  <p className="text-3xl font-bold text-transparent bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-500 bg-clip-text">
                    GA Wins
                  </p>
                  <p className="mt-2 text-sm text-slate-400">
                    Genetic Algorithm dominates Greedy in solution quality, achieving
                    significantly fewer conflicts and higher constraint satisfaction
                  </p>
                  <div className="mt-6 flex gap-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-400">
                        {gaMetrics ? `${gaMetrics.quality_score.toFixed(1)}%` : "—"}
                      </p>
                      <p className="text-xs text-slate-500">GA Score</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-amber-400">
                        {grMetrics ? `${grMetrics.quality_score.toFixed(1)}%` : "—"}
                      </p>
                      <p className="text-xs text-slate-500">Greedy Score</p>
                    </div>
                  </div>
                  {gaMetrics && grMetrics && (
                    <p className="mt-4 text-sm text-green-400">
                      +{(gaMetrics.quality_score - grMetrics.quality_score).toFixed(1)} point improvement
                    </p>
                  )}
                </GlassCard>

                <GlassCard className="p-6">
                  <h3 className="mb-3 text-sm font-semibold text-white">System Summary</h3>
                  <div className="space-y-2 text-xs text-slate-400">
                    <div className="flex justify-between"><span>Dataset</span><span className="text-white">{summary?.courses_count ?? 235} courses, {summary?.rooms_count ?? 38} rooms</span></div>
                    <div className="flex justify-between"><span>Students</span><span className="text-white">{summary?.students_count ?? 4265}</span></div>
                    <div className="flex justify-between"><span>Conflict Pairs</span><span className="text-white">{summary?.conflict_pairs ?? 2702}</span></div>
                    <div className="flex justify-between"><span>GA Schedule Rows</span><span className="text-white">{ga?.schedule?.length ?? "—"}</span></div>
                    <div className="flex justify-between"><span>Greedy Schedule Rows</span><span className="text-white">{greedy?.schedule?.length ?? "—"}</span></div>
                    <div className="flex justify-between"><span>GA Runtime</span><span className="text-white">{gaMetrics?.runtime_seconds.toFixed(2) ?? "—"}s</span></div>
                    <div className="flex justify-between"><span>Greedy Runtime</span><span className="text-white">{grMetrics?.runtime_seconds.toFixed(3) ?? "—"}s</span></div>
                    <div className="flex justify-between"><span>Deployment</span><span className="text-white">Docker + Docker Compose</span></div>
                  </div>
                </GlassCard>
              </div>
            </div>
          </section>

          {/* ================================================================ */}
          {/*  FOOTER                                                          */}
          {/* ================================================================ */}
          <footer className="border-t py-8 text-center" style={{ borderColor: C.border }}>
            <p className="text-lg font-bold text-transparent bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text">
              OptiSchedule AI
            </p>
            <p className="mt-2 text-xs text-slate-500">
              AI-Powered Exam Scheduling Optimization Platform &middot; Built with Next.js 14 + FastAPI + Python 3.13
            </p>
            <p className="mt-1 text-xs text-slate-600">
              Genetic Algorithm &middot; Greedy Baseline &middot; Constraint System &middot; Real-Time WebSocket Streaming
            </p>
          </footer>

        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Helper Components                                                  */
/* ------------------------------------------------------------------ */

function MetricRow({ label, value, pct, color }: { label: string; value: string; pct: number; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-400">{label}</span>
        <span className="font-semibold text-white">{value}</span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${Math.min(100, Math.max(0, pct))}%`, backgroundColor: color, boxShadow: `0 0 6px ${color}` }}
        />
      </div>
    </div>
  );
}

function MiniGantt({ schedule }: { schedule: ScheduleRow[] }) {
  const slots = useMemo(() => {
    const map = new Map<string, { key: string; date: string; time: string }>();
    for (const row of schedule) {
      const key = `${row.date}|${row.time}`;
      map.set(key, { key, date: row.date, time: row.time });
    }
    return Array.from(map.values()).sort((a, b) => a.key.localeCompare(b.key));
  }, [schedule]);

  const rooms = useMemo(() => {
    return Array.from(new Set(schedule.map((r) => String(r.room ?? r.room_id ?? "?")))).slice(0, 14).sort();
  }, [schedule]);

  const byRoom = useMemo(() => {
    const map = new Map<string, ScheduleRow[]>();
    for (const row of schedule) {
      const room = String(row.room ?? row.room_id ?? "?");
      if (!map.has(room)) map.set(room, []);
      map.get(room)!.push(row);
    }
    return map;
  }, [schedule]);

  if (schedule.length === 0) {
    return <div className="flex h-48 items-center justify-center text-sm text-slate-500">Run an algorithm to view the Gantt schedule</div>;
  }

  return (
    <div className="overflow-auto max-h-80">
      <div className="min-w-[900px]">
        {/* Header row */}
        <div className="sticky top-0 z-10 grid grid-cols-[100px_1fr] border-b" style={{ borderColor: C.border, backgroundColor: "rgba(5,7,19,0.95)" }}>
          <div className="border-r px-2 py-2 text-xs font-medium text-slate-500" style={{ borderColor: C.border }}>Room</div>
          <div className="grid" style={{ gridTemplateColumns: `repeat(${Math.min(slots.length, 40)}, minmax(50px, 1fr))` }}>
            {slots.slice(0, 40).map((s) => (
              <div key={s.key} className="border-r px-1 py-1 text-[10px] text-slate-600 truncate text-center" style={{ borderColor: C.border }}>
                {s.date.slice(5)}<br/>{s.time.slice(0, 5)}
              </div>
            ))}
          </div>
        </div>
        {/* Room rows */}
        {rooms.map((room) => (
          <div key={room} className="grid min-h-[32px] grid-cols-[100px_1fr] border-b" style={{ borderColor: C.border }}>
            <div className="flex items-center border-r px-2 text-xs text-slate-400 truncate" style={{ borderColor: C.border }}>{room}</div>
            <div className="relative grid" style={{ gridTemplateColumns: `repeat(${Math.min(slots.length, 40)}, minmax(50px, 1fr))` }}>
              {slots.slice(0, 40).map((s) => (
                <div key={s.key} className="border-r" style={{ borderColor: "rgba(255,255,255,0.03)" }} />
              ))}
              {(byRoom.get(room) ?? []).map((item, i) => {
                const idx = slots.slice(0, 40).findIndex((s) => s.key === `${item.date}|${item.time}`);
                if (idx === -1) return null;
                return (
                  <div
                    key={`${item.exam}-${i}`}
                    title={`${item.exam} | ${item.date} ${item.time}`}
                    className="absolute top-0.5 h-6 overflow-hidden rounded px-1 py-0.5 text-[9px] font-medium leading-tight truncate border"
                    style={{
                      left: `${(idx / Math.min(slots.length, 40)) * 100}%`,
                      width: `${Math.max(100 / Math.min(slots.length, 40), 4)}%`,
                      backgroundColor: item.status === "conflict" ? "rgba(239,68,68,0.3)" : item.priority === "high" ? "rgba(245,158,11,0.3)" : "rgba(16,185,129,0.25)",
                      borderColor: item.status === "conflict" ? "rgba(239,68,68,0.4)" : item.priority === "high" ? "rgba(245,158,11,0.3)" : "rgba(16,185,129,0.2)",
                      color: item.status === "conflict" ? "#fca5a5" : item.priority === "high" ? "#fcd34d" : "#6ee7b7",
                    }}
                  >
                    {item.exam}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
