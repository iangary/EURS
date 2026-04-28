import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiRequireAdmin } from "@/lib/auth-helpers";
import { setSetting } from "@/lib/settings";

export async function GET() {
  const r = await apiRequireAdmin();
  if (r instanceof NextResponse) return r;
  const all = await db.systemSetting.findMany({ orderBy: { key: "asc" } });
  return NextResponse.json(all);
}

export async function PUT(req: Request) {
  const r = await apiRequireAdmin();
  if (r instanceof NextResponse) return r;
  const body = await req.json().catch(() => ({}));
  const updates = body?.updates as Array<{ key: string; value: string }> | undefined;
  if (!Array.isArray(updates)) return NextResponse.json({ error: "格式錯誤" }, { status: 400 });
  for (const u of updates) await setSetting(u.key, String(u.value ?? ""));
  return NextResponse.json({ ok: true });
}
