"use client";

import { customToast } from "@/lib/custom-toast";
import { CldImage, CldUploadWidget } from "next-cloudinary";
import axios from "axios";
import { useCallback, useState } from "react";

export type PendingTicketMedia = {
  publicId: string;
  secureUrl: string;
  resourceType: string;
  bytes: number;
  originalFilename: string;
  format?: string;
};

type CloudinaryUploadInfo = {
  public_id: string;
  secure_url: string;
  resource_type: string;
  bytes?: number;
  original_filename?: string;
  format?: string;
};

function parseUploadInfo(info: unknown): PendingTicketMedia | null {
  if (!info || typeof info !== "object") return null;
  const row = info as CloudinaryUploadInfo;
  if (!row.public_id || !row.secure_url || !row.resource_type) return null;
  return {
    publicId: row.public_id,
    secureUrl: row.secure_url,
    resourceType: row.resource_type,
    bytes: row.bytes ?? 0,
    originalFilename: row.original_filename || row.public_id.split("/").pop() || "media",
    format: row.format,
  };
}

type Props = {
  value: PendingTicketMedia[];
  onChange: (next: PendingTicketMedia[]) => void;
  maxFiles?: number;
  label?: string;
  compact?: boolean;
  /** When set, uploads go straight to this ticket instead of pending state. */
  issueId?: string;
  onUploaded?: () => void;
};

export function TicketMediaUploader({
  value,
  onChange,
  maxFiles = 5,
  label = "Issue photos & videos",
  compact = false,
  issueId,
  onUploaded,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  const addMedia = useCallback(
    async (item: PendingTicketMedia) => {
      if (issueId) {
        try {
          setUploading(true);
          await axios.post("/api/issues/attachments/cloudinary", {
            issueId,
            media: cloudinaryMediaPayload([item])[0],
          });
          customToast.success({ title: "", description: "Media attached to ticket." });
          onUploaded?.();
        } catch {
          customToast.error({ title: "", description: "Could not save media to ticket." });
        } finally {
          setUploading(false);
        }
        return;
      }

      if (value.some((v) => v.publicId === item.publicId)) return;
      if (value.length >= maxFiles) return;
      onChange([...value, item]);
    },
    [issueId, maxFiles, onChange, onUploaded, value],
  );

  const removeMedia = (publicId: string) => {
    onChange(value.filter((item) => item.publicId !== publicId));
  };

  if (!cloudName) {
    return (
      <p className="text-xs text-(--muted-2)">
        Media uploads are unavailable (Cloudinary is not configured).
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        {label ? <p className="text-xs font-medium text-(--muted)">{label}</p> : <span />}
        <CldUploadWidget
          signatureEndpoint="/api/cloudinary/sign"
          onUploadAdded={() => setUploading(true)}
          onQueuesEnd={() => setUploading(false)}
          onSuccess={(result) => {
            const item = parseUploadInfo(result.info);
            if (item) void addMedia(item);
          }}
          options={{
            folder: "exporaflow/tickets",
            resourceType: "auto",
            sources: ["local", "camera", "url"],
            multiple: true,
            maxFiles: Math.max(0, maxFiles - value.length),
            clientAllowedFormats: [
              "jpg",
              "jpeg",
              "png",
              "webp",
              "gif",
              "mp4",
              "mov",
              "webm",
            ],
          }}
        >
          {({ open }) => (
            <button
              type="button"
              disabled={uploading || (!issueId && value.length >= maxFiles)}
              onClick={() => open()}
              className={`rounded-md border border-(--border-strong) bg-(--surface-2) text-xs font-medium hover:bg-(--surface-3) disabled:opacity-50 ${
                compact ? "h-7 px-2.5" : "h-8 px-3"
              }`}
            >
              {uploading
                ? "Uploading…"
                : !issueId && value.length >= maxFiles
                  ? "Limit reached"
                  : "Add photo/video"}
            </button>
          )}
        </CldUploadWidget>
      </div>

      {issueId ? null : value.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {value.map((item) => (
            <div
              key={item.publicId}
              className="relative rounded-lg border border-(--border) bg-(--surface-2) overflow-hidden"
            >
              {item.resourceType === "video" ? (
                <video
                  src={item.secureUrl}
                  className="w-full h-24 object-cover bg-black"
                  controls
                  preload="metadata"
                />
              ) : (
                <CldImage
                  src={item.publicId}
                  alt={item.originalFilename}
                  width={240}
                  height={160}
                  crop={{ type: "auto", source: true }}
                  className="w-full h-24 object-cover"
                />
              )}
              <button
                type="button"
                onClick={() => removeMedia(item.publicId)}
                className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/60 text-white text-xs hover:bg-black/80"
                aria-label="Remove media"
              >
                ×
              </button>
              <p className="px-2 py-1 text-[10px] text-(--muted-2) truncate">
                {item.originalFilename}
              </p>
            </div>
          ))}
        </div>
      ) : !issueId ? (
        <p className="text-xs text-(--muted-2)">
          Attach screenshots or screen recordings of the issue (up to {maxFiles} files).
        </p>
      ) : null}
    </div>
  );
}

export function cloudinaryMediaPayload(items: PendingTicketMedia[]) {
  return items.map((item) => ({
    publicId: item.publicId,
    secureUrl: item.secureUrl,
    resourceType: item.resourceType,
    bytes: item.bytes,
    originalFilename: item.originalFilename,
    format: item.format,
  }));
}
