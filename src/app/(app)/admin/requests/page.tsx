import { AdminRequestList } from "./AdminRequestList";
import { getT } from "@/i18n/server";

export default function AdminRequestsPage() {
  const t = getT();
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">{t("adminReq.title")}</h1>
      <AdminRequestList />
    </div>
  );
}
