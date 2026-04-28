import { NextResponse } from "next/server";
import { apiRequireUser } from "@/lib/auth-helpers";
import { buildTemplate, type TemplateType } from "@/lib/excel-template";

export async function GET(_: Request, { params }: { params: { type: string } }) {
  const r = await apiRequireUser();
  if (r instanceof NextResponse) return r;
  const t = params.type as TemplateType;
  if (!["helmet", "shoes", "uniform"].includes(t)) {
    return NextResponse.json({ error: "未知範本" }, { status: 400 });
  }
  const { buffer, filename } = await buildTemplate(t);
  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "content-disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  });
}
