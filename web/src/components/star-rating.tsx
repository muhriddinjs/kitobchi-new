export default function StarRating({
  value,
  count,
}: {
  value: number;
  count: number;
}) {
  if (count === 0) {
    return (
      <span className="shrink-0 whitespace-nowrap text-xs text-ink-soft">
        Hali baholanmagan
      </span>
    );
  }

  return (
    <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-xs text-ink-soft">
      <span aria-hidden className="text-amber-500">
        ★
      </span>
      <span className="font-medium text-ink">{value.toFixed(1)}</span>
      <span>({count})</span>
    </span>
  );
}
