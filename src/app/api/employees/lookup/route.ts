import { NextResponse } from "next/server";
import { apiRequireUser } from "@/lib/auth-helpers";
import { lookupByAcc } from "@/lib/emp-api";

export async function POST(req: Request) {
  const r = await apiRequireUser();
  if (r instanceof NextResponse) return r;
  const body = await req.json().catch(() => ({}));
  const acc = String(body?.acc ?? "").trim();
  if (!acc) return NextResponse.json({ error: "工號為必填" }, { status: 400 });
  const emp = await lookupByAcc(acc);
  if (!emp) return NextResponse.json({ error: "查無此工號" }, { status: 404 });
  return NextResponse.json(emp);
}
