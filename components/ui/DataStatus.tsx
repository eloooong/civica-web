import { cn } from "@/lib/utils";

export function DataStatus({ className }: { className?: string }) {
  return (
    <p className={cn("text-xs leading-5", className)}>
      Public records from three sources. Cached responses are eligible for refresh after one hour.
      Each record includes source and retrieval details where available.
    </p>
  );
}
