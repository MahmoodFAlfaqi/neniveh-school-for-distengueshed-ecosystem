import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, Trophy, TrendingUp, Newspaper, Clock, BookOpen, Volleyball, Flame, Star } from "lucide-react";
import { Link } from "wouter";
import { useMemo } from "react";

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
  startTime: string;
  eventType: "curricular" | "extracurricular";
  location?: string;
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

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const calendarDays = useMemo(() => {
    const days = [];
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 1);
    
    for (let i = 0; i < 15; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      days.push(date);
    }
    
    return days;
  }, [today]);

  const getDateString = (date: Date) => {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      return null;
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const eventsByDate = useMemo(() => {
    const map: Record<string, Event[]> = {};
    
    events.forEach(event => {
      try {
        const eventDate = new Date(event.startTime);
        
        if (!(eventDate instanceof Date) || isNaN(eventDate.getTime())) {
          return;
        }
        
        eventDate.setHours(0, 0, 0, 0);
        const dateStr = getDateString(eventDate);
        
        if (dateStr) {
          if (!map[dateStr]) {
            map[dateStr] = [];
          }
          map[dateStr].push(event);
        }
      } catch (e) {
        // Silently skip invalid dates
      }
    });
    
    return map;
  }, [events]);

  const getEventTypeStyle = (eventType: string) => {
    if (eventType === "curricular") {
      return {
        bg: "bg-indigo-500/20 dark:bg-indigo-400/20",
        text: "text-indigo-700 dark:text-indigo-300",
        icon: BookOpen,
        label: "Class",
      };
    } else {
      return {
        bg: "bg-teal-500/20 dark:bg-teal-400/20",
        text: "text-teal-700 dark:text-teal-300",
        icon: Volleyball,
        label: "Activity",
      };
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="w-full">
        {/* Hero/Header Section */}
        <div className="relative bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 dark:from-primary/10 dark:via-transparent dark:to-secondary/10 border-b border-border/50">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12 lg:py-16">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-1 h-8 bg-gradient-to-b from-primary to-secondary rounded-full" />
                <h1 className="text-4xl lg:text-5xl font-bold tracking-tight">
                  Welcome back{user ? `, ${user.name.split(' ')[0]}` : ''}!
                </h1>
              </div>
              <p className="text-base text-muted-foreground max-w-2xl">
                Stay connected with your school community. Track your progress, explore upcoming events, and engage with classmates.
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8 lg:py-12 space-y-8">
          
          {/* Stats Grid */}
          {user && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* User Profile Card */}
              <Link href="/profile" className="group">
                <Card className="hover-elevate active-elevate-2 cursor-pointer h-full transition-all" data-testid="card-user-stats">
                  <CardContent className="p-6 flex flex-col h-full">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="relative">
                        <Avatar className="w-12 h-12 ring-2 ring-primary/20">
                          <AvatarFallback className="text-sm font-bold bg-gradient-to-br from-primary to-secondary text-white">
                            {getUserInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        {user.role === "admin" && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg">
                            ⭐
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors" data-testid="text-user-name">
                          {user.name}
                        </p>
                        <Badge variant="secondary" className="mt-1 text-xs font-medium">
                          {user.role}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-3 flex-1">
                      <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 border border-primary/20 dark:border-primary/30">
                        <div className="flex items-center gap-2 mb-2">
                          <Trophy className="w-4 h-4 text-primary" />
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Credibility</span>
                        </div>
                        <p className="text-2xl font-bold text-primary" data-testid="text-credibility">
                          {user.credibilityScore.toFixed(0)}
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-gradient-to-br from-secondary/10 to-secondary/5 dark:from-secondary/20 dark:to-secondary/10 border border-secondary/20 dark:border-secondary/30">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="w-4 h-4 text-secondary" />
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Reputation</span>
                        </div>
                        <p className="text-2xl font-bold text-secondary" data-testid="text-reputation">
                          {user.reputationScore.toFixed(0)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-border/50 text-xs text-muted-foreground flex items-center gap-1">
                      <span>View full profile</span>
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              {/* Status Overview Card */}
              <Card className="h-full" data-testid="card-status-overview">
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent/70 flex items-center justify-center">
                      <Flame className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="font-semibold text-sm">Activity Status</h3>
                  </div>
                  
                  <div className="space-y-3 flex-1">
                    <div className="bg-background/50 dark:bg-background/30 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1">Account Status</p>
                      <Badge variant="outline" className="text-xs font-medium">
                        {user.accountStatus}
                      </Badge>
                    </div>
                    <div className="bg-background/50 dark:bg-background/30 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1">Participation</p>
                      <p className="font-semibold text-sm">{recentPosts.length} posts</p>
                    </div>
                    <div className="bg-background/50 dark:bg-background/30 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1">Upcoming Events</p>
                      <p className="font-semibold text-sm">{events.length} total</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions Card */}
              <Card className="h-full" data-testid="card-quick-actions">
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
                      <Star className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="font-semibold text-sm">Quick Access</h3>
                  </div>
                  
                  <div className="space-y-2 flex-1">
                    <Link href="/news" className="block">
                      <div className="p-3 rounded-lg bg-background/50 dark:bg-background/30 hover:bg-background dark:hover:bg-background/50 transition-colors group">
                        <p className="text-xs font-medium text-muted-foreground">Latest News</p>
                        <p className="text-sm font-semibold group-hover:text-primary transition-colors">View posts →</p>
                      </div>
                    </Link>
                    <Link href="/events" className="block">
                      <div className="p-3 rounded-lg bg-background/50 dark:bg-background/30 hover:bg-background dark:hover:bg-background/50 transition-colors group">
                        <p className="text-xs font-medium text-muted-foreground">Events</p>
                        <p className="text-sm font-semibold group-hover:text-primary transition-colors">Explore events →</p>
                      </div>
                    </Link>
                    <Link href="/teachers" className="block">
                      <div className="p-3 rounded-lg bg-background/50 dark:bg-background/30 hover:bg-background dark:hover:bg-background/50 transition-colors group">
                        <p className="text-xs font-medium text-muted-foreground">Faculty</p>
                        <p className="text-sm font-semibold group-hover:text-primary transition-colors">Meet teachers →</p>
                      </div>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Calendar Preview Card */}
              <Link href="/schedule" className="group">
                <Card className="hover-elevate active-elevate-2 cursor-pointer h-full transition-all" data-testid="card-upcoming-events">
                  <CardContent className="p-6 flex flex-col h-full">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-white" />
                      </div>
                      <h3 className="font-semibold text-sm">Calendar</h3>
                    </div>

                    {/* Mini Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1 flex-1">
                      {calendarDays.slice(0, 14).map((date, idx) => {
                        const dateStr = getDateString(date);
                        const dayEvents = dateStr ? (eventsByDate[dateStr] || []) : [];
                        const isToday = date.getTime() === today.getTime();
                        const isPast = date.getTime() < today.getTime();

                        return (
                          <div
                            key={idx}
                            className={`
                              text-center text-[0.65rem] p-1 rounded-lg min-h-10 flex flex-col items-center justify-center font-medium transition-colors
                              ${isToday 
                                ? 'bg-gradient-to-br from-primary to-secondary text-white font-bold shadow-md' 
                                : isPast 
                                ? 'text-muted-foreground/50' 
                                : dayEvents.length > 0
                                ? 'bg-accent/20 dark:bg-accent/30 text-accent-foreground font-semibold'
                                : 'hover:bg-background/50 dark:hover:bg-background/30'
                              }
                            `}
                            data-testid={`event-${date.getDate()}`}
                          >
                            <div className="text-[#141414]">{date.getDate()}</div>
                            {dayEvents.length > 0 && !isToday && (
                              <div className="w-1 h-1 bg-accent rounded-full mt-0.5" />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-3 pt-3 border-t border-border/50 text-xs text-muted-foreground flex items-center gap-1">
                      <span>View calendar</span>
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          )}

          {/* Featured Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-gradient-to-b from-primary to-secondary rounded-full" />
              <h2 className="text-2xl font-bold">Community Highlights</h2>
            </div>

            <Link href="/news" className="group">
              <Card className="hover-elevate active-elevate-2 cursor-pointer transition-all" data-testid="card-news-preview">
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent/70 flex items-center justify-center">
                      <Newspaper className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">Latest News & Posts</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {recentPosts.length} posts from your school community
                      </p>
                    </div>
                  </div>

                  {recentPosts.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No posts yet. Be the first to share!</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {recentPosts.slice(0, 6).map((post: Post) => (
                        <div 
                          key={post.id} 
                          className="p-4 rounded-xl bg-background/50 dark:bg-background/30 border border-border/50 hover:border-primary/30 hover:bg-background dark:hover:bg-background/50 transition-all group/post"
                          data-testid={`post-preview-${post.id}`}
                        >
                          <div className="flex items-start gap-3 mb-3">
                            <Avatar className="w-8 h-8 flex-shrink-0 ring-2 ring-primary/20">
                              <AvatarFallback className="text-xs font-bold">
                                {post.author ? getUserInitials(post.author.name) : "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold truncate group-hover/post:text-primary transition-colors">
                                {post.author?.name || "Unknown"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {post.author?.role}
                              </p>
                            </div>
                          </div>
                          <p className="text-sm text-foreground/80 line-clamp-2 mb-3">
                            {post.content}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {new Date(post.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-6 flex items-center gap-2 text-primary font-medium text-sm group-hover:gap-3 transition-all">
                    <span>View all posts</span>
                    <span>→</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
