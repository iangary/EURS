import ExcelJS from "exceljs";
import type { Request, RequestItem, User } from "@prisma/client";

const TYPE_LABEL = { HELMET: "安全帽", SHOES: "安全鞋", UNIFORM: "制服" } as const;
const STATUS_LABEL = {
  SUBMITTED: "已送出",
  SHIPPED: "已出貨",
  REJECTED: "退件",
} as const;
const ACTION_LABEL = { NEW: "新領", REPLACE: "更換", PURCHASE: "自購" } as const;
const GENDER_LABEL = { MALE: "男", FEMALE: "女" } as const;

type Row = Request & { items: RequestItem[]; requester: User };

export const HEADER = [
  "申請單號",
  "申請日期",
  "申請人",
  "工地／部門",
  "使用人工地/部門",
  "部門代號",
  "項目類型",
  "使用人",
  "規格",
  "子項目",
  "數量",
  "領用方式",
  "性別",
  "狀態",
  "出貨日期",
  "備註",
];

function helmetSpec(it: RequestItem) {
  return it.bloodType ? `血型 ${it.bloodType}` : "";
}
function shoesSpec(it: RequestItem) {
  return it.shoeSize ? `鞋號 ${it.shoeSize}（${it.reason ?? ""}）` : "";
}

/** 一張申請單可能展開為多列（制服上衣／折褲分列；其他每位使用人一列） */
export function flattenRows(rows: Row[]): (string | number | Date | null)[][] {
  const out: (string | number | Date | null)[][] = [];
  for (const r of rows) {
    for (const it of r.items) {
      const baseDate = r.submittedAt;
      const common = [
        r.requestNo,
        baseDate,
        r.requesterName,
        r.siteOrDept,
        it.userDept ?? "",
        it.deptCode ?? "",
        TYPE_LABEL[r.type],
      ];
      if (r.type === "HELMET") {
        out.push([
          ...common, it.userName, helmetSpec(it), "—", 1, "—", "—",
          STATUS_LABEL[r.status], r.shippedAt, r.remark ?? "",
        ]);
      } else if (r.type === "SHOES") {
        out.push([
          ...common, it.userName, shoesSpec(it), "—", 1, "—", "—",
          STATUS_LABEL[r.status], r.shippedAt, r.remark ?? "",
        ]);
      } else {
        // UNIFORM — 上衣與折褲分列
        if (it.topSelected) {
          out.push([
            ...common, it.userName, `尺寸 ${it.topSize ?? ""}`, "上衣",
            it.topQty ?? 0, ACTION_LABEL[it.topAction ?? "NEW"],
            it.gender ? GENDER_LABEL[it.gender] : "—",
            STATUS_LABEL[r.status], r.shippedAt, r.remark ?? "",
          ]);
        }
        if (it.pantsSelected) {
          out.push([
            ...common, it.userName, `腰 ${it.pantsWaist ?? ""}/長 ${it.pantsLength ?? ""}`,
            "折褲", it.pantsQty ?? 0, ACTION_LABEL[it.pantsAction ?? "NEW"],
            it.gender ? GENDER_LABEL[it.gender] : "—",
            STATUS_LABEL[r.status], r.shippedAt, r.remark ?? "",
          ]);
        }
      }
    }
  }
  return out;
}

export async function buildXlsx(rows: Row[]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "EURS";
  const ws = wb.addWorksheet("出貨明細");
  ws.addRow(HEADER);
  ws.getRow(1).font = { bold: true };
  ws.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE5E7EB" },
  };
  for (const r of flattenRows(rows)) ws.addRow(r);
  ws.columns.forEach((c) => (c.width = 16));

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}

export function buildCsv(rows: Row[]): Buffer {
  const all = [HEADER, ...flattenRows(rows)];
  const csv = all
    .map((r) =>
      r
        .map((v) => {
          if (v === null || v === undefined) return "";
          if (v instanceof Date) return v.toISOString().slice(0, 10);
          const s = String(v).replace(/"/g, '""');
          return /[",\n]/.test(s) ? `"${s}"` : s;
        })
        .join(",")
    )
    .join("\n");
  // 加 BOM 讓 Excel 直接以 UTF-8 開啟正常
  return Buffer.concat([Buffer.from("﻿", "utf8"), Buffer.from(csv, "utf8")]);
}

export function exportFilename(from: string, to: string, ext: "xlsx" | "csv") {
  return `PPE_出貨明細_${from}_${to}.${ext}`;
}
