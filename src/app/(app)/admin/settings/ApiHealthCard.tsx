"use client";

import { useState } from "react";
import { useT, useFormat } from "@/i18n/client";

type ErrRec = { status: number | null; message: string; at: string };
type ErrMap = { emp?: ErrRec; mail?: ErrRec };
type TestResult = { ok: boolean; message: string };

export function ApiHealthCard({ initial }: { initial: ErrMap }) {
  const t = useT();
  const fmt = useFormat();
  const [errors, setErrors] = useState<ErrMap>(initial);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{ emp: TestResult; mail: TestResult } | null>(null);

  const sourceLabel = (s: keyof ErrMap) =>
    s === "emp" ? t("apiHealth.source.emp") : t("apiHealth.source.mail");

  async function runTest() {
    setTesting(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/api-health", { method: "POST" });
      const json = await res.json();
      setResult(json);
      const refreshed = await fetch("/api/admin/api-health").then((r) => r.json());
      setErrors(refreshed.errors ?? {});
    } finally {
      setTesting(false);
    }
  }

  const sources: Array<keyof ErrMap> = ["emp", "mail"];
  const hasError = sources.some((s) => errors[s]);

  return (
    <div className="card">
      <div className="px-5 py-3 border-b flex items-center justify-between gap-3">
        <div>
          <div className="font-medium">{t("apiHealth.title")}</div>
          <div className="text-xs text-slate-400">
            {t("apiHealth.subtitle")}
          </div>
        </div>
        <button className="btn btn-primary" disabled={testing} onClick={runTest}>
          {testing ? t("apiHealth.btn.testing") : t("apiHealth.btn.test")}
        </button>
      </div>
      <div className="card-body space-y-3">
        {!hasError && !result && (
          <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded p-2">
            {t("apiHealth.noErrors")}
          </div>
        )}
        {sources.map((s) =>
          errors[s] ? (
            <div key={s} className="text-sm text-rose-800 bg-rose-50 border border-rose-200 rounded p-2">
              <div className="font-medium">{sourceLabel(s)} {t("apiHealth.lastFailure")}</div>
              <div className="font-mono text-xs mt-1">
                {t("apiHealth.field.status", {
                  status: errors[s]!.status ?? t("apiHealth.field.statusEmpty"),
                  time: fmt.dateTime(errors[s]!.at),
                })}
              </div>
              <div className="font-mono text-xs mt-1 break-all">
                {t("apiHealth.field.message", { message: errors[s]!.message })}
              </div>
            </div>
          ) : null,
        )}
        {result && (
          <div className="grid md:grid-cols-2 gap-2">
            {(["emp", "mail"] as const).map((s) => (
              <div
                key={s}
                className={`text-sm rounded p-2 border ${
                  result[s].ok
                    ? "text-emerald-800 bg-emerald-50 border-emerald-200"
                    : "text-rose-800 bg-rose-50 border-rose-200"
                }`}
              >
                <div className="font-medium">
                  {t("apiHealth.test.label", {
                    source: sourceLabel(s),
                    result: result[s].ok ? t("apiHealth.test.pass") : t("apiHealth.test.fail"),
                  })}
                </div>
                <div className="font-mono text-xs mt-1 break-all">{result[s].message}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
