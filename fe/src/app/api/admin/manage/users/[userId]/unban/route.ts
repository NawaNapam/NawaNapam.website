import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdmin, hasAdminRole } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } },
) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin || !hasAdminRole(admin, "ADMIN")) {
      return NextResponse.json(
        { error: "Only admins and super admins can unban users" },
        { status: 403 },
      );
    }

    const userId = params.userId;
    const body = await request.json();
    const { reason } = body;

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Unban the user
    await prisma.user.update({
      where: { id: userId },
      data: { banned: false },
    });

    // Log the moderation action (optional - you might want to add UNBAN to ModerationAction enum)
    await prisma.moderationLog.create({
      data: {
        userId,
        action: "WARN", // You may want to add UNBAN to the enum
        reason: reason || "User unbanned",
        performedBy: admin.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "User unbanned successfully",
    });
  } catch (error) {
    console.error("Unban user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
