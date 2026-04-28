import Link from "next/link";
import { requireUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { TYPE_LABEL, STATUS_LABEL, STATUS_BADGE_CLASS } from "@/lib/labels";

export const dynamic = "force-dynamic";

export default async function MyRequestsPage() {
  const session = await requireUser();
  const list = await db.request.findMany({
    where: { requesterId: session.user.id },
    orderBy: { submittedAt: "desc" },
    include: { items: true },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">我的申請</h1>
      <div className="card">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="p-3">申請單號</th>
              <th className="p-3">日期</th>
              <th className="p-3">類型</th>
              <th className="p-3">使用人</th>
              <th className="p-3">狀態</th>
              <th className="p-3">出貨日</th>
              <th></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {list.length === 0 && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-slate-400">尚無申請紀錄</td>
              </tr>
            )}
            {list.map((r) => (
              <tr key={r.id}>
                <td className="p-3 font-mono">{r.requestNo}</td>
                <td className="p-3">{r.submittedAt.toLocaleDateString("zh-TW")}</td>
                <td className="p-3">{TYPE_LABEL[r.type]}</td>
                <td className="p-3">{r.items.map((i) => i.userName).join("、")}</td>
                <td className="p-3">
                  <span className={`badge ${STATUS_BADGE_CLASS[r.status]}`}>{STATUS_LABEL[r.status]}</span>
                </td>
                <td className="p-3">{r.shippedAt ? r.shippedAt.toLocaleDateString("zh-TW") : "—"}</td>
                <td className="p-3 text-right">
                  <Link href={`/my-requests/${r.id}`} className="text-brand-600 hover:underline">
                    詳情
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
