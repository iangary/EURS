import { requireUser } from "@/lib/auth-helpers";
import { getSettingJson, SettingKeys } from "@/lib/settings";
import { HelmetForm } from "./HelmetForm";

export const dynamic = "force-dynamic";

export default async function HelmetPage() {
  const session = await requireUser();
  const blood = await getSettingJson<string[]>(SettingKeys.BLOOD_TYPES, ["A", "B", "O", "AB"]);
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">安全帽申請</h1>
      <HelmetForm
        bloodOptions={blood}
        defaultDept={session.user.department}
        requesterName={session.user.name}
        requesterId={session.user.id}
      />
    </div>
  );
}
