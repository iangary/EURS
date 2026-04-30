import type { Request, RequestItem, User } from "@prisma/client";
import { sendMail } from "./mail-api";
import { getSettingJson, SettingKeys } from "./settings";

const TYPE_LABEL = { HELMET: "安全帽", SHOES: "安全鞋", UNIFORM: "制服" } as const;
const STATUS_LABEL = {
  APPLYING: "申請中",
  SHIPPED: "已出貨",
  REJECTED: "退件",
} as const;

function deepLink(role: "admin" | "user", id: string): string {
  const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  return role === "admin" ? `${base}/admin/requests/${id}` : `${base}/my-requests/${id}`;
}

function summary(items: RequestItem[]): string {
  return items
    .map((it) => {
      const parts: string[] = [it.userName];
      if (it.bloodType) parts.push(`血型 ${it.bloodType}`);
      if (it.shoeSize) parts.push(`鞋號 ${it.shoeSize}`);
      if (it.topSelected) parts.push(`上衣 ${it.topSize}×${it.topQty}`);
      if (it.pantsSelected) parts.push(`折褲 ${it.pantsWaist}/${it.pantsLength}×${it.pantsQty}`);
      return parts.join("，");
    })
    .join("；");
}

export async function notifySubmitted(req: Request & { items: RequestItem[]; requester: User }) {
  const admins = await getSettingJson<string[]>(SettingKeys.ADMIN_NOTIFY_EMAILS, []);
  if (admins.length === 0) return;
  await sendMail({
    to: admins,
    subject: `[EURS] 新申請 ${req.requestNo}（${TYPE_LABEL[req.type]}）`,
    html: `
      <p>您有一筆新的 <b>${TYPE_LABEL[req.type]}</b> 申請：</p>
      <ul>
        <li>申請單號：<b>${req.requestNo}</b></li>
        <li>申請人：${req.requesterName}（${req.siteOrDept}）</li>
        <li>狀態：${STATUS_LABEL[req.status]}</li>
        <li>明細：${summary(req.items)}</li>
        ${req.importNote ? `<li>註：${req.importNote}</li>` : ""}
      </ul>
      <p><a href="${deepLink("admin", req.id)}">點此前往後台處理</a></p>
    `,
  });
}

export async function notifyShipped(req: Request & { items: RequestItem[]; requester: User }) {
  if (!req.requester.email) return;
  await sendMail({
    to: req.requester.email,
    subject: `[EURS] 您的申請 ${req.requestNo} 已出貨`,
    html: `
      <p>您的 <b>${TYPE_LABEL[req.type]}</b> 申請已標記為「已出貨」：</p>
      <ul>
        <li>申請單號：<b>${req.requestNo}</b></li>
        <li>出貨日期：${req.shippedAt?.toLocaleDateString("zh-TW") ?? "—"}</li>
      </ul>
      <p><a href="${deepLink("user", req.id)}">查看詳情</a></p>
    `,
  });
}

export async function notifyRejected(req: Request & { items: RequestItem[]; requester: User }) {
  if (!req.requester.email) return;
  await sendMail({
    to: req.requester.email,
    subject: `[EURS] 您的申請 ${req.requestNo} 已退件`,
    html: `
      <p>您的 <b>${TYPE_LABEL[req.type]}</b> 申請已被退件：</p>
      <ul>
        <li>申請單號：<b>${req.requestNo}</b></li>
        <li>退件原因：${req.rejectReason ?? "—"}</li>
      </ul>
      <p><a href="${deepLink("user", req.id)}">查看詳情</a></p>
    `,
  });
}
