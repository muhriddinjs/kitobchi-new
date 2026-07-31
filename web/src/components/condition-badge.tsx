import type { ListingCondition } from "@/lib/types";

const LABELS: Record<ListingCondition, string> = {
  NEW: "Yangidek",
  GOOD: "Yaxshi",
  FAIR: "Oʻrtacha",
  WORN: "Eskirgan",
};

export default function ConditionBadge({
  condition,
}: {
  condition: ListingCondition;
}) {
  return (
    <span className="rounded-full border border-border bg-white px-2 py-0.5 text-xs font-medium text-ink-soft">
      {LABELS[condition]}
    </span>
  );
}
