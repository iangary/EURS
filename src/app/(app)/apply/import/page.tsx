import { requireUser } from "@/lib/auth-helpers";
import { BulkImportUnified } from "@/components/BulkImportUnified";

export const dynamic = "force-dynamic";

export default async function UnifiedImportPage() {
  await requireUser();
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">批量匯入（統一 Excel）</h1>
      <p className="text-sm text-slate-600">
        上傳一個 Excel 檔，內含「安全帽 / 安全鞋 / 制服」三個分頁。
        系統會分別解析驗證三個分頁；通過驗證後可分別前往對應申請頁檢視並送出。
      </p>
      <BulkImportUnified />
    </div>
  );
}
