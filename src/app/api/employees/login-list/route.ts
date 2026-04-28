import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { listEmployees } from "@/lib/emp-api";
import { getSettingJson, SettingKeys } from "@/lib/settings";

export const dynamic = "force-dynamic";

// 公開：登入頁顯示「快速登入」清單。
// 先嘗試遠端 /emp，失敗則回傳本地 seed 過的 User。
export async function GET() {
  const adminIds = await getSettingJson<string[]>(SettingKeys.ADMIN_EMPLOYEE_IDS, []);
  const adminSet = new Set(adminIds);

  const remote = await listEmployees(50);
  if (remote.length) {
    return NextResponse.json(remote.map((e) => ({ ...e, isAdmin: adminSet.has(e.id) })));
  }
  const local = await db.user.findMany({ orderBy: [{ role: "desc" }, { id: "asc" }], take: 20 });
  return NextResponse.json(
    local.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      department: u.department,
      isAdmin: adminSet.has(u.id) || u.role === "ADMIN",
    }))
  );
}
