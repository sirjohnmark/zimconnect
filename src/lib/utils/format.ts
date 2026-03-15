export function formatPrice(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-ZW", { style: "currency", currency }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-ZW", { dateStyle: "medium" }).format(new Date(date));
}

export function formatRelativeDate(date: string | Date): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diff = Math.floor((now - then) / 1000); // seconds

  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`;
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400 / 7)}w ago`;
  return formatDate(date);
}
