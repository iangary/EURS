import Link from "next/link";
import { requireUser } from "@/lib/auth-helpers";
import { UserMenu } from "@/components/UserMenu";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireUser();
  const isAdmin = session.user.role === "ADMIN";

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto flex items-center px-4 h-14 gap-1">
          <Link href="/" className="font-bold text-brand-700 mr-4">
            EURS
          </Link>
          <NavLink href="/apply/helmet">安全帽</NavLink>
          <NavLink href="/apply/shoes">安全鞋</NavLink>
          <NavLink href="/apply/uniform">制服</NavLink>
          <span className="mx-2 h-5 w-px bg-slate-200" />
          <NavLink href="/my-requests">我的申請</NavLink>
          {isAdmin && (
            <>
              <span className="mx-2 h-5 w-px bg-slate-200" />
              <NavLink href="/admin/requests">申請單管理</NavLink>
              <NavLink href="/admin/export">匯出</NavLink>
              <NavLink href="/admin/dashboard">儀表板</NavLink>
              <NavLink href="/admin/settings">參數</NavLink>
            </>
          )}
          <div className="ml-auto">
            <UserMenu name={session.user.name} role={session.user.role} dept={session.user.department} />
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="max-w-7xl mx-auto p-4">{children}</div>
      </main>
      <footer className="text-center text-xs text-slate-400 py-4">
        EURS · 總務部 · v0.1
      </footer>
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="px-3 py-2 text-sm text-slate-700 hover:text-brand-700 hover:bg-slate-50 rounded">
      {children}
    </Link>
  );
}
