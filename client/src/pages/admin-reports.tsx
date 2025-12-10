import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import { Redirect, Link } from "wouter";
import { AlertTriangle, Check, X, User, FileText, Calendar, BookOpen, ExternalLink } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";

type Report = {
  id: string;
  reporterId: string;
  reportedUserId: string | null;
  reportedPostId: string | null;
  reportedEventId: string | null;
  reportedStudySourceId: string | null;
  reason: string;
  status: "pending" | "resolved" | "dismissed";
  resolvedById: string | null;
  resolvedAt: string | null;
  resolutionNotes: string | null;
  createdAt: string;
};

export default function AdminReportsPage() {
  const { user, isLoading: userLoading } = useUser();
  const { toast } = useToast();
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("pending");

  const { data: reports = [], isLoading } = useQuery<Report[]>({
    queryKey: ["/api/reports", statusFilter],
    queryFn: () => fetch(`/api/reports?status=${statusFilter}`).then(r => r.json()),
    enabled: user?.role === "admin",
  });

  const resolveMutation = useMutation({
    mutationFn: async ({ reportId, status, notes }: { reportId: string; status: "resolved" | "dismissed"; notes?: string }) => {
      return await apiRequest("PATCH", `/api/reports/${reportId}/resolve`, { status, notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      toast({
        title: "Report updated",
        description: "The report has been processed.",
      });
      setSelectedReport(null);
      setResolutionNotes("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to process report",
        variant: "destructive",
      });
    },
  });

  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return <Redirect to="/" />;
  }

  const getReportType = (report: Report) => {
    if (report.reportedUserId) return { type: "Profile", icon: User, link: `/profile/${report.reportedUserId}` };
    if (report.reportedPostId) return { type: "Post", icon: FileText, link: `/news` };
    if (report.reportedEventId) return { type: "Event", icon: Calendar, link: `/events/${report.reportedEventId}` };
    if (report.reportedStudySourceId) return { type: "Study Source", icon: BookOpen, link: `/study-sources` };
    return { type: "Unknown", icon: AlertTriangle, link: null };
  };

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-background via-background to-muted/20">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <AlertTriangle className="w-8 h-8" />
              Reports Dashboard
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Review and manage user-submitted reports
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={statusFilter === "pending" ? "default" : "outline"}
              onClick={() => setStatusFilter("pending")}
              data-testid="button-filter-pending"
            >
              Pending
            </Button>
            <Button
              variant={statusFilter === "resolved" ? "default" : "outline"}
              onClick={() => setStatusFilter("resolved")}
              data-testid="button-filter-resolved"
            >
              Resolved
            </Button>
            <Button
              variant={statusFilter === "dismissed" ? "default" : "outline"}
              onClick={() => setStatusFilter("dismissed")}
              data-testid="button-filter-dismissed"
            >
              Dismissed
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : reports.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium">No {statusFilter} reports</p>
              <p className="text-sm text-muted-foreground">
                {statusFilter === "pending" ? "All reports have been processed!" : "No reports with this status."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => {
              const { type, icon: TypeIcon, link } = getReportType(report);
              return (
                <Card key={report.id} className="hover-elevate" data-testid={`card-report-${report.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <TypeIcon className="w-4 h-4 text-muted-foreground" />
                          <Badge variant="outline">{type}</Badge>
                          <Badge variant={report.status === "pending" ? "destructive" : report.status === "resolved" ? "default" : "secondary"}>
                            {report.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(report.createdAt), "MMM d, yyyy 'at' h:mm a")}
                          </span>
                        </div>
                        <p className="text-sm mb-2">{report.reason}</p>
                        {link && (
                          <Link href={link}>
                            <Button variant="link" size="sm" className="p-0 h-auto" data-testid={`button-view-content-${report.id}`}>
                              <ExternalLink className="w-3 h-3 mr-1" />
                              View Content
                            </Button>
                          </Link>
                        )}
                      </div>
                      {report.status === "pending" && (
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => setSelectedReport(report)}
                                data-testid={`button-resolve-${report.id}`}
                              >
                                <Check className="w-4 h-4 mr-1" />
                                Resolve
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Resolve Report</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                  Add notes about how this report was handled (optional):
                                </p>
                                <Textarea
                                  value={resolutionNotes}
                                  onChange={(e) => setResolutionNotes(e.target.value)}
                                  placeholder="Resolution notes..."
                                  data-testid="input-resolution-notes"
                                />
                                <div className="flex gap-2 justify-end">
                                  <Button
                                    variant="outline"
                                    onClick={() => resolveMutation.mutate({ reportId: report.id, status: "dismissed", notes: resolutionNotes })}
                                    disabled={resolveMutation.isPending}
                                    data-testid="button-dismiss-report"
                                  >
                                    <X className="w-4 h-4 mr-1" />
                                    Dismiss
                                  </Button>
                                  <Button
                                    onClick={() => resolveMutation.mutate({ reportId: report.id, status: "resolved", notes: resolutionNotes })}
                                    disabled={resolveMutation.isPending}
                                    data-testid="button-confirm-resolve"
                                  >
                                    <Check className="w-4 h-4 mr-1" />
                                    Resolve & Take Action
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      )}
                    </div>
                    {report.resolutionNotes && (
                      <div className="mt-3 p-2 bg-muted rounded text-sm">
                        <span className="font-medium">Resolution notes:</span> {report.resolutionNotes}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
