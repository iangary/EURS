"use client";

import { useState } from "react";
import { useT } from "@/i18n/client";
import type { DictKey } from "@/i18n/dictionaries/zh";

type Setting = { key: string; value: string };

export function SettingsForm({ initial }: { initial: Setting[] }) {
  const t = useT();
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
    setMsg(res.ok ? t("adminSet.msg.saved") : t("adminSet.msg.saveFailed"));
  }

  function labelFor(key: string): string {
    const dictKey = `adminSet.label.${key}` as DictKey;
    const translated = t(dictKey);
    return translated === dictKey ? key : translated;
  }

  return (
    <div className="card">
      <div className="card-body space-y-3">
        {rows.map((r, i) => (
          <div key={r.key} className="grid md:grid-cols-[260px_1fr] gap-3 items-start">
            <div>
              <div className="font-medium text-sm">{labelFor(r.key)}</div>
              <div className="text-xs text-slate-400 font-mono">{r.key}</div>
            </div>
            <input className="input font-mono text-xs" value={r.value} onChange={(e) => update(i, e.target.value)} />
          </div>
        ))}
      </div>
      <div className="px-5 py-3 border-t flex items-center justify-end gap-3">
        {msg && <span className="text-sm text-slate-500">{msg}</span>}
        <button className="btn btn-primary" disabled={saving} onClick={save}>
          {saving ? t("adminSet.btn.saving") : t("adminSet.btn.save")}
        </button>
      </div>
    </div>
  );
}
