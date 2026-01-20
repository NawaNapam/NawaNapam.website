import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdmin, hasAdminRole } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

// Get moderation logs with pagination and filters
export async function GET(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin || !hasAdminRole(admin, "MODERATOR")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const action = searchParams.get("action");

    const skip = (page - 1) * limit;

    // Build filter
    const where: any = {};
    if (action && action !== "all") {
      where.action = action;
    }

    const [logs, total] = await Promise.all([
      prisma.moderationLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
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
      }),
      prisma.moderationLog.count({ where }),
    ]);

    // Get admin details for performedBy
    const adminIds = [...new Set(logs.map((log) => log.performedBy))];
    const admins = await prisma.admin.findMany({
      where: { id: { in: adminIds } },
      select: { id: true, email: true, name: true },
    });

    const adminsMap = new Map(admins.map((a) => [a.id, a]));

    const logsWithAdmin = logs.map((log) => ({
      ...log,
      performedByAdmin: adminsMap.get(log.performedBy) || null,
    }));

    return NextResponse.json({
      logs: logsWithAdmin,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get moderation logs error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
