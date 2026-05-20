import * as React from "react";
import { cn } from "@/lib/utils";

export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-10 w-full rounded-lg border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none",
        "focus:border-blue-400/70 focus:ring-2 focus:ring-blue-400/20",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

