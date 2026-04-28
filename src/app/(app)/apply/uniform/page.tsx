import { requireUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { getSetting, getSettingJson, SettingKeys } from "@/lib/settings";
import { UniformForm } from "./UniformForm";

export const dynamic = "force-dynamic";

export default async function UniformPage({ searchParams }: { searchParams: { from?: string } }) {
  const session = await requireUser();
  const tops = await getSettingJson<string[]>(SettingKeys.TOP_SIZES, ["S", "M", "L", "XL", "2XL", "3XL"]);
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
        dept: src.siteOrDept,
        remark: src.remark ?? "",
        items: src.items.map((it) => ({
          wearerAcc: it.wearerAcc,
          userName: it.userName,
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
      <h1 className="text-xl font-bold">制服申請</h1>
      {initial && (
        <div className="notice border-amber-300 bg-amber-50 text-amber-900">
          已載入退件單資料，請修正後重新送出（將建立新申請單，原退件單保留稽核）。「更換」附件需重新上傳。
        </div>
      )}
      <UniformForm
        topOptions={tops}
        waistOptions={waists}
        lengthOptions={lengths}
        bankBranch={bankBranch}
        bankAccount={bankAccount}
        defaultDept={session.user.department}
        requesterName={session.user.name}
        requesterId={session.user.id}
        initial={initial}
      />
    </div>
  );
}
