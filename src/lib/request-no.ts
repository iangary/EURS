import type { PrismaClient, Prisma } from "@prisma/client";

function todayStamp(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

/**
 * 在交易中產生 PPE-YYYYMMDD-NNN 申請單號，三位流水序號每日重置。
 */
export async function nextRequestNo(tx: Prisma.TransactionClient | PrismaClient): Promise<string> {
  const stamp = todayStamp();
  const prefix = `PPE-${stamp}-`;
  const last = await tx.request.findFirst({
    where: { requestNo: { startsWith: prefix } },
    orderBy: { requestNo: "desc" },
    select: { requestNo: true },
  });
  const n = last ? Number(last.requestNo.slice(prefix.length)) + 1 : 1;
  return `${prefix}${String(n).padStart(3, "0")}`;
}
