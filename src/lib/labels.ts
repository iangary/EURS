// 共用標籤對照（DB 列舉 → 中文，舊版同步保留以利未遷移呼叫端）
// 新程式請改用 i18n: t(`type.${key}`) / t(`status.${key}`) 等

export const TYPE_LABEL = { HELMET: "安全帽", SHOES: "安全鞋", UNIFORM: "制服" } as const;
export const STATUS_LABEL = {
  APPLYING: "申請中",
  SHIPPED: "已出貨",
  REJECTED: "退件",
} as const;
export const ACTION_LABEL = { NEW: "新領", REPLACE: "更換", PURCHASE: "自購" } as const;
export const GENDER_LABEL = { MALE: "男", FEMALE: "女" } as const;

export const STATUS_BADGE_CLASS: Record<keyof typeof STATUS_LABEL, string> = {
  APPLYING: "bg-amber-100 text-amber-800",
  SHIPPED: "bg-emerald-100 text-emerald-800",
  REJECTED: "bg-rose-100 text-rose-800",
};

// i18n helpers — 給有 t() 的呼叫端用
import type { DictKey } from "@/i18n/dictionaries/zh";

type TFn = (key: DictKey, vars?: Record<string, string | number>) => string;

export const typeLabel = (t: TFn, k: keyof typeof TYPE_LABEL) =>
  t(`type.${k}` as DictKey);
export const statusLabel = (t: TFn, k: keyof typeof STATUS_LABEL) =>
  t(`status.${k}` as DictKey);
export const actionLabel = (t: TFn, k: keyof typeof ACTION_LABEL) =>
  t(`action.${k}` as DictKey);
export const genderLabel = (t: TFn, k: keyof typeof GENDER_LABEL) =>
  t(`gender.${k}` as DictKey);
