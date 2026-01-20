import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdmin, hasAdminRole } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin || !hasAdminRole(admin, "ADMIN")) {
      return NextResponse.json(
        { error: "Only admins and above can ban users" },
        { status: 403 },
      );
    }

    const { userId } = await params;
    const body = await request.json();
    const { reason } = body;

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Ban the user
    await prisma.user.update({
      where: { id: userId },
      data: { banned: true },
    });

    // Log the moderation action
    await prisma.moderationLog.create({
      data: {
        userId,
        action: "BAN",
        reason: reason || "No reason provided",
        performedBy: admin.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "User banned successfully",
    });
  } catch (error) {
    console.error("Ban user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
