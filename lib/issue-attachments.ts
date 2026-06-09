import { mkdir, writeFile, unlink, readFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
export const ALLOWED_ATTACHMENT_MIME = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "text/plain",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

const STORAGE_ROOT = path.join(process.cwd(), "storage", "issue-attachments");

export function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 180) || "file";
}

export async function saveIssueAttachmentFile(params: {
  issueId: string;
  fileName: string;
  bytes: Buffer;
}) {
  const storageKey = `${params.issueId}/${randomUUID()}-${sanitizeFileName(params.fileName)}`;
  const absolutePath = path.join(STORAGE_ROOT, storageKey);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, params.bytes);
  return storageKey;
}

export async function readIssueAttachmentFile(storageKey: string) {
  const absolutePath = path.join(STORAGE_ROOT, storageKey);
  return readFile(absolutePath);
}

export async function deleteIssueAttachmentFile(storageKey: string) {
  const absolutePath = path.join(STORAGE_ROOT, storageKey);
  try {
    await unlink(absolutePath);
  } catch {
    // missing file on disk is acceptable
  }
}
