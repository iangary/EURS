import Link from "next/link";
import { requireUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { TYPE_LABEL, STATUS_LABEL, STATUS_BADGE_CLASS } from "@/lib/labels";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await requireUser();
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
          您好，{session.user.name}
        </h1>
        <p className="text-slate-500 text-sm">
          {session.user.department} · {session.user.role === "ADMIN" ? "總務管理員" : "申請人"}
        </p>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ApplyCard href="/apply/helmet" title="安全帽" subtitle="HELMET" color="bg-amber-100" />
        <ApplyCard href="/apply/shoes" title="安全鞋" subtitle="SHOES" color="bg-emerald-100" />
        <ApplyCard href="/apply/uniform" title="制服" subtitle="UNIFORM" color="bg-sky-100" />
      </section>

      <section className="card">
        <div className="card-header flex items-center justify-between">
          <span>我的申請（最近 5 筆）</span>
          <Link href="/my-requests" className="text-sm text-brand-600 hover:underline">
            查看全部 →
          </Link>
        </div>
        <div className="divide-y">
          {recent.length === 0 && (
            <div className="px-5 py-6 text-center text-sm text-slate-400">尚無申請紀錄</div>
          )}
          {recent.map((r) => (
            <Link
              key={r.id}
              href={`/my-requests/${r.id}`}
              className="flex items-center justify-between px-5 py-3 hover:bg-slate-50"
            >
              <div className="flex items-center gap-3">
                <span className="badge bg-slate-100 text-slate-700">{TYPE_LABEL[r.type]}</span>
                <div>
                  <div className="font-medium">{r.requestNo}</div>
                  <div className="text-xs text-slate-500">
                    {r.submittedAt.toLocaleDateString("zh-TW")} · {r.items.length} 位使用人
                  </div>
                </div>
              </div>
              <span className={`badge ${STATUS_BADGE_CLASS[r.status]}`}>
                {STATUS_LABEL[r.status]}
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
}: {
  href: string;
  title: string;
  subtitle: string;
  color: string;
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
        <div className="font-semibold text-lg">{title}申請</div>
        <div className="text-xs text-slate-500">{subtitle}</div>
      </div>
    </Link>
  );
}
