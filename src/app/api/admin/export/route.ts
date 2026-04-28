import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiRequireAdmin } from "@/lib/auth-helpers";
import { buildXlsx, buildCsv, exportFilename } from "@/lib/export-xlsx";
import type { Prisma } from "@prisma/client";

export async function GET(req: Request) {
  const r = await apiRequireAdmin();
  if (r instanceof NextResponse) return r;
  const u = new URL(req.url);
  const fmt = (u.searchParams.get("format") ?? "xlsx").toLowerCase();
  const type = u.searchParams.get("type") as any;
  const status = u.searchParams.get("status") as any;
  const dept = u.searchParams.get("dept");
  const submittedFrom = u.searchParams.get("submittedFrom");
  const submittedTo = u.searchParams.get("submittedTo");
  const shippedFrom = u.searchParams.get("shippedFrom");
  const shippedTo = u.searchParams.get("shippedTo");
  const includeUnshipped = u.searchParams.get("includeUnshipped") === "1";

  const where: Prisma.RequestWhereInput = {};
  if (type && type !== "ALL") where.type = type;
  if (status) where.status = status;
  if (dept) where.siteOrDept = { contains: dept };
  if (submittedFrom || submittedTo) {
    where.submittedAt = {};
    if (submittedFrom) (where.submittedAt as any).gte = new Date(submittedFrom);
    if (submittedTo) (where.submittedAt as any).lte = new Date(`${submittedTo}T23:59:59`);
  }
  if (shippedFrom || shippedTo) {
    const range: Prisma.DateTimeNullableFilter = {};
    if (shippedFrom) range.gte = new Date(shippedFrom);
    if (shippedTo) range.lte = new Date(`${shippedTo}T23:59:59`);
    if (includeUnshipped) {
      where.OR = [{ shippedAt: range }, { shippedAt: null }];
    } else {
      where.shippedAt = range;
    }
  }

  const rows = await db.request.findMany({
    where,
    orderBy: { submittedAt: "asc" },
    include: { items: true, requester: true },
  });

  const fromLabel = (submittedFrom || shippedFrom || "ALL").slice(0, 10);
  const toLabel = (submittedTo || shippedTo || "ALL").slice(0, 10);

  if (fmt === "csv") {
    const buf = buildCsv(rows as any);
    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename*=UTF-8''${encodeURIComponent(exportFilename(fromLabel, toLabel, "csv"))}`,
      },
    });
  }

  const buf = await buildXlsx(rows as any);
  return new NextResponse(new Uint8Array(buf), {
    status: 200,
    headers: {
      "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "content-disposition": `attachment; filename*=UTF-8''${encodeURIComponent(exportFilename(fromLabel, toLabel, "xlsx"))}`,
    },
  });
}
