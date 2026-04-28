import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiRequireAdmin } from "@/lib/auth-helpers";

export async function GET() {
  const r = await apiRequireAdmin();
  if (r instanceof NextResponse) return r;

  const [byDept, byType, byStatus] = await Promise.all([
    db.request.groupBy({ by: ["siteOrDept"], _count: { _all: true } }),
    db.request.groupBy({ by: ["type"], _count: { _all: true } }),
    db.request.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  return NextResponse.json({
    byDept: byDept.map((x) => ({ dept: x.siteOrDept, count: x._count._all })),
    byType: byType.map((x) => ({ type: x.type, count: x._count._all })),
    byStatus: byStatus.map((x) => ({ status: x.status, count: x._count._all })),
  });
}
