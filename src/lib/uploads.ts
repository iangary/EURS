import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads");
const MAX_MB = Number(process.env.MAX_UPLOAD_MB ?? "10");
export const MAX_ATTACHMENTS = Number(process.env.MAX_ATTACHMENTS_PER_REQUEST ?? "5");

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "application/pdf"]);
const ALLOWED_EXT = new Set([".jpg", ".jpeg", ".png", ".pdf"]);

export class UploadError extends Error {}

export type SavedFile = {
  fileName: string;
  storedPath: string; // 相對於 UPLOAD_DIR
  absolutePath: string;
  mimeType: string;
  size: number;
};

export async function saveUpload(file: File): Promise<SavedFile> {
  if (file.size > MAX_MB * 1024 * 1024) {
    throw new UploadError(`檔案大小超過 ${MAX_MB} MB 上限`);
  }
  const ext = path.extname(file.name).toLowerCase();
  if (!ALLOWED_EXT.has(ext) || !ALLOWED_MIME.has(file.type)) {
    throw new UploadError("僅允許 JPG／PNG／PDF 格式");
  }

  const today = new Date();
  const subdir = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}`;
  const dir = path.join(UPLOAD_DIR, subdir);
  await fs.mkdir(dir, { recursive: true });

  const id = randomUUID();
  const stored = path.join(subdir, `${id}${ext}`);
  const abs = path.join(UPLOAD_DIR, stored);
  const buf = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(abs, buf);

  return {
    fileName: file.name,
    storedPath: stored.replaceAll(path.sep, "/"),
    absolutePath: abs,
    mimeType: file.type,
    size: file.size,
  };
}

export function resolveStoredPath(stored: string): string {
  // 防止路徑跳脫
  const safe = path.normalize(stored).replace(/^([/\\])+/, "");
  const abs = path.join(UPLOAD_DIR, safe);
  if (!abs.startsWith(path.resolve(UPLOAD_DIR))) {
    throw new UploadError("非法路徑");
  }
  return abs;
}
