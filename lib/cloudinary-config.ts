import { v2 as cloudinary } from "cloudinary";

export function configureCloudinary() {
  cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  return cloudinary;
}

export function cloudinaryMimeType(
  resourceType: string,
  format?: string | null,
): string {
  if (resourceType === "video") {
    return format ? `video/${format}` : "video/mp4";
  }
  if (resourceType === "image") {
    return format ? `image/${format}` : "image/jpeg";
  }
  return "application/octet-stream";
}

export function isCloudinaryAttachment(row: {
  provider?: string | null;
  storageKey?: string | null;
}) {
  return (
    row.provider === "cloudinary" ||
    (row.storageKey?.startsWith("cloudinary/") ?? false)
  );
}
