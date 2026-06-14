import { authOptions } from "@/lib/auth";
import { configureCloudinary } from "@/lib/cloudinary-config";
import { getServerSession } from "next-auth";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!secret) {
    return Response.json(
      { message: "Cloudinary is not configured." },
      { status: 503 },
    );
  }

  const body = await request.json();
  const { paramsToSign } = body as { paramsToSign?: Record<string, string> };
  if (!paramsToSign || typeof paramsToSign !== "object") {
    return Response.json({ message: "paramsToSign is required." }, { status: 400 });
  }

  const cloudinary = configureCloudinary();
  const signature = cloudinary.utils.api_sign_request(paramsToSign, secret);

  return Response.json({ signature });
}
