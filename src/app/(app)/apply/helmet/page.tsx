import { requireUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { getSettingJson, SettingKeys } from "@/lib/settings";
import { HelmetForm } from "./HelmetForm";

export const dynamic = "force-dynamic";

export default async function HelmetPage({ searchParams }: { searchParams: { from?: string } }) {
  const session = await requireUser();
  const blood = await getSettingJson<string[]>(SettingKeys.BLOOD_TYPES, ["A", "B", "O", "AB"]);

  let initial: { dept: string; remark: string; items: { wearerAcc: string; userName: string; bloodType: string }[] } | undefined;
  if (searchParams.from) {
    const src = await db.request.findUnique({
      where: { id: searchParams.from },
      include: { items: true },
    });
    if (src && src.requesterId === session.user.id && src.type === "HELMET" && src.status === "REJECTED") {
      initial = {
        dept: src.siteOrDept,
        remark: src.remark ?? "",
        items: src.items.map((it) => ({
          wearerAcc: it.wearerAcc,
          userName: it.userName,
          bloodType: it.bloodType ?? blood[0] ?? "A",
        })),
      };
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">安全帽申請</h1>
      {initial && (
        <div className="notice border-amber-300 bg-amber-50 text-amber-900">
          已載入退件單資料，請修正後重新送出（將建立新申請單，原退件單保留稽核）。
        </div>
      )}
      <HelmetForm
        bloodOptions={blood}
        defaultDept={session.user.department}
        requesterName={session.user.name}
        requesterId={session.user.id}
        initial={initial}
      />
    </div>
  );
}
