import type { Locale } from "./config";

const intlLocale = (l: Locale) => (l === "en" ? "en-US" : "zh-Hant-TW");

export function formatDate(d: Date | string | number, locale: Locale): string {
  const date = d instanceof Date ? d : new Date(d);
  return new Intl.DateTimeFormat(intlLocale(locale), {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function formatDateTime(d: Date | string | number, locale: Locale): string {
  const date = d instanceof Date ? d : new Date(d);
  return new Intl.DateTimeFormat(intlLocale(locale), {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function pluralKey(count: number): "one" | "other" {
  return count === 1 ? "one" : "other";
}
