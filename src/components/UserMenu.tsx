"use client";

import { signOut } from "next-auth/react";

export function UserMenu({ name, role, dept }: { name: string; role: string; dept: string }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="text-right leading-tight">
        <div className="font-medium">{name}</div>
        <div className="text-xs text-slate-500">
          {dept} · {role === "ADMIN" ? "總務" : "申請人"}
        </div>
      </div>
      <button className="btn btn-ghost text-xs" onClick={() => signOut({ callbackUrl: "/login" })}>
        登出
      </button>
    </div>
  );
}
