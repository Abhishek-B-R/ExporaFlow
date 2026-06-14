import { prisma } from "@/db";
import { cloudinaryMimeType } from "@/lib/cloudinary-config";

export type CloudinaryMediaInput = {
  publicId: string;
  secureUrl: string;
  resourceType: string;
  bytes?: number;
  originalFilename?: string;
  format?: string;
};

export async function saveCloudinaryAttachments(params: {
  issueId: string;
  uploadedById: string;
  media: CloudinaryMediaInput[];
}) {
  if (params.media.length === 0) return [];

  const rows = await Promise.all(
    params.media.map((item) =>
      prisma.issueAttachment.create({
        data: {
          issueId: params.issueId,
          uploadedById: params.uploadedById,
          provider: "cloudinary",
          cloudinaryPublicId: item.publicId,
          deliveryUrl: item.secureUrl,
          resourceType: item.resourceType,
          storageKey: `cloudinary/${item.publicId}`,
          fileName:
            item.originalFilename?.trim() ||
            item.publicId.split("/").pop() ||
            "media",
          mimeType: cloudinaryMimeType(item.resourceType, item.format),
          sizeBytes: item.bytes ?? 0,
        },
        include: {
          uploadedBy: { select: { id: true, name: true, email: true } },
        },
      }),
    ),
  );

  return rows;
}
