import Link from "next/link";
import { requireUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { STATUS_BADGE_CLASS } from "@/lib/labels";
import { getT } from "@/i18n/server";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await requireUser();
  const t = getT();
  const recent = await db.request.findMany({
    where: { requesterId: session.user.id },
    orderBy: { submittedAt: "desc" },
    take: 5,
    include: { items: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          {t("home.greeting", { name: session.user.name })}
        </h1>
        <p className="text-slate-500 text-sm">
          {session.user.department} · {session.user.role === "ADMIN" ? t("home.role.admin") : t("home.role.requester")}
        </p>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ApplyCard href="/apply/helmet" title={t("type.HELMET")} subtitle="HELMET" color="bg-amber-100" suffix={t("home.applyCard.suffix")} />
        <ApplyCard href="/apply/shoes" title={t("type.SHOES")} subtitle="SHOES" color="bg-emerald-100" suffix={t("home.applyCard.suffix")} />
        <ApplyCard href="/apply/uniform" title={t("type.UNIFORM")} subtitle="UNIFORM" color="bg-sky-100" suffix={t("home.applyCard.suffix")} />
      </section>

      <section className="card">
        <div className="card-header flex items-center justify-between">
          <span>{t("home.recent.title")}</span>
          <Link href="/my-requests" className="text-sm text-brand-600 hover:underline">
            {t("home.recent.viewAll")}
          </Link>
        </div>
        <div className="divide-y">
          {recent.length === 0 && (
            <div className="px-5 py-6 text-center text-sm text-slate-400">{t("my.empty")}</div>
          )}
          {recent.map((r) => (
            <Link
              key={r.id}
              href={`/my-requests/${r.id}`}
              className="flex items-center justify-between px-5 py-3 hover:bg-slate-50"
            >
              <div className="flex items-center gap-3">
                <span className="badge bg-slate-100 text-slate-700">{t(`type.${r.type}` as const)}</span>
                <div>
                  <div className="font-medium">{r.requestNo}</div>
                  <div className="text-xs text-slate-500">
                    {r.submittedAt.toLocaleDateString()} · {t("home.recent.userCount", { count: r.items.length })}
                  </div>
                </div>
              </div>
              <span className={`badge ${STATUS_BADGE_CLASS[r.status]}`}>
                {t(`status.${r.status}` as const)}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function ApplyCard({
  href,
  title,
  subtitle,
  color,
  suffix,
}: {
  href: string;
  title: string;
  subtitle: string;
  color: string;
  suffix: string;
}) {
  return (
    <Link
      href={href}
      className="card hover:shadow-md transition flex items-center gap-4 p-5"
    >
      <div className={`w-14 h-14 rounded-lg ${color} flex items-center justify-center text-2xl`}>
        ＋
      </div>
      <div>
        <div className="font-semibold text-lg">{title}{suffix}</div>
        <div className="text-xs text-slate-500">{subtitle}</div>
      </div>
    </Link>
  );
}
