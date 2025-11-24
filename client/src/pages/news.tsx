import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Heart, MessageSquare, Send, TrendingUp, Star, ChevronDown, ChevronUp, Edit2, X, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ScopeSelector } from "@/components/ScopeSelector";
import { useHasAccessToScope } from "@/hooks/use-digital-keys";
import { UserProfileLink } from "@/components/UserProfileLink";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

type Post = {
  id: string;
  content: string;
  authorId: string;
  scopeId: string | null;
  credibilityRating: number;
  authorCredibilityScore: number;
  mediaUrl: string | null;
  mediaType: string | null;
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  authorName: string;
  authorRole: string;
  authorAvatarUrl: string | null;
  isLikedByCurrentUser: boolean;
  currentUserAccuracyRating?: number | null;
  author: {
    name: string;
    role: string;
    avatarUrl: string | null;
    averageRating: number | null;
  };
};

export default function NewsPage() {
  const { toast } = useToast();
  const [newPost, setNewPost] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [filterByRole, setFilterByRole] = useState("all");
  
  // Fetch scopes to find public scope for default selection
  const { data: scopes = [] } = useQuery<Array<{ id: string; type: string; name: string }>>({
    queryKey: ["/api/scopes"],
  });

  // Find public scope
  const publicScope = scopes.find((s) => s.type === "public");
  
  // Initialize selected scope to public scope by default
  const [selectedScope, setSelectedScope] = useState<string | null>(() => publicScope?.id || null);
  
  const [showCommentsForPostId, setShowCommentsForPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState<{ [postId: string]: string }>({});
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);

  // Update selected scope when public scope loads (in case it wasn't available on mount)
  useEffect(() => {
    if (publicScope && selectedScope === null) {
      setSelectedScope(publicScope.id);
    }
  }, [publicScope?.id]);

  // Check if user has access to selected scope
  const hasAccess = useHasAccessToScope(selectedScope);

  // Fetch news posts for the selected scope (or all global posts if no scope selected)
  const { data: posts = [], isLoading } = useQuery<Post[]>({
    queryKey: ["/api/posts", selectedScope],
    queryFn: async () => {
      const scopeParam = selectedScope === null ? "null" : selectedScope;
      const response = await fetch(`/api/posts?scopeId=${scopeParam}`);
      if (!response.ok) throw new Error("Failed to fetch posts");
      return response.json();
    },
  });

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

  const toggleLikeMutation = useMutation({
    mutationFn: async (postId: string) => {
      return await apiRequest("POST", `/api/posts/${postId}/like`);
    },
    onSuccess: () => {
      // Refetch posts to get updated likes count and status
      queryClient.invalidateQueries({ queryKey: ["/api/posts", selectedScope] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update like",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createPostMutation = useMutation({
    mutationFn: async (content: string) => {
      return await apiRequest("POST", "/api/posts", {
        content,
        scopeId: selectedScope,
      });
    },
    onSuccess: () => {
      toast({
        title: "Post published",
        description: "Your news has been shared successfully",
      });
      setNewPost("");
      queryClient.invalidateQueries({ queryKey: ["/api/posts", selectedScope] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to post",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const rateAccuracyMutation = useMutation({
    mutationFn: async (data: { postId: string; rating: number }) => {
      return await apiRequest("POST", `/api/posts/${data.postId}/rate-accuracy`, { rating: data.rating });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts", selectedScope] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to rate post accuracy",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updatePostMutation = useMutation({
    mutationFn: async (data: { postId: string; content: string }) => {
      return await apiRequest("PATCH", `/api/posts/${data.postId}`, { content: data.content });
    },
    onSuccess: () => {
      toast({
        title: "Post updated",
        description: "Your post has been edited successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/posts", selectedScope] });
      setEditingPostId(null);
      setEditContent("");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update post",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleToggleLike = (postId: string) => {
    toggleLikeMutation.mutate(postId);
  };

  const handleEditPost = (post: Post) => {
    setEditingPostId(post.id);
    setEditContent(post.content);
  };

  const handleSaveEdit = () => {
    if (editContent.trim() && editingPostId) {
      updatePostMutation.mutate({ postId: editingPostId, content: editContent });
    }
  };

  const handleRatePostAccuracy = (postId: string, rating: number) => {
    rateAccuracyMutation.mutate({ postId, rating });
  }

  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      return await apiRequest("DELETE", `/api/posts/${postId}`);
    },
    onSuccess: () => {
      toast({
        title: "Post deleted",
        description: "The post has been removed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/posts", selectedScope] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete post",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDeletePost = (postId: string) => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      deletePostMutation.mutate(postId);
    }
  };

  const isPostAuthor = (authorId: string): boolean => {
    return user?.id === authorId;
  };

  const isAdmin = (): boolean => {
    return user?.role === "admin";
  };

  const handleSubmitPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPost.trim()) {
      createPostMutation.mutate(newPost);
    }
  };

  const getCredibilityColor = (rating: number) => {
    if (rating >= 75) return "text-green-600 dark:text-green-400";
    if (rating >= 50) return "text-yellow-600 dark:text-yellow-400";
    if (rating >= 25) return "text-orange-600 dark:text-orange-400";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Public Square</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Share news and updates with the entire school community
          </p>
        </div>

        {/* Create Post Card - Collapsible */}
        <Collapsible open={isCreatePostOpen} onOpenChange={setIsCreatePostOpen}>
          <Card className="transition-all duration-300 ease-out" data-testid="card-create-post">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover-elevate py-3 sm:py-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user?.avatarUrl || undefined} />
                      <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{user?.name || "User"}</p>
                      <Badge variant="secondary" className="text-xs">
                        {user?.role || "student"}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-muted-foreground transition-transform duration-300" style={{
                    transform: isCreatePostOpen ? "rotate(180deg)" : "rotate(0deg)"
                  }}>
                    <ChevronDown className="w-5 h-5" />
                  </div>
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <form onSubmit={handleSubmitPost}>
                <CardContent className="space-y-4 animate-in fade-in duration-300">
                  <div className="space-y-1">
                    <Textarea
                      placeholder="What's happening in our school community?"
                      value={newPost}
                      onChange={(e) => setNewPost(e.target.value)}
                      className="min-h-24 resize-none border-0 text-base focus-visible:ring-0"
                      data-testid="textarea-new-post"
                      maxLength={4000}
                    />
                    <div className="flex justify-end">
                      <span className={`text-xs ${newPost.length > 4000 ? "text-destructive" : "text-muted-foreground"}`} data-testid="text-character-count">
                        {newPost.length}/4000
                      </span>
                    </div>
                  </div>
                  <Separator />
                  <ScopeSelector
                    value={selectedScope}
                    onChange={setSelectedScope}
                    label="Post to"
                    placeholder="Public Square"
                  />
                </CardContent>
                <CardFooter className="justify-end animate-in fade-in duration-300">
                  <Button
                    type="submit"
                    disabled={!newPost.trim() || newPost.length > 4000 || createPostMutation.isPending || (selectedScope !== null && !hasAccess)}
                    data-testid="button-submit-post"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {createPostMutation.isPending ? "Posting..." : "Post"}
                  </Button>
                </CardFooter>
              </form>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* News Feed */}
        <div className="space-y-4 sm:space-y-6">
          <h2 className="text-xl sm:text-2xl font-semibold flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Latest News
          </h2>

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading news...</p>
            </div>
          ) : posts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  No news yet. Be the first to share something!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {posts.sort((a, b) => sortBy === "newest" ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() : a.credibilityRating - b.credibilityRating).filter(p => filterByRole === "all" || p.authorRole === filterByRole).map((post) => (
              <Card key={post.id} className="hover-elevate" data-testid={`card-post-${post.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col gap-2">
                      <UserProfileLink 
                        userId={post.authorId}
                        name={post.authorName}
                        avatarUrl={post.authorAvatarUrl}
                        showAvatar={true}
                      />
                      <div className="flex items-center gap-2 text-sm text-muted-foreground pl-1">
                        <Badge variant="secondary" className="text-xs">
                          {post.authorRole}
                        </Badge>
                        {post.author.averageRating !== null && post.author.averageRating > 0 && (
                          <>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-xs font-medium">{post.author.averageRating.toFixed(1)}</span>
                            </div>
                          </>
                        )}
                        <span>•</span>
                        <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={getCredibilityColor(post.authorCredibilityScore)}>
                        {post.authorCredibilityScore.toFixed(0)}% credibility
                      </Badge>
                      {isPostAuthor(post.authorId) && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEditPost(post)}
                          data-testid={`button-edit-post-${post.id}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      )}
                      {isAdmin() && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDeletePost(post.id)}
                          data-testid={`button-delete-post-${post.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap" data-testid={`text-content-${post.id}`}>
                    {post.content}
                  </p>
                  {post.mediaUrl && (
                    <div className="mt-4">
                      {post.mediaType === "image" && (
                        <img
                          src={post.mediaUrl}
                          alt="Post media"
                          className="rounded-md max-h-96 w-full object-cover"
                        />
                      )}
                    </div>
                  )}
                </CardContent>
                <Separator />
                <CardFooter className="py-3 flex-col items-start gap-3 w-full sticky top-0 z-10 bg-card">
                  <div className="flex gap-4 w-full items-center justify-between">
                    <div className="flex gap-4 items-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2"
                        onClick={() => handleToggleLike(post.id)}
                        data-testid={`button-like-${post.id}`}
                      >
                        <Heart
                          className={`w-4 h-4 ${
                            post.isLikedByCurrentUser
                              ? "fill-red-500 text-red-500"
                              : ""
                          }`}
                        />
                        <span>{post.likesCount}</span>
                      </Button>
                      <Collapsible open={showCommentsForPostId === post.id} onOpenChange={(open) => setShowCommentsForPostId(open ? post.id : null)}>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm" className="gap-2" data-testid={`button-comment-${post.id}`}>
                            <MessageSquare className="w-4 h-4" />
                            <span>{post.commentsCount}</span>
                            {showCommentsForPostId === post.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </Button>
                        </CollapsibleTrigger>
                      </Collapsible>
                    </div>
                    
                    {/* Post Accuracy Rating */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground" data-testid={`post-accuracy-${post.id}`}>
                      <span className="font-medium">Post Accuracy</span>
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <button
                            key={i}
                            onClick={() => handleRatePostAccuracy(post.id, i + 1)}
                            className="hover:opacity-80 transition-opacity"
                            data-testid={`button-rate-accuracy-${post.id}-${i + 1}`}
                          >
                            <Star
                              className={`w-3.5 h-3.5 cursor-pointer ${
                                i < (post.currentUserAccuracyRating || 0)
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-muted-foreground hover:text-amber-300"
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                      <span className="text-xs ml-0.5 font-semibold">{(post.currentUserAccuracyRating || 0).toFixed(1)}</span>
                    </div>
                  </div>
                  <Collapsible open={showCommentsForPostId === post.id} className="w-full">
                    <CollapsibleContent className="w-full">
                      <PostCommentSection postId={post.id} />
                    </CollapsibleContent>
                  </Collapsible>
                </CardFooter>
              </Card>
              ))}
            </div>
          )}
        </div>

        <Dialog open={!!editingPostId} onOpenChange={(open) => { if (!open) setEditingPostId(null); }}>
          <DialogContent data-testid="dialog-edit-post">
            <DialogHeader>
              <DialogTitle>Edit Post</DialogTitle>
              <DialogDescription>Make changes to your post content.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="What's happening in our school community?"
                className="min-h-24 resize-none"
                data-testid="textarea-edit-post"
                maxLength={4000}
              />
              <div className="flex justify-end">
                <span className={`text-xs ${editContent.length > 4000 ? "text-destructive" : "text-muted-foreground"}`}>
                  {editContent.length}/4000
                </span>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setEditingPostId(null)}
                data-testid="button-cancel-edit"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveEdit}
                disabled={!editContent.trim() || editContent.length > 4000 || updatePostMutation.isPending}
                data-testid="button-save-edit"
              >
                {updatePostMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

function PostCommentSection({ postId }: { postId: string }) {
  const { toast } = useToast();
  const [commentText, setCommentText] = useState("");
  const { data: comments = [], isLoading } = useQuery<any[]>({
    queryKey: [`/api/posts/${postId}/comments`],
    queryFn: async () => {
      const response = await fetch(`/api/posts/${postId}/comments`);
      if (!response.ok) throw new Error("Failed to fetch comments");
      return response.json();
    },
  });

  const createCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      return await apiRequest("POST", `/api/posts/${postId}/comments`, { content });
    },
    onSuccess: () => {
      setCommentText("");
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${postId}/comments`] });
      toast({ title: "Comment added", description: "Your comment has been posted" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to add comment", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmitComment = () => {
    if (commentText.trim()) {
      createCommentMutation.mutate(commentText);
    }
  };

  return (
    <div className="space-y-3 border-t pt-3">
      <div className="space-y-2">
        <div className="flex gap-2">
          <Input
            placeholder="Add a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="text-sm"
            data-testid="input-post-comment"
          />
          <Button size="sm" onClick={handleSubmitComment} disabled={!commentText.trim() || createCommentMutation.isPending} data-testid="button-submit-comment">
            <Send className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <div className="space-y-2 max-h-[200px] overflow-y-auto scrollbar-thin">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading comments...</p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No comments yet</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-2 p-2 bg-muted/50 rounded-md text-sm" data-testid={`comment-${comment.id}`}>
              <Avatar className="h-6 w-6">
                <AvatarImage src={comment.authorAvatarUrl || undefined} />
                <AvatarFallback>{comment.authorName?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-xs">{comment.authorName}</span>
                  <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</span>
                </div>
                <p className="text-xs text-foreground break-words">{comment.content}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
