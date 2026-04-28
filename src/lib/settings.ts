import { db } from "./db";

const cache = new Map<string, { value: string; ts: number }>();
const TTL_MS = 30_000;

export async function getSetting(key: string, fallback = ""): Promise<string> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.ts < TTL_MS) return hit.value;
  const row = await db.systemSetting.findUnique({ where: { key } });
  const value = row?.value ?? fallback;
  cache.set(key, { value, ts: Date.now() });
  return value;
}

export async function getSettingJson<T>(key: string, fallback: T): Promise<T> {
  const raw = await getSetting(key, "");
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function setSetting(key: string, value: string): Promise<void> {
  await db.systemSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
  cache.delete(key);
}

export const SettingKeys = {
  BANK_BRANCH: "BANK_BRANCH",
  BANK_ACCOUNT: "BANK_ACCOUNT",
  SHOE_SIZES: "SHOE_SIZES",
  BLOOD_TYPES: "BLOOD_TYPES",
  TOP_SIZES: "TOP_SIZES",
  PANTS_WAIST: "PANTS_WAIST",
  PANTS_LENGTH: "PANTS_LENGTH",
  ADMIN_NOTIFY_EMAILS: "ADMIN_NOTIFY_EMAILS",
  ADMIN_EMPLOYEE_IDS: "ADMIN_EMPLOYEE_IDS",
} as const;
