"use client";

import { useEffect, useRef, useState } from "react";

type Status = "idle" | "loading" | "ok" | "notfound" | "error";

export function AccLookupField({
  acc,
  userName,
  valid,
  onChange,
}: {
  acc: string;
  userName: string;
  valid: boolean;
  onChange: (next: { acc: string; userName: string; valid: boolean }) => void;
}) {
  const [status, setStatus] = useState<Status>(
    acc && userName && valid ? "ok" : "idle"
  );
  const lastLookedUp = useRef<string>(acc && valid ? acc : "");

  async function doLookup(value: string) {
    const v = value.trim();
    if (!v) {
      setStatus("idle");
      lastLookedUp.current = "";
      onChange({ acc: "", userName: "", valid: false });
      return;
    }
    if (lastLookedUp.current === v && status === "ok") return;
    setStatus("loading");
    try {
      const res = await fetch("/api/employees/lookup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ acc: v }),
      });
      if (res.status === 404) {
        setStatus("notfound");
        lastLookedUp.current = v;
        onChange({ acc: v, userName: "", valid: false });
        return;
      }
      if (!res.ok) {
        setStatus("error");
        lastLookedUp.current = v;
        onChange({ acc: v, userName: "", valid: false });
        return;
      }
      const emp = await res.json();
      setStatus("ok");
      lastLookedUp.current = v;
      onChange({ acc: v, userName: emp.name ?? "", valid: !!emp.name });
    } catch {
      setStatus("error");
      lastLookedUp.current = v;
      onChange({ acc: v, userName: "", valid: false });
    }
  }

  useEffect(() => {
    if (acc && userName && valid && status === "idle") {
      setStatus("ok");
      lastLookedUp.current = acc;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="grid grid-cols-[120px_1fr] gap-2">
      <div>
        <label className="label">工號 *</label>
        <input
          className="input"
          value={acc}
          placeholder="acc"
          onChange={(e) => {
            const v = e.target.value;
            setStatus("idle");
            onChange({ acc: v, userName: "", valid: false });
          }}
          onBlur={(e) => doLookup(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              doLookup((e.target as HTMLInputElement).value);
            }
          }}
        />
      </div>
      <div>
        <label className="label">使用人姓名 *</label>
        <div className="relative">
          <input
            className="input bg-slate-50"
            value={userName}
            disabled
            readOnly
            placeholder={
              status === "loading"
                ? "查詢中…"
                : status === "notfound"
                ? "查無此工號"
                : status === "error"
                ? "查詢失敗，請重試"
                : "輸入工號後自動帶入"
            }
          />
          {status === "ok" && (
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-emerald-600 text-sm">
              ✓
            </span>
          )}
        </div>
        {status === "notfound" && (
          <div className="text-xs text-rose-600 mt-1">查無此工號</div>
        )}
        {status === "error" && (
          <div className="text-xs text-rose-600 mt-1">查詢失敗，請重試</div>
        )}
      </div>
    </div>
  );
}
