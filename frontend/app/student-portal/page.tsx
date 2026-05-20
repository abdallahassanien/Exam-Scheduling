"use client";

import { Suspense } from "react";
import { ArrowLeft, GraduationCap } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";

const StudentSchedulePortal = dynamic(
  () => import("@/components/StudentSchedulePortal").then((m) => ({ default: m.StudentSchedulePortal })),
  { ssr: false }
);

import { useSearchParams } from "next/navigation";

function PortalContent() {
  const searchParams = useSearchParams();
  const algorithm = (searchParams.get("algorithm") ?? "ga") as "ga" | "greedy";
  return <StudentSchedulePortal algorithm={algorithm} />;
}

export default function StudentPortalPage() {
  return (
    <main className="min-h-screen bg-[#050713]">
      <div className="relative z-50 flex items-center justify-between border-b border-white/10 bg-slate-950/80 px-4 py-3 backdrop-blur-xl">
        <Link href="/" className="flex items-center gap-2 text-sm text-slate-400 transition hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <div className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-blue-400" />
          <span className="text-sm font-medium text-white">Student Portal</span>
        </div>
      </div>
      <Suspense fallback={<div className="flex items-center justify-center py-20 text-slate-500">Loading...</div>}>
        <PortalContent />
      </Suspense>
    </main>
  );
}
