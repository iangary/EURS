import { db } from "@/lib/db";
import { SettingsForm } from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const all = await db.systemSetting.findMany({ orderBy: { key: "asc" } });
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">後台 · 系統參數</h1>
      <p className="text-sm text-slate-500">
        匯款帳號、鞋號／血型／尺寸選項、總務通知名單與管理員白名單皆於此維護，免改程式。
      </p>
      <SettingsForm initial={all} />
    </div>
  );
}
