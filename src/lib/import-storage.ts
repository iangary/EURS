export type ImportTab = "helmet" | "shoes" | "uniform";

export const IMPORT_TAB_STORAGE_KEY: Record<ImportTab, string> = {
  helmet: "eurs.import.helmet",
  shoes: "eurs.import.shoes",
  uniform: "eurs.import.uniform",
};

export const IMPORT_RESULT_STORAGE_KEY = "eurs.import.result";

export function clearAllImportedData() {
  if (typeof window === "undefined") return;
  for (const k of Object.values(IMPORT_TAB_STORAGE_KEY)) {
    sessionStorage.removeItem(k);
  }
  sessionStorage.removeItem(IMPORT_RESULT_STORAGE_KEY);
}

export function clearImportedData(tab: ImportTab) {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(IMPORT_TAB_STORAGE_KEY[tab]);
  try {
    const raw = sessionStorage.getItem(IMPORT_RESULT_STORAGE_KEY);
    if (!raw) return;
    const r = JSON.parse(raw) as Record<ImportTab, unknown[]>;
    r[tab] = [];
    if (r.helmet.length === 0 && r.shoes.length === 0 && r.uniform.length === 0) {
      sessionStorage.removeItem(IMPORT_RESULT_STORAGE_KEY);
    } else {
      sessionStorage.setItem(IMPORT_RESULT_STORAGE_KEY, JSON.stringify(r));
    }
  } catch {
    sessionStorage.removeItem(IMPORT_RESULT_STORAGE_KEY);
  }
}
