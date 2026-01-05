import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { apiRateLimiter, getClientIdentifier } from "@/lib/rate-limit";
import { updateUserValidation } from "@/lib/security";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function PUT(req: Request) {
  try {
    // Apply rate limiting
    const identifier = getClientIdentifier(req);
    const { success, limit, remaining, reset } =
      await apiRateLimiter.limit(identifier);

    if (!success) {
      return new NextResponse("Too Many Requests", {
        status: 429,
        headers: {
          "X-RateLimit-Limit": limit.toString(),
          "X-RateLimit-Remaining": remaining.toString(),
          "X-RateLimit-Reset": reset.toString(),
          "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString(),
        },
      });
    }

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Validate and sanitize input
    const validation = updateUserValidation.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { name, username, email, password, image, phoneNumber, gender } =
      validation.data;

    // Validate required fields
    if (
      !name &&
      !username &&
      !email &&
      !password &&
      !image &&
      !phoneNumber &&
      !gender
    ) {
      return NextResponse.json(
        { error: "At least one field is required for update" },
        { status: 400 }
      );
    }

    // Check if user exists and is not banned
    const existingUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        username: true,
        banned: true,
      },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (existingUser.banned) {
      return NextResponse.json(
        { error: "Account is banned and cannot be updated" },
        { status: 403 }
      );
    }

    // Check for duplicate email or username (excluding current user)
    if (email || username) {
      const duplicateUser = await prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: session.user.id } },
            {
              OR: [
                ...(email ? [{ email }] : []),
                ...(username ? [{ username }] : []),
              ],
            },
          ],
        },
      });

      if (duplicateUser) {
        const field = duplicateUser.email === email ? "Email" : "Username";
        return NextResponse.json(
          { error: `${field} already exists` },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: {
      name?: string;
      username?: string;
      email?: string;
      image?: string;
      passwordHash?: string;
      phoneNumber?: string;
      gender?: "MALE" | "FEMALE" | "OTHER";
    } = {};

    if (name !== undefined) updateData.name = name;
    if (username !== undefined) updateData.username = username;
    if (email !== undefined) updateData.email = email;
    if (image !== undefined) updateData.image = image;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
    if (gender !== undefined) updateData.gender = gender;

    // Hash new password if provided
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 12);
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        image: true,
        isAnonymous: true,
        phoneNumber: true,
        gender: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(
      {
        message: "User updated successfully",
        user: updatedUser,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
