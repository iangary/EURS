/**
 * 產生批量匯入「測試用」Excel：涵蓋 valid / 邊界 / 各類錯誤 / 混合情境
 * 使用方式：
 *   docker compose exec -T web npx tsx scripts/gen-test-import.ts
 *   產出三份檔案於容器內 /app/：
 *     - test-import-valid.xlsx   全部 valid + 邊界值
 *     - test-import-errors.xlsx  各種錯誤案例（每列觸發一種錯誤）
 *     - test-import-mixed.xlsx   ok / warn / error 混雜
 *   取出：docker cp eurs-web-1:/app/test-import-valid.xlsx .
 *
 * 工號取自 prisma/data/employees.json，錯誤案例使用刻意不存在的工號（ZZ999999 / ZZ888888）。
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

type Row = (string | number | null)[];

function buildHelmet(ws: ExcelJS.Worksheet, dataRows: Row[]) {
  ws.addRow(["使用人工號*", "血型*", "備註"]);
  ws.addRow(["A12345", "A", "（範例列，匯入時略過）"]);
  for (const r of dataRows) ws.addRow(r);
  ws.getRow(1).fill = HEADER_FILL;
  ws.getRow(1).font = { bold: true };
  ws.getRow(2).fill = NOTE_FILL;
  ws.columns = [{ width: 18 }, { width: 10 }, { width: 32 }];
}

function buildShoes(ws: ExcelJS.Worksheet, dataRows: Row[]) {
  ws.addRow(["使用人工號*", "鞋號*", "說明原因*", "備註"]);
  ws.addRow(["A12345", 42, "工地新進人員", "（範例列）"]);
  for (const r of dataRows) ws.addRow(r);
  ws.getRow(1).fill = HEADER_FILL;
  ws.getRow(1).font = { bold: true };
  ws.getRow(2).fill = NOTE_FILL;
  ws.columns = [{ width: 18 }, { width: 10 }, { width: 24 }, { width: 28 }];
}

function buildUniform(ws: ExcelJS.Worksheet, dataRows: Row[]) {
  ws.addRow([
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
  ws.addRow(["A12345", "男", "L", 1, "新領", 80, 80, 1, "新領", "（範例列）"]);
  for (const r of dataRows) ws.addRow(r);
  ws.getRow(1).fill = HEADER_FILL;
  ws.getRow(1).font = { bold: true };
  ws.getRow(2).fill = NOTE_FILL;
  ws.columns = [
    { width: 18 }, { width: 14 }, { width: 12 }, { width: 10 }, { width: 26 },
    { width: 10 }, { width: 10 }, { width: 10 }, { width: 26 }, { width: 28 },
  ];
}

// ───────── valid（全綠 + 邊界值）─────────
const VALID_HELMET: Row[] = [
  ["RT020205", "A", "葉慶宇 - A 型"],
  ["RT019574", "B", "蔡榮煌 - B 型"],
  ["RT018710", "O", "廖家麟 - O 型"],
  ["RT016185", "AB", "謝東益 - AB 型"],
];

const VALID_SHOES: Row[] = [
  ["RT020465", 36, "新進人員（下界）", "梁得義 - size 36"],
  ["RT016125", 41, "舊鞋破損", "張紘文"],
  ["RT016126", 43, "尺寸不合", "劉牧宇"],
  ["RT020205", 46, "腳掌較大（上界）", "葉慶宇 - size 46"],
];

const VALID_UNIFORM: Row[] = [
  // 上衣 + 折褲，qty 下界
  ["RT020466", "男", "S", 1, "新領", 70, 70, 1, "新領", "下界尺寸組合 (W70/L70)"],
  // 上衣 + 折褲，qty 上界
  ["RT020205", "男", "3XL", 5, "新領", 110, 90, 5, "新領", "上界尺寸組合 (W110/L90)"],
  // 只申請上衣
  ["RT018378", "男", "XL", 1, "新領", "", "", "", "", "賴允瀚 - 只要上衣"],
  // 只申請折褲
  ["RT020374", "男", "", "", "", 85, 80, 1, "新領", "只要折褲"],
  // 自購（不觸發 warn）
  ["RT019574", "男", "M", 2, "自購", 80, 80, 2, "自購", "自購情境"],
];

// ───────── errors（每列觸發一種錯誤）─────────
const ERR_HELMET: Row[] = [
  ["", "A", "工號空白 → 必填錯誤"],                          // r3
  ["RT020205", "", "血型空白 → 必填錯誤"],                   // r4
  ["RT020205", "X", "血型 enum 錯誤"],                        // r5
  ["ZZ999999", "A", "查無工號"],                              // r6
  ["RT020205", "a", "血型大小寫敏感 → enum 錯誤"],            // r7
  ["", "", "整列空白 → 自動略過（不會出現在結果）"],          // r8
  ["RT019574", "AB", "✅ 對照組（valid）"],                  // r9
];

const ERR_SHOES: Row[] = [
  ["", 42, "新進", "工號空白"],                               // r3
  ["RT020465", "", "新進", "鞋號空白"],                       // r4
  ["RT020465", 25, "新進", "鞋號低於下界"],                  // r5
  ["RT020465", 99, "新進", "鞋號高於上界"],                  // r6
  ["RT020465", "abc", "新進", "鞋號非數字 → 視為空"],         // r7
  ["RT020465", 42, "", "說明原因空白"],                       // r8
  ["ZZ888888", 42, "新進", "查無工號"],                       // r9
  ["RT016125", 41, "舊鞋破損", "✅ 對照組（valid）"],         // r10
];

const ERR_UNIFORM: Row[] = [
  // r3 工號空白
  ["", "男", "L", 1, "新領", "", "", "", "", "工號空白"],
  // r4 性別 enum 錯誤
  ["RT020205", "其他", "L", 1, "新領", "", "", "", "", "性別錯誤"],
  // r5 上衣與折褲皆空
  ["RT020205", "男", "", "", "", "", "", "", "", "上衣與折褲都沒填"],
  // r6 上衣 size 錯誤
  ["RT020205", "男", "XXL", 1, "新領", "", "", "", "", "上衣尺寸不在清單"],
  // r7 上衣 qty 下界
  ["RT020205", "男", "L", 0, "新領", "", "", "", "", "件數 = 0"],
  // r8 上衣 qty 上界
  ["RT020205", "男", "L", 6, "新領", "", "", "", "", "件數 = 6"],
  // r9 上衣 action 錯誤
  ["RT020205", "男", "L", 1, "預留", "", "", "", "", "領用方式錯誤"],
  // r10 折褲腰圍錯誤
  ["RT020205", "男", "", "", "", 69, 80, 1, "新領", "腰圍不在清單"],
  // r11 折褲褲長錯誤
  ["RT020205", "男", "", "", "", 80, 91, 1, "新領", "褲長不在清單"],
  // r12 折褲 qty 錯誤
  ["RT020205", "男", "", "", "", 80, 80, 10, "新領", "件數超過 5"],
  // r13 折褲 action 錯誤
  ["RT020205", "男", "", "", "", 80, 80, 1, "送修", "折褲領用方式錯誤"],
  // r14 上衣 action = 更換 → warn
  ["RT020466", "男", "L", 1, "更換", "", "", "", "", "⚠ warn：含更換"],
  // r15 valid（上衣+折褲）
  ["RT020466", "男", "L", 2, "新領", 80, 80, 1, "新領", "✅ valid"],
  // r16 valid（只上衣）
  ["RT018378", "男", "XL", 1, "新領", "", "", "", "", "✅ valid 只上衣"],
  // r17 valid（只折褲）
  ["RT020374", "男", "", "", "", 85, 80, 1, "新領", "✅ valid 只折褲"],
];

// ───────── mixed（ok / warn / error 混雜）─────────
const MIXED_HELMET: Row[] = [
  ["RT020205", "A", "✅ valid"],
  ["ZZ999999", "A", "查無工號"],
  ["RT019574", "X", "血型錯誤"],
  ["RT018710", "O", "✅ valid"],
];

const MIXED_SHOES: Row[] = [
  ["RT020465", 42, "新進人員", "✅ valid"],
  ["RT016125", 25, "尺寸過小", "鞋號越界"],
  ["", 41, "新進", "工號必填"],
  ["RT016126", 43, "尺寸不合", "✅ valid"],
];

const MIXED_UNIFORM: Row[] = [
  ["RT020466", "男", "L", 2, "新領", 80, 80, 1, "新領", "✅ valid"],
  ["RT020205", "男", "M", 1, "更換", "", "", "", "", "⚠ warn：上衣更換"],
  ["RT020205", "其他", "L", 1, "新領", "", "", "", "", "性別錯誤"],
  ["RT020205", "男", "", "", "", "", "", "", "", "上衣與折褲都沒填"],
  ["RT018378", "男", "XL", 1, "新領", "", "", "", "", "✅ valid 只上衣"],
];

async function writeWorkbook(
  filename: string,
  helmetRows: Row[],
  shoesRows: Row[],
  uniformRows: Row[]
) {
  const wb = new ExcelJS.Workbook();
  buildHelmet(wb.addWorksheet("安全帽"), helmetRows);
  buildShoes(wb.addWorksheet("安全鞋"), shoesRows);
  buildUniform(wb.addWorksheet("制服"), uniformRows);
  await wb.xlsx.writeFile(filename);
  console.log(`已產出：${filename}`);
}

async function main() {
  await writeWorkbook("test-import-valid.xlsx", VALID_HELMET, VALID_SHOES, VALID_UNIFORM);
  await writeWorkbook("test-import-errors.xlsx", ERR_HELMET, ERR_SHOES, ERR_UNIFORM);
  await writeWorkbook("test-import-mixed.xlsx", MIXED_HELMET, MIXED_SHOES, MIXED_UNIFORM);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
