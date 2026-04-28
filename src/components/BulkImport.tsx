"use client";

import { useRef, useState } from "react";

type Row = { rowNumber: number; status: "ok" | "warn" | "error"; errors: string[]; warnings: string[]; data: any };

export function BulkImport({
  type,
  onApply,
}: {
  type: "helmet" | "shoes" | "uniform";
  onApply: (rows: any[]) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function upload(f: File) {
    setBusy(true);
    setError(null);
    setRows([]);
    const fd = new FormData();
    fd.append("file", f);
    const res = await fetch(`/api/import/${type}`, { method: "POST", body: fd });
    setBusy(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "解析失敗");
      return;
    }
    const d = await res.json();
    setRows(d.rows ?? []);
  }

  const okCount = rows.filter((r) => r.status === "ok").length;
  const errCount = rows.filter((r) => r.status === "error").length;
  const canApply = rows.length > 0 && errCount === 0;

  return (
    <div className="card">
      <div className="card-header flex items-center justify-between">
        <span>批量匯入（Excel）</span>
        <a className="btn btn-outline text-xs" href={`/api/templates/${type}`}>
          下載範本
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
          <button className="btn btn-outline" onClick={() => fileRef.current?.click()} disabled={busy}>
            {busy ? "解析中…" : "選擇 .xlsx 或拖放至此"}
          </button>
          <div className="mt-2 text-xs text-slate-400">最大 5MB，最多 200 列</div>
        </div>

        {error && <div className="text-sm text-rose-600">{error}</div>}

        {rows.length > 0 && (
          <div>
            <div className="text-sm text-slate-600 mb-2">
              共 {rows.length} 列：
              <span className="text-emerald-700"> ✅ {okCount}</span>
              <span className="text-rose-700 ml-2">❌ {errCount}</span>
            </div>
            <div className="max-h-72 overflow-auto border rounded">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="p-2 text-left">列</th>
                    <th className="p-2 text-left">狀態</th>
                    <th className="p-2 text-left">摘要</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.rowNumber} className={r.status === "error" ? "bg-rose-50" : ""}>
                      <td className="p-2">{r.rowNumber}</td>
                      <td className="p-2">
                        {r.status === "ok" ? "✅" : r.status === "warn" ? "⚠️" : "❌"}
                      </td>
                      <td className="p-2">
                        <div>
                          {r.data?.wearerAcc ?? "—"}
                          {r.data?.userName ? `（${r.data.userName}）` : ""}
                        </div>
                        {r.errors.map((e, i) => (
                          <div key={i} className="text-rose-700">{e}</div>
                        ))}
                        {r.warnings.map((w, i) => (
                          <div key={i} className="text-amber-700">{w}</div>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-2 mt-3">
              <button className="btn btn-outline" onClick={() => setRows([])}>
                取消
              </button>
              <button
                className="btn btn-primary"
                disabled={!canApply}
                onClick={() => onApply(rows.filter((r) => r.status !== "error").map((r) => r.data))}
              >
                套用至表單
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
