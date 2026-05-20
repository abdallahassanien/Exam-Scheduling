"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
};

export function Button({ className, variant = "primary", size = "md", ...props }: ButtonProps) {
  const variants = {
    primary: "bg-blue-500 text-white shadow-glow hover:bg-blue-400",
    secondary: "border border-white/10 bg-white/[0.08] text-slate-100 hover:bg-white/[0.12]",
    ghost: "text-slate-300 hover:bg-white/10 hover:text-white",
    danger: "bg-red-500/90 text-white hover:bg-red-400"
  };
  const sizes = {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-5 text-sm",
    icon: "h-10 w-10 p-0"
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition disabled:pointer-events-none disabled:opacity-50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
}
