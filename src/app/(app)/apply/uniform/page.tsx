import { requireUser } from "@/lib/auth-helpers";
import { getSetting, getSettingJson, SettingKeys } from "@/lib/settings";
import { UniformForm } from "./UniformForm";

export const dynamic = "force-dynamic";

export default async function UniformPage() {
  const session = await requireUser();
  const tops = await getSettingJson<string[]>(SettingKeys.TOP_SIZES, ["S", "M", "L", "XL", "2XL", "3XL"]);
  const waists = await getSettingJson<number[]>(SettingKeys.PANTS_WAIST, [28, 30, 32, 34, 36, 38, 40, 42]);
  const lengths = await getSettingJson<number[]>(SettingKeys.PANTS_LENGTH, [28, 30, 32, 34, 36]);
  const bankBranch = await getSetting(SettingKeys.BANK_BRANCH, "中崙分行");
  const bankAccount = await getSetting(SettingKeys.BANK_ACCOUNT, "045-031-0000-1898");

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">制服申請</h1>
      <UniformForm
        topOptions={tops}
        waistOptions={waists}
        lengthOptions={lengths}
        bankBranch={bankBranch}
        bankAccount={bankAccount}
        defaultDept={session.user.department}
        requesterName={session.user.name}
        requesterId={session.user.id}
      />
    </div>
  );
}
