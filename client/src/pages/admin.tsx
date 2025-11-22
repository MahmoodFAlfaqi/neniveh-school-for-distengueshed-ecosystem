import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, Copy, Check, ChevronUp, ChevronDown, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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

type Student = {
  id: string;
  username: string;
  name: string;
  grade: number | null;
  className: string | null;
  credibilityScore: number;
  reputationScore: number;
  createdAt: string;
  assignedDate: string | null;
};

type SortField = "name" | "grade" | "class" | "date";
type SortDirection = "asc" | "desc";

export default function AdminPage() {
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [grade, setGrade] = useState("");
  const [className, setClassName] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Student Accounts search/sort state
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  
  // Student IDs search/sort state
  const [idSearchQuery, setIdSearchQuery] = useState("");
  const [idSortField, setIdSortField] = useState<SortField>("name");
  const [idSortDirection, setIdSortDirection] = useState<SortDirection>("asc");
  
  // Promote to admin state
  const [selectedUserToPromote, setSelectedUserToPromote] = useState<string>("");
  const [showPromoteDialog, setShowPromoteDialog] = useState(false);

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

  const { data: students, isLoading: studentsLoading } = useQuery<Student[]>({
    queryKey: ["/api/admin/students"],
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest("DELETE", `/api/admin/student/${userId}`);
    },
    onSuccess: () => {
      toast({
        title: "Student account deleted",
        description: "Student account and all associated data has been removed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/students"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete student account",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDeleteStudent = (userId: string, studentName: string) => {
    if (window.confirm(`Are you sure you want to delete ${studentName}'s account and all associated data? This action cannot be undone.`)) {
      deleteAccountMutation.mutate(userId);
    }
  };

  const promoteMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest("POST", "/api/admin/promote", { userId });
    },
    onSuccess: () => {
      toast({
        title: "User promoted to admin",
        description: "The user has been successfully promoted to admin",
      });
      setSelectedUserToPromote("");
      setShowPromoteDialog(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/students"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to promote user",
        description: error.message,
        variant: "destructive",
      });
      setShowPromoteDialog(false);
    },
  });

  const handlePromoteClick = () => {
    if (!selectedUserToPromote) return;
    setShowPromoteDialog(true);
  };

  const handleConfirmPromotion = () => {
    if (!selectedUserToPromote) return;
    promoteMutation.mutate(selectedUserToPromote);
  };

  const selectedUserData = students?.find(s => s.id === selectedUserToPromote);

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

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const toggleIdSort = (field: SortField) => {
    if (idSortField === field) {
      setIdSortDirection(idSortDirection === "asc" ? "desc" : "asc");
    } else {
      setIdSortField(field);
      setIdSortDirection("asc");
    }
  };

  const filteredAndSortedStudents = useMemo(() => {
    if (!students) return [];
    
    let filtered = students.filter((student) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        student.name.toLowerCase().includes(searchLower) ||
        student.username.toLowerCase().includes(searchLower)
      );
    });

    filtered.sort((a, b) => {
      let compareValue = 0;

      switch (sortField) {
        case "name":
          compareValue = a.name.localeCompare(b.name);
          break;
        case "grade":
          compareValue = (a.grade || 0) - (b.grade || 0);
          break;
        case "class":
          compareValue = (a.className || "").localeCompare(b.className || "");
          break;
        case "date":
          compareValue = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }

      return sortDirection === "asc" ? compareValue : -compareValue;
    });

    return filtered;
  }, [students, searchQuery, sortField, sortDirection]);

  const filteredAndSortedStudentIds = useMemo(() => {
    if (!studentIds) return [];
    
    let filtered = studentIds.filter((record) => {
      const searchLower = idSearchQuery.toLowerCase();
      return (
        record.username.toLowerCase().includes(searchLower) ||
        record.studentId.toLowerCase().includes(searchLower)
      );
    });

    filtered.sort((a, b) => {
      let compareValue = 0;

      switch (idSortField) {
        case "name":
          compareValue = a.username.localeCompare(b.username);
          break;
        case "grade":
          compareValue = a.grade - b.grade;
          break;
        case "class":
          compareValue = a.className.localeCompare(b.className);
          break;
        case "date":
          compareValue = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }

      return idSortDirection === "asc" ? compareValue : -compareValue;
    });

    return filtered;
  }, [studentIds, idSearchQuery, idSortField, idSortDirection]);

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
          <CardContent className="p-3 pt-0">
            <div className="space-y-4">
              <div className="space-y-3">
                <div>
                  <Label htmlFor="search-student-ids">Search by Username or ID</Label>
                  <Input
                    id="search-student-ids"
                    placeholder="Search student ID..."
                    value={idSearchQuery}
                    onChange={(e) => setIdSearchQuery(e.target.value)}
                    data-testid="input-search-student-ids"
                  />
                </div>

                <div className="flex gap-2 flex-wrap">
                  <Button
                    size="sm"
                    variant={idSortField === "name" ? "default" : "outline"}
                    onClick={() => toggleIdSort("name")}
                    data-testid="button-sort-id-name"
                  >
                    Name
                    {idSortField === "name" && (
                      idSortDirection === "asc" ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant={idSortField === "grade" ? "default" : "outline"}
                    onClick={() => toggleIdSort("grade")}
                    data-testid="button-sort-id-grade"
                  >
                    Grade
                    {idSortField === "grade" && (
                      idSortDirection === "asc" ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant={idSortField === "class" ? "default" : "outline"}
                    onClick={() => toggleIdSort("class")}
                    data-testid="button-sort-id-class"
                  >
                    Section
                    {idSortField === "class" && (
                      idSortDirection === "asc" ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />
                    )}
                  </Button>
                </div>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : !studentIds || studentIds.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No student IDs generated yet. Create one above to get started.
                </p>
              ) : filteredAndSortedStudentIds.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No student IDs match your search criteria.
                </p>
              ) : (
                <div className="space-y-2">
                  {filteredAndSortedStudentIds.map((record) => (
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
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Student Accounts</CardTitle>
            <CardDescription>
              All registered student accounts. You can delete accounts here, which will remove all associated data.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="space-y-4">
              <div className="space-y-3">
                <div>
                  <Label htmlFor="search-students">Search by Name or Username</Label>
                  <Input
                    id="search-students"
                    placeholder="Search student..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    data-testid="input-search-students"
                  />
                </div>

                <div className="flex gap-2 flex-wrap">
                  <Button
                    size="sm"
                    variant={sortField === "name" ? "default" : "outline"}
                    onClick={() => toggleSort("name")}
                    data-testid="button-sort-name"
                  >
                    Name
                    {sortField === "name" && (
                      sortDirection === "asc" ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant={sortField === "grade" ? "default" : "outline"}
                    onClick={() => toggleSort("grade")}
                    data-testid="button-sort-grade"
                  >
                    Grade
                    {sortField === "grade" && (
                      sortDirection === "asc" ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant={sortField === "class" ? "default" : "outline"}
                    onClick={() => toggleSort("class")}
                    data-testid="button-sort-class"
                  >
                    Section
                    {sortField === "class" && (
                      sortDirection === "asc" ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />
                    )}
                  </Button>
                </div>
              </div>

              {studentsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : !students || students.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No student accounts registered yet.
                </p>
              ) : filteredAndSortedStudents.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No students match your search criteria.
                </p>
              ) : (
                <div className="space-y-2">
                  {filteredAndSortedStudents.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-4 rounded-lg border hover-elevate"
                      data-testid={`student-account-${student.id}`}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex flex-col">
                          <span className="font-semibold">{student.name}</span>
                          <code className="text-sm font-mono text-muted-foreground">
                            @{student.username}
                          </code>
                        </div>
                        {student.grade && student.className && (
                          <Badge variant="outline">
                            Grade {student.grade}-{student.className}
                          </Badge>
                        )}
                        <Badge variant="outline">
                          Credibility: {student.credibilityScore.toFixed(1)}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Joined {new Date(student.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteStudent(student.id, student.name)}
                        disabled={deleteAccountMutation.isPending}
                        data-testid={`button-delete-account-${student.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5" />
              Promote User to Admin
            </CardTitle>
            <CardDescription>
              Grant admin privileges to a student without losing your own admin status. This is different from the handover feature.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="select-user-promote">Select Student to Promote</Label>
                <Select
                  value={selectedUserToPromote}
                  onValueChange={setSelectedUserToPromote}
                >
                  <SelectTrigger id="select-user-promote" data-testid="select-user-promote">
                    <SelectValue placeholder={studentsLoading ? "Loading..." : "Choose a student..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {studentsLoading ? (
                      <SelectItem value="loading" disabled>
                        Loading students...
                      </SelectItem>
                    ) : students && students.length > 0 ? (
                      students.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.name} (@{student.username}) - Grade {student.grade}-{student.className}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>
                        No students available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <Button
                onClick={handlePromoteClick}
                disabled={!selectedUserToPromote || promoteMutation.isPending}
                data-testid="button-promote-to-admin"
                className="w-full"
              >
                <Crown className="w-4 h-4 mr-2" />
                {promoteMutation.isPending ? "Promoting..." : "Promote to Admin"}
              </Button>

              <div className="rounded-lg bg-muted p-4 space-y-2">
                <h4 className="font-semibold text-sm">Important Notes:</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>This action promotes a student to admin status</li>
                  <li>You will keep your admin privileges (inheritance model)</li>
                  <li>The promoted user will have full administrative access</li>
                  <li>This is different from "handover" which transfers privileges</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <AlertDialog open={showPromoteDialog} onOpenChange={setShowPromoteDialog}>
          <AlertDialogContent data-testid="dialog-confirm-promote">
            <AlertDialogHeader>
              <AlertDialogTitle>Promote User to Admin?</AlertDialogTitle>
              <AlertDialogDescription>
                {selectedUserData && (
                  <span>
                    Are you sure you want to promote <strong>{selectedUserData.name}</strong> (@{selectedUserData.username}) to admin? 
                    They will have full administrative privileges including:
                    <ul className="mt-2 space-y-1 list-disc list-inside">
                      <li>Managing student IDs and accounts</li>
                      <li>Deleting posts and content</li>
                      <li>Promoting other users to admin</li>
                      <li>All other administrative functions</li>
                    </ul>
                  </span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-promote">Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleConfirmPromotion} 
                disabled={promoteMutation.isPending}
                data-testid="button-confirm-promote"
              >
                {promoteMutation.isPending ? "Promoting..." : "Promote to Admin"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
