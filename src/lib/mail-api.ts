// 寄信 API 客戶端 — http://172.16.105.117/app
// 失敗為非阻塞：寫 log 後吞掉錯誤，避免影響主流程

import { recordApiError, clearApiError } from "./api-health";

const BASE = process.env.MAIL_API_BASE ?? "http://172.16.105.117/app/mail";
const API_KEY = process.env.SSO_API_KEY ?? "";

function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  return API_KEY ? { ...extra, "X-API-Key": API_KEY } : extra;
}

export type MailPayload = {
  to: string | string[];
  cc?: string | string[];
  subject: string;
  html: string;
};

function htmlToText(html: string): string {
  let s = html;
  s = s.replace(/<a\s[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, "$2（$1）");
  s = s.replace(/<li[^>]*>/gi, "・");
  s = s.replace(/<\/li\s*>/gi, "\n");
  s = s.replace(/<\/(p|div|ul|ol|h[1-6])\s*>/gi, "\n");
  s = s.replace(/<br\s*\/?>(?!\n)/gi, "\n");
  s = s.replace(/<[^>]+>/g, "");
  s = s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  s = s.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n");
  return s.split("\n").map((l) => l.trim()).join("\n").trim();
}

export async function sendMail(payload: MailPayload): Promise<boolean> {
  const body = {
    to: Array.isArray(payload.to) ? payload.to : [payload.to],
    cc: payload.cc ? (Array.isArray(payload.cc) ? payload.cc : [payload.cc]) : [],
    subject: payload.subject,
    body: htmlToText(payload.html),
  };
  try {
    const res = await fetch(`${BASE}/send`, {
      method: "POST",
      headers: authHeaders({ "content-type": "application/json" }),
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.warn("[mail-api] non-OK", res.status, text);
      await recordApiError("mail", res.status, `${res.status} ${text || res.statusText}`);
      return false;
    }
    await clearApiError("mail");
    return true;
  } catch (e) {
    console.warn("[mail-api] failed", e);
    await recordApiError("mail", null, e instanceof Error ? e.message : String(e));
    return false;
  }
}
