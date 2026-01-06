import { z } from "zod";

/**
 * Lazy load DOMPurify to avoid loading jsdom on server startup
 */
let DOMPurify: typeof import("isomorphic-dompurify").default | null = null;

async function getDOMPurify() {
  if (!DOMPurify) {
    DOMPurify = (await import("isomorphic-dompurify")).default;
  }
  return DOMPurify;
}

/**
 * Sanitize HTML to prevent XSS attacks
 * Note: This is async to support lazy loading of DOMPurify
 */
export async function sanitizeHtml(dirty: string): Promise<string> {
  const purify = await getDOMPurify();
  return purify.sanitize(dirty, {
    ALLOWED_TAGS: ["b", "i", "em", "strong", "a", "p", "br"],
    ALLOWED_ATTR: ["href", "title", "target"],
  });
}

/**
 * Sanitize plain text input
 */
export function sanitizeText(text: string): string {
  // Remove any HTML tags
  const cleaned = text.replace(/<[^>]*>/g, "");
  // Trim whitespace
  return cleaned.trim();
}

/**
 * Sanitize email
 */
export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * Validate and sanitize username
 */
export const usernameSchema = z
  .string()
  .min(3, "Username must be at least 3 characters")
  .max(30, "Username must be at most 30 characters")
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    "Username can only contain letters, numbers, underscores, and hyphens"
  );

/**
 * Validate and sanitize email
 */
export const emailSchema = z
  .string()
  .email("Invalid email address")
  .max(255, "Email must be at most 255 characters")
  .transform((email) => email.toLowerCase().trim());

/**
 * Validate password
 */
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be at most 128 characters")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    "Password must contain at least one uppercase letter, one lowercase letter, and one number"
  );

/**
 * Validate phone number
 */
export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format")
  .optional();

/**
 * Validate name
 */
export const nameSchema = z
  .string()
  .min(1, "Name is required")
  .max(100, "Name must be at most 100 characters")
  .transform(sanitizeText);

/**
 * Comprehensive signup validation
 */
export const signupValidation = z.object({
  email: emailSchema,
  password: passwordSchema,
  username: usernameSchema,
});

/**
 * Login validation
 */
export const loginValidation = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

/**
 * Update user validation
 */
export const updateUserValidation = z.object({
  name: nameSchema.optional(),
  username: usernameSchema.optional(),
  email: emailSchema.optional(),
  password: passwordSchema.optional(),
  phoneNumber: phoneSchema,
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  image: z.string().url("Invalid image URL").optional(),
});

/**
 * Escape SQL wildcards to prevent SQL injection in LIKE queries
 */
export function escapeSqlWildcards(value: string): string {
  return value.replace(/[%_]/g, "\\$&");
}

/**
 * Validate and sanitize URL
 */
export function sanitizeUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Remove potentially dangerous characters from file names
 */
export function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "_").substring(0, 255);
}

/**
 * Type-safe JSON parsing with validation
 */
export function safeJsonParse<T>(
  json: string,
  schema: z.ZodSchema<T>
): T | null {
  try {
    const parsed = JSON.parse(json);
    return schema.parse(parsed);
  } catch {
    return null;
  }
}

/**
 * Prevent prototype pollution
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized = { ...obj };
  delete (sanitized as Record<string, unknown>)["__proto__"];
  delete (sanitized as Record<string, unknown>)["constructor"];
  delete (sanitized as Record<string, unknown>)["prototype"];
  return sanitized;
}
