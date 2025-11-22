import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, Trophy, TrendingUp, Newspaper, ArrowRight } from "lucide-react";
import { Link } from "wouter";

type User = {
  id: string;
  name: string;
  role: string;
  credibilityScore: number;
  reputationScore: number;
  accountStatus: string;
};

type Post = {
  id: string;
  content: string;
  authorId: string;
  scopeId: string | null;
  credibilityRating: number;
  createdAt: string;
  author?: {
    name: string;
    role: string;
  };
};

type Event = {
  id: string;
  title: string;
  date: string;
  type: string;
};

export default function Home() {
  const { data: user } = useQuery<User>({
    queryKey: ["/api/auth/me"],
  });

  const { data: recentPosts = [] } = useQuery<Post[]>({
    queryKey: ["/api/posts"],
  });

  const { data: events = [] } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const upcomingEvents = events.slice(0, 5);

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Welcome back{user ? `, ${user.name.split(' ')[0]}` : ''}!</h1>
          <p className="text-muted-foreground mt-1">Here's what's happening in your school community</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Your Profile Card */}
          {user && (
            <Card data-testid="card-user-stats" className="hover-elevate">
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
                    <p className="font-semibold text-lg" data-testid="text-user-name">{user.name}</p>
                    <Badge variant="outline">{user.role}</Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Trophy className="w-4 h-4 text-amber-500" />
                      <p className="text-2xl font-bold" data-testid="text-credibility">{user.credibilityScore.toFixed(1)}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">Credibility</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <TrendingUp className="w-4 h-4 text-blue-500" />
                      <p className="text-2xl font-bold" data-testid="text-reputation">{user.reputationScore.toFixed(0)}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">Reputation</p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">Account Status</p>
                    <Badge variant={user.accountStatus === "active" ? "default" : "destructive"}>
                      {user.accountStatus}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Mini Calendar Widget - Links to Schedule */}
          <Link href="/schedule">
            <Card className="hover-elevate active-elevate-2 cursor-pointer h-full" data-testid="card-upcoming-events">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    <CardTitle>Upcoming Events</CardTitle>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </div>
                <CardDescription>{upcomingEvents.length} events scheduled</CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingEvents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Calendar className="w-12 h-12 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No upcoming events</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {upcomingEvents.map((event) => (
                      <div
                        key={event.id}
                        className="flex items-center gap-3 p-2 rounded-lg border"
                        data-testid={`event-${event.id}`}
                      >
                        <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary">
                          <span className="text-xs font-medium">
                            {new Date(event.date).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
                          </span>
                          <span className="text-lg font-bold">
                            {new Date(event.date).getDate()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{event.title}</p>
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
          </Link>
        </div>

        {/* News Preview Card - Links to News */}
        <Link href="/news">
          <Card className="hover-elevate active-elevate-2 cursor-pointer" data-testid="card-news-preview">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Newspaper className="w-5 h-5" />
                  <CardTitle>Recent News</CardTitle>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </div>
              <CardDescription>Latest posts from your community</CardDescription>
            </CardHeader>
            <CardContent>
              {recentPosts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Newspaper className="w-12 h-12 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No news posts yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentPosts.slice(0, 3).map((post: Post) => (
                    <div key={post.id} className="flex gap-3 p-3 rounded-lg border" data-testid={`post-preview-${post.id}`}>
                      <Avatar className="w-10 h-10">
                        <AvatarFallback>
                          {post.author ? getUserInitials(post.author.name) : "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold truncate">
                            {post.author?.name || "Unknown"}
                          </p>
                          {post.author && (
                            <Badge variant="outline" className="text-xs">
                              {post.author.role}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {post.content}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(post.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </Link>

        {/* Activity Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Activity</CardTitle>
            <CardDescription>Recent posts from across the community</CardDescription>
          </CardHeader>
          <CardContent>
            {recentPosts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
            ) : (
              <div className="space-y-2">
                {recentPosts.slice(0, 5).map((post: Post) => (
                  <div key={post.id} className="flex gap-2 p-2 rounded-lg border hover-elevate">
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
      </div>
    </div>
  );
}
