"use client";

import { customToast } from "@/lib/custom-toast";
import axios from "axios";
import { useCallback, useEffect, useRef, useState } from "react";

type AttachmentRow = {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  uploadedBy: { id: string; name?: string | null; email?: string | null };
};

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function IssueAttachmentsPanel({
  issueId,
  canUpload,
  canDelete,
}: {
  issueId: string;
  canUpload: boolean;
  canDelete: boolean;
}) {
  const [rows, setRows] = useState<AttachmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get<AttachmentRow[]>("/api/issues/attachments", {
        params: { issueId },
      });
      setRows(res.data ?? []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [issueId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const onUpload = async (file: File | null) => {
    if (!file || !canUpload) return;
    try {
      setUploading(true);
      const form = new FormData();
      form.append("issueId", issueId);
      form.append("file", file);
      await axios.post("/api/issues/attachments", form);
      await refresh();
      customToast.success({ title: "", description: "Document uploaded." });
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.message ?? "Upload failed."
        : "Upload failed.";
      customToast.error({ title: "", description: msg });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const onDelete = async (id: string) => {
    if (!canDelete) return;
    if (!window.confirm("Delete this attachment?")) return;
    try {
      await axios.delete(`/api/issues/attachments/${id}`);
      await refresh();
      customToast.success({ title: "", description: "Attachment removed." });
    } catch {
      customToast.error({ title: "", description: "Could not delete attachment." });
    }
  };

  return (
    <div className="space-y-2 pt-4 border-t border-(--border)">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-(--muted-2) uppercase tracking-wide">
          Documents
        </p>
        {canUpload ? (
          <>
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.csv,.doc,.docx,.xls,.xlsx"
              onChange={(e) => void onUpload(e.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
              className="h-7 px-2.5 rounded-md border border-(--border-strong) bg-(--surface-2) text-xs font-medium hover:bg-(--surface-3) disabled:opacity-50"
            >
              {uploading ? "Uploading…" : "Add document"}
            </button>
          </>
        ) : null}
      </div>

      {loading ? (
        <p className="text-xs text-(--muted-2)">Loading documents…</p>
      ) : rows.length === 0 ? (
        <p className="text-xs text-(--muted-2)">No documents attached yet.</p>
      ) : (
        <ul className="space-y-1.5">
          {rows.map((row) => (
            <li
              key={row.id}
              className="flex items-center gap-2 rounded-md border border-(--border) bg-(--surface-2) px-2.5 py-2 text-sm"
            >
              <div className="min-w-0 flex-1">
                <a
                  href={`/api/issues/attachments/${row.id}/download`}
                  className="font-medium text-sky-700 hover:underline truncate block"
                  download
                >
                  {row.fileName}
                </a>
                <p className="text-[10px] text-(--muted-2)">
                  {formatBytes(row.sizeBytes)} ·{" "}
                  {row.uploadedBy.name || row.uploadedBy.email || "User"}
                </p>
              </div>
              {canDelete ? (
                <button
                  type="button"
                  onClick={() => void onDelete(row.id)}
                  className="text-xs text-red-600 hover:underline shrink-0"
                >
                  Delete
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
