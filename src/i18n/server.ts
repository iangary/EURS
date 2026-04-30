import { cookies } from "next/headers";
import zh, { type DictKey } from "./dictionaries/zh";
import en from "./dictionaries/en";
import { COOKIE_NAME, DEFAULT_LOCALE, isLocale, type Locale } from "./config";
import { format } from "./shared";

const dicts: Record<Locale, typeof zh> = {
  "zh-Hant": zh,
  en,
};

export function getLocale(): Locale {
  const c = cookies().get(COOKIE_NAME)?.value;
  return isLocale(c) ? c : DEFAULT_LOCALE;
}

export function getDict(locale: Locale = getLocale()) {
  return dicts[locale];
}

export type TFn = (key: DictKey, vars?: Record<string, string | number>) => string;

export function getT(locale: Locale = getLocale()): TFn {
  const d = dicts[locale];
  return (key, vars) => format(d[key] ?? key, vars);
}

export { format };
