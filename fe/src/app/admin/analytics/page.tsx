"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Users, MessageSquare, AlertTriangle, Activity } from "lucide-react";

interface AnalyticsData {
  timeRange: { days: number; startDate: string; endDate: string };
  userGrowth: Array<{ date: string; count: number }>;
  roomActivity: Array<{ date: string; count: number }>;
  reportsOverTime: Array<{ date: string; count: number }>;
  distributions: {
    userTypes: Array<{ type: string; count: number }>;
    roomStatus: Array<{ status: string; count: number }>;
    gender: Array<{ gender: string; count: number }>;
    reportStatus: Array<{ status: string; count: number }>;
  };
  insights: {
    topReporters: Array<{ username: string; count: number }>;
    mostReported: Array<{ username: string; banned: boolean; count: number }>;
    activeUsersCount: number;
  };
}

const COLORS = {
  primary: "#3b82f6",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  purple: "#8b5cf6",
  pink: "#ec4899",
  teal: "#14b8a6",
  orange: "#f97316",
};

const PIE_COLORS = [
  COLORS.primary,
  COLORS.success,
  COLORS.warning,
  COLORS.danger,
  COLORS.purple,
];

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30");

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/analytics?days=${timeRange}`);
      if (response.ok) {
        const analyticsData = await response.json();
        setData(analyticsData);
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading) {
    return (
      <div className="p-4 sm:p-8">
        <Skeleton className="mb-6 h-10 w-48" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="p-4 sm:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">
            Analytics Dashboard
          </h1>
          <p className="text-sm text-gray-600 sm:text-base">
            Platform insights and statistics
          </p>
        </div>

        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Active Users
            </CardTitle>
            <Activity className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.insights.activeUsersCount}
            </div>
            <p className="text-xs text-gray-500">In selected period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Rooms
            </CardTitle>
            <MessageSquare className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.roomActivity.reduce((sum, d) => sum + d.count, 0)}
            </div>
            <p className="text-xs text-gray-500">Created in period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              New Users
            </CardTitle>
            <Users className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.userGrowth.reduce((sum, d) => sum + d.count, 0)}
            </div>
            <p className="text-xs text-gray-500">Joined in period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Reports
            </CardTitle>
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.reportsOverTime.reduce((sum, d) => sum + d.count, 0)}
            </div>
            <p className="text-xs text-gray-500">Filed in period</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* User Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
            <CardDescription>New user registrations over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.userGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke={COLORS.primary}
                  strokeWidth={2}
                  name="New Users"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Room Activity Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Room Activity</CardTitle>
            <CardDescription>Chat rooms created over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.roomActivity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="count"
                  fill={COLORS.success}
                  name="Rooms Created"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Reports Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Reports Trend</CardTitle>
            <CardDescription>User reports over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.reportsOverTime}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke={COLORS.danger}
                  strokeWidth={2}
                  name="Reports"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* User Types Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>User Types</CardTitle>
            <CardDescription>Distribution of user categories</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.distributions.userTypes}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ type, percent }) =>
                    `${type}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {data.distributions.userTypes.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Room Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Room Status</CardTitle>
            <CardDescription>Current state of chat rooms</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.distributions.roomStatus} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis
                  dataKey="status"
                  type="category"
                  tick={{ fontSize: 12 }}
                  width={80}
                />
                <Tooltip />
                <Bar dataKey="count" fill={COLORS.teal} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gender Distribution */}
        {data.distributions.gender.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Gender Distribution</CardTitle>
              <CardDescription>User demographics</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.distributions.gender}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ gender, percent }) =>
                      `${gender}: ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {data.distributions.gender.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Insights Section */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Reporters */}
        <Card>
          <CardHeader>
            <CardTitle>Top Reporters</CardTitle>
            <CardDescription>Users who filed the most reports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.insights.topReporters.map((reporter, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between border-b pb-2 last:border-0"
                >
                  <span className="text-sm font-medium">
                    {reporter.username}
                  </span>
                  <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                    {reporter.count} reports
                  </span>
                </div>
              ))}
              {data.insights.topReporters.length === 0 && (
                <p className="text-sm text-gray-500">No reports filed yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Most Reported Users */}
        <Card>
          <CardHeader>
            <CardTitle>Most Reported Users</CardTitle>
            <CardDescription>
              Users with most reports against them
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.insights.mostReported.map((user, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between border-b pb-2 last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{user.username}</span>
                    {user.banned && (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                        Banned
                      </span>
                    )}
                  </div>
                  <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
                    {user.count} reports
                  </span>
                </div>
              ))}
              {data.insights.mostReported.length === 0 && (
                <p className="text-sm text-gray-500">No users reported yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
