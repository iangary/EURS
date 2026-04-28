import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiRequireAdmin } from "@/lib/auth-helpers";
import { notifyShipped } from "@/lib/notify";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const r = await apiRequireAdmin();
  if (r instanceof NextResponse) return r;

  const now = new Date();
  const updated = await db.$transaction(async (tx) => {
    const cur = await tx.request.findUnique({ where: { id: params.id } });
    if (!cur) throw new Error("找不到申請單");
    if (cur.status === "SHIPPED") return cur;
    const next = await tx.request.update({
      where: { id: params.id },
      data: {
        status: "SHIPPED",
        shippedAt: now,
        shippedById: r.user.id,
        items: { updateMany: { where: { requestId: params.id }, data: { shippedAt: now } } },
      },
      include: { items: true, requester: true, attachments: true },
    });
    await tx.statusLog.create({
      data: {
        requestId: params.id,
        fromStatus: cur.status,
        toStatus: "SHIPPED",
        changedById: r.user.id,
      },
    });
    return next;
  });

  notifyShipped(updated as any).catch((e) => console.warn("notifyShipped", e));
  return NextResponse.json(updated);
}
