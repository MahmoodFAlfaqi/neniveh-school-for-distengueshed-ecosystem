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
  username: string;
  studentId: string;
  grade: number;
  className: string;
  createdByAdminId: string;
  isAssigned: boolean;
  assignedToUserId: string | null;
  createdAt: string;
  assignedAt: string | null;
};

export default function AdminPage() {
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [grade, setGrade] = useState("");
  const [className, setClassName] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: studentIds, isLoading } = useQuery<StudentId[]>({
    queryKey: ["/api/admin/student-ids"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: { username: string; grade: number; className: string }) => {
      return await apiRequest("POST", "/api/admin/student-ids", data);
    },
    onSuccess: (response: any) => {
      const generatedId = response?.studentId?.studentId || response?.studentId || "Unknown";
      toast({
        title: "Student ID created",
        description: `Generated ID: ${generatedId} for ${response?.studentId?.username || username}`,
      });
      setUsername("");
      setGrade("");
      setClassName("");
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
    if (username.trim() && grade && className.trim()) {
      createMutation.mutate({
        username: username.trim(),
        grade: parseInt(grade),
        className: className.trim().toUpperCase(),
      });
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
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    placeholder="e.g., John.Smith"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    data-testid="input-username"
                  />
                </div>
                <div>
                  <Label htmlFor="grade">Grade (1-6)</Label>
                  <Input
                    id="grade"
                    type="number"
                    min="1"
                    max="6"
                    placeholder="1-6"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    data-testid="input-grade"
                  />
                </div>
                <div>
                  <Label htmlFor="className">Class</Label>
                  <Input
                    id="className"
                    placeholder="e.g., A"
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    data-testid="input-class"
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                disabled={createMutation.isPending || !username.trim() || !grade || !className.trim()}
                data-testid="button-create-student-id"
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                {createMutation.isPending ? "Generating..." : "Generate Student ID"}
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
                      <div className="flex flex-col">
                        <span className="font-semibold">{record.username}</span>
                        <code className="text-sm font-mono text-muted-foreground">
                          ID: {record.studentId}
                        </code>
                      </div>
                      <Badge variant="outline">
                        Grade {record.grade}-{record.className}
                      </Badge>
                      <Badge variant={record.isAssigned ? "default" : "outline"}>
                        {record.isAssigned ? "Assigned" : "Available"}
                      </Badge>
                      {record.isAssigned && (
                        <span className="text-sm text-muted-foreground">
                          {new Date(record.assignedAt!).toLocaleDateString()}
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
