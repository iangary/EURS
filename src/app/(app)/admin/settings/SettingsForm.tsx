"use client";

import { useState } from "react";

type Setting = { key: string; value: string };

const LABELS: Record<string, string> = {
  BANK_BRANCH: "匯款銀行／分行",
  BANK_ACCOUNT: "匯款帳號",
  SHOE_SIZES: "安全鞋鞋號（JSON 陣列）",
  BLOOD_TYPES: "血型選項（JSON 陣列）",
  TOP_SIZES: "上衣尺寸（JSON 陣列）",
  PANTS_WAIST: "折褲腰圍（JSON 陣列）",
  PANTS_LENGTH: "折褲褲長（JSON 陣列）",
  ADMIN_NOTIFY_EMAILS: "總務通知 Email（JSON 陣列）",
  ADMIN_EMPLOYEE_IDS: "管理員員工編號（JSON 陣列）",
};

export function SettingsForm({ initial }: { initial: Setting[] }) {
  const [rows, setRows] = useState<Setting[]>(initial);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function update(i: number, value: string) {
    setRows((xs) => xs.map((r, k) => (k === i ? { ...r, value } : r)));
  }

  async function save() {
    setSaving(true);
    setMsg(null);
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ updates: rows }),
    });
    setSaving(false);
    setMsg(res.ok ? "已儲存" : "儲存失敗");
  }

  return (
    <div className="card">
      <div className="card-body space-y-3">
        {rows.map((r, i) => (
          <div key={r.key} className="grid md:grid-cols-[260px_1fr] gap-3 items-start">
            <div>
              <div className="font-medium text-sm">{LABELS[r.key] ?? r.key}</div>
              <div className="text-xs text-slate-400 font-mono">{r.key}</div>
            </div>
            <input className="input font-mono text-xs" value={r.value} onChange={(e) => update(i, e.target.value)} />
          </div>
        ))}
      </div>
      <div className="px-5 py-3 border-t flex items-center justify-end gap-3">
        {msg && <span className="text-sm text-slate-500">{msg}</span>}
        <button className="btn btn-primary" disabled={saving} onClick={save}>
          {saving ? "儲存中…" : "儲存"}
        </button>
      </div>
    </div>
  );
}
