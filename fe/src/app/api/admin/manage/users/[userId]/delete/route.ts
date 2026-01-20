import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdmin, hasAdminRole } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } },
) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin || !hasAdminRole(admin, "SUPER_ADMIN")) {
      return NextResponse.json(
        { error: "Only super admins can delete users" },
        { status: 403 },
      );
    }

    const userId = params.userId;

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Delete user (cascade will handle related records)
    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
