import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, User as UserIcon, BookOpen, Edit, Save, X } from "lucide-react";
import { useState, useMemo } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Predefined subjects list
const SUBJECTS = [
  "Math",
  "R.E.",
  "P.E.",
  "Social Studies",
  "Biology",
  "Chemistry",
  "Physics",
  "Arabic",
  "English",
  "French",
  "B.P.C.",
  "Finance",
  "Geology",
  "Computer Science",
  "Arts",
  "Moralism",
  "Library",
] as const;

type Schedule = {
  id: string;
  scopeId: string;
  dayOfWeek: number;
  periodNumber: number;
  teacherName: string | null;
  subject: string | null;
};

type User = {
  id: string;
  grade: number | null;
  className: string | null;
  role: "student" | "admin";
};

type Scope = {
  id: string;
  name: string;
  type: "global" | "stage" | "section";
};

type Event = {
  id: string;
  title: string;
  description: string | null;
  eventType: string;
  scopeId: string | null;
  startTime: string;
  endTime: string | null;
  location: string | null;
  imageUrl: string | null;
  createdById: string;
  createdAt: string;
};

type RSVP = {
  eventId: string;
};

export default function SchedulePage() {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editedSchedules, setEditedSchedules] = useState<Record<string, { subject: string | null; teacherName: string | null }>>({});

  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: ["/api/auth/me"],
  });

  const { data: scopes } = useQuery<Scope[]>({
    queryKey: ["/api/scopes"],
  });

  const { data: digitalKeys = [] } = useQuery<{ scopeId: string }[]>({
    queryKey: ["/api/keys"],
    enabled: !!user,
  });

  const { data: events = [] } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  const { data: rsvps = [] } = useQuery<RSVP[]>({
    queryKey: ["/api/rsvps"],
    enabled: !!user,
  });

  // Find user's class scope
  const classScope = scopes?.find(
    (s) => s.name === `Class ${user?.grade}-${user?.className}`
  );

  // Find user's grade scope
  const gradeScope = scopes?.find(
    (s) => s.type === "stage" && s.name === `Grade ${user?.grade}`
  );

  const { data: schedules = [], isLoading: schedulesLoading } = useQuery<Schedule[]>({
    queryKey: ["/api/schedules", classScope?.id],
    queryFn: async () => {
      if (!classScope?.id) return [];
      const response = await fetch(`/api/schedules/${classScope.id}`);
      if (!response.ok) throw new Error("Failed to fetch schedules");
      return response.json();
    },
    enabled: !!classScope?.id,
  });

  // Check if user can edit (admin or has access to class scope)
  const canEdit = user?.role === "admin" || digitalKeys.some(key => key.scopeId === classScope?.id);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!classScope?.id) throw new Error("No class scope");
      
      // Only send slots that were actually edited (exist in editedSchedules)
      const updates = Object.entries(editedSchedules).map(([key, value]) => {
        const [dayStr, periodStr] = key.split('-');
        return {
          dayOfWeek: parseInt(dayStr),
          periodNumber: parseInt(periodStr),
          subject: value.subject || null,
          teacherName: value.teacherName || null,
        };
      });

      // Only send if there are actual changes
      if (updates.length === 0) {
        setIsEditing(false);
        return { message: "No changes to save" };
      }

      return apiRequest("PATCH", `/api/schedules/${classScope.id}/bulk`, { updates });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schedules", classScope?.id] });
      setIsEditing(false);
      setEditedSchedules({});
      toast({
        title: "Schedule updated",
        description: "Your timetable has been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update schedule. Please try again.",
        variant: "destructive",
      });
    },
  });

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const periods = [1, 2, 3, 4, 5, 6, 7];

  const getScheduleForSlot = (dayIndex: number, periodNum: number): Schedule | undefined => {
    return schedules.find(
      (s) => s.dayOfWeek === dayIndex + 1 && s.periodNumber === periodNum
    );
  };

  const getEditedValue = (dayIndex: number, periodNum: number, field: 'subject' | 'teacherName') => {
    const key = `${dayIndex + 1}-${periodNum}`;
    if (editedSchedules[key]) {
      return editedSchedules[key][field];
    }
    const schedule = getScheduleForSlot(dayIndex, periodNum);
    return schedule?.[field] || null;
  };

  const updateScheduleSlot = (dayIndex: number, periodNum: number, field: 'subject' | 'teacherName', value: string | null) => {
    const key = `${dayIndex + 1}-${periodNum}`;
    setEditedSchedules(prev => ({
      ...prev,
      [key]: {
        subject: field === 'subject' ? value : (prev[key]?.subject || getScheduleForSlot(dayIndex, periodNum)?.subject || null),
        teacherName: field === 'teacherName' ? value : (prev[key]?.teacherName || getScheduleForSlot(dayIndex, periodNum)?.teacherName || null),
      }
    }));
  };

  // Get events for calendar (RSVPed events + class/grade events)
  const rsvpedEventIds = useMemo(() => new Set(rsvps.map(r => r.eventId)), [rsvps]);
  
  const relevantEvents = useMemo(() => {
    return events.filter(event => {
      // Show if user RSVPed
      if (rsvpedEventIds.has(event.id)) return true;
      // Show if event is for user's class or grade
      if (event.scopeId === classScope?.id || event.scopeId === gradeScope?.id) return true;
      return false;
    });
  }, [events, rsvpedEventIds, classScope?.id, gradeScope?.id]);

  // Generate calendar dates (yesterday + next 2 weeks = 15 days)
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const calendarDates: Date[] = [];
  for (let i = 0; i < 15; i++) {
    const date = new Date(yesterday);
    date.setDate(date.getDate() + i);
    calendarDates.push(date);
  }

  // Group events by date
  const eventsByDate = new Map<string, Event[]>();
  relevantEvents.forEach(event => {
    const eventDate = new Date(event.startTime).toDateString();
    if (!eventsByDate.has(eventDate)) {
      eventsByDate.set(eventDate, []);
    }
    eventsByDate.get(eventDate)!.push(event);
  });

  if (userLoading) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6">
          <Skeleton className="h-10 w-64 mb-6" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!user?.grade || !user?.className) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Schedule Available</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                You need to be assigned to a grade and class to view your schedule.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Calendar className="w-8 h-8" />
            Schedule & Events
          </h1>
          <p className="text-muted-foreground mt-2">
            Class {user.grade}-{user.className} • {relevantEvents.length} upcoming events
          </p>
        </div>

        {/* Calendar with Events */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
            <CardDescription>
              Showing events you're attending and events for your class/grade
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {calendarDates.map((date, idx) => {
                const dateStr = date.toDateString();
                const dayEvents = eventsByDate.get(dateStr) || [];
                const isToday = dateStr === today.toDateString();
                const isPast = date < today && !isToday;

                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border ${
                      isToday ? 'bg-primary/10 border-primary' : isPast ? 'bg-muted/50' : 'bg-card'
                    }`}
                    data-testid={`calendar-day-${idx}`}
                  >
                    <div className="text-xs font-medium text-muted-foreground">
                      {date.toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                    <div className={`text-2xl font-bold ${isToday ? 'text-primary' : ''}`}>
                      {date.getDate()}
                    </div>
                    <div className="mt-2 space-y-1">
                      {dayEvents.slice(0, 2).map(event => {
                        const isRsvped = rsvpedEventIds.has(event.id);
                        return (
                          <div
                            key={event.id}
                            className={`text-xs p-1 rounded truncate ${
                              isRsvped ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground'
                            }`}
                            title={event.title}
                          >
                            {event.title}
                          </div>
                        );
                      })}
                      {dayEvents.length > 2 && (
                        <div className="text-xs text-muted-foreground">
                          +{dayEvents.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Event List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Events</CardTitle>
            <CardDescription>
              Click on any event to view full details
            </CardDescription>
          </CardHeader>
          <CardContent>
            {relevantEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No upcoming events
              </div>
            ) : (
              <div className="space-y-3">
                {relevantEvents.map(event => {
                  const isRsvped = rsvpedEventIds.has(event.id);
                  const eventDate = new Date(event.startTime);
                  
                  return (
                    <Link
                      key={event.id}
                      href={`/events/${event.id}`}
                      data-testid={`link-event-${event.id}`}
                    >
                      <div className="p-4 rounded-lg border hover-elevate cursor-pointer">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-lg">{event.title}</h3>
                              {isRsvped && (
                                <span className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded">
                                  Attending
                                </span>
                              )}
                            </div>
                            {event.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                {event.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {eventDate.toLocaleDateString('en-US', { 
                                  weekday: 'short', 
                                  month: 'short', 
                                  day: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit'
                                })}
                              </div>
                              {event.location && (
                                <div className="flex items-center gap-1">
                                  📍 {event.location}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Timetable */}
        {schedulesLoading ? (
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-96 w-full" />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <CardTitle>Weekly Timetable</CardTitle>
                  <CardDescription>
                    {schedules.length > 0
                      ? `${schedules.length} class periods scheduled`
                      : "No schedule entries yet"}
                  </CardDescription>
                </div>
                {canEdit && (
                  <div className="flex gap-2">
                    {isEditing ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setIsEditing(false);
                            setEditedSchedules({});
                          }}
                          data-testid="button-cancel-edit"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => saveMutation.mutate()}
                          disabled={saveMutation.isPending}
                          data-testid="button-save-schedule"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          {saveMutation.isPending ? "Saving..." : "Save Changes"}
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => setIsEditing(true)}
                        data-testid="button-edit-schedule"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Schedule
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="p-3 text-left font-semibold bg-muted">Period</th>
                      {days.map((day) => (
                        <th key={day} className="p-3 text-center font-semibold bg-muted">
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {periods.map((period) => (
                      <tr key={period} className="border-b">
                        <td className="p-3 font-medium bg-muted/50">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Period {period}
                          </div>
                        </td>
                        {days.map((day, dayIndex) => {
                          const currentSubject = getEditedValue(dayIndex, period, 'subject');
                          const currentTeacher = getEditedValue(dayIndex, period, 'teacherName');

                          return (
                            <td
                              key={day}
                              className="p-2"
                              data-testid={`schedule-cell-${dayIndex + 1}-${period}`}
                            >
                              {isEditing ? (
                                <div className="space-y-2 p-2">
                                  <Select
                                    value={currentSubject || "NONE"}
                                    onValueChange={(value) =>
                                      updateScheduleSlot(dayIndex, period, 'subject', value === "NONE" ? null : value)
                                    }
                                  >
                                    <SelectTrigger className="h-8 text-xs">
                                      <SelectValue placeholder="Select subject" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="NONE">None</SelectItem>
                                      {SUBJECTS.map((subject) => (
                                        <SelectItem key={subject} value={subject}>
                                          {subject}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <input
                                    type="text"
                                    placeholder="Teacher name"
                                    className="w-full px-2 py-1 text-xs border rounded"
                                    value={currentTeacher || ""}
                                    onChange={(e) =>
                                      updateScheduleSlot(dayIndex, period, 'teacherName', e.target.value || null)
                                    }
                                    data-testid={`input-teacher-${dayIndex + 1}-${period}`}
                                  />
                                </div>
                              ) : currentSubject ? (
                                <div className="space-y-1 p-2 rounded-lg border bg-card hover-elevate">
                                  <div className="flex items-center gap-1 text-sm font-semibold">
                                    <BookOpen className="w-3 h-3" />
                                    {currentSubject}
                                  </div>
                                  {currentTeacher && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                      <UserIcon className="w-3 h-3" />
                                      {currentTeacher}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="p-2 text-center text-xs text-muted-foreground">
                                  —
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {schedules.length === 0 && !isEditing && (
                <div className="mt-8 text-center">
                  <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">
                    No schedule entries have been created yet for your class.
                  </p>
                  {canEdit && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Click "Edit Schedule" to start building your timetable.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
