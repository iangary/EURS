import { db } from "@/lib/db";
import { TYPE_LABEL, STATUS_LABEL } from "@/lib/labels";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [byDept, byType, byStatus] = await Promise.all([
    db.request.groupBy({ by: ["siteOrDept"], _count: { _all: true } }),
    db.request.groupBy({ by: ["type"], _count: { _all: true } }),
    db.request.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">後台 · 儀表板</h1>

      <div className="grid md:grid-cols-3 gap-4">
        <Card title="依項目類型">
          {byType.map((x) => (
            <Bar key={x.type} label={TYPE_LABEL[x.type]} value={x._count._all} max={Math.max(...byType.map((y) => y._count._all))} />
          ))}
        </Card>
        <Card title="依狀態">
          {byStatus.map((x) => (
            <Bar key={x.status} label={STATUS_LABEL[x.status]} value={x._count._all} max={Math.max(...byStatus.map((y) => y._count._all))} />
          ))}
        </Card>
        <Card title="依工地／部門">
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
