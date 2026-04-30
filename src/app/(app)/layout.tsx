import Link from "next/link";
import { requireUser } from "@/lib/auth-helpers";
import { UserMenu } from "@/components/UserMenu";
import { MobileNav } from "@/components/MobileNav";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
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
            <NavLink href="/apply/helmet">{t("nav.helmet")}</NavLink>
            <NavLink href="/apply/shoes">{t("nav.shoes")}</NavLink>
            <NavLink href="/apply/uniform">{t("nav.uniform")}</NavLink>
            <NavLink href="/apply/import">{t("nav.import")}</NavLink>
            <span className="mx-2 h-5 w-px bg-slate-200" />
            <NavLink href="/my-requests">{t("nav.myRequests")}</NavLink>
            {isAdmin && (
              <>
                <span className="mx-2 h-5 w-px bg-slate-200" />
                <NavLink href="/admin/requests">{t("nav.adminRequests")}</NavLink>
                <NavLink href="/admin/export">{t("nav.adminExport")}</NavLink>
                <NavLink href="/admin/dashboard">{t("nav.adminDashboard")}</NavLink>
                <NavLink href="/admin/settings">{t("nav.adminSettings")}</NavLink>
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

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="px-3 py-2 text-sm text-slate-700 hover:text-brand-700 hover:bg-slate-50 rounded">
      {children}
    </Link>
  );
}
