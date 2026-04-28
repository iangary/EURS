import { AdminRequestList } from "./AdminRequestList";

export default function AdminRequestsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">申請單管理</h1>
      <AdminRequestList />
    </div>
  );
}
