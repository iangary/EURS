"use client";

import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { clearAllImportedData } from "@/lib/import-storage";

export function UserMenu({ name, role, dept }: { name: string; role: string; dept: string }) {
  const router = useRouter();
  async function handleLogout() {
    await signOut({ redirect: false });
    clearAllImportedData();
    router.push("/");
    router.refresh();
  }
  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="hidden sm:block text-right leading-tight">
        <div className="font-medium">{name}</div>
        <div className="text-xs text-slate-500">
          {dept} · {role === "ADMIN" ? "總務" : "申請人"}
        </div>
      </div>
      <button className="btn btn-ghost text-xs" onClick={handleLogout}>
        登出
      </button>
    </div>
  );
}
