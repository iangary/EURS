// 寄信 API 客戶端 — http://172.16.105.117/app
// 失敗為非阻塞：寫 log 後吞掉錯誤，避免影響主流程

const BASE = process.env.MAIL_API_BASE ?? "http://172.16.105.117/app";

export type MailPayload = {
  to: string | string[];
  cc?: string | string[];
  subject: string;
  html: string;
};

export async function sendMail(payload: MailPayload): Promise<boolean> {
  const body = {
    to: Array.isArray(payload.to) ? payload.to : [payload.to],
    cc: payload.cc ? (Array.isArray(payload.cc) ? payload.cc : [payload.cc]) : [],
    subject: payload.subject,
    html: payload.html,
  };
  try {
    const res = await fetch(`${BASE}/send`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      console.warn("[mail-api] non-OK", res.status, await res.text().catch(() => ""));
      return false;
    }
    return true;
  } catch (e) {
    console.warn("[mail-api] failed", e);
    return false;
  }
}
