import ExcelJS from "exceljs";
import { getSettingJson, SettingKeys } from "./settings";

export type TemplateType = "helmet" | "shoes" | "uniform" | "unified";

const NOTE_FILL: ExcelJS.FillPattern = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFF3F4F6" },
};
const HEADER_FILL: ExcelJS.FillPattern = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFDBEAFE" },
};

async function addHelmetSheet(wb: ExcelJS.Workbook): Promise<void> {
  const ws = wb.addWorksheet("安全帽");
  ws.addRow(["使用人工號*", "血型*", "備註"]);
  ws.addRow(["A12345", "A", "（範例列，匯入時略過）"]);
  ws.getRow(1).fill = HEADER_FILL;
  ws.getRow(1).font = { bold: true };
  ws.getRow(2).fill = NOTE_FILL;
  ws.columns = [{ width: 20 }, { width: 14 }, { width: 30 }];

  const blood = await getSettingJson<string[]>(SettingKeys.BLOOD_TYPES, ["A", "B", "O", "AB"]);
  (ws as any).dataValidations.add("B3:B500", {
    type: "list",
    allowBlank: false,
    formulae: [`"${blood.join(",")}"`],
  });
}

async function addShoesSheet(wb: ExcelJS.Workbook): Promise<void> {
  const ws = wb.addWorksheet("安全鞋");
  ws.addRow(["使用人工號*", "鞋號*", "說明原因*", "備註"]);
  ws.addRow(["A12345", 42, "工地新進人員", "（範例列）"]);
  ws.getRow(1).fill = HEADER_FILL;
  ws.getRow(1).font = { bold: true };
  ws.getRow(2).fill = NOTE_FILL;
  ws.columns = [{ width: 20 }, { width: 10 }, { width: 30 }, { width: 30 }];

  const sizes = await getSettingJson<number[]>(SettingKeys.SHOE_SIZES, [36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46]);
  (ws as any).dataValidations.add("B3:B500", {
    type: "list",
    allowBlank: false,
    formulae: [`"${sizes.join(",")}"`],
  });
}

async function addUniformSheet(wb: ExcelJS.Workbook): Promise<void> {
  const ws = wb.addWorksheet("制服");
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
  ws.addRow([
    "A12345",
    "男",
    "L",
    1,
    "新領",
    32,
    30,
    1,
    "新領",
    "上衣與折褲至少填一組；不申請的子項目整組留空",
  ]);
  ws.getRow(1).fill = HEADER_FILL;
  ws.getRow(1).font = { bold: true };
  ws.getRow(2).fill = NOTE_FILL;
  ws.columns = [
    { width: 20 }, { width: 14 }, { width: 12 }, { width: 12 }, { width: 24 },
    { width: 12 }, { width: 12 }, { width: 12 }, { width: 24 }, { width: 30 },
  ];

  const tops = await getSettingJson<string[]>(SettingKeys.TOP_SIZES, ["S", "M", "L", "XL", "2XL", "3XL"]);
  const waists = await getSettingJson<number[]>(SettingKeys.PANTS_WAIST, [28, 30, 32, 34, 36, 38, 40, 42]);
  const lengths = await getSettingJson<number[]>(SettingKeys.PANTS_LENGTH, [28, 30, 32, 34, 36]);
  const actions = "新領,更換,自購";

  (ws as any).dataValidations.add("B3:B500", { type: "list", allowBlank: false, formulae: ['"男,女"'] });
  (ws as any).dataValidations.add("C3:C500", { type: "list", allowBlank: true, formulae: [`"${tops.join(",")}"`] });
  (ws as any).dataValidations.add("E3:E500", { type: "list", allowBlank: true, formulae: [`"${actions}"`] });
  (ws as any).dataValidations.add("F3:F500", { type: "list", allowBlank: true, formulae: [`"${waists.join(",")}"`] });
  (ws as any).dataValidations.add("G3:G500", { type: "list", allowBlank: true, formulae: [`"${lengths.join(",")}"`] });
  (ws as any).dataValidations.add("I3:I500", { type: "list", allowBlank: true, formulae: [`"${actions}"`] });
}

async function addHelp(wb: ExcelJS.Workbook): Promise<void> {
  const blood = await getSettingJson<string[]>(SettingKeys.BLOOD_TYPES, ["A", "B", "O", "AB"]);
  const sizes = await getSettingJson<number[]>(SettingKeys.SHOE_SIZES, [36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46]);
  const tops = await getSettingJson<string[]>(SettingKeys.TOP_SIZES, ["S", "M", "L", "XL", "2XL", "3XL"]);
  const waists = await getSettingJson<number[]>(SettingKeys.PANTS_WAIST, [28, 30, 32, 34, 36, 38, 40, 42]);
  const lengths = await getSettingJson<number[]>(SettingKeys.PANTS_LENGTH, [28, 30, 32, 34, 36]);
  const help = wb.addWorksheet("說明");
  help.addRow(["分頁", "欄位", "規則"]);
  help.addRow(["安全帽", "血型", `必填，可選：${blood.join("／")}`]);
  help.addRow(["安全鞋", "鞋號", `必填，可選：${sizes.join("／")}`]);
  help.addRow(["安全鞋", "說明原因", "必填"]);
  help.addRow(["制服", "性別", "男 或 女（必填）"]);
  help.addRow(["制服", "上衣尺寸", tops.join("／")]);
  help.addRow(["制服", "折褲腰圍", waists.join("／")]);
  help.addRow(["制服", "折褲褲長", lengths.join("／")]);
  help.addRow(["制服", "領用方式", "新領／更換／自購；更換需附件、自購跳匯款視窗"]);
  help.addRow(["共通", "使用人工號", "必填，自動帶入姓名與所屬部門"]);
}

export async function buildTemplate(type: TemplateType): Promise<{ buffer: Buffer; filename: string }> {
  const wb = new ExcelJS.Workbook();
  let label: string;
  switch (type) {
    case "helmet":
      await addHelmetSheet(wb);
      label = "安全帽";
      break;
    case "shoes":
      await addShoesSheet(wb);
      label = "安全鞋";
      break;
    case "uniform":
      await addUniformSheet(wb);
      label = "制服";
      break;
    case "unified":
      await addHelmetSheet(wb);
      await addShoesSheet(wb);
      await addUniformSheet(wb);
      label = "統一";
      break;
  }
  await addHelp(wb);
  const buf = await wb.xlsx.writeBuffer();
  return { buffer: Buffer.from(buf), filename: `EURS_批量範本_${label!}.xlsx` };
}
