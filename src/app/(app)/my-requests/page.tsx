import Link from "next/link";
import { requireUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { STATUS_BADGE_CLASS } from "@/lib/labels";
import { getT } from "@/i18n/server";

export const dynamic = "force-dynamic";

export default async function MyRequestsPage() {
  const session = await requireUser();
  const t = getT();
  const list = await db.request.findMany({
    where: { requesterId: session.user.id },
    orderBy: { submittedAt: "desc" },
    include: { items: true },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">{t("my.title")}</h1>
      <div className="card">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="p-3">{t("my.col.requestNo")}</th>
              <th className="p-3">{t("my.col.date")}</th>
              <th className="p-3">{t("my.col.type")}</th>
              <th className="p-3">{t("my.col.user")}</th>
              <th className="p-3">{t("my.col.status")}</th>
              <th className="p-3">{t("my.col.shippedAt")}</th>
              <th></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {list.length === 0 && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-slate-400">{t("my.empty")}</td>
              </tr>
            )}
            {list.map((r) => (
              <tr key={r.id}>
                <td className="p-3 font-mono">{r.requestNo}</td>
                <td className="p-3">{r.submittedAt.toLocaleDateString()}</td>
                <td className="p-3">{t(`type.${r.type}` as const)}</td>
                <td className="p-3">{r.items.map((i) => i.userName).join("、")}</td>
                <td className="p-3">
                  <span className={`badge ${STATUS_BADGE_CLASS[r.status]}`}>{t(`status.${r.status}` as const)}</span>
                </td>
                <td className="p-3">{r.shippedAt ? r.shippedAt.toLocaleDateString() : "—"}</td>
                <td className="p-3 text-right">
                  <Link href={`/my-requests/${r.id}`} className="text-brand-600 hover:underline">
                    {t("my.col.detail")}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
