"use client";

import { useLocale } from "@/i18n/client";
import type { Locale } from "@/i18n/config";

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { locale, setLocale, t } = useLocale();
  const btn = (l: Locale, label: string) => {
    const active = locale === l;
    return (
      <button
        type="button"
        onClick={() => setLocale(l)}
        aria-pressed={active}
        className={
          "px-2 py-1 text-xs rounded transition " +
          (active
            ? "bg-brand-600 text-white"
            : "text-slate-600 hover:bg-slate-100")
        }
      >
        {label}
      </button>
    );
  };
  return (
    <div className={"inline-flex items-center gap-0.5 " + className} aria-label={t("lang.switch")}>
      {btn("zh-Hant", t("lang.zh"))}
      {btn("en", t("lang.en"))}
    </div>
  );
}
