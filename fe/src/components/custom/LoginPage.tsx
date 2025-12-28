"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Toaster } from "@/components/ui/sonner";
import { Mail, Lock, Loader2, ArrowLeft, Globe, Sparkles } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const time = now.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      const date = now.toLocaleDateString("en-IN", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      setCurrentTime(`${date}, ${time} IST`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password");
      // toast.error("Invalid email or password");
    } else {
      // toast.success("Welcome back!");
      setTimeout(() => (window.location.href = "/dashboard"), 100);
    }
    setIsLoading(false);
  };

  const handleProvider = (provider: "google" | "instagram") => {
    signIn(provider, { callbackUrl: "/dashboard" });
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center md:p-4 overflow-hidden bg-gradient-to-br from-[#0a140a] via-[#0f1a0f] to-[#0a140a]">
      {/* Golden Animated Blobs */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute w-96 h-96 bg-amber-600/40 rounded-full blur-3xl -top-48 -left-48 animate-pulse" />
        <div className="absolute w-80 h-80 bg-emerald-700/40 rounded-full blur-3xl -bottom-40 -right-40 animate-pulse delay-700" />
      </div>

      {/* Floating Sparkles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <Sparkles
            key={i}
            size={18}
            className="absolute text-amber-400/30 animate-float"
            style={{
              top: `${15 + i * 14}%`,
              left: i % 2 === 0 ? "8%" : "78%",
              animationDelay: `${i * 0.6}s`,
            }}
          />
        ))}
      </div>

      {/* Top Bar */}
      <div className="absolute top-6 left-6 right-6 md:flex justify-between items-center z-20 hidden">
        <Link
          href="/"
          className="group flex items-center gap-2 text-amber-200 hover:text-amber-100 text-sm font-medium transition-all"
        >
          <ArrowLeft
            size={16}
            className="group-hover:-translate-x-1 transition-transform"
          />
          Back to Home
        </Link>
        <div className="flex items-center gap-2 text-amber-200 text-xs font-medium">
          <Globe size={14} className="text-amber-400" />
          <span className="font-mono tracking-wider">{currentTime}</span>
        </div>
      </div>

      {/* Login Card */}
      <Card className="relative z-10 w-full max-w-md bg-white/8 backdrop-blur-2xl border border-amber-500/30 rounded-lg shadow-lg shadow-amber-500/20 p-8">
        <div className="text-center mb-10">
          <h1
            className="text-4xl font-black tracking-tight"
            style={{ fontFamily: "var(--font-cinzel), serif" }}
          >
            <span className="bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-300 bg-clip-text text-transparent">
              Welcome Back
            </span>
          </h1>
          <p className="text-amber-100/70 text-sm mt-3">
            Sign in to continue your journey
          </p>
        </div>

        {error && (
          <Alert className="mb-6 bg-red-500/10 border-red-500/30 text-amber-100 text-sm">
            {error}
          </Alert>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="relative">
            <Mail className="absolute left-3 top-3.5 w-5 h-5 text-amber-400" />
            <Input
              type="email"
              placeholder="you@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-11 h-12 bg-white/10 border-amber-500/30 text-amber-50 placeholder-amber-200/50 focus:border-amber-400 focus:ring-amber-400/20 rounded-md"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3.5 w-5 h-5 text-amber-400" />
            <Input
              type="password"
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-11 h-12 bg-white/10 border-amber-500/30 text-amber-50 placeholder-amber-200/50 focus:border-amber-400 focus:ring-amber-400/20 rounded-md"
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-13 bg-gradient-to-r from-amber-500 to-yellow-600 text-black font-bold text-lg rounded-md shadow-xl cursor-pointer"
          >
            {isLoading ? (
              <>
                {" "}
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Signing In...{" "}
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>

        <div className="my-2 flex items-center">
          <hr className="flex-grow border-t border-amber-500/20" />
          <span className="mx-4 text-xs font-medium text-amber-300">OR</span>
          <hr className="flex-grow border-t border-amber-500/20" />
        </div>

        <div className="grid grid-cols-1 gap-4">
          <Button
            onClick={() => handleProvider("google")}
            variant="outline"
            className="h-12 border-amber-500/30 hover:bg-white/95 cursor-pointer text-black rounded-md"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="oklch(82.8% 0.189 84.429)"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="oklch(82.8% 0.189 84.429)"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="oklch(82.8% 0.189 84.429)"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="oklch(82.8% 0.189 84.429)"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google
          </Button>
        </div>

        <p className="mt-10 text-center text-sm text-amber-200/70">
          New here?{" "}
          <Link
            href="/signup"
            className="font-bold text-amber-300 hover:text-amber-100 underline"
          >
            Create Account
          </Link>
        </p>

        <p className=" text-center text-sm text-amber-200/70">
          Forgot your password?{" "}
          <Link
            href="/forget-pass"
            className="font-bold text-amber-300 hover:text-amber-100 underline"
          >
            Reset Password
          </Link>
        </p>
      </Card>

      <Toaster position="top-center" theme="dark" />
    </div>
  );
}
