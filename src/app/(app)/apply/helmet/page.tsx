import { requireUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { getSettingJson, SettingKeys } from "@/lib/settings";
import { getT } from "@/i18n/server";
import { HelmetForm } from "./HelmetForm";

export const dynamic = "force-dynamic";

export default async function HelmetPage({ searchParams }: { searchParams: { from?: string } }) {
  const session = await requireUser();
  const t = getT();
  const blood = await getSettingJson<string[]>(SettingKeys.BLOOD_TYPES, ["A", "B", "O", "AB"]);

  let initial:
    | { remark: string; items: { wearerAcc: string; userName: string; userDept: string; bloodType: string }[] }
    | undefined;
  if (searchParams.from) {
    const src = await db.request.findUnique({
      where: { id: searchParams.from },
      include: { items: true },
    });
    if (src && src.requesterId === session.user.id && src.type === "HELMET" && src.status === "REJECTED") {
      initial = {
        remark: src.remark ?? "",
        items: src.items.map((it) => ({
          wearerAcc: it.wearerAcc,
          userName: it.userName,
          userDept: it.userDept ?? "",
          bloodType: it.bloodType ?? blood[0] ?? "A",
        })),
      };
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">{t("apply.helmet.title")}</h1>
      {initial && (
        <div className="notice border-amber-300 bg-amber-50 text-amber-900">
          {t("apply.notice.rejected")}
        </div>
      )}
      <HelmetForm bloodOptions={blood} initial={initial} />
    </div>
  );
}
