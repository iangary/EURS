"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BulkImport } from "@/components/BulkImport";
import { AccLookupField } from "@/components/AccLookupField";

type Item = {
  wearerAcc: string;
  userName: string;
  valid: boolean;
  shoeSize: number;
  reason: string;
};

export function ShoesForm({
  sizeOptions,
  defaultDept,
  requesterName,
  requesterId,
  initial,
}: {
  sizeOptions: number[];
  defaultDept: string;
  requesterName: string;
  requesterId: string;
  initial?: { dept: string; remark: string; items: { wearerAcc: string; userName: string; shoeSize: number; reason: string }[] };
}) {
  const router = useRouter();
  const [dept, setDept] = useState(initial?.dept ?? defaultDept);
  const [remark, setRemark] = useState(initial?.remark ?? "");
  const [items, setItems] = useState<Item[]>(
    initial && initial.items.length > 0
      ? initial.items.map((it) => ({ ...it, valid: !!it.wearerAcc }))
      : [
          {
            wearerAcc: "",
            userName: "",
            valid: false,
            shoeSize: sizeOptions[Math.floor(sizeOptions.length / 2)] ?? 42,
            reason: "",
          },
        ]
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(i: number, patch: Partial<Item>) {
    setItems((xs) => xs.map((it, k) => (k === i ? { ...it, ...patch } : it)));
  }
  function add() {
    setItems((xs) => [
      ...xs,
      { wearerAcc: "", userName: "", valid: false, shoeSize: 42, reason: "" },
    ]);
  }
  function remove(i: number) {
    setItems((xs) => xs.filter((_, k) => k !== i));
  }

  async function submit() {
    setError(null);
    if (!items.every((it) => it.valid && it.wearerAcc && it.userName)) {
      setError("請確認所有使用人工號皆已查詢成功");
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/requests", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        type: "SHOES",
        siteOrDept: dept,
        remark,
        items: items.map((it) => ({
          wearerAcc: it.wearerAcc,
          userName: it.userName,
          shoeSize: it.shoeSize,
          reason: it.reason,
        })),
      }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "送出失敗");
      return;
    }
    router.push("/my-requests");
  }

  return (
    <div className="space-y-4">
      <BulkImport
        type="shoes"
        onApply={(rows) =>
          setItems(
            rows.map((r: any) => ({
              wearerAcc: r.wearerAcc,
              userName: r.userName,
              valid: true,
              shoeSize: Number(r.shoeSize),
              reason: r.reason ?? "",
            }))
          )
        }
      />

      <div className="card">
        <div className="card-header">基本資料</div>
        <div className="card-body grid md:grid-cols-2 gap-4">
          <div>
            <label className="label">申請人</label>
            <input className="input bg-slate-50" disabled value={`${requesterName}（${requesterId}）`} />
          </div>
          <div>
            <label className="label">所屬工地／部門 *</label>
            <input className="input" value={dept} onChange={(e) => setDept(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header flex items-center justify-between">
          <span>使用人清單</span>
          <button className="btn btn-outline text-xs" onClick={add}>＋ 新增欄位</button>
        </div>
        <div className="card-body space-y-4">
          {items.map((it, i) => (
            <div key={i} className="grid md:grid-cols-[1fr_140px_100px_2fr_60px] gap-2 items-end">
              <AccLookupField
                acc={it.wearerAcc}
                userName={it.userName}
                valid={it.valid}
                onChange={(next) =>
                  update(i, { wearerAcc: next.acc, userName: next.userName, valid: next.valid })
                }
              />
              <div>
                <label className="label">鞋號 *</label>
                <select
                  className="select"
                  value={it.shoeSize}
                  onChange={(e) => update(i, { shoeSize: Number(e.target.value) })}
                >
                  {sizeOptions.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">數量</label>
                <input className="input bg-slate-50" disabled value={1} />
              </div>
              <div>
                <label className="label">說明原因 *</label>
                <input
                  className="input"
                  value={it.reason}
                  onChange={(e) => update(i, { reason: e.target.value })}
                  placeholder="例：新進人員、舊鞋破損"
                />
              </div>
              <button className="btn btn-ghost text-rose-600" onClick={() => remove(i)} disabled={items.length === 1}>
                刪除
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-header">備註</div>
        <div className="card-body">
          <textarea className="textarea min-h-24" value={remark} onChange={(e) => setRemark(e.target.value)} />
        </div>
      </div>

      {error && <div className="text-sm text-rose-600">{error}</div>}

      <div className="flex justify-end">
        <button className="btn btn-primary" disabled={submitting} onClick={submit}>
          {submitting ? "送出中…" : "送出申請"}
        </button>
      </div>
    </div>
  );
}
