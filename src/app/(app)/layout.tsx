import Link from "next/link";
import type { ReactNode } from "react";
import { requireUser } from "@/lib/auth-helpers";
import { UserMenu } from "@/components/UserMenu";
import { MobileNav } from "@/components/MobileNav";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import {
  HelmetIcon,
  ShoesIcon,
  UniformIcon,
  ImportIcon,
  ListIcon,
  InboxIcon,
  ExportIcon,
  ChartIcon,
  SettingsIcon,
} from "@/components/nav-icons";
import { getT } from "@/i18n/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireUser();
  const isAdmin = session.user.role === "ADMIN";
  const t = getT();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto flex items-center px-4 h-14 gap-1">
          <MobileNav
            isAdmin={isAdmin}
            user={{
              name: session.user.name,
              role: session.user.role,
              dept: session.user.department,
            }}
          />
          <Link href="/" className="flex items-center gap-1.5 font-bold text-brand-700 md:mr-4 ml-2 md:ml-0">
            <BrandIcon />
            <span>{t("brand.title")}</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            <NavIcon href="/apply/helmet" label={t("nav.helmet")} icon={HelmetIcon} />
            <NavIcon href="/apply/shoes" label={t("nav.shoes")} icon={ShoesIcon} />
            <NavIcon href="/apply/uniform" label={t("nav.uniform")} icon={UniformIcon} />
            <NavIcon href="/apply/import" label={t("nav.import")} icon={ImportIcon} />
            <span className="mx-2 h-5 w-px bg-slate-200" />
            <NavIcon href="/my-requests" label={t("nav.myRequests")} icon={ListIcon} />
            {isAdmin && (
              <>
                <span className="mx-2 h-5 w-px bg-slate-200" />
                <NavIcon href="/admin/requests" label={t("nav.adminRequests")} icon={InboxIcon} />
                <NavIcon href="/admin/export" label={t("nav.adminExport")} icon={ExportIcon} />
                <NavIcon href="/admin/dashboard" label={t("nav.adminDashboard")} icon={ChartIcon} />
                <NavIcon href="/admin/settings" label={t("nav.adminSettings")} icon={SettingsIcon} />
              </>
            )}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <LanguageSwitcher className="hidden md:inline-flex" />
            <UserMenu name={session.user.name} role={session.user.role} dept={session.user.department} />
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="max-w-7xl mx-auto p-4">{children}</div>
      </main>
      <footer className="text-center text-xs text-slate-400 py-4">
        {t("brand.footer")}
      </footer>
    </div>
  );
}

function BrandIcon() {
  return (
    <svg
      className="w-6 h-6 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 17h18" />
      <path d="M4 17v-2a8 8 0 0 1 16 0v2" />
      <path d="M9 9V6.5A1.5 1.5 0 0 1 10.5 5h3A1.5 1.5 0 0 1 15 6.5V9" />
      <path d="M12 9v6" />
    </svg>
  );
}

function NavIcon({ href, label, icon }: { href: string; label: string; icon: ReactNode }) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="group relative w-9 h-9 inline-flex items-center justify-center rounded text-slate-600 hover:text-brand-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
    >
      {icon}
      <span
        role="tooltip"
        className="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-2 whitespace-nowrap rounded bg-slate-900 px-2.5 py-1 text-white opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity z-50"
        style={{ fontSize: "21px", lineHeight: 1.2 }}
      >
        {label}
      </span>
    </Link>
  );
}
