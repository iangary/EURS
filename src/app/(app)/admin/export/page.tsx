"use client";

import { useState } from "react";
import { TYPE_LABEL, STATUS_LABEL } from "@/lib/labels";

type PreviewData = { header: string[]; rows: (string | number | null)[][]; count: number };

function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function daysAgoStr(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function ExportPage() {
  const [type, setType] = useState<string>("ALL");
  const [status, setStatus] = useState<string>("");
  const [shippedFrom, setShippedFrom] = useState(daysAgoStr(7));
  const [shippedTo, setShippedTo] = useState(todayStr());
  const [includeUnshipped, setIncludeUnshipped] = useState(true);
  const [dept, setDept] = useState("");
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(false);

  function buildHref(format: "xlsx" | "csv" | "preview") {
    const sp = new URLSearchParams();
    sp.set("format", format);
    if (type) sp.set("type", type);
    if (status) sp.set("status", status);
    if (dept) sp.set("dept", dept);
    if (shippedFrom) sp.set("shippedFrom", shippedFrom);
    if (shippedTo) sp.set("shippedTo", shippedTo);
    if ((shippedFrom || shippedTo) && includeUnshipped) sp.set("includeUnshipped", "1");
    return `/api/admin/export?${sp.toString()}`;
  }

  async function loadPreview() {
    setLoading(true);
    try {
      const res = await fetch(buildHref("preview"));
      if (res.ok) setPreview(await res.json());
      else alert("預覽失敗");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">後台 · 匯出（會計對帳）</h1>
      <div className="card">
        <div className="card-body grid md:grid-cols-3 gap-3 text-sm">
          <div>
            <label className="label">項目類型</label>
            <select className="select" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="ALL">全部</option>
              {Object.entries(TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="label">狀態</label>
            <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">全部</option>
              {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="label">工地／部門（包含）</label>
            <input className="input" value={dept} onChange={(e) => setDept(e.target.value)} />
          </div>
          <div>
            <label className="label">出貨日期 起</label>
            <input type="date" className="input" value={shippedFrom} onChange={(e) => setShippedFrom(e.target.value)} />
          </div>
          <div>
            <label className="label">出貨日期 迄</label>
            <input type="date" className="input" value={shippedTo} onChange={(e) => setShippedTo(e.target.value)} />
          </div>
          <div className="md:col-span-3 flex items-center gap-2">
            <input
              id="includeUnshipped"
              type="checkbox"
              className="h-4 w-4"
              checked={includeUnshipped}
              disabled={!shippedFrom && !shippedTo}
              onChange={(e) => setIncludeUnshipped(e.target.checked)}
            />
            <label htmlFor="includeUnshipped" className="text-slate-700">
              包含尚未出貨的申請（出貨日期為空者）
            </label>
            {!shippedFrom && !shippedTo && (
              <span className="text-xs text-slate-400">— 未設定出貨日期區間時無作用</span>
            )}
          </div>
        </div>
        <div className="px-5 py-3 border-t flex justify-end gap-2">
          <button className="btn btn-outline" onClick={loadPreview} disabled={loading}>
            {loading ? "載入中…" : "預覽"}
          </button>
          <a className="btn btn-outline" href={buildHref("csv")}>匯出 CSV</a>
          <a className="btn btn-primary" href={buildHref("xlsx")}>匯出 Excel</a>
        </div>
      </div>

      {preview && (
        <div className="card">
          <div className="px-5 py-3 border-b text-sm text-slate-600">
            預覽結果：{preview.count} 張申請單，共 {preview.rows.length} 列
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-left">
                <tr>
                  {preview.header.map((h) => (
                    <th key={h} className="p-2 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {preview.rows.length === 0 && (
                  <tr><td colSpan={preview.header.length} className="p-6 text-center text-slate-400">無資料</td></tr>
                )}
                {preview.rows.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    {row.map((v, j) => (
                      <td key={j} className="p-2 whitespace-nowrap">{v == null ? "" : String(v)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="text-xs text-slate-500">
        日期欄位皆為萬年曆（HTML date picker），可任意選擇起訖日期。
      </p>
    </div>
  );
}
