import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiRequireAdmin } from "@/lib/auth-helpers";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const r = await apiRequireAdmin();
  if (r instanceof NextResponse) return r;
  const body = await req.json().catch(() => ({}));
  const note = String(body?.note ?? "").slice(0, 500) || "管理員還原出貨";

  const updated = await db.$transaction(async (tx) => {
    const cur = await tx.request.findUnique({ where: { id: params.id } });
    if (!cur) throw new Error("找不到申請單");
    if (cur.status !== "SHIPPED") throw new Error("僅已出貨單可還原");
    const next = await tx.request.update({
      where: { id: params.id },
      data: {
        status: "PROCESSING",
        shippedAt: null,
        shippedById: null,
        items: { updateMany: { where: { requestId: params.id }, data: { shippedAt: null } } },
      },
    });
    await tx.statusLog.create({
      data: {
        requestId: params.id,
        fromStatus: "SHIPPED",
        toStatus: "PROCESSING",
        changedById: r.user.id,
        note,
      },
    });
    return next;
  });
  return NextResponse.json(updated);
}
