import { requireUser } from "@/lib/auth-helpers";
import { getSettingJson, SettingKeys } from "@/lib/settings";
import { ShoesForm } from "./ShoesForm";

export const dynamic = "force-dynamic";

export default async function ShoesPage() {
  const session = await requireUser();
  const sizes = await getSettingJson<number[]>(SettingKeys.SHOE_SIZES, [36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46]);
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">安全鞋申請</h1>
      <ShoesForm
        sizeOptions={sizes}
        defaultDept={session.user.department}
        requesterName={session.user.name}
        requesterId={session.user.id}
      />
    </div>
  );
}
