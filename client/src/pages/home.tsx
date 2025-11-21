import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Heart, MessageCircle, Share2, Calendar, Trophy, Users, TrendingUp } from "lucide-react";

type User = {
  id: string;
  name: string;
  role: string;
  credibilityScore: number;
  reputationScore: number;
  accountStatus: string;
};

type Scope = {
  id: string;
  name: string;
  description?: string;
  type: string;
  accessCode: string;
};

type Post = {
  id: string;
  content: string;
  authorId: string;
  scopeId: string | null;
  credibilityRating: number;
  mediaUrl?: string;
  mediaType?: string;
  createdAt: string;
  author?: {
    name: string;
    role: string;
    avatarUrl?: string;
  };
};

type Event = {
  id: string;
  title: string;
  description?: string;
  date: string;
  location?: string;
  type: string;
  scopeId: string;
  createdById: string;
  createdAt: string;
};

export default function Home() {
  const { toast } = useToast();
  const [selectedScope, setSelectedScope] = useState<string | null>(null);
  const [postContent, setPostContent] = useState("");

  const { data: user } = useQuery<User>({
    queryKey: ["/api/auth/me"],
  });

  const { data: scopes = [] } = useQuery<Scope[]>({
    queryKey: ["/api/scopes"],
  });

  const { data: posts = [], isLoading: postsLoading } = useQuery<Post[]>({
    queryKey: ["/api/posts", selectedScope],
  });

  const { data: events = [] } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  const { data: digitalKeys = [] } = useQuery<any[]>({
    queryKey: ["/api/keys"],
  });

  // Get recent activity - all recent posts regardless of scope
  const { data: recentActivity = [] } = useQuery<Post[]>({
    queryKey: ["/api/posts"],
  });

  const createPostMutation = useMutation({
    mutationFn: async (data: { content: string; scopeId: string | null }) => {
      await apiRequest("POST", "/api/posts", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts", selectedScope] });
      setPostContent("");
      toast({
        title: "Post created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create post",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreatePost = () => {
    if (!postContent.trim()) {
      toast({
        title: "Post content is required",
        variant: "destructive",
      });
      return;
    }

    createPostMutation.mutate({
      content: postContent,
      scopeId: selectedScope,
    });
  };

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getCredibilityBadge = (rating: number) => {
    if (rating >= 75) return { text: "High", variant: "default" as const };
    if (rating >= 50) return { text: "Medium", variant: "secondary" as const };
    return { text: "Low", variant: "destructive" as const };
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - User Stats & Leaderboard */}
        <div className="space-y-6">
          {user && (
            <Card data-testid="card-user-stats">
              <CardHeader>
                <CardTitle>Your Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarFallback className="text-xl">
                      {getUserInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold text-lg">{user.name}</p>
                    <Badge variant="outline">{user.role}</Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Trophy className="w-4 h-4 text-amber-500" />
                      <p className="text-2xl font-bold">{user.credibilityScore}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">Credibility</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <TrendingUp className="w-4 h-4 text-blue-500" />
                      <p className="text-2xl font-bold">{user.reputationScore}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">Reputation</p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-sm font-medium">Account Status</p>
                    <Badge variant={user.accountStatus === "active" ? "default" : "destructive"}>
                      {user.accountStatus}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
              <CardDescription>{events.length} events scheduled</CardDescription>
            </CardHeader>
            <CardContent>
              {events.length === 0 ? (
                <p className="text-sm text-muted-foreground">No upcoming events</p>
              ) : (
                <div className="space-y-3">
                  {events.slice(0, 5).map((event) => (
                    <div
                      key={event.id}
                      className="flex items-start gap-3 p-3 rounded-lg border hover-elevate"
                      data-testid={`event-${event.id}`}
                    >
                      <Calendar className="w-4 h-4 mt-1 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{event.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(event.date).toLocaleDateString()}
                        </p>
                        <Badge variant="outline" className="text-xs mt-1">
                          {event.type}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Center Column - News Feed */}
        <div className="space-y-6">
          {/* Scope Selector */}
          <Card>
            <CardHeader>
              <CardTitle>Select Scope</CardTitle>
              <CardDescription>Choose where to view and post content</CardDescription>
            </CardHeader>
            <CardContent>
              <Select
                value={selectedScope || "public"}
                onValueChange={(value) => setSelectedScope(value === "public" ? null : value)}
              >
                <SelectTrigger data-testid="select-scope">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public Square (Global)</SelectItem>
                  {scopes.map((scope) => (
                    <SelectItem key={scope.id} value={scope.id}>
                      {scope.name} - {scope.type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Create Post */}
          <Card>
            <CardHeader>
              <CardTitle>Create Post</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="What's on your mind?"
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                className="min-h-24"
                data-testid="textarea-post-content"
              />
              <div className="flex justify-end">
                <Button
                  onClick={handleCreatePost}
                  disabled={createPostMutation.isPending}
                  data-testid="button-create-post"
                >
                  {createPostMutation.isPending ? "Posting..." : "Post"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* News Feed */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">News Feed</h2>
            {postsLoading ? (
              <Card>
                <CardContent className="py-12">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                </CardContent>
              </Card>
            ) : posts.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <p className="text-center text-muted-foreground">
                    No posts yet. Be the first to share something!
                  </p>
                </CardContent>
              </Card>
            ) : (
              posts.map((post) => {
                const credibilityBadge = getCredibilityBadge(post.credibilityRating);
                return (
                  <Card key={post.id} data-testid={`post-${post.id}`}>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {post.author ? getUserInitials(post.author.name) : "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{post.author?.name || "Unknown User"}</p>
                            {post.author && (
                              <Badge variant="outline" className="text-xs">
                                {post.author.role}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-muted-foreground">
                              {new Date(post.createdAt).toLocaleDateString()}
                            </p>
                            <Badge variant={credibilityBadge.variant} className="text-xs">
                              {credibilityBadge.text}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="whitespace-pre-wrap">{post.content}</p>
                      
                      {post.mediaUrl && (
                        <div className="rounded-lg border overflow-hidden">
                          {post.mediaType === "image" ? (
                            <img
                              src={post.mediaUrl}
                              alt="Post media"
                              className="w-full max-h-96 object-cover"
                            />
                          ) : (
                            <div className="p-4 flex items-center gap-2">
                              <span className="text-sm">{post.mediaUrl}</span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-6 pt-2 border-t">
                        <button 
                          className="flex items-center gap-2 text-sm text-muted-foreground hover-elevate px-3 py-2 rounded-md"
                          data-testid={`button-like-${post.id}`}
                        >
                          <Heart className="w-4 h-4" />
                          <span>Like</span>
                        </button>
                        <button 
                          className="flex items-center gap-2 text-sm text-muted-foreground hover-elevate px-3 py-2 rounded-md"
                          data-testid={`button-comment-${post.id}`}
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>Comment</span>
                        </button>
                        <button 
                          className="flex items-center gap-2 text-sm text-muted-foreground hover-elevate px-3 py-2 rounded-md"
                          data-testid={`button-share-${post.id}`}
                        >
                          <Share2 className="w-4 h-4" />
                          <span>Share</span>
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column - Activity Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Activity</CardTitle>
              <CardDescription>Recent posts ({recentActivity.slice(0, 5).length})</CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent activity</p>
              ) : (
                <div className="space-y-3">
                  {recentActivity.slice(0, 5).map((post: Post) => (
                    <div key={post.id} className="flex gap-2 p-2 rounded-lg border">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="text-xs">
                          {post.author ? getUserInitials(post.author.name) : "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">
                          {post.author?.name || "Unknown"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {post.content.slice(0, 60)}...
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(post.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Digital Keys</CardTitle>
              <CardDescription>Unlocked scopes ({digitalKeys.length})</CardDescription>
            </CardHeader>
            <CardContent>
              {digitalKeys.length === 0 ? (
                <p className="text-sm text-muted-foreground">No keys unlocked yet</p>
              ) : (
                <div className="space-y-2">
                  {digitalKeys.map((key: any) => (
                    <div key={key.id} className="flex items-center gap-2 p-2 rounded-lg border">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">Scope: {key.scopeId.slice(0, 12)}</p>
                        <p className="text-xs text-muted-foreground">
                          Unlocked {new Date(key.unlockedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Leaderboard</CardTitle>
              <CardDescription>Top contributors</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {user && (
                  <div className="flex items-center gap-3 p-2 rounded-lg border">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold text-sm">
                      1
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.reputationScore} points
                      </p>
                    </div>
                    <Trophy className="w-4 h-4 text-amber-500" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
