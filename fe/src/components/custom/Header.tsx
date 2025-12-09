"use client";

import Link from "next/link";
import Image from "next/image";
import { signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import {
  Menu,
  X,
  LogOut,
  Settings,
  LayoutDashboard,
  Globe,
  ArrowLeft,
} from "lucide-react";

export default function Header() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { user, isAuthenticated, isLoading } = useAuthStore();

  // Close sidebar when clicking outside
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [sidebarOpen]);

  if (isLoading) {
    return (
      <header className="fixed top-0 inset-x-0 z-50 bg-white/5 backdrop-blur-xl border-b border-amber-500/20">
        <div className="container h-16 flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-amber-600/20 rounded-full animate-pulse" />
            <div className="h-7 w-40 bg-amber-500/10 rounded animate-pulse" />
          </div>
        </div>
      </header>
    );
  }

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-50 bg-gradient-to-b from-black/40 via-[#0f1a0f]/90 to-transparent backdrop-blur-2xl border-b border-amber-500/20 flex items-center justify-center">
        <div className="container h-16 flex items-center justify-between px-4 sm:px-6">
          {/* Logo + Brand Name */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-amber-500/40 shadow-lg transition-all group-hover:ring-amber-400 group-hover:scale-110">
              <Image
                src="/images/logo.jpg"
                alt="NawaNapam"
                width={40}
                height={40}
                className="object-cover"
              />
            </div>
            <span
              className="text-xl font-bold tracking-wide"
              style={{ fontFamily: "var(--font-cinzel), serif" }}
            >
              <span className="bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-300 bg-clip-text text-transparent">
                NawaNapam
              </span>
            </span>
          </Link>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            {/* Authenticated User */}
            {isAuthenticated && user ? (
              <>
                {/* Desktop Dropdown */}
                <div className="hidden sm:block relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-3 p-2 rounded-full hover:bg-white/10 transition-all group"
                  >
                    <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-amber-500/50 shadow-md group-hover:ring-amber-400">
                      <Image
                        src={user.image || "/images/default-avatar.png"}
                        alt="User"
                        width={36}
                        height={36}
                        className="object-cover"
                      />
                    </div>
                    <span className="text-sm font-medium text-amber-100">
                      {user.username || user.name?.split(" ")[0] || "Not set"}
                    </span>
                  </button>

                  {/* Desktop Dropdown */}
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-3 w-64 origin-top-right rounded-md bg-black backdrop-blur-2xl border border-amber-500/30 shadow-2xl overflow-hidden">
                      <div className="p-4 border-b border-amber-500/20">
                        <p
                          className="text-sm font-bold text-amber-100"
                          style={{ fontFamily: "serif" }}
                        >
                          {user.username?.toLowerCase() ||
                            user.name?.split(" ")[0]?.toLowerCase() ||
                            "not set"}
                        </p>
                        <p className="text-xs text-amber-300 truncate">
                          {user.email}
                        </p>
                      </div>
                      <div className="py-2">
                        <Link
                          href="/dashboard"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-5 py-3 text-amber-100 hover:bg-amber-500/10 transition-colors"
                        >
                          <LayoutDashboard size={18} />
                          Dashboard
                        </Link>
                        <Link
                          href="/settings"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-5 py-3 text-amber-100 hover:bg-amber-500/10 transition-colors"
                        >
                          <Settings size={18} />
                          Settings
                        </Link>
                      </div>
                      <div className="border-t border-amber-500/20 pt-2">
                        <button
                          onClick={() => signOut({ callbackUrl: "/" })}
                          className="flex w-full items-center gap-3 px-5 py-3 text-rose-400 hover:bg-rose-500/10 transition-colors"
                        >
                          <LogOut size={18} />
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Mobile User Avatar */}
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="sm:hidden flex items-center gap-2 p-1.5 rounded-full hover:bg-white/10 transition-all"
                >
                  <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-amber-500/50 shadow-md">
                    <Image
                      src={user.image || "/images/default-avatar.png"}
                      alt="User"
                      width={36}
                      height={36}
                      className="object-cover"
                    />
                  </div>
                </button>
              </>
            ) : (
              /* Guest Buttons */
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="hidden sm:inline-flex h-10 px-6 rounded-md text-sm font-medium text-amber-100 border border-amber-500/40 hover:border-amber-400 hover:bg-amber-500/10 transition-all items-center"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="hidden sm:inline-flex h-10 px-6 rounded-md text-sm font-bold bg-gradient-to-r from-amber-500 to-yellow-600 text-black shadow-lg items-center"
                >
                  Join Now
                </Link>
                {/* Mobile Login/Signup */}
                <Link
                  href="/login"
                  className="sm:hidden h-9 px-4 rounded-md text-sm font-medium text-amber-100 border border-amber-500/40 hover:border-amber-400 hover:bg-amber-500/10 transition-all inline-flex items-center"
                >
                  Login
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] sm:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-80 bg-gradient-to-b from-[#0a0a0a] to-[#1a1a1a] border-l border-amber-500/20 shadow-2xl z-[70] sm:hidden transform transition-transform duration-300 ease-in-out flex flex-col ${
          sidebarOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-amber-500/20">
          <h2 className="text-lg font-bold text-amber-100">Menu</h2>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <X size={20} className="text-amber-100" />
          </button>
        </div>

        {/* User Info */}
        {isAuthenticated && user && (
          <div className="p-6 border-b border-amber-500/20">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden ring-2 ring-amber-500/50 shadow-lg">
                <Image
                  src={user.image || "/images/default-avatar.png"}
                  alt="User"
                  width={64}
                  height={64}
                  className="object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="text-base font-bold text-amber-100 truncate"
                  style={{ fontFamily: "serif" }}
                >
                  {user.username?.toLowerCase() ||
                    user.name?.split(" ")[0]?.toLowerCase() ||
                    "not set"}
                </p>
                <p className="text-sm text-amber-300 truncate">{user.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <Link
            href="/dashboard"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-4 px-4 py-4 text-amber-100 hover:bg-amber-500/10 rounded-lg transition-colors group"
          >
            <LayoutDashboard
              size={22}
              className="text-amber-400 group-hover:text-amber-300"
            />
            <span className="text-base font-medium">Dashboard</span>
          </Link>
          <Link
            href="/settings"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-4 px-4 py-4 text-amber-100 hover:bg-amber-500/10 rounded-lg transition-colors group"
          >
            <Settings
              size={22}
              className="text-amber-400 group-hover:text-amber-300"
            />
            <span className="text-base font-medium">Settings</span>
          </Link>
        </nav>

        {/* Logout Button at Bottom */}
        <div className="mt-auto p-4 border-t border-amber-500/20">
          <button
            onClick={() => {
              setSidebarOpen(false);
              signOut({ callbackUrl: "/" });
            }}
            className="flex w-full items-center gap-4 px-4 py-4 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors group"
          >
            <LogOut size={22} className="group-hover:text-rose-300" />
            <span className="text-base font-medium">Logout</span>
          </button>
        </div>
      </div>
    </>
  );
}
