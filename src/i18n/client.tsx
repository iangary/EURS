"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import zh, { type DictKey } from "./dictionaries/zh";
import en from "./dictionaries/en";
import { COOKIE_NAME, DEFAULT_LOCALE, type Locale } from "./config";
import { format } from "./shared";
import { formatDate, formatDateTime, pluralKey } from "./format";

const dicts: Record<Locale, typeof zh> = { "zh-Hant": zh, en };

type TFn = (key: DictKey, vars?: Record<string, string | number>) => string;

type Ctx = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: TFn;
};

const LocaleContext = createContext<Ctx | null>(null);

export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale?: Locale;
  children: React.ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale ?? DEFAULT_LOCALE);
  const router = useRouter();

  const setLocale = useCallback(
    (l: Locale) => {
      if (typeof document !== "undefined") {
        document.cookie = `${COOKIE_NAME}=${l}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
      }
      setLocaleState(l);
      router.refresh();
    },
    [router],
  );

  const t = useMemo<TFn>(() => {
    const d = dicts[locale];
    return (key, vars) => format(d[key] ?? key, vars);
  }, [locale]);

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used inside <LocaleProvider>");
  return ctx;
}

export function useT(): TFn {
  return useLocale().t;
}

export function useFormat() {
  const { locale } = useLocale();
  return useMemo(
    () => ({
      date: (d: Date | string | number) => formatDate(d, locale),
      dateTime: (d: Date | string | number) => formatDateTime(d, locale),
    }),
    [locale],
  );
}

export function useTEnum() {
  const t = useT();
  return useMemo(
    () => ({
      type: (k: "HELMET" | "SHOES" | "UNIFORM") => t(`type.${k}`),
      status: (k: "APPLYING" | "SHIPPED" | "REJECTED") => t(`status.${k}`),
      action: (k: "NEW" | "REPLACE" | "PURCHASE") => t(`action.${k}`),
      gender: (k: "MALE" | "FEMALE") => t(`gender.${k}`),
    }),
    [t],
  );
}

export function useTPlural() {
  const t = useT();
  return useMemo(
    () => (baseKey: string, count: number, vars?: Record<string, string | number>) =>
      t(`${baseKey}.${pluralKey(count)}` as DictKey, { count, ...vars }),
    [t],
  );
}
