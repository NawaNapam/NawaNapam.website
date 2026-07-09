"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/components/admin/AdminAuthProvider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { UserPlus, Shield } from "lucide-react";
import Link from "next/link";

interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export default function SettingsPage() {
  const _router = useRouter();
  const { admin } = useAdminAuth();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  const isSuperAdmin = admin?.role === "SUPER_ADMIN";

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const response = await fetch("/api/admin/manage/admins");
      if (response.ok) {
        const data = await response.json();
        setAdmins(data.admins);
      }
    } catch (error) {
      console.error("Failed to fetch admins:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "border-primary text-primary bg-primary/5";
      case "ADMIN":
        return "border-link text-link bg-link/5";
      case "MODERATOR":
        return "border-success-border text-success bg-success/5";
      default:
        return "border-border text-foreground bg-muted";
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-8">
        <Skeleton className="mb-6 h-10 w-48" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Skeleton className="h-64 w-full lg:col-span-2" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold sm:text-3xl">Settings</h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Manage admin users and system settings
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:auto-rows-fr">
        {/* Admin Management — large tile */}
        <Card className="lg:col-span-2 lg:row-span-2">
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Admin Users
              </CardTitle>
              <CardDescription>Manage administrator accounts</CardDescription>
            </div>
            {isSuperAdmin && (
              <Link href="/console/settings/add-admin">
                <Button className="w-full sm:w-auto">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Admin
                </Button>
              </Link>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {admins.map((adminUser) => (
                <div
                  key={adminUser.id}
                  className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className="font-medium">
                        {adminUser.name || adminUser.email}
                      </span>
                      <Badge
                        variant="outline"
                        className={getRoleBadgeColor(adminUser.role)}
                      >
                        {adminUser.role.replace("_", " ")}
                      </Badge>
                      {!adminUser.isActive && (
                        <Badge variant="destructive">Inactive</Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <div>{adminUser.email}</div>
                      <div className="text-xs">
                        {adminUser.lastLoginAt
                          ? `Last login: ${new Date(adminUser.lastLoginAt).toLocaleDateString()}`
                          : "Never logged in"}
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground sm:text-right">
                    Added {new Date(adminUser.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}

              {admins.length === 0 && (
                <p className="text-center text-sm text-muted-foreground">
                  No admin users found
                </p>
              )}
            </div>

            {!isSuperAdmin && (
              <div className="mt-4 rounded-lg border border-border bg-muted p-4">
                <p className="text-sm text-muted-foreground">
                  Only super admins can add or manage admin users.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Current Session Info — side tile */}
        <Card>
          <CardHeader>
            <CardTitle>Your Account</CardTitle>
            <CardDescription>Current session information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium">{admin?.email}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Name:</span>
                <span className="font-medium">{admin?.name || "Not set"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Role:</span>
                <Badge
                  variant="outline"
                  className={admin ? getRoleBadgeColor(admin.role) : ""}
                >
                  {admin?.role.replace("_", " ")}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Role summary — side tile filling the puzzle gap */}
        <Card>
          <CardHeader>
            <CardTitle>Admin Breakdown</CardTitle>
            <CardDescription>Accounts by role</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {["SUPER_ADMIN", "ADMIN", "MODERATOR"].map((role) => {
                const count = admins.filter((a) => a.role === role).length;
                return (
                  <div
                    key={role}
                    className="flex items-center justify-between"
                  >
                    <Badge
                      variant="outline"
                      className={getRoleBadgeColor(role)}
                    >
                      {role.replace("_", " ")}
                    </Badge>
                    <span className="font-medium">{count}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
