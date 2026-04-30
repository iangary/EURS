"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { useT } from "@/i18n/client";
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

type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
};

type Section = {
  title?: string;
  items: NavItem[];
};

const MenuIcon = (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18" />
    <path d="M3 12h18" />
    <path d="M3 18h18" />
  </svg>
);

const CloseIcon = (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6L6 18" />
    <path d="M6 6l12 12" />
  </svg>
);

export function MobileNav({
  isAdmin,
  user,
}: {
  isAdmin: boolean;
  user: { name: string; role: string; dept: string };
}) {
  const [open, setOpen] = useState(false);
  const t = useT();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const sections: Section[] = [
    {
      title: t("mobileNav.section.apply"),
      items: [
        { href: "/apply/helmet", label: t("nav.helmet"), icon: HelmetIcon },
        { href: "/apply/shoes", label: t("nav.shoes"), icon: ShoesIcon },
        { href: "/apply/uniform", label: t("nav.uniform"), icon: UniformIcon },
        { href: "/apply/import", label: t("nav.import"), icon: ImportIcon },
      ],
    },
    {
      items: [{ href: "/my-requests", label: t("nav.myRequests"), icon: ListIcon }],
    },
  ];

  if (isAdmin) {
    sections.push({
      title: t("mobileNav.section.admin"),
      items: [
        { href: "/admin/requests", label: t("nav.adminRequests"), icon: InboxIcon },
        { href: "/admin/export", label: t("nav.adminExport"), icon: ExportIcon },
        { href: "/admin/dashboard", label: t("nav.adminDashboard"), icon: ChartIcon },
        { href: "/admin/settings", label: t("nav.adminSettings"), icon: SettingsIcon },
      ],
    });
  }

  return (
    <>
      <button
        type="button"
        aria-label={t("mobileNav.openMenu")}
        className="md:hidden p-2 -ml-2 rounded text-slate-700 hover:bg-slate-100"
        onClick={() => setOpen(true)}
      >
        {MenuIcon}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85%] bg-white shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-4 h-14 border-b border-slate-200">
              <span className="font-bold text-brand-700">{t("brand.title")}</span>
              <button
                type="button"
                aria-label={t("mobileNav.closeMenu")}
                className="p-2 -mr-2 rounded text-slate-700 hover:bg-slate-100"
                onClick={() => setOpen(false)}
              >
                {CloseIcon}
              </button>
            </div>

            <div className="px-4 py-3 border-b border-slate-200">
              <div className="font-medium text-sm">{user.name}</div>
              <div className="text-xs text-slate-500">
                {user.dept} · {user.role === "ADMIN" ? t("user.role.admin") : t("user.role.requester")}
              </div>
            </div>

            <nav className="flex-1 overflow-y-auto py-2">
              {sections.map((section, i) => (
                <div key={i} className="py-1">
                  {section.title && (
                    <div className="px-4 pt-2 pb-1 text-xs font-medium text-slate-400">
                      {section.title}
                    </div>
                  )}
                  {section.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-700"
                    >
                      <span className="text-slate-500">{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </div>
              ))}
            </nav>
            <div className="border-t border-slate-200 px-4 py-3 flex items-center justify-between">
              <span className="text-xs text-slate-500">{t("lang.switch")}</span>
              <LanguageSwitcher />
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
