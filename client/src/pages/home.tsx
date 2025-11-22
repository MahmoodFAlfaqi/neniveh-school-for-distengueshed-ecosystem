import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, Trophy, TrendingUp, Newspaper, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";

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

  const [calendarDate, setCalendarDate] = useState(new Date());

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const upcomingEvents = events.slice(0, 5);

  // Calendar logic
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const calendarDays = useMemo(() => {
    const days = [];
    const daysInMonth = getDaysInMonth(calendarDate);
    const firstDay = getFirstDayOfMonth(calendarDate);

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  }, [calendarDate]);

  const eventDates = useMemo(() => {
    return events.map(e => new Date(e.date).getDate()).filter(d => !isNaN(d));
  }, [events]);

  const prevMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1));
  };

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-background via-background to-muted/20">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        
        {/* Hero Section */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">
            Welcome back{user ? `, ${user.name.split(' ')[0]}` : ''}!
          </h1>
          <p className="text-lg text-muted-foreground">
            Stay updated with your school community
          </p>
        </div>

        {/* Stats Grid */}
        {user && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Profile Card */}
            <Card className="md:col-span-1 hover-elevate" data-testid="card-user-stats">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-6">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="text-base font-semibold">
                      {getUserInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate" data-testid="text-user-name">{user.name}</p>
                    <Badge variant="secondary" className="mt-1 text-xs">{user.role}</Badge>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-violet-50 dark:bg-violet-950/20">
                    <div className="flex items-center gap-2 mb-1">
                      <Trophy className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                      <span className="text-xs font-medium text-muted-foreground">Credibility</span>
                    </div>
                    <p className="text-2xl font-bold text-violet-600 dark:text-violet-400" data-testid="text-credibility">
                      {user.credibilityScore.toFixed(0)}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-cyan-50 dark:bg-cyan-950/20">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                      <span className="text-xs font-medium text-muted-foreground">Reputation</span>
                    </div>
                    <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400" data-testid="text-reputation">
                      {user.reputationScore.toFixed(0)}
                    </p>
                  </div>
                  <div className="pt-3 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">Status</span>
                      <Badge 
                        variant={user.accountStatus === "active" ? "default" : "destructive"}
                        className="text-xs"
                      >
                        {user.accountStatus}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Mini Calendar */}
            <Link href="/schedule" className="md:col-span-2">
              <Card className="hover-elevate active-elevate-2 cursor-pointer h-full" data-testid="card-upcoming-events">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-primary" />
                      <h2 className="text-lg font-semibold">Calendar</h2>
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">
                      {calendarDate.toLocaleString('default', { month: 'short', year: 'numeric' })}
                    </span>
                  </div>

                  <div className="space-y-4">
                    {/* Month Navigation */}
                    <div className="flex items-center justify-between">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          prevMonth();
                        }}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <span className="text-sm font-medium">
                        {calendarDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                      </span>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          nextMonth();
                        }}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="text-center text-xs font-semibold text-muted-foreground py-2">
                          {day}
                        </div>
                      ))}
                      {calendarDays.map((day, idx) => (
                        <div
                          key={idx}
                          className={`aspect-square flex items-center justify-center text-xs rounded-lg ${
                            day === null 
                              ? 'text-muted-foreground/20' 
                              : eventDates.includes(day)
                              ? 'bg-primary/20 text-primary font-semibold'
                              : 'text-foreground hover:bg-muted/50'
                          } transition-colors`}
                        >
                          {day}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Events List */}
                  {upcomingEvents.length > 0 && (
                    <div className="mt-4 pt-4 border-t space-y-2">
                      {upcomingEvents.map((event) => (
                        <div
                          key={event.id}
                          className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors text-sm"
                          data-testid={`event-${event.id}`}
                        >
                          <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                          <p className="truncate flex-1">{event.title}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          </div>
        )}

        {/* News & Activity Section */}
        <Link href="/news">
          <Card className="hover-elevate active-elevate-2 cursor-pointer" data-testid="card-news-preview">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Newspaper className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">Latest News</h2>
                <span className="text-xs font-medium text-muted-foreground ml-auto">
                  {recentPosts.length} posts
                </span>
              </div>

              {recentPosts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Newspaper className="w-12 h-12 text-muted-foreground/20 mb-2" />
                  <p className="text-sm text-muted-foreground">No posts yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {recentPosts.slice(0, 6).map((post: Post) => (
                    <div 
                      key={post.id} 
                      className="p-4 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors group"
                      data-testid={`post-preview-${post.id}`}
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <Avatar className="w-9 h-9 flex-shrink-0">
                          <AvatarFallback className="text-xs font-semibold">
                            {post.author ? getUserInitials(post.author.name) : "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">
                            {post.author?.name || "Unknown"}
                          </p>
                          {post.author && (
                            <Badge variant="outline" className="text-xs mt-0.5">
                              {post.author.role}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
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
            </CardContent>
          </Card>
        </Link>

      </div>
    </div>
  );
}
