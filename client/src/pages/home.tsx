import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, Trophy, TrendingUp, Newspaper, Clock, BookOpen, Volleyball } from "lucide-react";
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

  // Get today's date at midnight
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Generate 15-day window: 1 day before to 14 days ahead
  const calendarDays = useMemo(() => {
    const days = [];
    
    // Start from yesterday
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 1);
    
    // Generate 15 days
    for (let i = 0; i < 15; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      days.push(date);
    }
    
    return days;
  }, [today]);

  // Helper function to get date string (YYYY-MM-DD)
  const getDateString = (date: Date) => {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      return null;
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Map events by date string
  const eventsByDate = useMemo(() => {
    const map: Record<string, Event[]> = {};
    
    events.forEach(event => {
      try {
        // Parse the event date from startTime
        const eventDate = new Date(event.startTime);
        
        // Check if date is valid
        if (!(eventDate instanceof Date) || isNaN(eventDate.getTime())) {
          return;
        }
        
        // Set to midnight
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

  // Get event type icon and color
  const getEventTypeStyle = (eventType: string) => {
    if (eventType === "curricular") {
      return {
        bg: "bg-violet-600/30 dark:bg-violet-400/30",
        text: "text-violet-700 dark:text-violet-300",
        icon: BookOpen,
        label: "Class",
      };
    } else {
      return {
        bg: "bg-cyan-600/30 dark:bg-cyan-400/30",
        text: "text-cyan-700 dark:text-cyan-300",
        icon: Volleyball,
        label: "Activity",
      };
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-background via-background to-muted/20">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
        
        {/* Hero Section */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back{user ? `, ${user.name.split(' ')[0]}` : ''}!
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Your school community updates
          </p>
        </div>

        {/* Stats Grid */}
        {user && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            
            {/* Profile Card */}
            <Link href="/profile">
              <Card className="hover-elevate active-elevate-2 cursor-pointer h-full" data-testid="card-user-stats">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="text-sm font-semibold">
                        {getUserInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate" data-testid="text-user-name">{user.name}</p>
                      <Badge variant="secondary" className="mt-0.5 text-[0.65rem]">{user.role}</Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="p-2 rounded-lg bg-violet-50 dark:bg-violet-950/20">
                      <div className="flex items-center gap-2 mb-1">
                        <Trophy className="w-3 h-3 text-violet-600 dark:text-violet-400" />
                        <span className="text-[0.65rem] font-medium text-muted-foreground">Credibility</span>
                      </div>
                      <p className="text-xl font-bold text-violet-600 dark:text-violet-400" data-testid="text-credibility">
                        {user.credibilityScore.toFixed(0)}
                      </p>
                    </div>
                    <div className="p-2 rounded-lg bg-cyan-50 dark:bg-cyan-950/20">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                        <span className="text-[0.65rem] font-medium text-muted-foreground">Reputation</span>
                      </div>
                      <p className="text-xl font-bold text-cyan-600 dark:text-cyan-400" data-testid="text-reputation">
                        {user.reputationScore.toFixed(0)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Compact Calendar with Events */}
            <Link href="/schedule" className="md:col-span-2">
              <Card className="hover-elevate active-elevate-2 cursor-pointer h-full" data-testid="card-upcoming-events">
                <CardContent className="pt-3 pb-3">
                  <h2 className="text-sm font-semibold flex items-center gap-1 mb-2">
                    <Calendar className="w-3.5 h-3.5" />
                    Upcoming Events
                  </h2>

                  {/* 15-Day Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((date, idx) => {
                      const dateStr = getDateString(date);
                      const dayEvents = dateStr ? (eventsByDate[dateStr] || []) : [];
                      const isToday = date.getTime() === today.getTime();
                      const isPast = date.getTime() < today.getTime();

                      return (
                        <div
                          key={idx}
                          className={`text-center text-[0.65rem] p-1 rounded-sm min-h-12 flex flex-col ${
                            isToday
                              ? 'bg-primary/30 text-primary font-bold border-2 border-primary'
                              : isPast
                              ? 'bg-muted/30 text-muted-foreground'
                              : 'bg-background'
                          }`}
                        >
                          <div className="font-semibold">{date.getDate()}</div>
                          <div className="text-[0.5rem] flex-1 flex flex-col justify-center gap-0.5 overflow-hidden">
                            {dayEvents.slice(0, 2).map((event, eventIdx) => {
                              const typeStyle = getEventTypeStyle(event.eventType);
                              const TypeIcon = typeStyle.icon;
                              
                              return (
                                <div
                                  key={eventIdx}
                                  className={`flex items-center gap-0.5 px-0.5 rounded-sm line-clamp-1 ${typeStyle.bg} ${typeStyle.text}`}
                                  title={`${typeStyle.label}: ${event.title}`}
                                  data-testid={`event-${event.id}`}
                                >
                                  <TypeIcon className="w-2 h-2 flex-shrink-0" />
                                  <span className="truncate">{event.title}</span>
                                </div>
                              );
                            })}
                            {dayEvents.length > 2 && (
                              <div className="text-[0.5rem] text-muted-foreground">+{dayEvents.length - 2}</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Legend */}
                  <div className="mt-2 flex gap-2 text-[0.5rem]">
                    <div className="flex items-center gap-0.5">
                      <BookOpen className="w-2 h-2 text-violet-600 dark:text-violet-400" />
                      <span className="text-muted-foreground">Class</span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <Volleyball className="w-2 h-2 text-cyan-600 dark:text-cyan-400" />
                      <span className="text-muted-foreground">Activity</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        )}

        {/* News & Activity Section */}
        <Link href="/news">
          <Card className="hover-elevate active-elevate-2 cursor-pointer" data-testid="card-news-preview">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-3">
                <Newspaper className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold">Latest News</h2>
                <span className="text-xs text-muted-foreground ml-auto">
                  {recentPosts.length} posts
                </span>
              </div>

              {recentPosts.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No posts yet</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {recentPosts.slice(0, 6).map((post: Post) => (
                    <div 
                      key={post.id} 
                      className="p-3 rounded-lg bg-rose-50/50 dark:bg-rose-950/20 hover:bg-rose-100/50 dark:hover:bg-rose-950/40 transition-colors group"
                      data-testid={`post-preview-${post.id}`}
                    >
                      <div className="flex items-start gap-2 mb-2">
                        <Avatar className="w-7 h-7 flex-shrink-0">
                          <AvatarFallback className="text-[0.6rem] font-semibold">
                            {post.author ? getUserInitials(post.author.name) : "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold truncate">
                            {post.author?.name || "Unknown"}
                          </p>
                          {post.author && (
                            <Badge variant="outline" className="text-[0.6rem] mt-0.5">
                              {post.author.role}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                        {post.content}
                      </p>
                      <div className="flex items-center gap-1 text-[0.65rem] text-muted-foreground">
                        <Clock className="w-2.5 h-2.5" />
                        {new Date(post.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </Link>

      </div>
    </div>
  );
}
