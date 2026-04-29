import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiRequireUser } from "@/lib/auth-helpers";
import { nextRequestNo } from "@/lib/request-no";
import { notifySubmitted } from "@/lib/notify";
import {
  HelmetRequestSchema,
  ShoesRequestSchema,
  UniformRequestSchema,
} from "@/lib/zod-schemas";

export async function GET() {
  const r = await apiRequireUser();
  if (r instanceof NextResponse) return r;
  const list = await db.request.findMany({
    where: { requesterId: r.user.id },
    orderBy: { submittedAt: "desc" },
    include: { items: true, attachments: true },
  });
  return NextResponse.json(list);
}

export async function POST(req: Request) {
  const r = await apiRequireUser();
  if (r instanceof NextResponse) return r;
  const body = await req.json();
  const type = body?.type as "HELMET" | "SHOES" | "UNIFORM";

  let parsed: any;
  if (type === "HELMET") parsed = HelmetRequestSchema.safeParse(body);
  else if (type === "SHOES") parsed = ShoesRequestSchema.safeParse(body);
  else if (type === "UNIFORM") parsed = UniformRequestSchema.safeParse(body);
  else return NextResponse.json({ error: "未知申請類型" }, { status: 400 });

  if (!parsed.success) {
    return NextResponse.json({ error: "驗證失敗", details: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  // 制服「更換」需要附件
  if (type === "UNIFORM") {
    const hasReplace = data.items.some(
      (it: any) =>
        (it.topSelected && it.topAction === "REPLACE") ||
        (it.pantsSelected && it.pantsAction === "REPLACE")
    );
    if (hasReplace && (data.attachmentIds?.length ?? 0) === 0) {
      return NextResponse.json({ error: "「更換」項目至少需上傳一個附件" }, { status: 400 });
    }
  }

  const created = await db.$transaction(async (tx) => {
    const requestNo = await nextRequestNo(tx);
    const request = await tx.request.create({
      data: {
        requestNo,
        type,
        requesterId: r.user.id,
        requesterName: r.user.name,
        siteOrDept: r.user.department ?? "",
        remark: data.remark ?? null,
        items: {
          create: data.items.map((it: any) => normalizeItem(type, it)),
        },
      },
      include: { items: true, requester: true, attachments: true },
    });

    if (type === "UNIFORM" && data.attachmentIds?.length) {
      await tx.attachment.updateMany({
        where: {
          id: { in: data.attachmentIds },
          requestId: null,
          uploaderId: r.user.id,
        },
        data: { requestId: request.id },
      });
    }

    await tx.statusLog.create({
      data: {
        requestId: request.id,
        toStatus: "SUBMITTED",
        changedById: r.user.id,
      },
    });

    return request;
  });

  // 觸發通知（非阻塞）
  notifySubmitted(created as any).catch((e) => console.warn("notifySubmitted", e));
  return NextResponse.json(created, { status: 201 });
}

function normalizeItem(type: "HELMET" | "SHOES" | "UNIFORM", it: any) {
  const userDept = it.userDept ?? null;
  if (type === "HELMET") {
    return { wearerAcc: it.wearerAcc, userName: it.userName, userDept, bloodType: it.bloodType };
  }
  if (type === "SHOES") {
    return {
      wearerAcc: it.wearerAcc,
      userName: it.userName,
      userDept,
      shoeSize: it.shoeSize,
      reason: it.reason,
    };
  }
  return {
    wearerAcc: it.wearerAcc,
    userName: it.userName,
    userDept,
    gender: it.gender,
    topSelected: !!it.topSelected,
    topSize: it.topSelected ? it.topSize : null,
    topQty: it.topSelected ? it.topQty : null,
    topAction: it.topSelected ? it.topAction : null,
    pantsSelected: !!it.pantsSelected,
    pantsWaist: it.pantsSelected ? it.pantsWaist : null,
    pantsLength: it.pantsSelected ? it.pantsLength : null,
    pantsQty: it.pantsSelected ? it.pantsQty : null,
    pantsAction: it.pantsSelected ? it.pantsAction : null,
  };
}
