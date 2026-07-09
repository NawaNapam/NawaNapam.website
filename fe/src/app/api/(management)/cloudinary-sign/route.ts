import { authOptions } from "@/lib/authOptions";
import { apiRateLimiter, getClientIdentifier } from "@/lib/rate-limit";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
  const identifier = getClientIdentifier(req);
  const { success } = await apiRateLimiter.limit(identifier);
  if (!success) {
    return NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const timestamp = Math.round(Date.now() / 1000);
  const folder = "avatars";
  const publicId = `user_${session.user.id}`;

  const paramsToSign = {
    timestamp,
    folder,
    public_id: publicId,
    overwrite: true,
  };

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET as string
  );

  return NextResponse.json({
    signature,
    timestamp,
    folder,
    publicId,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  });
}
