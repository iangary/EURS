import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiRequireAdmin } from "@/lib/auth-helpers";
import { notifyRejected } from "@/lib/notify";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const r = await apiRequireAdmin();
  if (r instanceof NextResponse) return r;
  const body = await req.json().catch(() => ({}));
  const reason = String(body?.reason ?? "").trim();
  if (!reason) return NextResponse.json({ error: "退件原因為必填" }, { status: 400 });

  const updated = await db.$transaction(async (tx) => {
    const cur = await tx.request.findUnique({ where: { id: params.id } });
    if (!cur) throw new Error("找不到申請單");
    if (cur.status === "SHIPPED") throw new Error("已出貨單無法退件，請先還原");
    const next = await tx.request.update({
      where: { id: params.id },
      data: { status: "REJECTED", rejectReason: reason },
      include: { items: true, requester: true, attachments: true },
    });
    await tx.statusLog.create({
      data: {
        requestId: params.id,
        fromStatus: cur.status,
        toStatus: "REJECTED",
        changedById: r.user.id,
        note: reason,
      },
    });
    return next;
  });

  notifyRejected(updated as any).catch((e) => console.warn("notifyRejected", e));
  return NextResponse.json(updated);
}
