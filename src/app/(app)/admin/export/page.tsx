"use client";

import { useState } from "react";
import { TYPE_LABEL, STATUS_LABEL } from "@/lib/labels";

export default function ExportPage() {
  const [type, setType] = useState<string>("ALL");
  const [status, setStatus] = useState<string>("");
  const [submittedFrom, setSubmittedFrom] = useState("");
  const [submittedTo, setSubmittedTo] = useState("");
  const [shippedFrom, setShippedFrom] = useState("");
  const [shippedTo, setShippedTo] = useState("");
  const [includeUnshipped, setIncludeUnshipped] = useState(true);
  const [dept, setDept] = useState("");

  function buildHref(format: "xlsx" | "csv") {
    const sp = new URLSearchParams();
    sp.set("format", format);
    if (type) sp.set("type", type);
    if (status) sp.set("status", status);
    if (dept) sp.set("dept", dept);
    if (submittedFrom) sp.set("submittedFrom", submittedFrom);
    if (submittedTo) sp.set("submittedTo", submittedTo);
    if (shippedFrom) sp.set("shippedFrom", shippedFrom);
    if (shippedTo) sp.set("shippedTo", shippedTo);
    if ((shippedFrom || shippedTo) && includeUnshipped) sp.set("includeUnshipped", "1");
    return `/api/admin/export?${sp.toString()}`;
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
            <label className="label">申請日期 起</label>
            <input type="date" className="input" value={submittedFrom} onChange={(e) => setSubmittedFrom(e.target.value)} />
          </div>
          <div>
            <label className="label">申請日期 迄</label>
            <input type="date" className="input" value={submittedTo} onChange={(e) => setSubmittedTo(e.target.value)} />
          </div>
          <div></div>
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
          <a className="btn btn-outline" href={buildHref("csv")}>匯出 CSV</a>
          <a className="btn btn-primary" href={buildHref("xlsx")}>匯出 Excel</a>
        </div>
      </div>
      <p className="text-xs text-slate-500">
        日期欄位皆為萬年曆（HTML date picker），可任意選擇起訖日期。
      </p>
    </div>
  );
}
