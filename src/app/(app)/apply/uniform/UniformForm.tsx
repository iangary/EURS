"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { BulkImport } from "@/components/BulkImport";
import { AccLookupField } from "@/components/AccLookupField";

type Action = "NEW" | "REPLACE" | "PURCHASE";
type Item = {
  wearerAcc: string;
  userName: string;
  valid: boolean;
  gender: "MALE" | "FEMALE";
  topSelected: boolean;
  topSize?: string;
  topQty?: number;
  topAction?: Action;
  pantsSelected: boolean;
  pantsWaist?: number;
  pantsLength?: number;
  pantsQty?: number;
  pantsAction?: Action;
};

const ACTION_OPTIONS: { value: Action; label: string }[] = [
  { value: "NEW", label: "新領" },
  { value: "REPLACE", label: "更換" },
  { value: "PURCHASE", label: "自購" },
];

function blankItem(): Item {
  return {
    wearerAcc: "",
    userName: "",
    valid: false,
    gender: "MALE",
    topSelected: false,
    pantsSelected: false,
  };
}

export function UniformForm({
  topOptions,
  waistOptions,
  lengthOptions,
  bankBranch,
  bankAccount,
  defaultDept,
  requesterName,
  requesterId,
  initial,
}: {
  topOptions: string[];
  waistOptions: number[];
  lengthOptions: number[];
  bankBranch: string;
  bankAccount: string;
  defaultDept: string;
  requesterName: string;
  requesterId: string;
  initial?: { dept: string; remark: string; items: Omit<Item, "valid">[] };
}) {
  const router = useRouter();
  const [dept, setDept] = useState(initial?.dept ?? defaultDept);
  const [remark, setRemark] = useState(initial?.remark ?? "");
  const [items, setItems] = useState<Item[]>(
    initial && initial.items.length > 0
      ? initial.items.map((it) => ({ ...it, valid: !!it.wearerAcc }))
      : [blankItem()]
  );
  const [attachments, setAttachments] = useState<{ id: string; fileName: string }[]>([]);
  const [showPurchase, setShowPurchase] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const hasReplace = useMemo(
    () =>
      items.some(
        (it) =>
          (it.topSelected && it.topAction === "REPLACE") ||
          (it.pantsSelected && it.pantsAction === "REPLACE")
      ),
    [items]
  );
  const hasPurchase = useMemo(
    () =>
      items.some(
        (it) =>
          (it.topSelected && it.topAction === "PURCHASE") ||
          (it.pantsSelected && it.pantsAction === "PURCHASE")
      ),
    [items]
  );

  function update(i: number, patch: Partial<Item>) {
    setItems((xs) => xs.map((it, k) => (k === i ? { ...it, ...patch } : it)));
  }
  function add() {
    setItems((xs) => [...xs, blankItem()]);
  }
  function remove(i: number) {
    setItems((xs) => xs.filter((_, k) => k !== i));
  }

  async function uploadAtt(f: File) {
    const fd = new FormData();
    fd.append("file", f);
    const res = await fetch("/api/uploads", { method: "POST", body: fd });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      alert(d.error ?? "上傳失敗");
      return;
    }
    const d = await res.json();
    setAttachments((xs) => [...xs, { id: d.id, fileName: d.fileName }]);
  }

  async function trySubmit() {
    setError(null);
    if (!items.every((it) => it.valid && it.wearerAcc && it.userName)) {
      setError("請確認所有使用人工號皆已查詢成功");
      return;
    }
    const ok = items.every((it) => it.topSelected || it.pantsSelected);
    if (!ok) {
      setError("每位使用人上衣／折褲至少需勾選一項");
      return;
    }
    if (hasReplace && attachments.length === 0) {
      setError("含「更換」項目，請至少上傳一個附件");
      return;
    }
    if (hasPurchase) {
      setShowPurchase(true);
      return;
    }
    await doSubmit();
  }

  async function doSubmit() {
    setSubmitting(true);
    setError(null);
    setShowPurchase(false);
    const res = await fetch("/api/requests", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        type: "UNIFORM",
        siteOrDept: dept,
        remark,
        items,
        attachmentIds: attachments.map((a) => a.id),
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
        type="uniform"
        onApply={(rows) =>
          setItems(
            rows.map((r: any) => ({
              wearerAcc: r.wearerAcc,
              userName: r.userName,
              valid: true,
              gender: r.gender,
              topSelected: r.topSelected,
              topSize: r.topSize ?? undefined,
              topQty: r.topQty ?? undefined,
              topAction: r.topAction ?? undefined,
              pantsSelected: r.pantsSelected,
              pantsWaist: r.pantsWaist ?? undefined,
              pantsLength: r.pantsLength ?? undefined,
              pantsQty: r.pantsQty ?? undefined,
              pantsAction: r.pantsAction ?? undefined,
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

      {/* 制服主分類卡片 */}
      <div className="bg-sky-50 border-2 border-sky-200 rounded-xl">
        <div className="px-5 py-3 border-b border-sky-200 font-semibold text-sky-900">制服 領用項目</div>
        <div className="p-5 space-y-5">
          {items.map((it, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 space-y-4">
              <div className="grid md:grid-cols-[1fr_180px_60px] gap-3 items-end">
                <AccLookupField
                  acc={it.wearerAcc}
                  userName={it.userName}
                  valid={it.valid}
                  onChange={(next) =>
                    update(i, { wearerAcc: next.acc, userName: next.userName, valid: next.valid })
                  }
                />
                <div>
                  <label className="label">性別（男／女款）*</label>
                  <div className="flex gap-2">
                    <button
                      className={cn("size-pill flex-1", it.gender === "MALE" && "size-pill-active")}
                      onClick={() => update(i, { gender: "MALE" })}
                    >
                      男
                    </button>
                    <button
                      className={cn("size-pill flex-1", it.gender === "FEMALE" && "size-pill-active")}
                      onClick={() => update(i, { gender: "FEMALE" })}
                    >
                      女
                    </button>
                  </div>
                </div>
                <button className="btn btn-ghost text-rose-600" onClick={() => remove(i)} disabled={items.length === 1}>
                  刪除
                </button>
              </div>

              {/* 上衣子卡 */}
              <SubCard
                title="上衣"
                checked={it.topSelected}
                onToggle={(v) =>
                  update(i, {
                    topSelected: v,
                    topSize: v ? it.topSize ?? topOptions[0] : undefined,
                    topQty: v ? it.topQty ?? 1 : undefined,
                    topAction: v ? it.topAction ?? "NEW" : undefined,
                  })
                }
              >
                <div>
                  <label className="label">尺寸 *</label>
                  <div className="flex flex-wrap gap-2">
                    {topOptions.map((s) => (
                      <button
                        key={s}
                        className={cn("size-pill", it.topSize === s && "size-pill-active")}
                        onClick={() => update(i, { topSize: s })}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">數量 *（1–5）</label>
                    <input
                      type="number" min={1} max={5}
                      className="input"
                      value={it.topQty ?? 1}
                      onChange={(e) => update(i, { topQty: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="label">領用方式 *</label>
                    <ActionRadio
                      value={it.topAction ?? "NEW"}
                      onChange={(v) => update(i, { topAction: v })}
                    />
                  </div>
                </div>
              </SubCard>

              {/* 折褲子卡 */}
              <SubCard
                title="折褲"
                checked={it.pantsSelected}
                onToggle={(v) =>
                  update(i, {
                    pantsSelected: v,
                    pantsWaist: v ? it.pantsWaist ?? waistOptions[0] : undefined,
                    pantsLength: v ? it.pantsLength ?? lengthOptions[0] : undefined,
                    pantsQty: v ? it.pantsQty ?? 1 : undefined,
                    pantsAction: v ? it.pantsAction ?? "NEW" : undefined,
                  })
                }
              >
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">腰圍 *</label>
                    <select
                      className="select"
                      value={it.pantsWaist ?? waistOptions[0]}
                      onChange={(e) => update(i, { pantsWaist: Number(e.target.value) })}
                    >
                      {waistOptions.map((w) => <option key={w} value={w}>{w}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">褲長 *</label>
                    <select
                      className="select"
                      value={it.pantsLength ?? lengthOptions[0]}
                      onChange={(e) => update(i, { pantsLength: Number(e.target.value) })}
                    >
                      {lengthOptions.map((l) => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">數量 *（1–5）</label>
                    <input
                      type="number" min={1} max={5}
                      className="input"
                      value={it.pantsQty ?? 1}
                      onChange={(e) => update(i, { pantsQty: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="label">領用方式 *</label>
                    <ActionRadio
                      value={it.pantsAction ?? "NEW"}
                      onChange={(v) => update(i, { pantsAction: v })}
                    />
                  </div>
                </div>
              </SubCard>
            </div>
          ))}
          <button className="btn btn-outline" onClick={add}>＋ 新增使用人</button>
        </div>
      </div>

      {/* 黃色提示區（更換需附件） */}
      {hasReplace && (
        <div className="notice border-rose-300 bg-rose-50 text-rose-900">
          <div className="font-medium mb-2">含「更換」項目，請上傳舊衣照片（必填）</div>
          <input ref={fileRef} type="file" className="hidden" accept=".jpg,.jpeg,.png,.pdf"
            onChange={(e) => e.target.files?.[0] && uploadAtt(e.target.files[0])} />
          <button className="btn btn-outline" onClick={() => fileRef.current?.click()}>選擇檔案</button>
          <ul className="mt-2 text-sm">
            {attachments.map((a) => (
              <li key={a.id}>📎 {a.fileName}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="card">
        <div className="card-header">備註</div>
        <div className="card-body">
          <textarea className="textarea min-h-24" value={remark} onChange={(e) => setRemark(e.target.value)} />
        </div>
      </div>

      <div className="notice">
        <div>說明：選擇【更換】需上傳舊品照片附件；選擇【自購】請與總務聯繫取得購買金額。</div>
        <div className="mt-1">匯款帳號：{bankBranch} {bankAccount}</div>
      </div>

      {error && <div className="text-sm text-rose-600">{error}</div>}

      <div className="flex justify-end">
        <button className="btn btn-primary" disabled={submitting} onClick={trySubmit}>
          {submitting ? "送出中…" : "送出申請"}
        </button>
      </div>

      {/* 自購提示視窗 */}
      {showPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="card max-w-md w-full">
            <div className="card-header">自購提醒</div>
            <div className="card-body space-y-3 text-sm">
              <p>本次申請含「自購」項目，請與總務聯繫取得購買金額。</p>
              <table className="w-full">
                <tbody>
                  <tr><td className="py-1 text-slate-500">匯款銀行／分行</td><td className="font-medium">{bankBranch}</td></tr>
                  <tr><td className="py-1 text-slate-500">匯款帳號</td><td className="font-medium">{bankAccount}</td></tr>
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 border-t flex justify-end gap-2">
              <button className="btn btn-outline" onClick={() => setShowPurchase(false)}>取消</button>
              <button className="btn btn-primary" onClick={doSubmit}>我已知悉並確認送出</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SubCard({
  title,
  checked,
  onToggle,
  children,
}: {
  title: string;
  checked: boolean;
  onToggle: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("rounded-lg border p-3", checked ? "border-brand-300 bg-brand-50/40" : "border-slate-200 bg-slate-50")}>
      <label className="flex items-center gap-2 font-medium">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onToggle(e.target.checked)}
        />
        {title}
      </label>
      {checked && <div className="mt-3 space-y-3">{children}</div>}
    </div>
  );
}

function ActionRadio({ value, onChange }: { value: Action; onChange: (v: Action) => void }) {
  return (
    <div className="flex gap-2">
      {ACTION_OPTIONS.map((o) => (
        <button
          key={o.value}
          className={cn("size-pill flex-1", value === o.value && "size-pill-active")}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
