"use client";

import { useState } from "react";

type ErrRec = { status: number | null; message: string; at: string };
type ErrMap = { emp?: ErrRec; mail?: ErrRec };
type TestResult = { ok: boolean; message: string };

const SOURCE_LABEL: Record<string, string> = { emp: "員工 API (EMP)", mail: "寄信 API (MAIL)" };

export function ApiHealthCard({ initial }: { initial: ErrMap }) {
  const [errors, setErrors] = useState<ErrMap>(initial);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{ emp: TestResult; mail: TestResult } | null>(null);

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
          <div className="font-medium">外部 API 連線狀態</div>
          <div className="text-xs text-slate-400">
            申請流程使用的 EMP / MAIL API 共用 <code className="font-mono">SSO_API_KEY</code>，金鑰錯誤會在此顯示。
          </div>
        </div>
        <button className="btn btn-primary" disabled={testing} onClick={runTest}>
          {testing ? "測試中…" : "測試連線"}
        </button>
      </div>
      <div className="card-body space-y-3">
        {!hasError && !result && (
          <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded p-2">
            目前無記錄到的 API 錯誤。
          </div>
        )}
        {sources.map((s) =>
          errors[s] ? (
            <div key={s} className="text-sm text-rose-800 bg-rose-50 border border-rose-200 rounded p-2">
              <div className="font-medium">{SOURCE_LABEL[s]} 最後一次失敗</div>
              <div className="font-mono text-xs mt-1">
                狀態：{errors[s]!.status ?? "無回應/逾時"} · 時間：
                {new Date(errors[s]!.at).toLocaleString("zh-TW")}
              </div>
              <div className="font-mono text-xs mt-1 break-all">訊息：{errors[s]!.message}</div>
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
                  {SOURCE_LABEL[s]}：{result[s].ok ? "✓ 通過" : "✗ 失敗"}
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
