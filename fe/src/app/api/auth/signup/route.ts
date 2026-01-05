import { sendWelcomeEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { authRateLimiter, getClientIdentifier } from "@/lib/rate-limit";
import { signupValidation } from "@/lib/security";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    // Apply rate limiting
    const identifier = getClientIdentifier(req);
    const { success, limit, remaining, reset } =
      await authRateLimiter.limit(identifier);

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

    const body = await req.json();

    // Validate and sanitize input
    const validation = signupValidation.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { email, password, username } = validation.data;

    // Check existing user
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      const field =
        existingUser.email === email
          ? "Email"
          : existingUser.username === username
            ? "Username"
            : "User";

      return NextResponse.json(
        { error: `${field} already exists` },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const createdUser = await prisma.user.create({
      data: {
        email,
        passwordHash,
        username,
        name: "not set",
        isAnonymous: false,
      },
      select: {
        id: true,
        email: true,
        username: true,
        createdAt: true,
      },
    });

    await sendWelcomeEmail(email);

    return NextResponse.json(
      { message: "User created successfully", user: createdUser },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
