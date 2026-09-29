import { cn } from "@/lib/utils";

export function DataStatus({ className }: { className?: string }) {
  return (
    <p className={cn("text-xs leading-5", className)}>
      Live data from three public APIs; every record links back to its source with a
      retrieval timestamp.
    </p>
  );
}
