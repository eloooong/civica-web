import { ArrowDown, ArrowUp } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

  /** YoY/period trend badge. Uses the Civica badge + Lucide icons. */
export function TrendBadge({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const positive = value >= 0;
  const Icon = positive ? ArrowUp : ArrowDown;
  return (
    <Badge
      tone={positive ? "success" : "accent"}
      className={cn("tabular-nums", className)}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      {positive ? "+" : ""}
      {value.toFixed(1)}%
    </Badge>
  );
}
