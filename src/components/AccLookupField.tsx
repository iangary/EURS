"use client";

import { useEffect, useRef, useState } from "react";
import { FloatingInput } from "@/components/FloatingField";

type Status = "idle" | "loading" | "ok" | "notfound" | "error";

export type AccLookupValue = {
  acc: string;
  userName: string;
  userDept: string;
  valid: boolean;
};

export function AccLookupField({
  acc,
  userName,
  userDept,
  valid,
  onChange,
}: {
  acc: string;
  userName: string;
  userDept: string;
  valid: boolean;
  onChange: (next: AccLookupValue) => void;
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
      onChange({ acc: "", userName: "", userDept: "", valid: false });
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
        onChange({ acc: v, userName: "", userDept: "", valid: false });
        return;
      }
      if (!res.ok) {
        setStatus("error");
        lastLookedUp.current = v;
        onChange({ acc: v, userName: "", userDept: "", valid: false });
        return;
      }
      const emp = await res.json();
      setStatus("ok");
      lastLookedUp.current = v;
      onChange({
        acc: v,
        userName: emp.name ?? "",
        userDept: emp.department ?? "",
        valid: !!emp.name,
      });
    } catch {
      setStatus("error");
      lastLookedUp.current = v;
      onChange({ acc: v, userName: "", userDept: "", valid: false });
    }
  }

  useEffect(() => {
    if (acc && userName && valid && status === "idle") {
      setStatus("ok");
      lastLookedUp.current = acc;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const namePlaceholder =
    status === "loading"
      ? "查詢中…"
      : status === "notfound"
      ? "查無此工號"
      : status === "error"
      ? "查詢失敗"
      : "輸入工號後自動帶入";

  return (
    <div className="grid grid-cols-1 md:grid-cols-[140px_minmax(160px,1fr)_180px] gap-2">
      <FloatingInput
        label="工號 *"
        value={acc}
        onChange={(v) => {
          setStatus("idle");
          onChange({ acc: v, userName: "", userDept: "", valid: false });
        }}
        onBlur={(v) => doLookup(v)}
        onEnter={(v) => doLookup(v)}
      />
      <div className="relative">
        <FloatingInput
          label="使用人姓名 *"
          value={userName}
          disabled
          readOnly
          placeholder={namePlaceholder}
        />
        {status === "ok" && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-emerald-600 text-sm">
            ✓
          </span>
        )}
        {status === "notfound" && (
          <div className="text-xs text-rose-600 mt-1">查無此工號</div>
        )}
        {status === "error" && (
          <div className="text-xs text-rose-600 mt-1">查詢失敗，請重試</div>
        )}
      </div>
      <FloatingInput
        label="所屬工地／部門"
        value={userDept}
        disabled
        readOnly
        placeholder="自動帶入"
      />
    </div>
  );
}

