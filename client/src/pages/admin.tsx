import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, Copy, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type StudentId = {
  id: string;
  studentId: string;
  createdByAdminId: string;
  isAssigned: boolean;
  assignedToUserId: string | null;
  createdAt: string;
  assignedAt: string | null;
};

export default function AdminPage() {
  const { toast } = useToast();
  const [newStudentId, setNewStudentId] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: studentIds, isLoading } = useQuery<StudentId[]>({
    queryKey: ["/api/admin/student-ids"],
  });

  const createMutation = useMutation({
    mutationFn: async (studentId: string) => {
      return await apiRequest("POST", "/api/admin/student-ids", { studentId });
    },
    onSuccess: () => {
      toast({
        title: "Student ID created",
        description: "New student ID has been generated successfully",
      });
      setNewStudentId("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/student-ids"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create student ID",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/student-ids/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Student ID deleted",
        description: "Student ID has been removed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/student-ids"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete student ID",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newStudentId.trim()) {
      createMutation.mutate(newStudentId.trim());
    }
  };

  const handleCopy = async (studentId: string) => {
    await navigator.clipboard.writeText(studentId);
    setCopiedId(studentId);
    setTimeout(() => setCopiedId(null), 2000);
    toast({
      title: "Copied!",
      description: "Student ID copied to clipboard",
    });
  };

  return (
    <div className="container max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Management</h1>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Generate Student ID</CardTitle>
            <CardDescription>
              Create new student IDs for registration. Students will need these IDs to sign up.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="studentId" className="sr-only">Student ID</Label>
                <Input
                  id="studentId"
                  placeholder="e.g., ST2024001"
                  value={newStudentId}
                  onChange={(e) => setNewStudentId(e.target.value)}
                  data-testid="input-new-student-id"
                />
              </div>
              <Button 
                type="submit" 
                disabled={createMutation.isPending || !newStudentId.trim()}
                data-testid="button-create-student-id"
              >
                <Plus className="w-4 h-4 mr-2" />
                {createMutation.isPending ? "Creating..." : "Create ID"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Student ID Database</CardTitle>
            <CardDescription>
              All generated student IDs. Assigned IDs cannot be deleted.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : !studentIds || studentIds.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No student IDs generated yet. Create one above to get started.
              </p>
            ) : (
              <div className="space-y-2">
                {studentIds.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-4 rounded-lg border hover-elevate"
                    data-testid={`student-id-${record.studentId}`}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <code className="text-lg font-mono font-semibold">
                        {record.studentId}
                      </code>
                      <Badge variant={record.isAssigned ? "default" : "outline"}>
                        {record.isAssigned ? "Assigned" : "Available"}
                      </Badge>
                      {record.isAssigned && (
                        <span className="text-sm text-muted-foreground">
                          Assigned on {new Date(record.assignedAt!).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopy(record.studentId)}
                        data-testid={`button-copy-${record.studentId}`}
                      >
                        {copiedId === record.studentId ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                      {!record.isAssigned && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteMutation.mutate(record.id)}
                          disabled={deleteMutation.isPending}
                          data-testid={`button-delete-${record.studentId}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
