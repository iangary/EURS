import { getSettingJson, setSetting } from "./settings";

export type ApiSource = "emp" | "mail";

export type ApiErrorRecord = {
  status: number | null;
  message: string;
  at: string;
};

export type ApiErrorMap = Partial<Record<ApiSource, ApiErrorRecord>>;

const KEY = "LAST_API_ERROR";

export async function getApiErrors(): Promise<ApiErrorMap> {
  return getSettingJson<ApiErrorMap>(KEY, {});
}

async function write(map: ApiErrorMap) {
  await setSetting(KEY, JSON.stringify(map));
}

export async function recordApiError(
  source: ApiSource,
  status: number | null,
  message: string,
): Promise<void> {
  try {
    const map = await getApiErrors();
    map[source] = { status, message: message.slice(0, 500), at: new Date().toISOString() };
    await write(map);
  } catch {
    // 不要因為記錄錯誤而再丟錯
  }
}

export async function clearApiError(source: ApiSource): Promise<void> {
  try {
    const map = await getApiErrors();
    if (map[source]) {
      delete map[source];
      await write(map);
    }
  } catch {
    // ignore
  }
}
