import { NextResponse } from "next/server";
import { apiRequireUser } from "@/lib/auth-helpers";
import { parseHelmet, parseShoes, parseUniform } from "@/lib/excel-import";

export async function POST(req: Request, { params }: { params: { type: string } }) {
  const r = await apiRequireUser();
  if (r instanceof NextResponse) return r;
  const fd = await req.formData();
  const file = fd.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "請上傳 Excel 檔案" }, { status: 400 });
  if (!file.name.toLowerCase().endsWith(".xlsx")) {
    return NextResponse.json({ error: "僅支援 .xlsx" }, { status: 400 });
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "檔案大小不可超過 5 MB" }, { status: 400 });
  }

  try {
    let rows;
    if (params.type === "helmet") rows = await parseHelmet(file);
    else if (params.type === "shoes") rows = await parseShoes(file);
    else if (params.type === "uniform") rows = await parseUniform(file);
    else return NextResponse.json({ error: "未知範本" }, { status: 400 });
    return NextResponse.json({ rows });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Excel 解析失敗" }, { status: 400 });
  }
}
