import { CONDITION_LABELS } from "@/lib/format";
import type { ListingCondition } from "@/lib/types";

export default function ConditionBadge({
  condition,
}: {
  condition: ListingCondition;
}) {
  return (
    <span className="rounded-full border border-border bg-white px-2 py-0.5 text-xs font-medium text-ink-soft">
      {CONDITION_LABELS[condition]}
    </span>
  );
}
