export function formatPrice(price: number | null): string {
  if (price === null) return "Bepul";
  return `${price.toLocaleString("uz-UZ")} soʻm`;
}

// "14:05" for today, "31.07 14:05" otherwise — compact chat timestamps.
export function formatMessageTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const time = date.toLocaleTimeString("uz-UZ", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  if (sameDay) return time;
  const day = date.toLocaleDateString("uz-UZ", {
    day: "2-digit",
    month: "2-digit",
  });
  return `${day} ${time}`;
}
