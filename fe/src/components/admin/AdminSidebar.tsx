"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAdminAuth } from "./AdminAuthProvider";
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  AlertTriangle,
  Settings,
  LogOut,
  ShieldAlert,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/console/dashboard", icon: LayoutDashboard },
  { name: "Users", href: "/console/users", icon: Users },
  { name: "Chat Rooms", href: "/console/rooms", icon: MessageSquare },
  { name: "Reports", href: "/console/reports", icon: AlertTriangle },
  { name: "Moderation", href: "/console/moderation", icon: ShieldAlert },
  { name: "Analytics", href: "/console/analytics", icon: BarChart3 },
  { name: "Settings", href: "/console/settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { admin, logout } = useAdminAuth();

  return (
    <div className="flex h-screen w-64 flex-col bg-gray-900 text-white">
      {/* Logo/Brand */}
      <div className="flex h-16 items-center justify-center border-b border-gray-800">
        <h1 className="text-xl font-bold">Admin Console</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2 py-4">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname?.startsWith(item.href + "/");

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-gray-800 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white",
              )}
            >
              <Icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Admin Info & Logout */}
      <div className="border-t border-gray-800 p-4">
        <div className="mb-3">
          <p className="text-sm font-medium">{admin?.name || admin?.email}</p>
          <p className="text-xs text-gray-400">{admin?.role}</p>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-gray-300 hover:bg-gray-800 hover:text-white"
          onClick={logout}
        >
          <LogOut className="mr-3 h-5 w-5" />
          Logout
        </Button>
      </div>
    </div>
  );
}
