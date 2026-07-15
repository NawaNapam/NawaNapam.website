import { ENV_FORCE_NATIVE, ENV_PLATFORM_OVERRIDE } from "./constants";

export const isProduction = process.env.NODE_ENV === "production";
export const isDevelopment = !isProduction;

export type OS = "android" | "ios" | "web";

export interface DevOverride {
  forceNative: boolean;
  os?: Extract<OS, "android" | "ios">;
}

/**
 * Lets a plain desktop/mobile browser simulate native behavior during
 * development, so auth/storage/share/notification code paths can be exercised
 * without an emulator. Never honored in production builds.
 */
export function getDevOverride(): DevOverride | null {
  if (isProduction) return null;

  const forceNative = process.env[ENV_FORCE_NATIVE] === "true";
  const osOverride = process.env[ENV_PLATFORM_OVERRIDE];
  const os = osOverride === "android" || osOverride === "ios" ? osOverride : undefined;

  if (!forceNative && !os) return null;
  return { forceNative: forceNative || !!os, os };
}
