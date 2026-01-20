import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdmin, hasAdminRole } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

// Get all chat rooms with pagination and filters
export async function GET(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin || !hasAdminRole(admin, "MODERATOR")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status");

    const skip = (page - 1) * limit;

    // Build filter
    const where: Record<string, string> = {};
    if (status && status !== "all") {
      where.status = status;
    }

    const [rooms, total] = await Promise.all([
      prisma.chatRoom.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  username: true,
                  name: true,
                  banned: true,
                },
              },
            },
          },
          reports: {
            select: {
              id: true,
              status: true,
            },
          },
          _count: {
            select: {
              participants: true,
              reports: true,
            },
          },
        },
      }),
      prisma.chatRoom.count({ where }),
    ]);

    return NextResponse.json({
      rooms,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get rooms error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
