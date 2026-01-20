import { NextRequest, NextResponse } from "next/server";
import {
  getCurrentAdmin,
  hasAdminRole,
  createAdminUser,
} from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createAdminSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "MODERATOR"]),
});

// Get all admins
export async function GET(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin || !hasAdminRole(admin, "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admins = await prisma.admin.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ admins });
  } catch (error) {
    console.error("Get admins error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Create new admin (SUPER_ADMIN only)
export async function POST(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin || !hasAdminRole(admin, "SUPER_ADMIN")) {
      return NextResponse.json(
        { error: "Only super admins can create admin users" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { email, password, name, role } = createAdminSchema.parse(body);

    // Check if admin already exists
    const existing = await prisma.admin.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Admin with this email already exists" },
        { status: 400 },
      );
    }

    const newAdmin = await createAdminUser(email, password, name, role);

    return NextResponse.json({
      success: true,
      admin: newAdmin,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error },
        { status: 400 },
      );
    }

    console.error("Create admin error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
