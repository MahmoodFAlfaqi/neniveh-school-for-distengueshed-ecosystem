import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Home() {
  const { toast } = useToast();
  
  // Auth state
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  
  // Access code state
  const [selectedScope, setSelectedScope] = useState("");
  const [accessCode, setAccessCode] = useState("");
  
  // Post state
  const [postContent, setPostContent] = useState("");
  const [postScope, setPostScope] = useState<string | null>(null);
  
  // Admin handover state
  const [successorEmail, setSuccessorEmail] = useState("");
  
  // Fetch current user (from session)
  const { data: currentUser, isLoading: userLoading } = useQuery<any>({
    queryKey: ["/api/auth/me"],
    retry: false,
  });
  
  // Fetch scopes
  const { data: scopes = [] } = useQuery<any[]>({
    queryKey: ["/api/scopes"],
    enabled: !!currentUser,
  });
  
  // Fetch user's digital keys
  const { data: digitalKeys = [] } = useQuery<any[]>({
    queryKey: ["/api/keys"],
    enabled: !!currentUser,
  });
  
  // Fetch posts
  const { data: posts = [] } = useQuery<any[]>({
    queryKey: ["/api/posts"],
    enabled: !!currentUser,
  });
  
  // Auth mutations
  const loginMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/auth/login", { email, password });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({ title: "Login successful", description: `Welcome, ${data.user.name}!` });
    },
    onError: () => {
      toast({ title: "Login failed", description: "Invalid credentials", variant: "destructive" });
    },
  });
  
  const registerMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/auth/register", { email, password, name, role: "student" });
    },
    onSuccess: (data: any) => {
      toast({ title: "Registration successful", description: "Please log in" });
      setAuthMode("login");
    },
    onError: () => {
      toast({ title: "Registration failed", variant: "destructive" });
    },
  });
  
  const logoutMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/auth/logout", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({ title: "Logged out successfully" });
    },
  });
  
  // Access code mutation
  const unlockScopeMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/keys/unlock", {
        scopeId: selectedScope,
        accessCode,
      });
    },
    onSuccess: (data: any) => {
      toast({ title: "Success!", description: data.message });
      queryClient.invalidateQueries({ queryKey: ["/api/keys"] });
      setAccessCode("");
    },
    onError: (error: any) => {
      toast({ title: "Failed", description: error.message || "Incorrect access code", variant: "destructive" });
    },
  });
  
  // Post creation mutation
  const createPostMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/posts", {
        content: postContent,
        scopeId: postScope,
      });
    },
    onSuccess: () => {
      toast({ title: "Post created!" });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      setPostContent("");
      
      // Recalculate reputation
      calculateReputationMutation.mutate();
    },
    onError: (error: any) => {
      toast({ title: "Failed to create post", description: error.message, variant: "destructive" });
    },
  });
  
  // Calculate reputation
  const calculateReputationMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/reputation/calculate", {});
    },
    onSuccess: (data: any) => {
      toast({ title: "Reputation updated", description: `Score: ${data.reputation.toFixed(2)}` });
      
      // Refresh user data
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
  });
  
  // Admin handover mutation
  const handoverMutation = useMutation({
    mutationFn: async (successorId: string) => {
      return apiRequest("POST", "/api/admin/handover", {
        successorId,
        notes: `Handover from ${currentUser.name}`,
      });
    },
    onSuccess: (data: any) => {
      toast({ title: "Admin privileges transferred", description: data.message });
      
      // Refresh user to show new role
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
    onError: (error: any) => {
      toast({ title: "Handover failed", description: error.message, variant: "destructive" });
    },
  });
  
  const handleAuth = () => {
    if (authMode === "login") {
      loginMutation.mutate();
    } else {
      registerMutation.mutate();
    }
  };
  
  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }
  
  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>School Community Ecosystem</CardTitle>
            <CardDescription>
              {authMode === "login" ? "Login to your account" : "Create a new account"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {authMode === "register" && (
              <div className="space-y-2">
                <Label htmlFor="name" data-testid="label-name">Name</Label>
                <Input
                  id="name"
                  data-testid="input-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email" data-testid="label-email">Email</Label>
              <Input
                id="email"
                data-testid="input-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" data-testid="label-password">Password</Label>
              <Input
                id="password"
                data-testid="input-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
              />
            </div>
            
            <Button
              data-testid="button-auth"
              onClick={handleAuth}
              className="w-full"
              disabled={loginMutation.isPending || registerMutation.isPending}
            >
              {authMode === "login" ? "Login" : "Register"}
            </Button>
            
            <Button
              data-testid="button-toggle-mode"
              variant="ghost"
              onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}
              className="w-full"
            >
              {authMode === "login" ? "Need an account? Register" : "Have an account? Login"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Welcome, {currentUser.name}</span>
            <Button
              data-testid="button-logout"
              variant="outline"
              onClick={() => logoutMutation.mutate()}
            >
              Logout
            </Button>
          </CardTitle>
          <CardDescription>Testing Backend Logic</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Role</div>
              <Badge variant={currentUser.role === "admin" ? "default" : "secondary"} data-testid="badge-role">
                {currentUser.role}
              </Badge>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Credibility</div>
              <div className="text-lg font-semibold" data-testid="text-credibility">
                {currentUser.credibilityScore?.toFixed(1) || "50.0"}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Reputation</div>
              <div className="text-lg font-semibold" data-testid="text-reputation">
                {currentUser.reputationScore?.toFixed(1) || "0.0"}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Account Status</div>
              <Badge 
                variant={currentUser.accountStatus === "threatened" ? "destructive" : "secondary"}
                data-testid="badge-status"
              >
                {currentUser.accountStatus || "active"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Digital Keys Section */}
      <Card>
        <CardHeader>
          <CardTitle>🔑 Digital Keys (Access Code System)</CardTitle>
          <CardDescription>
            Enter an access code once to unlock a scope permanently
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label data-testid="label-scope">Select Scope</Label>
              <Select value={selectedScope} onValueChange={setSelectedScope}>
                <SelectTrigger data-testid="select-scope">
                  <SelectValue placeholder="Choose a scope" />
                </SelectTrigger>
                <SelectContent>
                  {scopes.map((scope: any) => (
                    <SelectItem key={scope.id} value={scope.id}>
                      {scope.name} ({scope.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label data-testid="label-access-code">Access Code</Label>
              <div className="flex gap-2">
                <Input
                  data-testid="input-access-code"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  placeholder="Enter access code"
                />
                <Button
                  data-testid="button-unlock"
                  onClick={() => unlockScopeMutation.mutate()}
                  disabled={!selectedScope || !accessCode || unlockScopeMutation.isPending}
                >
                  Unlock
                </Button>
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div>
            <div className="text-sm font-medium mb-2">Your Digital Keys ({digitalKeys.length})</div>
            <div className="flex flex-wrap gap-2">
              {digitalKeys.length === 0 && (
                <div className="text-sm text-muted-foreground" data-testid="text-no-keys">
                  No keys yet. Enter an access code above to unlock a scope.
                </div>
              )}
              {digitalKeys.map((key: any) => (
                <Badge key={key.id} variant="outline" data-testid={`badge-key-${key.scopeId}`}>
                  Key #{key.scopeId.slice(0, 8)}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Admin Handover Section */}
      {currentUser.role === "admin" && (
        <Card>
          <CardHeader>
            <CardTitle>👑 Admin Handover Protocol</CardTitle>
            <CardDescription>
              Transfer admin privileges to a successor (you'll become Alumni)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive" data-testid="button-open-handover">
                  Initiate Handover
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Transfer Admin Privileges</DialogTitle>
                  <DialogDescription>
                    This action will transfer all admin privileges to the successor and downgrade your account to Alumni status.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-2">
                  <Label data-testid="label-successor">Successor Email</Label>
                  <Input
                    data-testid="input-successor"
                    value={successorEmail}
                    onChange={(e) => setSuccessorEmail(e.target.value)}
                    placeholder="successor@email.com"
                  />
                </div>
                
                <DialogFooter>
                  <Button
                    data-testid="button-confirm-handover"
                    variant="destructive"
                    onClick={async () => {
                      try {
                        // Search for user by email
                        const user = await apiRequest("GET", `/api/users/search?email=${encodeURIComponent(successorEmail)}`, {});
                        if (user?.id) {
                          handoverMutation.mutate(user.id);
                        }
                      } catch (error) {
                        toast({ title: "User not found", variant: "destructive" });
                      }
                    }}
                    disabled={!successorEmail || handoverMutation.isPending}
                  >
                    Confirm Transfer
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      )}
      
      {/* Post Creation Section */}
      <Card>
        <CardHeader>
          <CardTitle>📝 Create Post</CardTitle>
          <CardDescription>Post to Public Square or restricted scopes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label data-testid="label-post-scope">Post Scope</Label>
            <Select value={postScope || "public"} onValueChange={(v) => setPostScope(v === "public" ? null : v)}>
              <SelectTrigger data-testid="select-post-scope">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public Square (No Code Required)</SelectItem>
                {scopes.map((scope: any) => (
                  <SelectItem key={scope.id} value={scope.id}>
                    {scope.name} ({scope.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label data-testid="label-post-content">Content</Label>
            <Input
              data-testid="input-post-content"
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              placeholder="What's on your mind?"
            />
          </div>
          
          <Button
            data-testid="button-create-post"
            onClick={() => createPostMutation.mutate()}
            disabled={!postContent || createPostMutation.isPending}
          >
            Create Post
          </Button>
        </CardContent>
      </Card>
      
      {/* Posts Display */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Posts ({posts.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {posts.length === 0 && (
            <div className="text-sm text-muted-foreground" data-testid="text-no-posts">
              No posts yet. Create one above!
            </div>
          )}
          {posts.slice(0, 5).map((post: any) => (
            <Card key={post.id} data-testid={`post-${post.id}`}>
              <CardContent className="pt-4">
                <div className="text-sm">{post.content}</div>
                <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
                  <Badge variant="outline">Credibility: {post.credibilityRating?.toFixed(1)}</Badge>
                  <Badge variant="secondary">
                    {post.scopeId ? `Scope: ${post.scopeId.slice(0, 8)}` : "Public"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>
      
      {/* Reputation Calculator */}
      <Card>
        <CardHeader>
          <CardTitle>🎯 Reputation Engine</CardTitle>
          <CardDescription>Calculate your reputation based on activity, credibility, and participation</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            data-testid="button-calculate-reputation"
            onClick={() => calculateReputationMutation.mutate()}
            disabled={calculateReputationMutation.isPending}
          >
            Recalculate Reputation
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
