"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TYPE_LABEL, STATUS_LABEL, STATUS_BADGE_CLASS, ACTION_LABEL, GENDER_LABEL } from "@/lib/labels";

const TYPE_PATH: Record<string, string> = {
  HELMET: "helmet",
  SHOES: "shoes",
  UNIFORM: "uniform",
};

type Item = any;
type Log = any;
type Attachment = any;
type Req = {
  id: string;
  requestNo: string;
  type: keyof typeof TYPE_LABEL;
  status: keyof typeof STATUS_LABEL;
  submittedAt: string | Date;
  shippedAt?: string | Date | null;
  rejectReason?: string | null;
  remark?: string | null;
  importNote?: string | null;
  requesterName: string;
  siteOrDept: string;
  items: Item[];
  attachments: Attachment[];
  logs: Log[];
};

export function RequestDetail({ request: r, viewerRole }: { request: Req; viewerRole: "ADMIN" | "REQUESTER" }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);

  async function ship() {
    if (!confirm(`確認將 ${r.requestNo} 標記為已出貨？`)) return;
    setBusy(true);
    const res = await fetch(`/api/requests/${r.id}/ship`, { method: "POST" });
    setBusy(false);
    if (res.ok) router.refresh();
    else alert("操作失敗");
  }
  async function unship() {
    if (!confirm("確認還原出貨？此動作將留稽核紀錄。")) return;
    setBusy(true);
    const res = await fetch(`/api/requests/${r.id}/unship`, { method: "POST" });
    setBusy(false);
    if (res.ok) router.refresh();
    else alert("操作失敗");
  }
  async function doReject() {
    if (!rejectReason.trim()) return;
    setBusy(true);
    const res = await fetch(`/api/requests/${r.id}/reject`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reason: rejectReason }),
    });
    setBusy(false);
    setShowReject(false);
    if (res.ok) router.refresh();
    else alert("操作失敗");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold font-mono">{r.requestNo}</h1>
        <span className={`badge ${STATUS_BADGE_CLASS[r.status]}`}>{STATUS_LABEL[r.status]}</span>
        <span className="text-slate-500 text-sm">{TYPE_LABEL[r.type]}</span>
      </div>

      <div className="card">
        <div className="card-header">基本資料</div>
        <div className="card-body grid md:grid-cols-2 gap-3 text-sm">
          <Field label="申請人">{r.requesterName}</Field>
          <Field label="工地／部門">{r.siteOrDept}</Field>
          <Field label="送出時間">{new Date(r.submittedAt).toLocaleString("zh-TW")}</Field>
          <Field label="出貨時間">{r.shippedAt ? new Date(r.shippedAt).toLocaleString("zh-TW") : "—"}</Field>
          {r.rejectReason && <Field label="退件原因">{r.rejectReason}</Field>}
          {r.remark && <Field label="備註">{r.remark}</Field>}
          {r.importNote && <Field label="匯入備註">{r.importNote}</Field>}
        </div>
      </div>

      <div className="card">
        <div className="card-header">明細（{r.items.length}）</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="p-2">使用人</th>
                <th className="p-2">規格</th>
                <th className="p-2">數量</th>
                <th className="p-2">領用方式</th>
                <th className="p-2">出貨日</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {r.items.map((it) => itemRows(r.type, it))}
            </tbody>
          </table>
        </div>
      </div>

      {r.attachments.length > 0 && (
        <div className="card">
          <div className="card-header">附件</div>
          <div className="card-body space-y-1 text-sm">
            {r.attachments.map((a: any) => (
              <a key={a.id} href={`/api/uploads/${a.id}`} target="_blank" className="block text-brand-600 hover:underline">
                📎 {a.fileName}
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">狀態變更紀錄</div>
        <div className="card-body text-sm">
          <ul className="space-y-1">
            {r.logs.map((l: any) => (
              <li key={l.id}>
                {new Date(l.changedAt).toLocaleString("zh-TW")} ·
                {" "}{l.fromStatus ? STATUS_LABEL[l.fromStatus as keyof typeof STATUS_LABEL] : "—"} → {STATUS_LABEL[l.toStatus as keyof typeof STATUS_LABEL]}
                {l.note ? ` · ${l.note}` : ""}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {viewerRole === "REQUESTER" && r.status === "REJECTED" && (
        <div className="flex justify-end">
          <Link className="btn btn-primary" href={`/apply/${TYPE_PATH[r.type]}?from=${r.id}`}>
            重新填寫並送出
          </Link>
        </div>
      )}

      {viewerRole === "ADMIN" && (
        <div className="flex gap-2 justify-end">
          {r.status !== "SHIPPED" && (
            <>
              <button className="btn btn-outline text-rose-600" disabled={busy} onClick={() => setShowReject(true)}>
                退件
              </button>
              <button className="btn btn-primary" disabled={busy} onClick={ship}>
                標記已出貨
              </button>
            </>
          )}
          {r.status === "SHIPPED" && (
            <button className="btn btn-outline" disabled={busy} onClick={unship}>
              還原出貨
            </button>
          )}
        </div>
      )}

      {showReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="card max-w-md w-full">
            <div className="card-header">退件</div>
            <div className="card-body">
              <label className="label">退件原因 *</label>
              <textarea className="textarea" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
            </div>
            <div className="px-5 py-3 border-t flex justify-end gap-2">
              <button className="btn btn-outline" onClick={() => setShowReject(false)}>取消</button>
              <button className="btn btn-danger" disabled={!rejectReason.trim() || busy} onClick={doReject}>
                確認退件
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-slate-500 text-xs">{label}</div>
      <div className="font-medium">{children}</div>
    </div>
  );
}

function itemRows(type: keyof typeof TYPE_LABEL, it: any) {
  if (type === "HELMET") {
    return (
      <tr key={it.id}>
        <td className="p-2">{it.userName}</td>
        <td className="p-2">血型 {it.bloodType}</td>
        <td className="p-2">1</td>
        <td className="p-2">—</td>
        <td className="p-2">{it.shippedAt ? new Date(it.shippedAt).toLocaleDateString("zh-TW") : "—"}</td>
      </tr>
    );
  }
  if (type === "SHOES") {
    return (
      <tr key={it.id}>
        <td className="p-2">{it.userName}</td>
        <td className="p-2">鞋號 {it.shoeSize} · {it.reason}</td>
        <td className="p-2">1</td>
        <td className="p-2">—</td>
        <td className="p-2">{it.shippedAt ? new Date(it.shippedAt).toLocaleDateString("zh-TW") : "—"}</td>
      </tr>
    );
  }
  // UNIFORM
  const rows: any[] = [];
  if (it.topSelected) {
    rows.push(
      <tr key={`${it.id}-top`}>
        <td className="p-2">{it.userName}（{GENDER_LABEL[it.gender as "MALE" | "FEMALE"]}）</td>
        <td className="p-2">上衣 {it.topSize}</td>
        <td className="p-2">{it.topQty}</td>
        <td className="p-2">{ACTION_LABEL[it.topAction as keyof typeof ACTION_LABEL]}</td>
        <td className="p-2">{it.shippedAt ? new Date(it.shippedAt).toLocaleDateString("zh-TW") : "—"}</td>
      </tr>
    );
  }
  if (it.pantsSelected) {
    rows.push(
      <tr key={`${it.id}-pants`}>
        <td className="p-2">{it.userName}（{GENDER_LABEL[it.gender as "MALE" | "FEMALE"]}）</td>
        <td className="p-2">折褲 腰{it.pantsWaist}/長{it.pantsLength}</td>
        <td className="p-2">{it.pantsQty}</td>
        <td className="p-2">{ACTION_LABEL[it.pantsAction as keyof typeof ACTION_LABEL]}</td>
        <td className="p-2">{it.shippedAt ? new Date(it.shippedAt).toLocaleDateString("zh-TW") : "—"}</td>
      </tr>
    );
  }
  return rows;
}
