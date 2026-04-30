"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AccLookupField } from "@/components/AccLookupField";
import { FloatingInput, FloatingSelect } from "@/components/FloatingField";
import { clearImportedData } from "@/lib/import-storage";
import { useT, useTPlural, useFormat } from "@/i18n/client";

type Item = {
  wearerAcc: string;
  userName: string;
  userDept: string;
  valid: boolean;
  shoeSize: number;
  reason: string;
};

export function ShoesForm({
  sizeOptions,
  initial,
}: {
  sizeOptions: number[];
  initial?: { remark: string; items: { wearerAcc: string; userName: string; userDept: string; shoeSize: number; reason: string }[] };
}) {
  const router = useRouter();
  const t = useT();
  const tPlural = useTPlural();
  const fmt = useFormat();
  const [remark, setRemark] = useState(initial?.remark ?? "");
  const [items, setItems] = useState<Item[]>(
    initial && initial.items.length > 0
      ? initial.items.map((it) => ({ ...it, valid: !!it.wearerAcc }))
      : [
          {
            wearerAcc: "",
            userName: "",
            userDept: "",
            valid: false,
            shoeSize: sizeOptions[Math.floor(sizeOptions.length / 2)] ?? 42,
            reason: "",
          },
        ]
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blocked, setBlocked] = useState<Array<{ wearerAcc: string; userName: string; lastSubmittedAt: string; requestNo: string }>>([]);
  const [importedCount, setImportedCount] = useState(0);

  useEffect(() => {
    if (initial) return;
    const raw = sessionStorage.getItem("eurs.import.shoes");
    if (!raw) return;
    try {
      const arr = JSON.parse(raw) as Array<{
        wearerAcc: string;
        userName: string;
        userDept: string;
        shoeSize: number;
        reason: string;
      }>;
      if (!Array.isArray(arr) || arr.length === 0) return;
      const fallback = sizeOptions[Math.floor(sizeOptions.length / 2)] ?? 42;
      setItems(
        arr.map((it) => ({
          wearerAcc: it.wearerAcc ?? "",
          userName: it.userName ?? "",
          userDept: it.userDept ?? "",
          valid: !!it.wearerAcc,
          shoeSize: typeof it.shoeSize === "number" ? it.shoeSize : fallback,
          reason: it.reason ?? "",
        }))
      );
      setImportedCount(arr.length);
    } catch {
      // ignore malformed payload
    }
  }, [sizeOptions, initial]);

  function update(i: number, patch: Partial<Item>) {
    setItems((xs) => xs.map((it, k) => (k === i ? { ...it, ...patch } : it)));
  }
  function add() {
    setItems((xs) => [
      ...xs,
      { wearerAcc: "", userName: "", userDept: "", valid: false, shoeSize: 42, reason: "" },
    ]);
  }
  function remove(i: number) {
    setItems((xs) => xs.filter((_, k) => k !== i));
  }

  async function submit() {
    setError(null);
    setBlocked([]);
    if (!items.every((it) => it.valid && it.wearerAcc && it.userName)) {
      setError(t("form.error.lookupAll"));
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/requests", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        type: "SHOES",
        remark,
        items: items.map((it) => ({
          wearerAcc: it.wearerAcc,
          userName: it.userName,
          userDept: it.userDept,
          shoeSize: it.shoeSize,
          reason: it.reason,
        })),
      }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? t("form.error.submit"));
      if (res.status === 409 && Array.isArray(d.blocked)) setBlocked(d.blocked);
      return;
    }
    clearImportedData("shoes");
    router.push("/my-requests");
  }

  return (
    <div className="space-y-4">
      {importedCount > 0 && (
        <div className="notice border-emerald-300 bg-emerald-50 text-emerald-900">
          {tPlural("apply.notice.imported", importedCount)}
        </div>
      )}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <span>{t("form.section.users")}</span>
          <button className="btn btn-outline text-xs" onClick={add}>{t("form.btn.addRow")}</button>
        </div>
        <div className="card-body space-y-4">
          {items.map((it, i) => (
            <div key={i} className="grid md:grid-cols-[1fr_100px_70px_minmax(180px,1.5fr)_auto] gap-2 items-start">
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
              <FloatingSelect
                label={t("form.field.shoeSize")}
                value={it.shoeSize}
                onChange={(v) => update(i, { shoeSize: Number(v) })}
              >
                {sizeOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </FloatingSelect>
              <FloatingInput label={t("form.field.qty")} value={1} disabled readOnly />
              <FloatingInput
                label={t("form.field.reason")}
                value={it.reason}
                onChange={(v) => update(i, { reason: v })}
                placeholder={t("form.field.reason.placeholder")}
              />
              <button
                className="btn btn-danger h-[46px]"
                onClick={() => remove(i)}
                disabled={items.length === 1}
              >
                {t("form.btn.delete")}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-header">{t("form.section.remark")}</div>
        <div className="card-body">
          <textarea className="textarea min-h-24" value={remark} onChange={(e) => setRemark(e.target.value)} />
        </div>
      </div>

      {error && <div className="text-sm text-rose-600">{error}</div>}
      {blocked.length > 0 && (
        <div className="notice border-rose-300 bg-rose-50 text-rose-900">
          <div className="font-medium mb-1">{t("shoes.blocked.title")}</div>
          <ul className="text-sm list-disc pl-5 space-y-0.5">
            {blocked.map((b, idx) => (
              <li key={idx}>
                {t("shoes.blocked.row", {
                  name: b.userName,
                  acc: b.wearerAcc,
                  date: fmt.date(b.lastSubmittedAt),
                  requestNo: b.requestNo,
                })}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex justify-end">
        <button className="btn btn-primary" disabled={submitting} onClick={submit}>
          {submitting ? t("form.btn.submitting") : t("form.btn.submit")}
        </button>
      </div>
    </div>
  );
}
