"use client";

import { useEffect, useState, useCallback } from "react";
import { useAdminAuth } from "@/components/admin/AdminAuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Ban,
  AlertTriangle,
  Volume2,
} from "lucide-react";

interface ModerationLog {
  id: string;
  action: "BAN" | "WARN" | "MUTE";
  reason: string | null;
  createdAt: string;
  performedBy: string;
  user: {
    id: string;
    email: string;
    username: string | null;
    name: string | null;
    banned: boolean;
  };
  performedByAdmin: {
    id: string;
    email: string;
    name: string | null;
  } | null;
}

export default function ModerationPage() {
  const { admin: _admin } = useAdminAuth();
  const [logs, setLogs] = useState<ModerationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });

      if (actionFilter !== "all") params.append("action", actionFilter);

      const response = await fetch(`/api/admin/manage/moderation?${params}`);
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const getActionBadge = (action: string) => {
    switch (action) {
      case "BAN":
        return (
          <Badge variant="destructive" className="gap-1">
            <Ban className="h-3 w-3" />
            Ban
          </Badge>
        );
      case "WARN":
        return (
          <Badge variant="secondary" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            Warn
          </Badge>
        );
      case "MUTE":
        return (
          <Badge variant="outline" className="gap-1">
            <Volume2 className="h-3 w-3" />
            Mute
          </Badge>
        );
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  const getUserDisplay = (user: ModerationLog["user"]) => {
    return user.username || user.name || user.email;
  };

  const getAdminDisplay = (adminData: ModerationLog["performedByAdmin"]) => {
    if (!adminData) return "Unknown Admin";
    return adminData.name || adminData.email;
  };

  if (loading && logs.length === 0) {
    return (
      <div className="p-4 sm:p-8">
        <Skeleton className="mb-6 h-10 w-48" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold sm:text-3xl">Moderation Logs</h1>
        <p className="text-sm text-gray-600 sm:text-base">
          View all moderation actions and history
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5" />
            Action History
          </CardTitle>

          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="BAN">Bans</SelectItem>
              <SelectItem value="WARN">Warnings</SelectItem>
              <SelectItem value="MUTE">Mutes</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>

        <CardContent>
          {/* Desktop Table */}
          <div className="hidden overflow-x-auto lg:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Performed By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">
                          {getUserDisplay(log.user)}
                        </div>
                        <div className="text-gray-500">{log.user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>{getActionBadge(log.action)}</TableCell>
                    <TableCell>
                      <div className="max-w-xs text-sm">
                        {log.reason || "No reason provided"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {getAdminDisplay(log.performedByAdmin)}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div>{new Date(log.createdAt).toLocaleDateString()}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      {log.user.banned ? (
                        <Badge variant="destructive">Currently Banned</Badge>
                      ) : (
                        <Badge variant="secondary">Active</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile/Tablet Cards */}
          <div className="space-y-4 lg:hidden">
            {logs.map((log) => (
              <Card key={log.id}>
                <CardContent className="pt-6">
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-1 font-medium">
                        {getUserDisplay(log.user)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {log.user.email}
                      </div>
                    </div>
                    <div>{getActionBadge(log.action)}</div>
                  </div>

                  <div className="mb-3 space-y-2 text-sm">
                    <div>
                      <span className="text-gray-500">Reason: </span>
                      <span>{log.reason || "No reason provided"}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">By: </span>
                      <span>{getAdminDisplay(log.performedByAdmin)}</span>
                    </div>
                    <div className="text-gray-500">
                      {new Date(log.createdAt).toLocaleString()}
                    </div>
                  </div>

                  <div>
                    {log.user.banned ? (
                      <Badge variant="destructive">Currently Banned</Badge>
                    ) : (
                      <Badge variant="secondary">Active</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {logs.length === 0 && (
            <div className="py-12 text-center text-gray-500">
              <ShieldAlert className="mx-auto mb-3 h-12 w-12 text-gray-300" />
              <p>No moderation logs found</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Previous</span>
              </Button>

              <span className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
