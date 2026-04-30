"use client";

import { useEffect, useRef, useState } from "react";
import { FloatingInput } from "@/components/FloatingField";
import { useT } from "@/i18n/client";

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
  const t = useT();
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
      ? t("acc.placeholder.loading")
      : status === "notfound"
      ? t("acc.placeholder.notfound")
      : status === "error"
      ? t("acc.placeholder.error")
      : t("acc.placeholder.idle");

  return (
    <div className="grid grid-cols-1 md:grid-cols-[140px_minmax(160px,1fr)_180px] gap-2">
      <FloatingInput
        label={t("acc.field.empNo")}
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
          label={t("acc.field.userName")}
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
          <div className="text-xs text-rose-600 mt-1">{t("acc.error.notfound")}</div>
        )}
        {status === "error" && (
          <div className="text-xs text-rose-600 mt-1">{t("acc.error.retry")}</div>
        )}
      </div>
      <FloatingInput
        label={t("acc.field.userDept")}
        value={userDept}
        disabled
        readOnly
        placeholder={t("acc.placeholder.dept")}
      />
    </div>
  );
}

