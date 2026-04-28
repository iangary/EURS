"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { TYPE_LABEL, STATUS_LABEL, STATUS_BADGE_CLASS } from "@/lib/labels";

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

export function AdminRequestList() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [list, setList] = useState<Req[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const [fNo, setFNo] = useState("");
  const [fType, setFType] = useState<string>("");
  const [fRequester, setFRequester] = useState("");
  const [fDept, setFDept] = useState("");
  const [fUser, setFUser] = useState("");
  const [fStatus, setFStatus] = useState<string>("");

  const params = useMemo(() => {
    const sp = new URLSearchParams();
    if (from) sp.set("from", from);
    if (to) sp.set("to", to);
    return sp.toString();
  }, [from, to]);

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

  const filtered = useMemo(() => {
    const norm = (s: string) => s.toLowerCase().trim();
    return list.filter((r) => {
      if (fNo && !norm(r.requestNo).includes(norm(fNo))) return false;
      if (fType && r.type !== fType) return false;
      if (fRequester && !norm(r.requesterName).includes(norm(fRequester))) return false;
      if (fDept && !norm(r.siteOrDept).includes(norm(fDept))) return false;
      if (fStatus && r.status !== fStatus) return false;
      if (fUser) {
        const users = r.items.map((i: any) => i.userName || "").join("、");
        if (!norm(users).includes(norm(fUser))) return false;
      }
      return true;
    });
  }, [list, fNo, fType, fRequester, fDept, fUser, fStatus]);

  return (
    <div className="space-y-3">
      {/* 日期區間 + 批次動作 */}
      <div className="card">
        <div className="card-body grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
          <div>
            <label className="label">起日</label>
            <input type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <label className="label">迄日</label>
            <input type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="md:col-start-5 self-end">
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
            <tr className="bg-white border-t">
              <th className="p-1"></th>
              <th className="p-1">
                <input className="input !py-1 !px-2 text-xs" placeholder="搜尋…"
                  value={fNo} onChange={(e) => setFNo(e.target.value)} />
              </th>
              <th className="p-1"></th>
              <th className="p-1">
                <select className="select !py-1 !px-2 text-xs" value={fType} onChange={(e) => setFType(e.target.value)}>
                  <option value="">全部</option>
                  {Object.entries(TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </th>
              <th className="p-1">
                <input className="input !py-1 !px-2 text-xs" placeholder="搜尋…"
                  value={fRequester} onChange={(e) => setFRequester(e.target.value)} />
              </th>
              <th className="p-1">
                <input className="input !py-1 !px-2 text-xs" placeholder="搜尋…"
                  value={fDept} onChange={(e) => setFDept(e.target.value)} />
              </th>
              <th className="p-1">
                <input className="input !py-1 !px-2 text-xs" placeholder="搜尋…"
                  value={fUser} onChange={(e) => setFUser(e.target.value)} />
              </th>
              <th className="p-1">
                <select className="select !py-1 !px-2 text-xs" value={fStatus} onChange={(e) => setFStatus(e.target.value)}>
                  <option value="">全部</option>
                  {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </th>
              <th className="p-1"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {busy && <tr><td colSpan={9} className="p-6 text-center text-slate-400">載入中…</td></tr>}
            {!busy && filtered.length === 0 && <tr><td colSpan={9} className="p-6 text-center text-slate-400">無資料</td></tr>}
            {filtered.map((r) => (
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
