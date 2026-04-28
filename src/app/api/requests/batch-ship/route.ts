import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiRequireAdmin } from "@/lib/auth-helpers";
import { notifyShipped } from "@/lib/notify";

export async function POST(req: Request) {
  const r = await apiRequireAdmin();
  if (r instanceof NextResponse) return r;
  const body = await req.json().catch(() => ({}));
  const ids: string[] = Array.isArray(body?.ids) ? body.ids : [];
  if (!ids.length) return NextResponse.json({ error: "未指定申請單" }, { status: 400 });

  const now = new Date();
  const targets = await db.request.findMany({
    where: { id: { in: ids }, status: { not: "SHIPPED" } },
    include: { items: true, requester: true, attachments: true },
  });

  await db.$transaction(async (tx) => {
    for (const t of targets) {
      await tx.request.update({
        where: { id: t.id },
        data: {
          status: "SHIPPED",
          shippedAt: now,
          shippedById: r.user.id,
          items: { updateMany: { where: { requestId: t.id }, data: { shippedAt: now } } },
        },
      });
      await tx.statusLog.create({
        data: {
          requestId: t.id,
          fromStatus: t.status,
          toStatus: "SHIPPED",
          changedById: r.user.id,
          note: "批次出貨",
        },
      });
    }
  });

  for (const t of targets) {
    const fresh = { ...t, status: "SHIPPED" as const, shippedAt: now };
    notifyShipped(fresh as any).catch((e) => console.warn("notifyShipped", e));
  }
  return NextResponse.json({ updated: targets.length });
}
