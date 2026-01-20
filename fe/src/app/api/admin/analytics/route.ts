import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdmin, hasAdminRole } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin || !hasAdminRole(admin, "MODERATOR")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get time range from query params (default to last 30 days)
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");

    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    // User growth over time
    const userGrowth = await prisma.$queryRaw<
      Array<{ date: string; count: bigint }>
    >`
      SELECT 
        DATE("createdAt") as date,
        COUNT(*) as count
      FROM "User"
      WHERE "createdAt" >= ${startDate}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `;

    // Room activity over time
    const roomActivity = await prisma.$queryRaw<
      Array<{ date: string; count: bigint }>
    >`
      SELECT 
        DATE("createdAt") as date,
        COUNT(*) as count
      FROM "ChatRoom"
      WHERE "createdAt" >= ${startDate}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `;

    // Reports over time
    const reportsOverTime = await prisma.$queryRaw<
      Array<{ date: string; count: bigint }>
    >`
      SELECT 
        DATE("createdAt") as date,
        COUNT(*) as count
      FROM "Report"
      WHERE "createdAt" >= ${startDate}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `;

    // User types distribution
    const userTypes = await prisma.user.groupBy({
      by: ["isAnonymous", "banned"],
      _count: true,
    });

    // Room status distribution
    const roomStatus = await prisma.chatRoom.groupBy({
      by: ["status"],
      _count: true,
    });

    // Gender distribution (exclude null)
    const genderDistribution = await prisma.user.groupBy({
      by: ["gender"],
      _count: true,
      where: {
        gender: { not: null },
      },
    });

    // Report status distribution
    const reportStatus = await prisma.report.groupBy({
      by: ["status"],
      _count: true,
    });

    // Top reporters
    const topReporters = await prisma.report.groupBy({
      by: ["reporterId"],
      _count: true,
      orderBy: {
        _count: {
          reporterId: "desc",
        },
      },
      take: 5,
    });

    const reporterDetails = await prisma.user.findMany({
      where: {
        id: { in: topReporters.map((r) => r.reporterId) },
      },
      select: {
        id: true,
        email: true,
        username: true,
      },
    });

    const topReportersWithDetails = topReporters.map((r) => {
      const user = reporterDetails.find((u) => u.id === r.reporterId);
      return {
        userId: r.reporterId,
        username: user?.username || user?.email || "Unknown",
        count: r._count,
      };
    });

    // Most reported users
    const mostReported = await prisma.report.groupBy({
      by: ["reportedUserId"],
      _count: true,
      orderBy: {
        _count: {
          reportedUserId: "desc",
        },
      },
      take: 5,
    });

    const reportedUserDetails = await prisma.user.findMany({
      where: {
        id: { in: mostReported.map((r) => r.reportedUserId) },
      },
      select: {
        id: true,
        email: true,
        username: true,
        banned: true,
      },
    });

    const mostReportedWithDetails = mostReported.map((r) => {
      const user = reportedUserDetails.find((u) => u.id === r.reportedUserId);
      return {
        userId: r.reportedUserId,
        username: user?.username || user?.email || "Unknown",
        banned: user?.banned || false,
        count: r._count,
      };
    });

    // Active users (users who joined rooms in the time period)
    const activeUsersCount = await prisma.participant.findMany({
      where: {
        joinedAt: { gte: startDate },
      },
      distinct: ["userId"],
      select: { userId: true },
    });

    return NextResponse.json({
      timeRange: { days, startDate, endDate: now },
      userGrowth: userGrowth.map((d) => ({
        date: d.date,
        count: Number(d.count),
      })),
      roomActivity: roomActivity.map((d) => ({
        date: d.date,
        count: Number(d.count),
      })),
      reportsOverTime: reportsOverTime.map((d) => ({
        date: d.date,
        count: Number(d.count),
      })),
      distributions: {
        userTypes: userTypes.map((t) => ({
          type: t.isAnonymous ? "Anonymous" : t.banned ? "Banned" : "Active",
          count: t._count,
        })),
        roomStatus: roomStatus.map((s) => ({
          status: s.status,
          count: s._count,
        })),
        gender: genderDistribution.map((g) => ({
          gender: g.gender,
          count: g._count,
        })),
        reportStatus: reportStatus.map((r) => ({
          status: r.status,
          count: r._count,
        })),
      },
      insights: {
        topReporters: topReportersWithDetails,
        mostReported: mostReportedWithDetails,
        activeUsersCount: activeUsersCount.length,
      },
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
