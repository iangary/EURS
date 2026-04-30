"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TYPE_LABEL, STATUS_LABEL, STATUS_BADGE_CLASS } from "@/lib/labels";
import { useT, useFormat } from "@/i18n/client";

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
  const t = useT();
  const fmt = useFormat();
  const [busy, setBusy] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);

  async function ship() {
    if (!confirm(t("detail.confirm.ship", { requestNo: r.requestNo }))) return;
    setBusy(true);
    const res = await fetch(`/api/requests/${r.id}/ship`, { method: "POST" });
    setBusy(false);
    if (res.ok) router.refresh();
    else alert(t("common.actionFailed"));
  }
  async function unship() {
    if (!confirm(t("detail.confirm.unship"))) return;
    setBusy(true);
    const res = await fetch(`/api/requests/${r.id}/unship`, { method: "POST" });
    setBusy(false);
    if (res.ok) router.refresh();
    else alert(t("common.actionFailed"));
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
    else alert(t("common.actionFailed"));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold font-mono">{r.requestNo}</h1>
        <span className={`badge ${STATUS_BADGE_CLASS[r.status]}`}>{t(`status.${r.status}` as const)}</span>
        <span className="text-slate-500 text-sm">{t(`type.${r.type}` as const)}</span>
      </div>

      <div className="card">
        <div className="card-header">{t("detail.section.basic")}</div>
        <div className="card-body grid md:grid-cols-2 gap-3 text-sm">
          <Field label={t("detail.field.requester")}>{r.requesterName}</Field>
          <Field label={t("detail.field.siteOrDept")}>{r.siteOrDept}</Field>
          <Field label={t("detail.field.submittedAt")}>{fmt.dateTime(r.submittedAt)}</Field>
          <Field label={t("detail.field.shippedTime")}>{r.shippedAt ? fmt.dateTime(r.shippedAt) : "—"}</Field>
          {r.rejectReason && <Field label={t("detail.field.rejectReason")}>{r.rejectReason}</Field>}
          {r.remark && <Field label={t("detail.field.remark")}>{r.remark}</Field>}
          {r.importNote && <Field label={t("detail.field.importNote")}>{r.importNote}</Field>}
        </div>
      </div>

      <div className="card">
        <div className="card-header">{t("detail.section.items")}（{r.items.length}）</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="p-2">{t("detail.field.user")}</th>
                <th className="p-2">{t("detail.field.siteOrDept")}</th>
                <th className="p-2">{t("detail.field.deptCode")}</th>
                <th className="p-2">{t("detail.field.spec")}</th>
                <th className="p-2">{t("detail.field.qty")}</th>
                <th className="p-2">{t("detail.field.action")}</th>
                <th className="p-2">{t("detail.field.shippedAt")}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {r.items.map((it) => itemRows(t, fmt, r.type, it, viewerRole))}
            </tbody>
          </table>
        </div>
      </div>

      {r.attachments.length > 0 && (
        <div className="card">
          <div className="card-header">{t("detail.section.attachments")}</div>
          <div className="card-body space-y-3 text-sm">
            {r.attachments.map((a: any) => (
              <AttachmentItem key={a.id} att={a} />
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">{t("detail.section.logs")}</div>
        <div className="card-body text-sm">
          <ul className="space-y-1">
            {r.logs.map((l: any) => (
              <li key={l.id}>
                {fmt.dateTime(l.changedAt)} ·
                {" "}{l.fromStatus ? t(`status.${l.fromStatus as keyof typeof STATUS_LABEL}`) : "—"} → {t(`status.${l.toStatus as keyof typeof STATUS_LABEL}`)}
                {l.note ? ` · ${l.note}` : ""}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {viewerRole === "REQUESTER" && r.status === "REJECTED" && (
        <div className="flex justify-end">
          <Link className="btn btn-primary" href={`/apply/${TYPE_PATH[r.type]}?from=${r.id}`}>
            {t("detail.btn.resubmit")}
          </Link>
        </div>
      )}

      {viewerRole === "ADMIN" && (
        <div className="flex gap-2 justify-end">
          {r.status !== "SHIPPED" && (
            <>
              <button className="btn btn-outline text-rose-600" disabled={busy} onClick={() => setShowReject(true)}>
                {t("detail.btn.reject")}
              </button>
              <button className="btn btn-primary" disabled={busy} onClick={ship}>
                {t("detail.btn.markShipped")}
              </button>
            </>
          )}
          {r.status === "SHIPPED" && (
            <button className="btn btn-outline" disabled={busy} onClick={unship}>
              {t("detail.btn.unship")}
            </button>
          )}
        </div>
      )}

      {showReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="card max-w-md w-full">
            <div className="card-header">{t("detail.btn.reject")}</div>
            <div className="card-body">
              <label className="label">{t("detail.reject.label")}</label>
              <textarea className="textarea" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
            </div>
            <div className="px-5 py-3 border-t flex justify-end gap-2">
              <button className="btn btn-outline" onClick={() => setShowReject(false)}>{t("common.cancel")}</button>
              <button className="btn btn-danger" disabled={!rejectReason.trim() || busy} onClick={doReject}>
                {t("detail.btn.confirmReject")}
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

type TFn = ReturnType<typeof useT>;
type Fmt = ReturnType<typeof useFormat>;

function itemRows(t: TFn, fmt: Fmt, type: keyof typeof TYPE_LABEL, it: any, viewerRole: "ADMIN" | "REQUESTER") {
  const deptCodeCell = <DeptCodeCell itemId={it.id} initial={it.deptCode ?? ""} editable={viewerRole === "ADMIN"} />;
  if (type === "HELMET") {
    return (
      <tr key={it.id}>
        <td className="p-2">{it.userName}</td>
        <td className="p-2">{it.userDept || "—"}</td>
        <td className="p-2">{deptCodeCell}</td>
        <td className="p-2">{t("detail.helmet.bloodType", { value: it.bloodType })}</td>
        <td className="p-2">1</td>
        <td className="p-2">—</td>
        <td className="p-2">{it.shippedAt ? fmt.date(it.shippedAt) : "—"}</td>
      </tr>
    );
  }
  if (type === "SHOES") {
    return (
      <tr key={it.id}>
        <td className="p-2">{it.userName}</td>
        <td className="p-2">{it.userDept || "—"}</td>
        <td className="p-2">{deptCodeCell}</td>
        <td className="p-2">{t("detail.shoes.size", { size: it.shoeSize, reason: it.reason })}</td>
        <td className="p-2">1</td>
        <td className="p-2">—</td>
        <td className="p-2">{it.shippedAt ? fmt.date(it.shippedAt) : "—"}</td>
      </tr>
    );
  }
  // UNIFORM
  const rows: any[] = [];
  if (it.topSelected) {
    rows.push(
      <tr key={`${it.id}-top`}>
        <td className="p-2">{t("detail.userWithGender", { name: it.userName, gender: t(`gender.${it.gender as "MALE" | "FEMALE"}`) })}</td>
        <td className="p-2">{it.userDept || "—"}</td>
        <td className="p-2">{deptCodeCell}</td>
        <td className="p-2">{t("detail.uniform.top", { size: it.topSize })}</td>
        <td className="p-2">{it.topQty}</td>
        <td className="p-2">{t(`action.${it.topAction as "NEW" | "REPLACE" | "PURCHASE"}`)}</td>
        <td className="p-2">{it.shippedAt ? fmt.date(it.shippedAt) : "—"}</td>
      </tr>
    );
  }
  if (it.pantsSelected) {
    rows.push(
      <tr key={`${it.id}-pants`}>
        <td className="p-2">{t("detail.userWithGender", { name: it.userName, gender: t(`gender.${it.gender as "MALE" | "FEMALE"}`) })}</td>
        <td className="p-2">{it.userDept || "—"}</td>
        <td className="p-2">{deptCodeCell}</td>
        <td className="p-2">{t("detail.uniform.pants", { waist: it.pantsWaist, length: it.pantsLength })}</td>
        <td className="p-2">{it.pantsQty}</td>
        <td className="p-2">{t(`action.${it.pantsAction as "NEW" | "REPLACE" | "PURCHASE"}`)}</td>
        <td className="p-2">{it.shippedAt ? fmt.date(it.shippedAt) : "—"}</td>
      </tr>
    );
  }
  return rows;
}

const IMAGE_EXT = /\.(jpe?g|png|gif|webp)$/i;

function AttachmentItem({ att }: { att: { id: string; fileName: string } }) {
  const isImage = IMAGE_EXT.test(att.fileName);
  const href = `/api/uploads/${att.id}`;
  if (isImage) {
    return (
      <div>
        <a href={href} target="_blank" className="inline-block">
          <img
            src={href}
            alt={att.fileName}
            className="max-w-full max-h-96 rounded border border-slate-200"
          />
        </a>
        <div className="mt-1 text-xs text-slate-500">{att.fileName}</div>
      </div>
    );
  }
  return (
    <a href={href} target="_blank" className="block text-brand-600 hover:underline">
      📎 {att.fileName}
    </a>
  );
}

function DeptCodeCell({ itemId, initial, editable }: { itemId: string; initial: string; editable: boolean }) {
  const t = useT();
  const [val, setVal] = useState(initial);
  const [baseline, setBaseline] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  if (!editable) {
    return <span>{initial || "—"}</span>;
  }

  async function save() {
    if (val === baseline) return;
    setSaving(true);
    const res = await fetch(`/api/admin/requests/items/${itemId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ deptCode: val }),
    });
    setSaving(false);
    if (res.ok) {
      setBaseline(val);
      setSavedAt(Date.now());
    } else {
      alert(t("common.updateFailed"));
      setVal(baseline);
    }
  }

  return (
    <div className="flex items-center gap-1">
      <input
        type="text"
        className="input w-24 px-2 py-1"
        value={val}
        placeholder="—"
        disabled={saving}
        onChange={(e) => setVal(e.target.value)}
        onBlur={save}
      />
      {saving && <span className="text-xs text-slate-400">{t("common.saving")}</span>}
      {savedAt && !saving && val === baseline && <span className="text-xs text-emerald-600">✓</span>}
    </div>
  );
}
