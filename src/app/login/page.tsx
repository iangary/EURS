"use client";

import { Suspense, useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useT } from "@/i18n/client";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

type Emp = { id: string; name: string; email: string; department: string; isAdmin?: boolean };

export default function LoginPage() {
  const t = useT();
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500">{t("common.loading")}</div>}>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const callbackUrl = sp.get("callbackUrl") ?? "/";
  const t = useT();

  const [list, setList] = useState<Emp[]>([]);
  const [empId, setEmpId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/employees/login-list")
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setList(d))
      .catch(() => {});
  }, []);

  async function submit(id: string) {
    setError(null);
    setLoading(true);
    const r = await signIn("credentials", { employeeId: id, redirect: false, callbackUrl });
    setLoading(false);
    if (r?.ok) router.push(callbackUrl);
    else setError(t("login.error.failed"));
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      <div className="absolute top-3 right-3">
        <LanguageSwitcher />
      </div>
      <div className="card w-full max-w-md">
        <div className="card-header">{t("login.title")}</div>
        <div className="card-body space-y-4">
          <p className="text-sm text-slate-500">
            {t("login.description")}
          </p>
          <div className="flex gap-2">
            <input
              className="input"
              placeholder={t("login.placeholder.empNo")}
              value={empId}
              onChange={(e) => setEmpId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && empId && submit(empId)}
            />
            <button
              className="btn btn-primary"
              disabled={!empId || loading}
              onClick={() => submit(empId)}
            >
              {t("login.btn.signin")}
            </button>
          </div>
          {error && <div className="text-sm text-rose-600">{error}</div>}

          {list.length > 0 && (
            <div>
              <div className="text-xs text-slate-500 mb-1">{t("login.section.quick")}</div>
              <ul className="divide-y rounded-md border">
                {list.map((u) => (
                  <li key={u.id} className="flex items-center justify-between px-3 py-2 text-sm">
                    <div>
                      <div className="font-medium flex items-center gap-1.5">
                        <span>{u.name}</span>
                        <span className="text-slate-400">{u.id}</span>
                        {u.isAdmin && (
                          <span className="inline-flex items-center rounded-full bg-indigo-100 text-indigo-700 px-2 py-0.5 text-[11px] font-medium">
                            {t("login.badge.admin")}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500">{u.department}</div>
                    </div>
                    <button className="btn btn-outline" onClick={() => submit(u.id)} disabled={loading}>
                      {t("login.btn.signin")}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
