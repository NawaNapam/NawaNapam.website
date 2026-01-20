import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdmin, hasAdminRole } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateReportSchema = z.object({
  status: z.enum(["PENDING", "REVIEWED", "ACTION_TAKEN"]),
  reviewedBy: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> },
) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin || !hasAdminRole(admin, "MODERATOR")) {
      return NextResponse.json(
        { error: "Only moderators and above can update reports" },
        { status: 403 },
      );
    }

    const { reportId } = await params;
    const body = await request.json();
    const { status, reviewedBy } = updateReportSchema.parse(body);

    // Check if report exists
    const report = await prisma.report.findUnique({ where: { id: reportId } });
    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Update report
    const updatedReport = await prisma.report.update({
      where: { id: reportId },
      data: {
        status,
        reviewedBy: reviewedBy || admin.id,
      },
      include: {
        reporter: {
          select: { email: true, username: true },
        },
        reportedUser: {
          select: { email: true, username: true, banned: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      report: updatedReport,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error },
        { status: 400 },
      );
    }

    console.error("Update report error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
