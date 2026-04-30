"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  IMPORT_RESULT_STORAGE_KEY,
  IMPORT_TAB_STORAGE_KEY,
} from "@/lib/import-storage";
import { useT, useTEnum, useTPlural } from "@/i18n/client";

type Row = {
  rowNumber: number;
  status: "ok" | "warn" | "error";
  errors: string[];
  warnings: string[];
  data: any;
};

type ParseResult = { helmet: Row[]; shoes: Row[]; uniform: Row[] };

type Tab = "helmet" | "shoes" | "uniform";

const TAB_TYPE: Record<Tab, "HELMET" | "SHOES" | "UNIFORM"> = {
  helmet: "HELMET",
  shoes: "SHOES",
  uniform: "UNIFORM",
};

const TAB_PATH: Record<Tab, string> = {
  helmet: "/apply/helmet",
  shoes: "/apply/shoes",
  uniform: "/apply/uniform",
};

const STORAGE_KEY = IMPORT_TAB_STORAGE_KEY;
const RESULT_STORAGE_KEY = IMPORT_RESULT_STORAGE_KEY;

export function BulkImportUnified() {
  const router = useRouter();
  const t = useT();
  const tEnum = useTEnum();
  const tPlural = useTPlural();
  const fileRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<ParseResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(RESULT_STORAGE_KEY);
      if (raw) setResult(JSON.parse(raw) as ParseResult);
    } catch {
      sessionStorage.removeItem(RESULT_STORAGE_KEY);
    }
  }, []);

  async function upload(f: File) {
    setBusy(true);
    setError(null);
    setResult(null);
    const fd = new FormData();
    fd.append("file", f);
    const res = await fetch("/api/import/unified", { method: "POST", body: fd });
    setBusy(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? t("import.error.parse"));
      return;
    }
    const d = (await res.json()) as ParseResult;
    setResult(d);
    sessionStorage.setItem(RESULT_STORAGE_KEY, JSON.stringify(d));

    const tabs: Tab[] = ["helmet", "shoes", "uniform"];
    for (const t of tabs) {
      const okRows = d[t].filter((r) => r.status !== "error").map((r) => r.data);
      if (okRows.length > 0) {
        sessionStorage.setItem(STORAGE_KEY[t], JSON.stringify(okRows));
      } else {
        sessionStorage.removeItem(STORAGE_KEY[t]);
      }
    }
  }

  const tabs: Tab[] = ["helmet", "shoes", "uniform"];

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <span>{t("import.card.title")}</span>
          <a className="btn btn-outline text-xs" href="/api/templates/unified">
            {t("import.btn.template")}
          </a>
        </div>
        <div className="card-body space-y-3">
          <div
            className="border-2 border-dashed border-slate-300 rounded-md p-6 text-center text-sm text-slate-500"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files?.[0];
              if (f) upload(f);
            }}
          >
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              accept=".xlsx"
              onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
            />
            <button
              className="btn btn-outline"
              onClick={() => fileRef.current?.click()}
              disabled={busy}
            >
              {busy ? t("import.btn.parsing") : t("import.btn.choose")}
            </button>
            <div className="mt-2 text-xs text-slate-400">
              {t("import.dropHint")}
            </div>
          </div>
          {error && <div className="text-sm text-rose-600">{error}</div>}
        </div>
      </div>

      {result && (
        <div className="card">
          <div className="card-header">{t("import.section.result")}</div>
          <div className="card-body space-y-3">
            {tabs.map((tab) => {
              const rows = result[tab];
              const okCount = rows.filter((r) => r.status !== "error").length;
              const errCount = rows.filter((r) => r.status === "error").length;
              const errorRows = rows.filter((r) => r.status === "error");
              const canGo = okCount > 0 && errCount === 0;
              const tabLabel = tEnum.type(TAB_TYPE[tab]);
              return (
                <div
                  key={tab}
                  className="border rounded-md p-3 flex flex-col md:flex-row md:items-start md:justify-between gap-3"
                >
                  <div className="flex-1 space-y-1">
                    <div className="font-medium">
                      {tabLabel}
                      <span className="ml-2 text-sm text-slate-500">
                        {tPlural("import.row.totalCount", rows.length)}
                      </span>
                      {okCount > 0 && (
                        <span className="ml-2 text-emerald-700 text-sm">
                          ✅ {okCount}
                        </span>
                      )}
                      {errCount > 0 && (
                        <span className="ml-2 text-rose-700 text-sm">
                          ❌ {errCount}
                        </span>
                      )}
                    </div>
                    {errorRows.length > 0 && (
                      <ul className="text-xs text-rose-700 list-disc pl-5">
                        {errorRows.map((r) => (
                          <li key={r.rowNumber}>
                            {t("import.row.errorRow", { row: r.rowNumber, errors: r.errors.join("；") })}
                          </li>
                        ))}
                      </ul>
                    )}
                    {rows.length === 0 && (
                      <div className="text-xs text-slate-400">{t("import.row.empty")}</div>
                    )}
                  </div>
                  <div className="md:w-56 md:text-right">
                    <button
                      className="btn btn-primary w-full md:w-auto"
                      disabled={!canGo}
                      onClick={() => router.push(`${TAB_PATH[tab]}?imported=1`)}
                    >
                      {t("import.row.goto", { label: tabLabel, count: okCount })}
                    </button>
                  </div>
                </div>
              );
            })}
            <div className="text-xs text-slate-500">
              {t("import.footer.hint")}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
