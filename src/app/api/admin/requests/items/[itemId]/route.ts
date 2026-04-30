import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiRequireAdmin } from "@/lib/auth-helpers";

export async function PATCH(
  req: Request,
  { params }: { params: { itemId: string } }
) {
  const r = await apiRequireAdmin();
  if (r instanceof NextResponse) return r;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }

  const data: { deptCode?: string | null } = {};
  if ("deptCode" in body) {
    const v = typeof body.deptCode === "string" ? body.deptCode.trim() : "";
    data.deptCode = v.length > 0 ? v : null;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "無可更新欄位" }, { status: 400 });
  }

  try {
    const updated = await db.requestItem.update({
      where: { id: params.itemId },
      data,
      select: { id: true, deptCode: true },
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "更新失敗或項目不存在" }, { status: 404 });
  }
}
