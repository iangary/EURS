"use client";

import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { clearAllImportedData } from "@/lib/import-storage";
import { useT } from "@/i18n/client";

export function UserMenu({ name, role, dept }: { name: string; role: string; dept: string }) {
  const router = useRouter();
  const t = useT();
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
          {dept} · {role === "ADMIN" ? t("user.role.admin") : t("user.role.requester")}
        </div>
      </div>
      <button className="btn btn-ghost text-xs" onClick={handleLogout}>
        {t("user.logout")}
      </button>
    </div>
  );
}
