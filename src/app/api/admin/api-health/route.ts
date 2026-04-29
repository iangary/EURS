import { NextResponse } from "next/server";
import { apiRequireAdmin } from "@/lib/auth-helpers";
import { getApiErrors, recordApiError, clearApiError } from "@/lib/api-health";
import { lookupByAcc } from "@/lib/emp-api";
import { sendMail } from "@/lib/mail-api";
import { getSettingJson, SettingKeys } from "@/lib/settings";

export async function GET() {
  const r = await apiRequireAdmin();
  if (r instanceof NextResponse) return r;
  const errors = await getApiErrors();
  return NextResponse.json({ errors });
}

// 主動測試：以登入管理員自己的員編呼叫 emp，並寄一封測試信給 ADMIN_NOTIFY_EMAILS 第一位
export async function POST() {
  const r = await apiRequireAdmin();
  if (r instanceof NextResponse) return r;

  const empResult = await testEmp(r.user.id);
  const mailResult = await testMail();

  return NextResponse.json({ emp: empResult, mail: mailResult });
}

async function testEmp(empId: string) {
  if (!empId) return { ok: false, message: "目前管理員無員工編號可測試" };
  const emp = await lookupByAcc(empId);
  if (emp) {
    return { ok: true, message: `查得 ${emp.name}（${emp.department || "—"}）` };
  }
  const errs = await getApiErrors();
  return { ok: false, message: errs.emp ? `${errs.emp.status ?? "ERR"} ${errs.emp.message}` : "查無資料或連線失敗" };
}

async function testMail() {
  const list = await getSettingJson<string[]>(SettingKeys.ADMIN_NOTIFY_EMAILS, []);
  const to = list[0];
  if (!to) return { ok: false, message: "ADMIN_NOTIFY_EMAILS 尚未設定，無法測試" };
  const ok = await sendMail({
    to,
    subject: "[EURS] 連線測試",
    html: `<p>這是 EURS 後台「測試外部 API」按鈕送出的測試信。</p><p>時間：${new Date().toLocaleString("zh-TW")}</p>`,
  });
  if (ok) {
    await clearApiError("mail");
    return { ok: true, message: `已送至 ${to}` };
  }
  const errs = await getApiErrors();
  return { ok: false, message: errs.mail ? `${errs.mail.status ?? "ERR"} ${errs.mail.message}` : "寄送失敗" };
}
