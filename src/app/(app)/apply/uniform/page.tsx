import { requireUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { getSetting, getSettingJson, SettingKeys } from "@/lib/settings";
import { UniformForm } from "./UniformForm";
import { defaultTopSizes } from "@/lib/uniform-options";
import { getT } from "@/i18n/server";

export const dynamic = "force-dynamic";

export default async function UniformPage({ searchParams }: { searchParams: { from?: string } }) {
  const session = await requireUser();
  const t = getT();
  const tops = await getSettingJson<string[]>(SettingKeys.TOP_SIZES, defaultTopSizes());
  const waists = await getSettingJson<number[]>(SettingKeys.PANTS_WAIST, [28, 30, 32, 34, 36, 38, 40, 42]);
  const lengths = await getSettingJson<number[]>(SettingKeys.PANTS_LENGTH, [28, 30, 32, 34, 36]);
  const bankBranch = await getSetting(SettingKeys.BANK_BRANCH, "中崙分行");
  const bankAccount = await getSetting(SettingKeys.BANK_ACCOUNT, "045-031-0000-1898");

  let initial: any | undefined;
  if (searchParams.from) {
    const src = await db.request.findUnique({
      where: { id: searchParams.from },
      include: { items: true },
    });
    if (src && src.requesterId === session.user.id && src.type === "UNIFORM" && src.status === "REJECTED") {
      initial = {
        remark: src.remark ?? "",
        items: src.items.map((it) => ({
          wearerAcc: it.wearerAcc,
          userName: it.userName,
          userDept: it.userDept ?? "",
          gender: (it.gender ?? "MALE") as "MALE" | "FEMALE",
          topSelected: it.topSelected,
          topSize: it.topSize ?? undefined,
          topQty: it.topQty ?? undefined,
          topAction: (it.topAction ?? undefined) as "NEW" | "REPLACE" | "PURCHASE" | undefined,
          pantsSelected: it.pantsSelected,
          pantsWaist: it.pantsWaist ?? undefined,
          pantsLength: it.pantsLength ?? undefined,
          pantsQty: it.pantsQty ?? undefined,
          pantsAction: (it.pantsAction ?? undefined) as "NEW" | "REPLACE" | "PURCHASE" | undefined,
        })),
      };
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">{t("apply.uniform.title")}</h1>
      {initial && (
        <div className="notice border-amber-300 bg-amber-50 text-amber-900">
          {t("apply.notice.rejectedUniform")}
        </div>
      )}
      <UniformForm
        topOptions={tops}
        waistOptions={waists}
        lengthOptions={lengths}
        bankBranch={bankBranch}
        bankAccount={bankAccount}
        initial={initial}
      />
    </div>
  );
}
