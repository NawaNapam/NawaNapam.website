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
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Clock,
} from "lucide-react";

interface Report {
  id: string;
  reason: string;
  message: string;
  status: "PENDING" | "REVIEWED" | "ACTION_TAKEN";
  createdAt: string;
  reporter: {
    id: string;
    email: string;
    username: string | null;
    name: string | null;
  };
  reportedUser: {
    id: string;
    email: string;
    username: string | null;
    name: string | null;
    banned: boolean;
  };
  room: {
    id: string;
    status: string;
  } | null;
}

export default function ReportsPage() {
  const { admin: _admin } = useAdminAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });

      if (statusFilter !== "all") params.append("status", statusFilter);

      const response = await fetch(`/api/admin/manage/reports?${params}`);
      if (response.ok) {
        const data = await response.json();
        setReports(data.reports);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch reports:", error);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const updateReportStatus = async (reportId: string, newStatus: string) => {
    try {
      setUpdatingId(reportId);
      const response = await fetch(`/api/admin/manage/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchReports();
      }
    } catch (error) {
      console.error("Failed to update report:", error);
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="destructive">Pending</Badge>;
      case "REVIEWED":
        return <Badge variant="secondary">Reviewed</Badge>;
      case "ACTION_TAKEN":
        return (
          <Badge className="bg-green-600 hover:bg-green-700">
            Action Taken
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getUserDisplay = (user: Report["reporter"]) => {
    return user.username || user.name || user.email;
  };

  if (loading && reports.length === 0) {
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
                <Skeleton key={i} className="h-24 w-full" />
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
        <h1 className="text-2xl font-bold sm:text-3xl">Reports Management</h1>
        <p className="text-sm text-gray-600 sm:text-base">
          Review and manage user reports
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            User Reports
          </CardTitle>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Reports</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="REVIEWED">Reviewed</SelectItem>
              <SelectItem value="ACTION_TAKEN">Action Taken</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>

        <CardContent>
          {/* Desktop Table */}
          <div className="hidden overflow-x-auto lg:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reporter</TableHead>
                  <TableHead>Reported User</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">
                          {getUserDisplay(report.reporter)}
                        </div>
                        <div className="text-gray-500">
                          {report.reporter.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {getUserDisplay(report.reportedUser)}
                          </span>
                          {report.reportedUser.banned && (
                            <Badge variant="destructive" className="text-xs">
                              Banned
                            </Badge>
                          )}
                        </div>
                        <div className="text-gray-500">
                          {report.reportedUser.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <div className="font-medium">{report.reason}</div>
                        <div className="text-sm text-gray-500 line-clamp-2">
                          {report.message}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(report.status)}</TableCell>
                    <TableCell className="text-sm">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {report.status === "PENDING" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                updateReportStatus(report.id, "REVIEWED")
                              }
                              disabled={updatingId === report.id}
                            >
                              <Clock className="mr-1 h-3 w-3" />
                              Review
                            </Button>
                            <Button
                              size="sm"
                              onClick={() =>
                                updateReportStatus(report.id, "ACTION_TAKEN")
                              }
                              disabled={updatingId === report.id}
                            >
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Action
                            </Button>
                          </>
                        )}
                        {report.status === "REVIEWED" && (
                          <Button
                            size="sm"
                            onClick={() =>
                              updateReportStatus(report.id, "ACTION_TAKEN")
                            }
                            disabled={updatingId === report.id}
                          >
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Action Taken
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile/Tablet Cards */}
          <div className="space-y-4 lg:hidden">
            {reports.map((report) => (
              <Card key={report.id}>
                <CardContent className="pt-6">
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-1 font-medium">{report.reason}</div>
                      <div className="text-sm text-gray-600 line-clamp-2">
                        {report.message}
                      </div>
                    </div>
                    <div className="ml-2">{getStatusBadge(report.status)}</div>
                  </div>

                  <div className="mb-3 space-y-2 text-sm">
                    <div>
                      <span className="text-gray-500">Reporter: </span>
                      <span className="font-medium">
                        {getUserDisplay(report.reporter)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Reported: </span>
                      <span className="font-medium">
                        {getUserDisplay(report.reportedUser)}
                      </span>
                      {report.reportedUser.banned && (
                        <Badge variant="destructive" className="ml-2 text-xs">
                          Banned
                        </Badge>
                      )}
                    </div>
                    <div className="text-gray-500">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  {report.status !== "ACTION_TAKEN" && (
                    <div className="flex flex-col gap-2 sm:flex-row">
                      {report.status === "PENDING" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              updateReportStatus(report.id, "REVIEWED")
                            }
                            disabled={updatingId === report.id}
                            className="flex-1"
                          >
                            <Clock className="mr-1 h-3 w-3" />
                            Mark Reviewed
                          </Button>
                          <Button
                            size="sm"
                            onClick={() =>
                              updateReportStatus(report.id, "ACTION_TAKEN")
                            }
                            disabled={updatingId === report.id}
                            className="flex-1"
                          >
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Action Taken
                          </Button>
                        </>
                      )}
                      {report.status === "REVIEWED" && (
                        <Button
                          size="sm"
                          onClick={() =>
                            updateReportStatus(report.id, "ACTION_TAKEN")
                          }
                          disabled={updatingId === report.id}
                          className="w-full"
                        >
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Mark Action Taken
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {reports.length === 0 && (
            <div className="py-12 text-center text-gray-500">
              <AlertTriangle className="mx-auto mb-3 h-12 w-12 text-gray-300" />
              <p>No reports found</p>
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
