"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastState = {
  type: "success" | "error" | "info";
  message: string;
} | null;

export function Toast({ toast }: { toast: ToastState }) {
  if (!toast) return null;
  const Icon = toast.type === "error" ? XCircle : CheckCircle2;
  return (
    <div
      className={cn(
        "fixed right-4 top-4 z-50 flex max-w-sm items-center gap-3 rounded-lg border px-4 py-3 text-sm shadow-2xl backdrop-blur-xl",
        toast.type === "error"
          ? "border-red-400/30 bg-red-950/80 text-red-100"
          : "border-emerald-400/30 bg-slate-950/[0.86] text-emerald-100"
      )}
    >
      <Icon className="h-4 w-4" />
      {toast.message}
    </div>
  );
}
