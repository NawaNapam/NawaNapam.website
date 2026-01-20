import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { deleteAdminSession } from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("admin_session")?.value;

    if (sessionToken) {
      await deleteAdminSession(sessionToken);
      cookieStore.delete("admin_session");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin logout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
