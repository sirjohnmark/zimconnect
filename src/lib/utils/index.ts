// TODO: implement
export { formatPrice, formatDate, formatRelativeDate } from "./format";

export function slugify(text: string): string {
  // TODO: implement
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  // TODO: replace with clsx/tailwind-merge
  return classes.filter(Boolean).join(" ");
}
