import { db } from "@/lib/db";
import { SettingsForm } from "./SettingsForm";
import { ApiHealthCard } from "./ApiHealthCard";
import { getApiErrors } from "@/lib/api-health";
import { getT } from "@/i18n/server";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const all = await db.systemSetting.findMany({ orderBy: { key: "asc" } });
  const filtered = all.filter((s) => s.key !== "LAST_API_ERROR");
  const errors = await getApiErrors();
  const t = getT();
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">{t("adminSet.title")}</h1>
      <p className="text-sm text-slate-500">
        {t("adminSet.description")}
      </p>
      <ApiHealthCard initial={errors} />
      <SettingsForm initial={filtered} />
    </div>
  );
}
