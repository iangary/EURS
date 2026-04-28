import { NextResponse } from "next/server";
import { apiRequireUser } from "@/lib/auth-helpers";
import { searchEmployees } from "@/lib/emp-api";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const r = await apiRequireUser();
  if (r instanceof NextResponse) return r;
  const q = new URL(req.url).searchParams.get("q") ?? "";
  if (!q.trim()) return NextResponse.json([]);
  // 1) 先打外部 API
  const remote = await searchEmployees(q);
  if (remote.length) return NextResponse.json(remote);
  // 2) Fallback：從本地 User 表查
  const local = await db.user.findMany({
    where: {
      OR: [{ id: { contains: q } }, { name: { contains: q } }],
    },
    take: 20,
  });
  return NextResponse.json(
    local.map((u) => ({ id: u.id, name: u.name, email: u.email, department: u.department }))
  );
}
