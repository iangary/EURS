"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { AccLookupField } from "@/components/AccLookupField";
import { clearImportedData } from "@/lib/import-storage";
import { useT, useTPlural, useTEnum } from "@/i18n/client";

type Action = "NEW" | "REPLACE" | "PURCHASE";
type Item = {
  wearerAcc: string;
  userName: string;
  userDept: string;
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

const ACTION_VALUES: Action[] = ["NEW", "REPLACE", "PURCHASE"];

function blankItem(): Item {
  return {
    wearerAcc: "",
    userName: "",
    userDept: "",
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
  initial,
}: {
  topOptions: string[];
  waistOptions: number[];
  lengthOptions: number[];
  bankBranch: string;
  bankAccount: string;
  initial?: { remark: string; items: Omit<Item, "valid">[] };
}) {
  const router = useRouter();
  const t = useT();
  const tPlural = useTPlural();
  const tEnum = useTEnum();
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
  const [importedCount, setImportedCount] = useState(0);
  const [importedHasReplace, setImportedHasReplace] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initial) return;
    const raw = sessionStorage.getItem("eurs.import.uniform");
    if (!raw) return;
    try {
      const arr = JSON.parse(raw) as Array<any>;
      if (!Array.isArray(arr) || arr.length === 0) return;
      const next: Item[] = arr.map((it) => ({
        wearerAcc: it.wearerAcc ?? "",
        userName: it.userName ?? "",
        userDept: it.userDept ?? "",
        valid: !!it.wearerAcc,
        gender: it.gender === "FEMALE" ? "FEMALE" : "MALE",
        topSelected: !!it.topSelected,
        topSize: it.topSelected ? it.topSize ?? topOptions[0] : undefined,
        topQty: it.topSelected ? it.topQty ?? 1 : undefined,
        topAction: it.topSelected ? (it.topAction ?? "NEW") : undefined,
        pantsSelected: !!it.pantsSelected,
        pantsWaist: it.pantsSelected ? it.pantsWaist ?? waistOptions[0] : undefined,
        pantsLength: it.pantsSelected ? it.pantsLength ?? lengthOptions[0] : undefined,
        pantsQty: it.pantsSelected ? it.pantsQty ?? 1 : undefined,
        pantsAction: it.pantsSelected ? (it.pantsAction ?? "NEW") : undefined,
      }));
      setItems(next);
      setImportedCount(arr.length);
      setImportedHasReplace(
        next.some(
          (it) =>
            (it.topSelected && it.topAction === "REPLACE") ||
            (it.pantsSelected && it.pantsAction === "REPLACE")
        )
      );
    } catch {
      // ignore malformed payload
    }
  }, [topOptions, waistOptions, lengthOptions, initial]);

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
      alert(d.error ?? t("common.uploadFailed"));
      return;
    }
    const d = await res.json();
    setAttachments((xs) => [...xs, { id: d.id, fileName: d.fileName }]);
  }

  async function trySubmit() {
    setError(null);
    if (!items.every((it) => it.valid && it.wearerAcc && it.userName)) {
      setError(t("form.error.lookupAll"));
      return;
    }
    const ok = items.every((it) => it.topSelected || it.pantsSelected);
    if (!ok) {
      setError(t("uniform.error.atLeastOne"));
      return;
    }
    if (hasReplace && attachments.length === 0) {
      setError(t("uniform.error.replaceAttachment"));
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
        remark,
        items,
        attachmentIds: attachments.map((a) => a.id),
      }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? t("form.error.submit"));
      return;
    }
    clearImportedData("uniform");
    router.push("/my-requests");
  }

  return (
    <div className="space-y-4">
      {importedCount > 0 && (
        <div className="notice border-emerald-300 bg-emerald-50 text-emerald-900">
          {tPlural("apply.notice.imported", importedCount)}
          {importedHasReplace && (
            <span className="ml-1">
              {t("apply.notice.importedReplace")}
            </span>
          )}
        </div>
      )}
      <div className="bg-sky-50 border-2 border-sky-200 rounded-xl">
        <div className="px-5 py-3 border-b border-sky-200 font-semibold text-sky-900">{t("uniform.section.title")}</div>
        <div className="p-5 space-y-5">
          {items.map((it, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 space-y-4">
              <div className="grid md:grid-cols-[1fr_180px_80px] gap-3 items-end">
                <AccLookupField
                  acc={it.wearerAcc}
                  userName={it.userName}
                  userDept={it.userDept}
                  valid={it.valid}
                  onChange={(next) =>
                    update(i, {
                      wearerAcc: next.acc,
                      userName: next.userName,
                      userDept: next.userDept,
                      valid: next.valid,
                    })
                  }
                />
                <div>
                  <label className="label">{t("uniform.field.gender")}</label>
                  <div className="flex gap-2">
                    <button
                      className={cn("size-pill flex-1", it.gender === "MALE" && "size-pill-active")}
                      onClick={() => update(i, { gender: "MALE" })}
                    >
                      {tEnum.gender("MALE")}
                    </button>
                    <button
                      className={cn("size-pill flex-1", it.gender === "FEMALE" && "size-pill-active")}
                      onClick={() => update(i, { gender: "FEMALE" })}
                    >
                      {tEnum.gender("FEMALE")}
                    </button>
                  </div>
                </div>
                <button
                  className="btn btn-danger"
                  onClick={() => remove(i)}
                  disabled={items.length === 1}
                >
                  {t("form.btn.delete")}
                </button>
              </div>

              <SubCard
                title={t("uniform.section.top")}
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
                  <label className="label">{t("uniform.field.size")}</label>
                  <select
                    className="select"
                    value={it.topSize ?? topOptions[0]}
                    onChange={(e) => update(i, { topSize: e.target.value })}
                  >
                    {topOptions.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">{t("uniform.field.qty")}</label>
                    <input
                      type="number" min={1} max={5}
                      className="input"
                      value={it.topQty ?? 1}
                      onChange={(e) => update(i, { topQty: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="label">{t("uniform.field.action")}</label>
                    <ActionRadio
                      value={it.topAction ?? "NEW"}
                      onChange={(v) => update(i, { topAction: v })}
                    />
                  </div>
                </div>
              </SubCard>

              <SubCard
                title={t("uniform.section.pants")}
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
                    <label className="label">{t("uniform.field.waist")}</label>
                    <select
                      className="select"
                      value={it.pantsWaist ?? waistOptions[0]}
                      onChange={(e) => update(i, { pantsWaist: Number(e.target.value) })}
                    >
                      {waistOptions.map((w) => <option key={w} value={w}>{w}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">{t("uniform.field.length")}</label>
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
                    <label className="label">{t("uniform.field.qty")}</label>
                    <input
                      type="number" min={1} max={5}
                      className="input"
                      value={it.pantsQty ?? 1}
                      onChange={(e) => update(i, { pantsQty: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="label">{t("uniform.field.action")}</label>
                    <ActionRadio
                      value={it.pantsAction ?? "NEW"}
                      onChange={(v) => update(i, { pantsAction: v })}
                    />
                  </div>
                </div>
              </SubCard>
            </div>
          ))}
          <button className="btn btn-outline" onClick={add}>{t("form.btn.addUser")}</button>
        </div>
      </div>

      {hasReplace && (
        <div className="notice border-rose-300 bg-rose-50 text-rose-900">
          <div className="font-medium mb-2">{t("uniform.replace.title")}</div>
          <input ref={fileRef} type="file" className="hidden" accept=".jpg,.jpeg,.png,.pdf"
            onChange={(e) => e.target.files?.[0] && uploadAtt(e.target.files[0])} />
          <button className="btn btn-outline" onClick={() => fileRef.current?.click()}>{t("uniform.replace.choose")}</button>
          <ul className="mt-2 text-sm">
            {attachments.map((a) => (
              <li key={a.id}>📎 {a.fileName}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="card">
        <div className="card-header">{t("form.section.remark")}</div>
        <div className="card-body">
          <textarea className="textarea min-h-24" value={remark} onChange={(e) => setRemark(e.target.value)} />
        </div>
      </div>

      <div className="notice">
        <div>{t("uniform.notice.purchase")}</div>
        <div className="mt-1">{t("uniform.notice.bank", { branch: bankBranch, account: bankAccount })}</div>
      </div>

      {error && <div className="text-sm text-rose-600">{error}</div>}

      <div className="flex justify-end">
        <button className="btn btn-primary" disabled={submitting} onClick={trySubmit}>
          {submitting ? t("form.btn.submitting") : t("form.btn.submit")}
        </button>
      </div>

      {showPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="card max-w-md w-full">
            <div className="card-header">{t("uniform.purchase.title")}</div>
            <div className="card-body space-y-3 text-sm">
              <p>{t("uniform.purchase.body")}</p>
              <table className="w-full">
                <tbody>
                  <tr><td className="py-1 text-slate-500">{t("uniform.purchase.bank")}</td><td className="font-medium">{bankBranch}</td></tr>
                  <tr><td className="py-1 text-slate-500">{t("uniform.purchase.account")}</td><td className="font-medium">{bankAccount}</td></tr>
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 border-t flex justify-end gap-2">
              <button className="btn btn-outline" onClick={() => setShowPurchase(false)}>{t("common.cancel")}</button>
              <button className="btn btn-primary" onClick={doSubmit}>{t("uniform.purchase.confirm")}</button>
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
  const tEnum = useTEnum();
  return (
    <div className="flex gap-2">
      {ACTION_VALUES.map((v) => (
        <button
          key={v}
          className={cn("size-pill flex-1", value === v && "size-pill-active")}
          onClick={() => onChange(v)}
        >
          {tEnum.action(v)}
        </button>
      ))}
    </div>
  );
}
