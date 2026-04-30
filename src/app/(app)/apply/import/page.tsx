import { requireUser } from "@/lib/auth-helpers";
import { BulkImportUnified } from "@/components/BulkImportUnified";
import { getT } from "@/i18n/server";

export const dynamic = "force-dynamic";

export default async function UnifiedImportPage() {
  await requireUser();
  const t = getT();
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">{t("import.page.title")}</h1>
      <p className="text-sm text-slate-600">
        {t("import.page.description")}
      </p>
      <BulkImportUnified />
    </div>
  );
}
