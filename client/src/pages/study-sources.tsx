import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Upload, FileText, Download, Trash2, Calendar, User, Filter, Plus, File, FileImage, FileAudio, FileVideo } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { ScopeSelector } from "@/components/ScopeSelector";
import { useHasAccessToScope } from "@/hooks/use-digital-keys";
import { UserProfileLink } from "@/components/UserProfileLink";

type StudySource = {
  id: string;
  authorId: string;
  scopeId: string | null;
  fileName: string;
  fileUrl: string;
  fileSize: number | null;
  fileType: string | null;
  subject: string;
  title: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    username: string;
    name: string;
    avatarUrl: string | null;
  } | null;
};

const SUBJECTS = [
  "Mathematics",
  "Physics", 
  "Chemistry",
  "Biology",
  "English",
  "Arabic",
  "History",
  "Geography",
  "Computer Science",
  "Art",
  "Music",
  "Physical Education",
  "Religion",
  "Other"
];

function getFileIcon(fileType: string | null) {
  if (!fileType) return <File className="w-8 h-8" />;
  
  if (fileType.startsWith("image/")) return <FileImage className="w-8 h-8 text-blue-500" />;
  if (fileType.startsWith("audio/")) return <FileAudio className="w-8 h-8 text-purple-500" />;
  if (fileType.startsWith("video/")) return <FileVideo className="w-8 h-8 text-pink-500" />;
  if (fileType.includes("pdf")) return <FileText className="w-8 h-8 text-red-500" />;
  
  return <File className="w-8 h-8 text-muted-foreground" />;
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "Unknown size";
  
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export default function StudySourcesPage() {
  const { toast } = useToast();
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [subject, setSubject] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [filterSubject, setFilterSubject] = useState<string>("all");
  
  // Fetch scopes to find public scope for default selection
  const { data: scopes = [] } = useQuery<Array<{ id: string; type: string; name: string }>>({
    queryKey: ["/api/scopes"],
  });

  // Find public scope
  const publicScope = scopes.find((s) => s.type === "public");
  
  // Initialize selected scope to public scope by default
  const [selectedScope, setSelectedScope] = useState<string | null>(null);
  const [uploadScope, setUploadScope] = useState<string | null>(null);
  
  // Update selected scope when public scope loads
  useEffect(() => {
    if (publicScope && selectedScope === null) {
      setSelectedScope(publicScope.id);
      setUploadScope(publicScope.id);
    }
  }, [publicScope?.id]);

  // Check if user has access to selected scope
  const hasAccess = useHasAccessToScope(selectedScope);
  const hasUploadAccess = useHasAccessToScope(uploadScope);

  // Get current user info
  const { data: user } = useQuery<{
    id: string;
    name: string;
    email: string;
    role: string;
    avatarUrl: string | null;
  }>({
    queryKey: ["/api/auth/me"],
  });

  // Fetch study sources
  const scopeParam = selectedScope === null ? "public" : selectedScope;
  const { data: sources = [], isLoading } = useQuery<StudySource[]>({
    queryKey: ["/api/study-sources", scopeParam],
    queryFn: async () => {
      const response = await fetch(`/api/study-sources?scopeId=${scopeParam}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch study sources");
      return response.json();
    },
  });

  // Filter sources by subject
  const filteredSources = filterSubject === "all" 
    ? sources 
    : sources.filter(s => s.subject === filterSubject);

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/study-sources", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to upload");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "File uploaded",
        description: "Your study source has been uploaded successfully",
      });
      setIsUploadDialogOpen(false);
      setSelectedFile(null);
      setSubject("");
      setTitle("");
      setDescription("");
      queryClient.invalidateQueries({ queryKey: ["/api/study-sources"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/study-sources/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "File deleted",
        description: "The study source has been removed",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/study-sources"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleUpload = () => {
    if (!selectedFile || !subject) {
      toast({
        title: "Missing required fields",
        description: "Please select a file and subject",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("subject", subject);
    formData.append("scopeId", uploadScope === null ? "public" : uploadScope);
    if (title) formData.append("title", title);
    if (description) formData.append("description", description);

    uploadMutation.mutate(formData);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this study source?")) {
      deleteMutation.mutate(id);
    }
  };

  const isOwner = (authorId: string) => user?.id === authorId;
  const isAdmin = () => user?.role === "admin";

  return (
    <div className="container mx-auto py-4 sm:py-8 px-4 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Study Sources</h1>
          <p className="text-muted-foreground mt-1">
            Share and access study materials with your school community
          </p>
        </div>
        
        {user?.role !== "visitor" && (
          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-upload-source">
                <Plus className="w-4 h-4 mr-2" />
                Upload File
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Upload Study Source</DialogTitle>
                <DialogDescription>
                  Share a study material with your school community
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="file">File</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="file"
                      type="file"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      data-testid="input-file"
                    />
                  </div>
                  {selectedFile && (
                    <p className="text-sm text-muted-foreground">
                      Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject *</Label>
                  <Select value={subject} onValueChange={setSubject}>
                    <SelectTrigger data-testid="select-subject">
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {SUBJECTS.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Title (optional)</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Give your file a descriptive title"
                    data-testid="input-title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what this file contains"
                    className="resize-none"
                    maxLength={1000}
                    data-testid="textarea-description"
                  />
                </div>

                <ScopeSelector
                  value={uploadScope}
                  onChange={setUploadScope}
                  label="Share with"
                  placeholder="Select who can see this"
                />
              </div>

              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIsUploadDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={!selectedFile || !subject || uploadMutation.isPending || (uploadScope !== null && !hasUploadAccess)}
                  data-testid="button-confirm-upload"
                >
                  {uploadMutation.isPending ? (
                    <>Uploading...</>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <ScopeSelector
                value={selectedScope}
                onChange={setSelectedScope}
                label="Filter by scope"
                placeholder="All scopes"
              />
            </div>
            <div className="w-full sm:w-[200px]">
              <Label className="text-sm font-medium mb-2 block">Filter by subject</Label>
              <Select value={filterSubject} onValueChange={setFilterSubject}>
                <SelectTrigger data-testid="select-filter-subject">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {SUBJECTS.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sources Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading study sources...</p>
        </div>
      ) : filteredSources.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No study sources found. {user?.role !== "visitor" && "Be the first to upload something!"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSources.map((source) => (
            <Card key={source.id} className="hover-elevate" data-testid={`card-source-${source.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  {getFileIcon(source.fileType)}
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">
                      {source.title || source.fileName}
                    </CardTitle>
                    <CardDescription className="text-xs mt-1">
                      {source.fileName}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{source.subject}</Badge>
                  <Badge variant="outline">{formatFileSize(source.fileSize)}</Badge>
                </div>
                
                {source.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {source.description}
                  </p>
                )}

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  <span>{format(new Date(source.createdAt), "MMM d, yyyy")}</span>
                </div>

                {source.author && (
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={source.author.avatarUrl || undefined} />
                      <AvatarFallback className="text-xs">
                        {source.author.name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-muted-foreground truncate">
                      {source.author.name}
                    </span>
                  </div>
                )}
              </CardContent>
              <CardFooter className="gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="flex-1"
                >
                  <a href={source.fileUrl} download data-testid={`button-download-${source.id}`}>
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </a>
                </Button>
                {(isOwner(source.authorId) || isAdmin()) && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(source.id)}
                    data-testid={`button-delete-${source.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
