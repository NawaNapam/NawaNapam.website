"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  MessageSquare,
  AlertTriangle,
  ShieldAlert,
  TrendingUp,
  Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

interface Stats {
  totalUsers: number;
  activeUsers: number;
  totalRooms: number;
  activeRooms: number;
  totalReports: number;
  pendingReports: number;
  bannedUsers: number;
}

interface Report {
  id: string;
  reason: string;
  status: string;
  createdAt: string;
  reporter: { email: string; username: string | null };
  reportedUser: { email: string; username: string | null };
}

interface User {
  id: string;
  email: string;
  username: string | null;
  isAnonymous: boolean;
  banned: boolean;
  createdAt: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentReports, setRecentReports] = useState<Report[]>([]);
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        setRecentReports(data.recentReports);
        setRecentUsers(data.recentUsers);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="mb-8 text-3xl font-bold">Dashboard</h1>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Users",
      value: stats?.totalUsers || 0,
      subtitle: `${stats?.activeUsers || 0} active`,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Chat Rooms",
      value: stats?.totalRooms || 0,
      subtitle: `${stats?.activeRooms || 0} active`,
      icon: MessageSquare,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Reports",
      value: stats?.totalReports || 0,
      subtitle: `${stats?.pendingReports || 0} pending`,
      icon: AlertTriangle,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
    {
      title: "Banned Users",
      value: stats?.bannedUsers || 0,
      subtitle: "Total banned",
      icon: ShieldAlert,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-600">Welcome to the admin console</p>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <div className={`rounded-full p-2 ${stat.bgColor}`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
                <p className="text-sm text-gray-500">{stat.subtitle}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Reports */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Recent Reports</span>
              <Link
                href="/admin/reports"
                className="text-sm text-blue-600 hover:underline"
              >
                View all
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentReports.length === 0 ? (
                <p className="text-sm text-gray-500">No reports yet</p>
              ) : (
                recentReports.slice(0, 5).map((report) => (
                  <div
                    key={report.id}
                    className="flex items-start justify-between border-b pb-3 last:border-0"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium">{report.reason}</p>
                      <p className="text-xs text-gray-500">
                        By {report.reporter.username || report.reporter.email}
                      </p>
                    </div>
                    <Badge
                      variant={
                        report.status === "PENDING"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {report.status}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Users */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Recent Users</span>
              <Link
                href="/admin/users"
                className="text-sm text-blue-600 hover:underline"
              >
                View all
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentUsers.length === 0 ? (
                <p className="text-sm text-gray-500">No users yet</p>
              ) : (
                recentUsers.slice(0, 5).map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between border-b pb-3 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {user.username || user.email}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {user.isAnonymous && (
                        <Badge variant="outline">Anonymous</Badge>
                      )}
                      {user.banned && (
                        <Badge variant="destructive">Banned</Badge>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
