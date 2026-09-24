import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "brand" | "accent" | "success";
  className?: string;
}) {
  const tones: Record<string, string> = {
    neutral: "border-line bg-slate-100 text-ink/80",
    brand: "border-brand-200 bg-brand-50 text-brand-800",
    accent: "border-red-200 bg-accent-50 text-accent-700",
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-2 py-0.5 text-xs font-semibold",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
