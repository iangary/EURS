// 共用標籤對照（DB 列舉 → 中文）

export const TYPE_LABEL = { HELMET: "安全帽", SHOES: "安全鞋", UNIFORM: "制服" } as const;
export const STATUS_LABEL = {
  SUBMITTED: "已送出",
  PROCESSING: "處理中",
  SHIPPED: "已出貨",
  REJECTED: "退件",
} as const;
export const ACTION_LABEL = { NEW: "新領", REPLACE: "更換", PURCHASE: "自購" } as const;
export const GENDER_LABEL = { MALE: "男", FEMALE: "女" } as const;

export const STATUS_BADGE_CLASS: Record<keyof typeof STATUS_LABEL, string> = {
  SUBMITTED: "bg-amber-100 text-amber-800",
  PROCESSING: "bg-sky-100 text-sky-800",
  SHIPPED: "bg-emerald-100 text-emerald-800",
  REJECTED: "bg-rose-100 text-rose-800",
};
