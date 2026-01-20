import { cookies } from "next/headers";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

const ADMIN_SESSION_COOKIE = "admin_session";
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  role: "SUPER_ADMIN" | "ADMIN" | "MODERATOR";
  isActive: boolean;
}

/**
 * Create a new admin session
 */
export async function createAdminSession(
  adminId: string,
  ipAddress?: string,
  userAgent?: string,
): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DURATION);

  await prisma.adminSession.create({
    data: {
      adminId,
      token,
      expiresAt,
      ipAddress,
      userAgent,
    },
  });

  // Update last login
  await prisma.admin.update({
    where: { id: adminId },
    data: { lastLoginAt: new Date() },
  });

  return token;
}

/**
 * Verify admin login credentials
 */
export async function verifyAdminCredentials(
  email: string,
  password: string,
): Promise<AdminUser | null> {
  const admin = await prisma.admin.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!admin || !admin.isActive) {
    return null;
  }

  const isValid = await bcrypt.compare(password, admin.passwordHash);
  if (!isValid) {
    return null;
  }

  return {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
    isActive: admin.isActive,
  };
}

/**
 * Get current admin from session cookie
 */
export async function getCurrentAdmin(): Promise<AdminUser | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (!sessionToken) {
    return null;
  }

  const session = await prisma.adminSession.findUnique({
    where: { token: sessionToken },
    include: { admin: true },
  });

  if (!session || session.expiresAt < new Date() || !session.admin.isActive) {
    // Clean up expired session
    if (session) {
      await prisma.adminSession.delete({ where: { id: session.id } });
    }
    return null;
  }

  return {
    id: session.admin.id,
    email: session.admin.email,
    name: session.admin.name,
    role: session.admin.role,
    isActive: session.admin.isActive,
  };
}

/**
 * Delete admin session (logout)
 */
export async function deleteAdminSession(token: string): Promise<void> {
  await prisma.adminSession.deleteMany({ where: { token } });
}

/**
 * Clean up expired sessions
 */
export async function cleanupExpiredSessions(): Promise<void> {
  await prisma.adminSession.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
}

/**
 * Check if admin has required role
 */
export function hasAdminRole(
  admin: AdminUser | null,
  requiredRole: "SUPER_ADMIN" | "ADMIN" | "MODERATOR",
): boolean {
  if (!admin) return false;

  const roleHierarchy = {
    SUPER_ADMIN: 3,
    ADMIN: 2,
    MODERATOR: 1,
  };

  return roleHierarchy[admin.role] >= roleHierarchy[requiredRole];
}

/**
 * Create a new admin user (only for super admin or initial setup)
 */
export async function createAdminUser(
  email: string,
  password: string,
  name?: string,
  role: "SUPER_ADMIN" | "ADMIN" | "MODERATOR" = "MODERATOR",
): Promise<AdminUser> {
  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.admin.create({
    data: {
      email: email.toLowerCase(),
      passwordHash,
      name,
      role,
    },
  });

  return {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
    isActive: admin.isActive,
  };
}
