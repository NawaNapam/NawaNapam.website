import { signIn, signOut, getSession } from "next-auth/react";
import type { AuthProvider, AuthUser, CredentialsResult } from "./AuthProvider";

/**
 * Credentials login, logout, and session lookup are identical on web and
 * native today (both go through NextAuth) — shared here so `NativeAuth` and
 * `WebAuth` only need to differ on `loginWithGoogle`.
 */
export abstract class BaseAuth implements AuthProvider {
  abstract loginWithGoogle(callbackUrl: string): Promise<void>;

  async loginWithCredentials(email: string, password: string): Promise<CredentialsResult> {
    const result = await signIn("credentials", { email, password, redirect: false });
    if (result?.error) {
      return { ok: false, error: result.error };
    }
    return { ok: true };
  }

  async logout(callbackUrl = "/"): Promise<void> {
    await signOut({ callbackUrl });
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    const session = await getSession();
    if (!session?.user) return null;
    return session.user as AuthUser;
  }
}
