"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  IMPORT_RESULT_STORAGE_KEY,
  IMPORT_TAB_STORAGE_KEY,
} from "@/lib/import-storage";

type Row = {
  rowNumber: number;
  status: "ok" | "warn" | "error";
  errors: string[];
  warnings: string[];
  data: any;
};

type ParseResult = { helmet: Row[]; shoes: Row[]; uniform: Row[] };

type Tab = "helmet" | "shoes" | "uniform";

const TAB_LABEL: Record<Tab, string> = {
  helmet: "安全帽",
  shoes: "安全鞋",
  uniform: "制服",
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
      setError(d.error ?? "解析失敗");
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
          <span>批量匯入 — 統一 Excel（三分頁）</span>
          <a className="btn btn-outline text-xs" href="/api/templates/unified">
            下載統一範本
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
              {busy ? "解析中…" : "選擇 .xlsx 或拖放至此"}
            </button>
            <div className="mt-2 text-xs text-slate-400">
              一個 Excel 內含「安全帽 / 安全鞋 / 制服」三個分頁，每頁最多 200 列、總檔 5 MB
            </div>
          </div>
          {error && <div className="text-sm text-rose-600">{error}</div>}
        </div>
      </div>

      {result && (
        <div className="card">
          <div className="card-header">驗證結果</div>
          <div className="card-body space-y-3">
            {tabs.map((t) => {
              const rows = result[t];
              const okCount = rows.filter((r) => r.status !== "error").length;
              const errCount = rows.filter((r) => r.status === "error").length;
              const errorRows = rows.filter((r) => r.status === "error");
              const canGo = okCount > 0 && errCount === 0;
              return (
                <div
                  key={t}
                  className="border rounded-md p-3 flex flex-col md:flex-row md:items-start md:justify-between gap-3"
                >
                  <div className="flex-1 space-y-1">
                    <div className="font-medium">
                      {TAB_LABEL[t]}
                      <span className="ml-2 text-sm text-slate-500">
                        共 {rows.length} 列
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
                            第 {r.rowNumber} 列：{r.errors.join("；")}
                          </li>
                        ))}
                      </ul>
                    )}
                    {rows.length === 0 && (
                      <div className="text-xs text-slate-400">此分頁無資料</div>
                    )}
                  </div>
                  <div className="md:w-56 md:text-right">
                    <button
                      className="btn btn-primary w-full md:w-auto"
                      disabled={!canGo}
                      onClick={() => router.push(`${TAB_PATH[t]}?imported=1`)}
                    >
                      前往{TAB_LABEL[t]}申請（{okCount}）
                    </button>
                  </div>
                </div>
              );
            })}
            <div className="text-xs text-slate-500">
              請在各申請頁檢視匯入內容後送出。錯誤列請修正 Excel 後重新上傳。
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
