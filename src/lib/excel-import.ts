import ExcelJS from "exceljs";
import { getSettingJson, SettingKeys } from "./settings";
import { lookupByAcc, type Employee } from "./emp-api";

async function resolveAcc(
  acc: string,
  cache: Map<string, Employee | null>
): Promise<Employee | null> {
  if (cache.has(acc)) return cache.get(acc)!;
  const emp = await lookupByAcc(acc);
  cache.set(acc, emp);
  return emp;
}

export type ImportRowStatus = "ok" | "warn" | "error";
export type ImportRow = {
  rowNumber: number; // Excel 檔內的列號（包含表頭）
  status: ImportRowStatus;
  errors: string[];
  warnings: string[];
  data: any;
};

const ROW_LIMIT = 200;
const ACTION_MAP = { 新領: "NEW", 更換: "REPLACE", 自購: "PURCHASE" } as const;

function val(cell: ExcelJS.Cell): string {
  const v = cell.value as any;
  if (v === null || v === undefined) return "";
  if (typeof v === "object") {
    if ("text" in v) return String(v.text).trim();
    if ("result" in v) return String(v.result).trim();
    if ("richText" in v) return v.richText.map((r: any) => r.text).join("").trim();
  }
  return String(v).trim();
}
function num(cell: ExcelJS.Cell): number | null {
  const s = val(cell);
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

async function readFirstSheet(file: File): Promise<ExcelJS.Worksheet> {
  const ab = await file.arrayBuffer();
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(ab as any);
  const ws = wb.worksheets[0];
  if (!ws) throw new Error("Excel 檔內沒有任何工作表");
  return ws;
}

export async function parseHelmet(file: File): Promise<ImportRow[]> {
  const ws = await readFirstSheet(file);
  const blood = await getSettingJson<string[]>(SettingKeys.BLOOD_TYPES, ["A", "B", "O", "AB"]);
  const out: ImportRow[] = [];
  const empCache = new Map<string, Employee | null>();

  // 第 1 列為表頭、第 2 列為範例（略過）；資料從第 3 列起
  const total = Math.max(0, ws.rowCount - 2);
  if (total > ROW_LIMIT) {
    return [{ rowNumber: 0, status: "error", errors: [`一次最多匯入 ${ROW_LIMIT} 列，目前 ${total} 列`], warnings: [], data: null }];
  }

  for (let r = 3; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const wearerAcc = val(row.getCell(1));
    const bloodType = val(row.getCell(2));
    const remark = val(row.getCell(3));
    if (!wearerAcc && !bloodType && !remark) continue;

    const errors: string[] = [];
    let userName = "";
    if (!wearerAcc) {
      errors.push("「使用人工號」為必填");
    } else {
      const emp = await resolveAcc(wearerAcc, empCache);
      if (!emp) errors.push(`查無工號 ${wearerAcc}`);
      else userName = emp.name;
    }
    if (!bloodType) errors.push("「血型」為必填");
    else if (!blood.includes(bloodType)) errors.push(`「血型」必須為 ${blood.join("／")}`);

    out.push({
      rowNumber: r,
      status: errors.length ? "error" : "ok",
      errors,
      warnings: [],
      data: { wearerAcc, userName, bloodType: bloodType as any, remark },
    });
  }
  return out;
}

export async function parseShoes(file: File): Promise<ImportRow[]> {
  const ws = await readFirstSheet(file);
  const sizes = await getSettingJson<number[]>(SettingKeys.SHOE_SIZES, [36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46]);
  const out: ImportRow[] = [];
  const empCache = new Map<string, Employee | null>();
  const total = Math.max(0, ws.rowCount - 2);
  if (total > ROW_LIMIT) {
    return [{ rowNumber: 0, status: "error", errors: [`一次最多匯入 ${ROW_LIMIT} 列，目前 ${total} 列`], warnings: [], data: null }];
  }

  for (let r = 3; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const wearerAcc = val(row.getCell(1));
    const shoeSize = num(row.getCell(2));
    const reason = val(row.getCell(3));
    const remark = val(row.getCell(4));
    if (!wearerAcc && !shoeSize && !reason && !remark) continue;

    const errors: string[] = [];
    let userName = "";
    if (!wearerAcc) {
      errors.push("「使用人工號」為必填");
    } else {
      const emp = await resolveAcc(wearerAcc, empCache);
      if (!emp) errors.push(`查無工號 ${wearerAcc}`);
      else userName = emp.name;
    }
    if (shoeSize === null) errors.push("「鞋號」為必填");
    else if (!sizes.includes(shoeSize)) errors.push(`「鞋號」需為 ${sizes.join("／")}`);
    if (!reason) errors.push("「說明原因」為必填");

    out.push({
      rowNumber: r,
      status: errors.length ? "error" : "ok",
      errors,
      warnings: [],
      data: { wearerAcc, userName, shoeSize, reason, remark },
    });
  }
  return out;
}

export async function parseUniform(file: File): Promise<ImportRow[]> {
  const ws = await readFirstSheet(file);
  const tops = await getSettingJson<string[]>(SettingKeys.TOP_SIZES, ["S", "M", "L", "XL", "2XL", "3XL"]);
  const waists = await getSettingJson<number[]>(SettingKeys.PANTS_WAIST, [28, 30, 32, 34, 36, 38, 40, 42]);
  const lengths = await getSettingJson<number[]>(SettingKeys.PANTS_LENGTH, [28, 30, 32, 34, 36]);
  const out: ImportRow[] = [];
  const empCache = new Map<string, Employee | null>();
  const total = Math.max(0, ws.rowCount - 2);
  if (total > ROW_LIMIT) {
    return [{ rowNumber: 0, status: "error", errors: [`一次最多匯入 ${ROW_LIMIT} 列，目前 ${total} 列`], warnings: [], data: null }];
  }

  for (let r = 3; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const wearerAcc = val(row.getCell(1));
    const genderRaw = val(row.getCell(2));
    const topSize = val(row.getCell(3));
    const topQty = num(row.getCell(4));
    const topActionRaw = val(row.getCell(5));
    const pantsWaist = num(row.getCell(6));
    const pantsLength = num(row.getCell(7));
    const pantsQty = num(row.getCell(8));
    const pantsActionRaw = val(row.getCell(9));
    const remark = val(row.getCell(10));

    if (!wearerAcc && !genderRaw && !topSize && !topQty && !pantsWaist && !pantsLength) continue;

    const errors: string[] = [];
    const warnings: string[] = [];
    let userName = "";
    if (!wearerAcc) {
      errors.push("「使用人工號」為必填");
    } else {
      const emp = await resolveAcc(wearerAcc, empCache);
      if (!emp) errors.push(`查無工號 ${wearerAcc}`);
      else userName = emp.name;
    }
    const gender = genderRaw === "男" ? "MALE" : genderRaw === "女" ? "FEMALE" : null;
    if (!gender) errors.push("「性別」需為 男 或 女");

    const topSelected = !!(topSize || topQty || topActionRaw);
    const pantsSelected = !!(pantsWaist || pantsLength || pantsQty || pantsActionRaw);
    if (!topSelected && !pantsSelected) errors.push("上衣與折褲至少需填一組");

    let topAction: string | null = null;
    if (topSelected) {
      if (!topSize || !tops.includes(topSize)) errors.push(`「上衣尺寸」需為 ${tops.join("／")}`);
      if (!topQty || topQty < 1 || topQty > 5) errors.push("「上衣件數」需介於 1～5");
      topAction = (ACTION_MAP as any)[topActionRaw] ?? null;
      if (!topAction) errors.push("「上衣領用方式」需為 新領／更換／自購");
    }

    let pantsAction: string | null = null;
    if (pantsSelected) {
      if (!pantsWaist || !waists.includes(pantsWaist)) errors.push(`「折褲腰圍」需為 ${waists.join("／")}`);
      if (!pantsLength || !lengths.includes(pantsLength)) errors.push(`「折褲褲長」需為 ${lengths.join("／")}`);
      if (!pantsQty || pantsQty < 1 || pantsQty > 5) errors.push("「折褲件數」需介於 1～5");
      pantsAction = (ACTION_MAP as any)[pantsActionRaw] ?? null;
      if (!pantsAction) errors.push("「折褲領用方式」需為 新領／更換／自購");
    }

    if (
      errors.length === 0 &&
      ((topSelected && topAction === "REPLACE") || (pantsSelected && pantsAction === "REPLACE"))
    ) {
      warnings.push("含「更換」項目，請於預覽頁補上附件");
    }

    out.push({
      rowNumber: r,
      status: errors.length ? "error" : warnings.length ? "warn" : "ok",
      errors,
      warnings,
      data: {
        wearerAcc,
        userName,
        gender,
        topSelected,
        topSize: topSelected ? topSize : null,
        topQty: topSelected ? topQty : null,
        topAction,
        pantsSelected,
        pantsWaist: pantsSelected ? pantsWaist : null,
        pantsLength: pantsSelected ? pantsLength : null,
        pantsQty: pantsSelected ? pantsQty : null,
        pantsAction,
        remark,
      },
    });
  }
  return out;
}
