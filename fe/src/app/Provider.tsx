"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";
import { Session } from "next-auth";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/providers/AuthProvider";
import NativeStatusBar from "@/components/native/NativeStatusBar";
import NativePush from "@/components/native/NativePush";

type Props = { children: ReactNode; session?: Session | null };

export default function Providers({ children, session }: Props) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <SessionProvider session={session}>
        <AuthProvider>
          <NativeStatusBar />
          <NativePush />
          {children}
        </AuthProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
