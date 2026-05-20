import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "blue" | "green" | "red" | "yellow" | "slate";
};

export function Badge({ className, tone = "slate", ...props }: BadgeProps) {
  const tones = {
    blue: "border-blue-400/30 bg-blue-400/10 text-blue-200",
    green: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
    red: "border-red-400/30 bg-red-400/10 text-red-200",
    yellow: "border-amber-400/30 bg-amber-400/10 text-amber-200",
    slate: "border-slate-400/20 bg-slate-400/10 text-slate-200"
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}

