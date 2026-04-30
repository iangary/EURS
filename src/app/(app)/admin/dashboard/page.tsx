import { db } from "@/lib/db";
import { TYPE_LABEL, STATUS_LABEL } from "@/lib/labels";
import { getT, getTEnum } from "@/i18n/server";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const t = getT();
  const tEnum = getTEnum();
  const [byDept, byType, byStatus] = await Promise.all([
    db.request.groupBy({ by: ["siteOrDept"], _count: { _all: true } }),
    db.request.groupBy({ by: ["type"], _count: { _all: true } }),
    db.request.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">{t("adminDash.title")}</h1>

      <div className="grid md:grid-cols-3 gap-4">
        <Card title={t("adminDash.byType")}>
          {byType.map((x) => (
            <Bar key={x.type} label={tEnum.type(x.type as keyof typeof TYPE_LABEL)} value={x._count._all} max={Math.max(...byType.map((y) => y._count._all))} />
          ))}
        </Card>
        <Card title={t("adminDash.byStatus")}>
          {byStatus.map((x) => (
            <Bar key={x.status} label={tEnum.status(x.status as keyof typeof STATUS_LABEL)} value={x._count._all} max={Math.max(...byStatus.map((y) => y._count._all))} />
          ))}
        </Card>
        <Card title={t("adminDash.byDept")}>
          {byDept.map((x) => (
            <Bar key={x.siteOrDept} label={x.siteOrDept || "—"} value={x._count._all} max={Math.max(...byDept.map((y) => y._count._all))} />
          ))}
        </Card>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card">
      <div className="card-header">{title}</div>
      <div className="card-body space-y-2 text-sm">{children}</div>
    </div>
  );
}

function Bar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max ? Math.round((value / max) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span>{label}</span>
        <span className="font-medium">{value}</span>
      </div>
      <div className="h-2 bg-slate-100 rounded">
        <div className="h-2 bg-brand-500 rounded" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
