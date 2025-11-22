import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Heart, MessageSquare, Send, TrendingUp, Star, ChevronDown, ChevronUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ScopeSelector } from "@/components/ScopeSelector";
import { useHasAccessToScope } from "@/hooks/use-digital-keys";
import { UserProfileLink } from "@/components/UserProfileLink";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";

type Post = {
  id: string;
  content: string;
  authorId: string;
  scopeId: string | null;
  credibilityRating: number;
  mediaUrl: string | null;
  mediaType: string | null;
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  authorName: string;
  authorRole: string;
  authorAvatarUrl: string | null;
  isLikedByCurrentUser: boolean;
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
  const [selectedScope, setSelectedScope] = useState<string | null>(null);
  const [showCommentsForPostId, setShowCommentsForPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState<{ [postId: string]: string }>({});

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

  const handleToggleLike = (postId: string) => {
    toggleLikeMutation.mutate(postId);
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
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">Public Square</h1>
          <p className="text-muted-foreground">
            Share news and updates with the entire school community
          </p>
        </div>

        {/* Create Post Card */}
        <Card data-testid="card-create-post">
          <CardHeader>
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
          </CardHeader>
          <form onSubmit={handleSubmitPost}>
            <CardContent className="space-y-4">
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
                placeholder="Select where to post"
              />
            </CardContent>
            <CardFooter className="justify-end">
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
        </Card>

        {/* News Feed */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
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
            posts.map((post) => (
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
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className={getCredibilityColor(post.credibilityRating)}>
                        {post.credibilityRating.toFixed(0)}% credibility
                      </Badge>
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
                <CardFooter className="py-3 flex-col items-start gap-3 w-full">
                  <div className="flex gap-4 w-full">
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
                    <Collapsible open={showCommentsForPostId === post.id} onOpenChange={(open) => setShowCommentsForPostId(open ? post.id : null)} className="flex items-center gap-2">
                      <CollapsibleTrigger className="flex items-center gap-2 text-sm hover-elevate px-2 py-1 rounded-md" data-testid={`button-comment-${post.id}`}>
                        <MessageSquare className="w-4 h-4" />
                        <span>{post.commentsCount}</span>
                        {showCommentsForPostId === post.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </CollapsibleTrigger>
                    </Collapsible>
                  </div>

                  <Collapsible open={showCommentsForPostId === post.id} className="w-full">
                    <CollapsibleContent className="space-y-3 pt-2 w-full">
                      <PostCommentSection postId={post.id} />
                    </CollapsibleContent>
                  </Collapsible>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
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
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-2">
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
