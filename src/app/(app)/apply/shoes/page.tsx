import { requireUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { getSettingJson, SettingKeys } from "@/lib/settings";
import { getT } from "@/i18n/server";
import { ShoesForm } from "./ShoesForm";

export const dynamic = "force-dynamic";

export default async function ShoesPage({ searchParams }: { searchParams: { from?: string } }) {
  const session = await requireUser();
  const t = getT();
  const sizes = await getSettingJson<number[]>(SettingKeys.SHOE_SIZES, [36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46]);

  let initial:
    | { remark: string; items: { wearerAcc: string; userName: string; userDept: string; shoeSize: number; reason: string }[] }
    | undefined;
  if (searchParams.from) {
    const src = await db.request.findUnique({
      where: { id: searchParams.from },
      include: { items: true },
    });
    if (src && src.requesterId === session.user.id && src.type === "SHOES" && src.status === "REJECTED") {
      initial = {
        remark: src.remark ?? "",
        items: src.items.map((it) => ({
          wearerAcc: it.wearerAcc,
          userName: it.userName,
          userDept: it.userDept ?? "",
          shoeSize: it.shoeSize ?? 42,
          reason: it.reason ?? "",
        })),
      };
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">{t("apply.shoes.title")}</h1>
      {initial && (
        <div className="notice border-amber-300 bg-amber-50 text-amber-900">
          {t("apply.notice.rejected")}
        </div>
      )}
      <ShoesForm sizeOptions={sizes} initial={initial} />
    </div>
  );
}
