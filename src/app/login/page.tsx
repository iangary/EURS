"use client";

import { Suspense, useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

type Emp = { id: string; name: string; email: string; department: string };

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500">載入中…</div>}>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const callbackUrl = sp.get("callbackUrl") ?? "/";

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
    else setError("登入失敗，請確認員工編號正確");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card w-full max-w-md">
        <div className="card-header">EURS 登入</div>
        <div className="card-body space-y-4">
          <p className="text-sm text-slate-500">
            第一階段採模擬登入；輸入員工編號或從下方清單快速選擇。
          </p>
          <div className="flex gap-2">
            <input
              className="input"
              placeholder="員工編號"
              value={empId}
              onChange={(e) => setEmpId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && empId && submit(empId)}
            />
            <button
              className="btn btn-primary"
              disabled={!empId || loading}
              onClick={() => submit(empId)}
            >
              登入
            </button>
          </div>
          {error && <div className="text-sm text-rose-600">{error}</div>}

          {list.length > 0 && (
            <div>
              <div className="text-xs text-slate-500 mb-1">快速登入</div>
              <ul className="divide-y rounded-md border">
                {list.map((u) => (
                  <li key={u.id} className="flex items-center justify-between px-3 py-2 text-sm">
                    <div>
                      <div className="font-medium">
                        {u.name} <span className="text-slate-400 ml-1">{u.id}</span>
                      </div>
                      <div className="text-xs text-slate-500">{u.department}</div>
                    </div>
                    <button className="btn btn-outline" onClick={() => submit(u.id)} disabled={loading}>
                      登入
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
