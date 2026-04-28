import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiRequireUser } from "@/lib/auth-helpers";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const r = await apiRequireUser();
  if (r instanceof NextResponse) return r;
  const item = await db.request.findUnique({
    where: { id: params.id },
    include: {
      items: true,
      attachments: true,
      logs: { orderBy: { changedAt: "asc" } },
      requester: true,
    },
  });
  if (!item) return NextResponse.json({ error: "找不到申請單" }, { status: 404 });
  if (r.user.role !== "ADMIN" && item.requesterId !== r.user.id) {
    return NextResponse.json({ error: "無權限" }, { status: 403 });
  }
  return NextResponse.json(item);
}
