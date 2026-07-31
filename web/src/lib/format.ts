export function formatPrice(price: number | null): string {
  if (price === null) return "Bepul";
  return `${price.toLocaleString("uz-UZ")} soʻm`;
}
