import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiRequireAdmin } from "@/lib/auth-helpers";
import type { Prisma } from "@prisma/client";

export async function GET(req: Request) {
  const r = await apiRequireAdmin();
  if (r instanceof NextResponse) return r;
  const u = new URL(req.url);

  const type = u.searchParams.get("type") as any;
  const status = u.searchParams.get("status") as any;
  const requesterId = u.searchParams.get("requesterId");
  const dept = u.searchParams.get("dept");
  const userName = u.searchParams.get("userName");
  const keyword = u.searchParams.get("q");
  const fromDate = u.searchParams.get("from");
  const toDate = u.searchParams.get("to");

  const where: Prisma.RequestWhereInput = {};
  if (type && type !== "ALL") where.type = type;
  if (status) where.status = status;
  if (requesterId) where.requesterId = requesterId;
  if (dept) where.siteOrDept = { contains: dept };
  if (userName) where.items = { some: { userName: { contains: userName } } };
  if (keyword) {
    where.OR = [
      { requestNo: { contains: keyword } },
      { requesterName: { contains: keyword } },
    ];
  }
  if (fromDate || toDate) {
    where.submittedAt = {};
    if (fromDate) (where.submittedAt as any).gte = new Date(fromDate);
    if (toDate) (where.submittedAt as any).lte = new Date(`${toDate}T23:59:59`);
  }

  const list = await db.request.findMany({
    where,
    orderBy: { submittedAt: "desc" },
    include: { items: true, attachments: true },
    take: 500,
  });
  return NextResponse.json(list);
}
