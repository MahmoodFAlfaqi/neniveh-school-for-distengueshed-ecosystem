import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, Copy, Check, ChevronUp, ChevronDown, Crown, ShieldCheck, ArrowRightLeft, KeyRound } from "lucide-react";
import { useLocation } from "wouter";
import { ClassPicker, CLASS_LETTERS, GRADES } from "@/components/ClassPicker";
import { useUser } from "@/hooks/use-user";
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

type Scope = {
  id: string;
  name: string;
  type: "grade" | "section" | "public";
  gradeNumber: number | null;
  sectionName: string | null;
  accessCode: string | null;
  createdAt: string;
};

type AdminAccount = {
  id: string;
  username: string;
  name: string;
  email: string;
  grade: number | null;
  className: string | null;
  isSpecialAdmin: boolean;
  isOwner: boolean;
};

function ScopeManagement() {
  const { toast } = useToast();
  const [scopeName, setScopeName] = useState("");
  const [scopeType, setScopeType] = useState<"grade" | "section" | "public">("section");
  const [gradeNumber, setGradeNumber] = useState("");
  const [sectionName, setSectionName] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [scopeToDelete, setScopeToDelete] = useState<Scope | null>(null);

  const { data: scopes, isLoading } = useQuery<Scope[]>({
    queryKey: ["/api/scopes"],
  });

  const createScopeMutation = useMutation({
    mutationFn: async (data: { name: string; type: string; gradeNumber?: number; sectionName?: string; accessCode: string | null }) => {
      return await apiRequest("POST", "/api/scopes", data);
    },
    onSuccess: () => {
      toast({
        title: "Scope created",
        description: "New access scope has been created successfully",
      });
      setScopeName("");
      setGradeNumber("");
      setSectionName("");
      setAccessCode("");
      queryClient.invalidateQueries({ queryKey: ["/api/scopes"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create scope",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteScopeMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/scopes/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Scope deleted",
        description: "Access scope has been removed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/scopes"] });
      setShowDeleteDialog(false);
      setScopeToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete scope",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateScope = () => {
    // Validate scope name
    if (!scopeName.trim()) {
      toast({
        title: "Validation Error",
        description: "Scope name is required",
        variant: "destructive",
      });
      return;
    }

    if (scopeType === "public") {
      createScopeMutation.mutate({
        name: scopeName,
        type: scopeType,
        accessCode: null,
      });
    } else if (scopeType === "grade") {
      // Validate access code (alphanumeric, no spaces)
      if (!accessCode.trim() || !/^[A-Za-z0-9]+$/.test(accessCode)) {
        toast({
          title: "Validation Error",
          description: "Access code must be alphanumeric with no spaces",
          variant: "destructive",
        });
        return;
      }
      // Validate grade number
      const gradeNum = parseInt(gradeNumber);
      if (!gradeNumber || isNaN(gradeNum) || gradeNum < 1 || gradeNum > 6) {
        toast({
          title: "Validation Error",
          description: "Grade number must be between 1 and 6",
          variant: "destructive",
        });
        return;
      }
      createScopeMutation.mutate({
        name: scopeName,
        type: scopeType,
        gradeNumber: gradeNum,
        accessCode: accessCode.trim(),
      });
    } else if (scopeType === "section") {
      // Validate access code (alphanumeric, no spaces)
      if (!accessCode.trim() || !/^[A-Za-z0-9]+$/.test(accessCode)) {
        toast({
          title: "Validation Error",
          description: "Access code must be alphanumeric with no spaces",
          variant: "destructive",
        });
        return;
      }

      // Validate section name format (e.g., "1-A", "2-B")
      if (!sectionName.trim() || !/^\d+-[A-E]$/.test(sectionName.trim())) {
        toast({
          title: "Validation Error",
          description: "Section name must be in format: grade-section (e.g., 1-A, 2-B)",
          variant: "destructive",
        });
        return;
      }
      createScopeMutation.mutate({
        name: scopeName,
        type: scopeType,
        sectionName: sectionName.trim(),
        accessCode: accessCode.trim(),
      });
    }
  };

  const handleDeleteClick = (scope: Scope) => {
    setScopeToDelete(scope);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    if (scopeToDelete) {
      deleteScopeMutation.mutate(scopeToDelete.id);
    }
  };

  const publicScope = scopes?.find(s => s.type === "public");
  const gradeScopes = scopes?.filter(s => s.type === "grade").sort((a, b) => (a.gradeNumber || 0) - (b.gradeNumber || 0)) || [];
  const classScopes = scopes?.filter(s => s.type === "section").sort((a, b) => (a.sectionName || "").localeCompare(b.sectionName || "")) || [];

  return (
    <div className="space-y-6">
      {/* Create New Scope */}
      <div className="space-y-4 p-4 border rounded-lg">
        <h3 className="font-semibold">Create New Class Scope</h3>
        
        <div className="grid gap-4">
          <div>
            <Label htmlFor="scope-name">Scope Name *</Label>
            <Input
              id="scope-name"
              placeholder="e.g., Class 1-A"
              value={scopeName}
              onChange={(e) => setScopeName(e.target.value)}
              data-testid="input-scope-name"
            />
          </div>

          <div>
            <Label htmlFor="scope-type">Scope Type</Label>
            <Select value={scopeType} onValueChange={(value: "grade" | "section" | "public") => setScopeType(value)}>
              <SelectTrigger id="scope-type" data-testid="select-scope-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public Square</SelectItem>
                <SelectItem value="grade">Grade Scope</SelectItem>
                <SelectItem value="section">Class Scope</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {scopeType === "public" && (
            <p className="text-sm text-muted-foreground">
              The public square scope is created automatically and is accessible to all users.
            </p>
          )}

          {scopeType === "grade" && (
            <div>
              <Label htmlFor="grade-number">Grade Number *</Label>
              <Input
                id="grade-number"
                type="number"
                min="1"
                max="6"
                placeholder="1-6"
                value={gradeNumber}
                onChange={(e) => setGradeNumber(e.target.value)}
                data-testid="input-grade-number"
              />
            </div>
          )}

          {scopeType === "section" && (
            <div>
              <Label htmlFor="section-name">Section Name *</Label>
              <Input
                id="section-name"
                placeholder="e.g., 1-A, 2-B"
                value={sectionName}
                onChange={(e) => setSectionName(e.target.value)}
                data-testid="input-section-name"
              />
            </div>
          )}

          {scopeType !== "public" && (
            <div>
            <Label htmlFor="access-code">Access Code *</Label>
            <Input
              id="access-code"
              placeholder="Custom access code for this scope"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              data-testid="input-access-code"
            />
              <p className="text-xs text-muted-foreground mt-1">
                Students will need this code to access content in this scope
              </p>
            </div>
          )}

          <Button
            onClick={handleCreateScope}
            disabled={createScopeMutation.isPending}
            data-testid="button-create-scope"
          >
            <Plus className="w-4 h-4 mr-2" />
            {createScopeMutation.isPending ? "Creating..." : "Create Scope"}
          </Button>
        </div>
      </div>

      {/* Existing Scopes */}
      <div className="space-y-4">
        <h3 className="font-semibold">Existing Scopes</h3>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {/* Public Square Scope */}
            {publicScope && (
              <div className="space-y-2 mb-6">
                <h4 className="text-sm font-medium text-muted-foreground">Public Scope</h4>
                <div className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-accent/50 hover-elevate">
                  <div className="flex-1">
                    <div className="font-medium">{publicScope.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Accessible to all users without any access code
                    </div>
                  </div>
                  <Badge variant="default">Public</Badge>
                </div>
              </div>
            )}

            {/* Grade Scopes */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Grade Scopes ({gradeScopes.length})</h4>
              {gradeScopes.map((scope) => (
                <div
                  key={scope.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg border hover-elevate"
                  data-testid={`scope-${scope.id}`}
                >
                  <div className="flex-1">
                    <div className="font-medium">{scope.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Code: <code className="font-mono">{scope.accessCode}</code>
                    </div>
                  </div>
                  <Badge variant="secondary">Grade {scope.gradeNumber}</Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteClick(scope)}
                    data-testid={`button-delete-scope-${scope.id}`}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Class Scopes */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Class Scopes ({classScopes.length})</h4>
              {classScopes.map((scope) => (
                <div
                  key={scope.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg border hover-elevate"
                  data-testid={`scope-${scope.id}`}
                >
                  <div className="flex-1">
                    <div className="font-medium">{scope.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Code: <code className="font-mono">{scope.accessCode}</code>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{scope.sectionName}</Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteClick(scope)}
                      disabled={deleteScopeMutation.isPending}
                      data-testid={`button-delete-scope-${scope.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent data-testid="dialog-confirm-delete-scope">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Scope?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the scope <strong>{scopeToDelete?.name}</strong>?
              This will remove access for all students who have unlocked this scope.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-scope">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteScopeMutation.isPending}
              data-testid="button-confirm-delete-scope"
            >
              {deleteScopeMutation.isPending ? "Deleting..." : "Delete Scope"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function AdminAccountsCard() {
  const { user } = useUser();
  const { toast } = useToast();
  const isOwner = !!(user as { isOwner?: boolean } | undefined)?.isOwner;
  const [adminToDemote, setAdminToDemote] = useState<AdminAccount | null>(null);
  const { data: admins, isLoading } = useQuery<AdminAccount[]>({
    queryKey: ["/api/admin/admins"],
  });

  const demoteMutation = useMutation({
    mutationFn: async (userId: string) => (await apiRequest("POST", "/api/admin/demote", { userId })).json(),
    onSuccess: (result: { message?: string }) => {
      toast({ title: "Admin demoted", description: result?.message });
      setAdminToDemote(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/admins"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/students"] });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to demote admin", description: error.message, variant: "destructive" });
      setAdminToDemote(null);
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5" />
          Admin Accounts
        </CardTitle>
        <CardDescription>
          Admins can open every grade and class without an access code; the class only decides where they appear
          in class lists. Every admin can set their own class. The owner (the first admin who signed in) can also
          change other admins' classes and demote admins.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-8" role="status" aria-label="Loading admins">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : !admins || admins.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No admin accounts found.</p>
        ) : (
          <ul className="space-y-2">
            {admins.map((admin) => (
              <li
                key={admin.id}
                className="flex flex-wrap items-center justify-between gap-3 p-3 sm:p-4 rounded-lg border"
                data-testid={`admin-account-${admin.id}`}
              >
                <div className="flex flex-wrap items-center gap-2 min-w-0">
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold truncate">
                      {admin.name}
                      {admin.id === user?.id && <span className="text-muted-foreground font-normal"> (you)</span>}
                    </span>
                    <code className="text-sm font-mono text-muted-foreground truncate">@{admin.username}</code>
                  </div>
                  {admin.isOwner && (
                    <Badge className="gap-1" data-testid={`badge-owner-${admin.id}`}>
                      <Crown className="w-3 h-3" aria-hidden="true" /> Owner
                    </Badge>
                  )}
                  <Badge variant="outline">
                    {admin.grade && admin.className ? `Class ${admin.grade}-${admin.className}` : "No class"}
                  </Badge>
                </div>
                {(isOwner || admin.id === user?.id) && (
                  <div className="flex flex-wrap items-center gap-2">
                    <ClassPicker
                      userId={admin.id}
                      userName={admin.name}
                      grade={admin.grade}
                      className={admin.className}
                      allowNone
                      invalidate={[["/api/admin/admins"], ["/api/auth/me"]]}
                    />
                    {isOwner && !admin.isOwner && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-10"
                        onClick={() => setAdminToDemote(admin)}
                        data-testid={`button-demote-${admin.id}`}
                      >
                        Demote
                      </Button>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <AlertDialog open={!!adminToDemote} onOpenChange={(open) => !open && setAdminToDemote(null)}>
        <AlertDialogContent data-testid="dialog-confirm-demote">
          <AlertDialogHeader>
            <AlertDialogTitle>Demote {adminToDemote?.name}?</AlertDialogTitle>
            <AlertDialogDescription>They will lose admin access and become a student.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => adminToDemote && demoteMutation.mutate(adminToDemote.id)}
              disabled={demoteMutation.isPending}
              data-testid="button-confirm-demote"
            >
              {demoteMutation.isPending ? "Demoting..." : "Demote"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

function AdminCodeCard() {
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [confirmCode, setConfirmCode] = useState("");

  const mutation = useMutation({
    mutationFn: async () => (await apiRequest("PUT", "/api/admin/settings/admin-code", { code })).json(),
    onSuccess: () => {
      toast({ title: "Admin sign-up code updated", description: "New admins must use the new code from now on." });
      setCode("");
      setConfirmCode("");
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update code", description: error.message, variant: "destructive" });
    },
  });

  const mismatch = confirmCode.length > 0 && code !== confirmCode;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="w-5 h-5" />
          Admin Sign-up Code
        </CardTitle>
        <CardDescription>
          The code new admins enter on the admin sign-up form. It starts as the original code; only you, the owner,
          can change it.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!mismatch && code.length >= 8) mutation.mutate();
          }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="admin-code">New code</Label>
              <Input
                id="admin-code"
                type="password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                data-testid="input-admin-code"
              />
            </div>
            <div>
              <Label htmlFor="admin-code-confirm">Repeat new code</Label>
              <Input
                id="admin-code-confirm"
                type="password"
                autoComplete="new-password"
                value={confirmCode}
                onChange={(e) => setConfirmCode(e.target.value)}
                aria-invalid={mismatch}
                aria-describedby={mismatch ? "admin-code-mismatch" : undefined}
                data-testid="input-admin-code-confirm"
              />
              {mismatch && (
                <p id="admin-code-mismatch" className="text-sm text-destructive mt-1">Codes don't match</p>
              )}
            </div>
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={code.length < 8 || code !== confirmCode || mutation.isPending}
            data-testid="button-save-admin-code"
          >
            {mutation.isPending ? "Saving..." : "Save new code"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function HandoverCard({ students, studentsLoading }: { students: Student[]; studentsLoading: boolean }) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [successorId, setSuccessorId] = useState("");
  const [notes, setNotes] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const successor = students.find((s) => s.id === successorId);

  const handoverMutation = useMutation({
    mutationFn: async () =>
      (await apiRequest("POST", "/api/admin/handover", { successorId, notes: notes.trim() || undefined })).json(),
    onSuccess: (result: { message?: string }) => {
      toast({ title: "Admin role handed over", description: result?.message });
      setShowConfirm(false);
      queryClient.invalidateQueries();
      navigate("/");
    },
    onError: (error: Error) => {
      toast({ title: "Handover failed", description: error.message, variant: "destructive" });
      setShowConfirm(false);
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowRightLeft className="w-5 h-5" />
          Hand Over Admin Role
        </CardTitle>
        <CardDescription>
          Pass your admin role and ownership to a student. They become the owner and you become a student. This is
          recorded in the succession history.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="select-successor">Successor</Label>
          <Select value={successorId} onValueChange={setSuccessorId}>
            <SelectTrigger id="select-successor" data-testid="select-successor">
              <SelectValue placeholder={studentsLoading ? "Loading..." : "Choose a student..."} />
            </SelectTrigger>
            <SelectContent>
              {students.length > 0 ? (
                students.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.name} (@{student.username})
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
        <div>
          <Label htmlFor="handover-notes">Notes (optional)</Label>
          <Input
            id="handover-notes"
            placeholder="e.g., End of school year handover"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            data-testid="input-handover-notes"
          />
        </div>
        <Button
          variant="destructive"
          className="w-full"
          disabled={!successorId || handoverMutation.isPending}
          onClick={() => setShowConfirm(true)}
          data-testid="button-handover"
        >
          <ArrowRightLeft className="w-4 h-4 mr-2" />
          Hand over admin role
        </Button>
      </CardContent>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent data-testid="dialog-confirm-handover">
          <AlertDialogHeader>
            <AlertDialogTitle>Hand over your admin role?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{successor?.name}</strong> will become an admin and you will lose admin access immediately. Only
              another admin can give it back.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handoverMutation.mutate()}
              disabled={handoverMutation.isPending}
              data-testid="button-confirm-handover"
            >
              {handoverMutation.isPending ? "Handing over..." : "Hand over"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

export default function AdminPage() {
  const { toast } = useToast();
  const { user: currentUser } = useUser();
  const isOwner = !!(currentUser as { isOwner?: boolean } | undefined)?.isOwner;
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
      return (await apiRequest("POST", "/api/admin/student-ids", data)).json();
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
      queryClient.invalidateQueries({ queryKey: ["/api/admin/admins"] });
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
    <div className="container max-w-6xl mx-auto px-4 py-6 sm:p-6">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6">Admin Management</h1>

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
                  <Label htmlFor="grade">Grade</Label>
                  <Select value={grade} onValueChange={setGrade}>
                    <SelectTrigger id="grade" data-testid="input-grade">
                      <SelectValue placeholder="Choose 1-6" />
                    </SelectTrigger>
                    <SelectContent>
                      {GRADES.map((g) => (
                        <SelectItem key={g} value={String(g)}>Grade {g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="className">Class</Label>
                  <Select value={className} onValueChange={setClassName}>
                    <SelectTrigger id="className" data-testid="input-class">
                      <SelectValue placeholder="Choose A-E" />
                    </SelectTrigger>
                    <SelectContent>
                      {CLASS_LETTERS.map((letter) => (
                        <SelectItem key={letter} value={letter}>Class {letter}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                      className="flex flex-wrap items-center justify-between gap-3 p-3 sm:p-4 rounded-lg border content-auto"
                      data-testid={`student-id-${record.studentId}`}
                    >
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 flex-1 min-w-0">
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
                          size="icon"
                          variant="ghost"
                          onClick={() => handleCopy(record.studentId)}
                          aria-label={`Copy student ID ${record.studentId}`}
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
                            size="icon"
                            variant="ghost"
                            onClick={() => deleteMutation.mutate(record.id)}
                            disabled={deleteMutation.isPending}
                            aria-label={`Delete student ID for ${record.username}`}
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
              All registered student accounts. Move a student to another class, or delete an account and all of its data.
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
                      className="flex flex-wrap items-center justify-between gap-3 p-3 sm:p-4 rounded-lg border content-auto"
                      data-testid={`student-account-${student.id}`}
                    >
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 flex-1 min-w-0">
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
                      <div className="flex flex-wrap items-center gap-2">
                        <ClassPicker
                          userId={student.id}
                          userName={student.name}
                          grade={student.grade}
                          className={student.className}
                          invalidate={[["/api/admin/students"]]}
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDeleteStudent(student.id, student.name)}
                          disabled={deleteAccountMutation.isPending}
                          aria-label={`Delete ${student.name}'s account`}
                          data-testid={`button-delete-account-${student.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Scope Management Card */}
        <Card>
          <CardHeader>
            <CardTitle>Manage Access Scopes</CardTitle>
            <CardDescription>
              Create and manage grade and class scopes with custom access codes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScopeManagement />
          </CardContent>
        </Card>

        <AdminAccountsCard />

        {isOwner && <AdminCodeCard />}

        {isOwner && <HandoverCard students={students ?? []} studentsLoading={studentsLoading} />}

        {isOwner && (
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
        )}

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
