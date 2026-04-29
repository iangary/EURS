/**
 * 產生批量匯入測試用 Excel：含「安全帽 / 安全鞋 / 制服」三個分頁
 * 使用方式：
 *   docker compose exec -T web npx tsx scripts/gen-sample-import.ts
 *   產出檔案：sample-import.xlsx（容器內 /app/sample-import.xlsx）
 *   再用 docker cp eurs-web-1:/app/sample-import.xlsx . 取出
 *
 * 工號取自 prisma/data/employees.json，確保 lookup 一定通過。
 */
import ExcelJS from "exceljs";

const HEADER_FILL: ExcelJS.FillPattern = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFDBEAFE" },
};
const NOTE_FILL: ExcelJS.FillPattern = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFF3F4F6" },
};

async function main() {
  const wb = new ExcelJS.Workbook();

  // ───────── 安全帽 ─────────
  const helmet = wb.addWorksheet("安全帽");
  helmet.addRow(["使用人工號*", "血型*", "備註"]);
  helmet.addRow(["A12345", "A", "（範例列，匯入時略過）"]);
  helmet.addRow(["RT020205", "A", "葉慶宇"]);
  helmet.addRow(["RT019574", "B", "蔡榮煌"]);
  helmet.addRow(["RT018710", "O", "廖家麟"]);
  helmet.addRow(["RT016185", "AB", "謝東益"]);
  helmet.getRow(1).fill = HEADER_FILL;
  helmet.getRow(1).font = { bold: true };
  helmet.getRow(2).fill = NOTE_FILL;
  helmet.columns = [{ width: 18 }, { width: 10 }, { width: 28 }];

  // ───────── 安全鞋 ─────────
  const shoes = wb.addWorksheet("安全鞋");
  shoes.addRow(["使用人工號*", "鞋號*", "說明原因*", "備註"]);
  shoes.addRow(["A12345", 42, "工地新進人員", "（範例列）"]);
  shoes.addRow(["RT020465", 42, "新進人員", "梁得義"]);
  shoes.addRow(["RT016125", 41, "舊鞋破損", "張紘文"]);
  shoes.addRow(["RT016126", 43, "尺寸不合", "劉牧宇"]);
  shoes.getRow(1).fill = HEADER_FILL;
  shoes.getRow(1).font = { bold: true };
  shoes.getRow(2).fill = NOTE_FILL;
  shoes.columns = [{ width: 18 }, { width: 10 }, { width: 24 }, { width: 24 }];

  // ───────── 制服 ─────────
  const uniform = wb.addWorksheet("制服");
  uniform.addRow([
    "使用人工號*",
    "性別*（男/女）",
    "上衣尺寸",
    "上衣件數",
    "上衣領用方式（新領/更換/自購）",
    "折褲腰圍",
    "折褲褲長",
    "折褲件數",
    "折褲領用方式（新領/更換/自購）",
    "備註",
  ]);
  uniform.addRow(["A12345", "男", "L", 1, "新領", 32, 30, 1, "新領", "（範例列）"]);
  // 範例：上衣 + 折褲 兩件都申請
  uniform.addRow(["RT020466", "男", "L", 2, "新領", 32, 30, 1, "新領", "沈文翊"]);
  // 範例：只申請上衣
  uniform.addRow(["RT018378", "男", "XL", 1, "新領", "", "", "", "", "賴允瀚 - 只要上衣"]);
  // 範例：只申請折褲
  uniform.addRow(["RT020374", "男", "", "", "", 34, 32, 1, "新領", "只要折褲"]);
  uniform.getRow(1).fill = HEADER_FILL;
  uniform.getRow(1).font = { bold: true };
  uniform.getRow(2).fill = NOTE_FILL;
  uniform.columns = [
    { width: 18 }, { width: 12 }, { width: 12 }, { width: 10 }, { width: 22 },
    { width: 10 }, { width: 10 }, { width: 10 }, { width: 22 }, { width: 24 },
  ];

  const out = "sample-import.xlsx";
  await wb.xlsx.writeFile(out);
  console.log(`已產出：${out}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
