"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { TYPE_LABEL, STATUS_LABEL, STATUS_BADGE_CLASS } from "@/lib/labels";
import { cn } from "@/lib/cn";

type Req = {
  id: string;
  requestNo: string;
  type: keyof typeof TYPE_LABEL;
  status: keyof typeof STATUS_LABEL;
  requesterName: string;
  siteOrDept: string;
  submittedAt: string;
  shippedAt: string | null;
  items: any[];
};

const TABS: { key: "ALL" | keyof typeof TYPE_LABEL; label: string }[] = [
  { key: "ALL", label: "全部" },
  { key: "HELMET", label: "安全帽" },
  { key: "SHOES", label: "安全鞋" },
  { key: "UNIFORM", label: "制服" },
];

export function AdminRequestList() {
  const [tab, setTab] = useState<"ALL" | keyof typeof TYPE_LABEL>("ALL");
  const [status, setStatus] = useState<string>("");
  const [keyword, setKeyword] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [list, setList] = useState<Req[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const params = useMemo(() => {
    const sp = new URLSearchParams();
    if (tab !== "ALL") sp.set("type", tab);
    if (status) sp.set("status", status);
    if (keyword) sp.set("q", keyword);
    if (from) sp.set("from", from);
    if (to) sp.set("to", to);
    return sp.toString();
  }, [tab, status, keyword, from, to]);

  async function load() {
    setBusy(true);
    const res = await fetch(`/api/admin/requests?${params}`);
    setBusy(false);
    if (res.ok) setList(await res.json());
  }
  useEffect(() => { load(); }, [params]);

  function toggle(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function ship(id: string) {
    if (!confirm("確認已出貨？")) return;
    const res = await fetch(`/api/requests/${id}/ship`, { method: "POST" });
    if (res.ok) load();
    else alert("失敗");
  }

  async function batchShip() {
    if (selected.size === 0) return;
    if (!confirm(`批次標記 ${selected.size} 筆為已出貨？`)) return;
    const res = await fetch(`/api/requests/batch-ship`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ids: Array.from(selected) }),
    });
    if (res.ok) {
      setSelected(new Set());
      load();
    } else alert("失敗");
  }

  return (
    <div className="space-y-3">
      {/* 分頁籤 */}
      <div className="flex border-b">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={cn("tab", tab === t.key && "tab-active")}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 篩選列 */}
      <div className="card">
        <div className="card-body grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
          <div>
            <label className="label">關鍵字</label>
            <input className="input" placeholder="申請單號／姓名"
              value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          </div>
          <div>
            <label className="label">狀態</label>
            <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">全部</option>
              {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="label">起日</label>
            <input type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <label className="label">迄日</label>
            <input type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="self-end">
            <button className="btn btn-primary w-full" onClick={batchShip} disabled={selected.size === 0}>
              批次標記已出貨（{selected.size}）
            </button>
          </div>
        </div>
      </div>

      {/* 清單 */}
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="p-2"></th>
              <th className="p-2">申請單號</th>
              <th className="p-2">日期</th>
              <th className="p-2">類型</th>
              <th className="p-2">申請人</th>
              <th className="p-2">工地／部門</th>
              <th className="p-2">使用人</th>
              <th className="p-2">狀態</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {busy && <tr><td colSpan={9} className="p-6 text-center text-slate-400">載入中…</td></tr>}
            {!busy && list.length === 0 && <tr><td colSpan={9} className="p-6 text-center text-slate-400">無資料</td></tr>}
            {list.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="p-2">
                  <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggle(r.id)} />
                </td>
                <td className="p-2 font-mono">
                  <Link href={`/my-requests/${r.id}`} className="text-brand-600 hover:underline">{r.requestNo}</Link>
                </td>
                <td className="p-2">{new Date(r.submittedAt).toLocaleDateString("zh-TW")}</td>
                <td className="p-2">{TYPE_LABEL[r.type]}</td>
                <td className="p-2">{r.requesterName}</td>
                <td className="p-2">{r.siteOrDept}</td>
                <td className="p-2">{r.items.map((i: any) => i.userName).join("、")}</td>
                <td className="p-2"><span className={`badge ${STATUS_BADGE_CLASS[r.status]}`}>{STATUS_LABEL[r.status]}</span></td>
                <td className="p-2 text-right">
                  {r.status !== "SHIPPED" ? (
                    <button className="btn btn-outline text-xs" onClick={() => ship(r.id)}>標記已出貨</button>
                  ) : (
                    <span className="text-emerald-700 text-xs">已出貨 ✓</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
