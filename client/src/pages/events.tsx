import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardFooter, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Calendar, MapPin, Clock, Users, Plus, ChevronDown, ChevronUp, Star, Send, MessageSquare, Filter, Check } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { format, formatDistanceToNow } from "date-fns";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScopeSelector } from "@/components/ScopeSelector";
import { useHasAccessToScope } from "@/hooks/use-digital-keys";
import { UserProfileLink } from "@/components/UserProfileLink";
import { Link } from "wouter";

type Event = {
  id: string;
  title: string;
  description: string | null;
  eventType: "curricular" | "extracurricular";
  scopeId: string | null;
  startTime: string;
  endTime: string | null;
  location: string | null;
  imageUrl: string | null;
  createdById: string;
  createdAt: string;
  createdByName: string;
  createdByRole: string;
  createdByAvatarUrl: string | null;
  rsvpCount: number;
  userHasRsvpd: boolean;
  createdBy: {
    name: string;
    role: string;
    avatarUrl: string | null;
    averageRating: number | null;
  };
};

type Rsvp = {
  id: string;
  eventId: string;
  userId: string;
  rsvpedAt: string;
};

type Attendee = {
  id: string;
  name: string;
  username: string;
  avatarUrl: string | null;
  grade: number | null;
  className: string | null;
  credibilityScore: number;
};

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

function EventCard({ event }: { event: Event }) {
  const { toast } = useToast();
  const [showAttendees, setShowAttendees] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");

  const { data: attendees = [], isLoading: loadingAttendees } = useQuery<Attendee[]>({
    queryKey: ["/api/events", event.id, "attendees"],
    enabled: showAttendees,
    queryFn: async () => {
      const response = await fetch(`/api/events/${event.id}/attendees`);
      if (!response.ok) throw new Error("Failed to fetch attendees");
      return response.json();
    },
  });

  const { data: comments = [], isLoading: loadingComments } = useQuery<any[]>({
    queryKey: [`/api/events/${event.id}/comments`],
    enabled: showComments,
    queryFn: async () => {
      const response = await fetch(`/api/events/${event.id}/comments`);
      if (!response.ok) throw new Error("Failed to fetch comments");
      return response.json();
    },
  });

  const rsvpMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/events/${event.id}/rsvp`, {});
    },
    onSuccess: (result) => {
      if (result === null) {
        toast({
          title: "RSVP cancelled",
          description: "You've been removed from the event attendance list",
        });
      } else {
        toast({
          title: "RSVP confirmed",
          description: "You've been added to the event attendance list",
        });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events", event.id, "attendees"] });
    },
    onError: (error: Error) => {
      toast({
        title: "RSVP failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      return await apiRequest("POST", `/api/events/${event.id}/comments`, { content });
    },
    onSuccess: () => {
      setCommentText("");
      queryClient.invalidateQueries({ queryKey: [`/api/events/${event.id}/comments`] });
      toast({ title: "Comment added", description: "Your comment has been posted" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to add comment", description: error.message, variant: "destructive" });
    },
  });

  return (
    <Card className="hover-elevate" data-testid={`card-event-${event.id}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle data-testid={`text-event-title-${event.id}`}>
                {event.title}
              </CardTitle>
              <Badge variant={event.eventType === "curricular" ? "default" : "secondary"}>
                {event.eventType}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <UserProfileLink 
                userId={event.createdById}
                name={event.createdByName}
                avatarUrl={event.createdByAvatarUrl}
                showAvatar={true}
                className="text-sm"
              />
              <Badge variant="outline" className="text-xs">
                {event.createdByRole}
              </Badge>
              {event.createdBy.averageRating !== null && event.createdBy.averageRating > 0 && (
                <>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs font-medium">{event.createdBy.averageRating.toFixed(1)}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {event.description && (
          <p className="text-muted-foreground">{event.description}</p>
        )}
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span>{format(new Date(event.startTime), "PPp")}</span>
          </div>
          {event.location && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span>{event.location}</span>
            </div>
          )}
        </div>
      </CardContent>
      <Separator />
      <CardFooter className="py-3 flex-col items-start gap-3">
        <div className="w-full flex items-center justify-between">
          <Collapsible open={showAttendees} onOpenChange={setShowAttendees} className="flex items-center gap-2">
            <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover-elevate px-2 py-1 rounded-md" data-testid={`button-toggle-attendees-${event.id}`}>
              <Users className="w-4 h-4" />
              <span data-testid={`text-rsvp-count-${event.id}`}>
                {event.rsvpCount} {event.rsvpCount === 1 ? "attendee" : "attendees"}
              </span>
              {showAttendees ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </CollapsibleTrigger>
          </Collapsible>
          <Button
            size="sm"
            variant={event.userHasRsvpd ? "outline" : "default"}
            onClick={() => rsvpMutation.mutate()}
            disabled={rsvpMutation.isPending}
            data-testid={`button-rsvp-${event.id}`}
          >
            {event.userHasRsvpd ? "Cancel RSVP" : "RSVP"}
          </Button>
        </div>
        
        <Collapsible open={showAttendees} onOpenChange={setShowAttendees} className="w-full">
          <CollapsibleContent>
            {loadingAttendees ? (
              <div className="text-sm text-muted-foreground">Loading attendees...</div>
            ) : attendees.length === 0 ? (
              <div className="text-sm text-muted-foreground">No attendees yet</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {attendees.map((attendee) => (
                  <div key={attendee.id} className="flex items-center gap-3 p-2 rounded-md bg-muted/50" data-testid={`attendee-${attendee.id}`}>
                    <Link href={`/profile/${attendee.id}`} className="flex items-center gap-3 flex-1 min-w-0 hover-elevate rounded-md px-1">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={attendee.avatarUrl || undefined} />
                        <AvatarFallback>{attendee.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{attendee.name}</div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {attendee.grade && attendee.className && (
                            <Badge variant="outline" className="text-xs">
                              Grade {attendee.grade}-{attendee.className}
                            </Badge>
                          )}
                          <span>Score: {attendee.credibilityScore.toFixed(0)}</span>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        <Collapsible open={showComments} onOpenChange={setShowComments} className="w-full">
          <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover-elevate px-2 py-1 rounded-md w-full" data-testid={`button-toggle-comments-${event.id}`}>
            <MessageSquare className="w-4 h-4" />
            <span>Comments</span>
            {showComments ? <ChevronUp className="w-4 h-4 ml-auto" /> : <ChevronDown className="w-4 h-4 ml-auto" />}
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 pt-3">
            <div className="flex gap-2">
              <Input
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="text-sm"
                data-testid="input-event-comment"
              />
              <Button size="sm" onClick={() => createCommentMutation.mutate(commentText)} disabled={!commentText.trim() || createCommentMutation.isPending} data-testid="button-submit-event-comment">
                <Send className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-2">
              {loadingComments ? (
                <p className="text-sm text-muted-foreground">Loading comments...</p>
              ) : comments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No comments yet</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-2 p-2 bg-muted/50 rounded-md text-sm" data-testid={`event-comment-${comment.id}`}>
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
          </CollapsibleContent>
        </Collapsible>
      </CardFooter>
    </Card>
  );
}

export default function EventsPage() {
  const { toast } = useToast();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedScope, setSelectedScope] = useState<string | null>(null);
  const [filterBy, setFilterBy] = useState<"all" | "upcoming" | "past">("upcoming");
  const [sortBy, setSortBy] = useState<"dateAsc" | "dateDesc" | "popular">("dateAsc");
  const [typeFilter, setTypeFilter] = useState<"all" | "curricular" | "extracurricular">("all");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    eventType: "extracurricular" as "curricular" | "extracurricular",
    subject: "",
    extracurricularCategory: "",
    startTime: "",
    endTime: "",
    location: "",
  });
  const [typeFilterCheckboxes, setTypeFilterCheckboxes] = useState({
    curricular: true,
    extracurricular: true,
  });

  // Check if user has access to selected scope
  const hasAccess = useHasAccessToScope(selectedScope);

  // Fetch all scopes to find the global scope
  const { data: scopes = [] } = useQuery<Array<{
    id: string;
    name: string;
    type: string;
  }>>({
    queryKey: ["/api/scopes"],
  });

  // Get the global scope ID
  const publicScope = scopes.find(s => s.type === "public");

  // Fetch all events the user has access to
  const { data: rawEvents = [], isLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
    queryFn: async () => {
      const response = await fetch("/api/events");
      if (!response.ok) throw new Error("Failed to fetch events");
      return response.json();
    },
  });

  // Filter and sort events
  const events = useMemo(() => {
    const now = new Date();
    let filtered = [...rawEvents];
    
    // Filter by time (upcoming/past)
    if (filterBy === "upcoming") {
      filtered = filtered.filter(e => new Date(e.startTime) >= now);
    } else if (filterBy === "past") {
      filtered = filtered.filter(e => new Date(e.startTime) < now);
    }
    
    // Filter by type checkboxes
    const selectedTypes = [];
    if (typeFilterCheckboxes.curricular) selectedTypes.push("curricular");
    if (typeFilterCheckboxes.extracurricular) selectedTypes.push("extracurricular");
    if (selectedTypes.length > 0) {
      filtered = filtered.filter(e => selectedTypes.includes(e.eventType));
    }
    
    // Sort
    switch (sortBy) {
      case "dateAsc":
        return filtered.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
      case "dateDesc":
        return filtered.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
      case "popular":
        return filtered.sort((a, b) => b.rsvpCount - a.rsvpCount);
      default:
        return filtered;
    }
  }, [rawEvents, filterBy, sortBy, typeFilter]);

  // Get current user info
  const { data: user } = useQuery<{
    id: string;
    name: string;
    email: string;
    role: string;
  }>({
    queryKey: ["/api/auth/me"],
  });

  const createEventMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const scopeId = selectedScope || publicScope?.id || null;
      return await apiRequest("POST", "/api/events", {
        ...data,
        scopeId,
        startTime: new Date(data.startTime),
        endTime: data.endTime ? new Date(data.endTime) : null,
      });
    },
    onSuccess: () => {
      toast({
        title: "Event created",
        description: "Your event has been posted successfully",
      });
      setFormData({
        title: "",
        description: "",
        eventType: "extracurricular",
        subject: "",
        extracurricularCategory: "",
        startTime: "",
        endTime: "",
        location: "",
      });
      setSelectedScope(null);
      setShowCreateForm(false);
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create event",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isValid = formData.title.trim() && formData.startTime && 
      (formData.eventType === "curricular" ? formData.subject.trim() : formData.extracurricularCategory);
    if (isValid) {
      createEventMutation.mutate(formData);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">Events</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Discover and join school events
            </p>
          </div>
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            data-testid="button-create-event"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Event
          </Button>
        </div>

        {/* Create Event Form */}
        {showCreateForm && (
          <Card data-testid="card-create-event">
            <CardHeader>
              <CardTitle>Create New Event</CardTitle>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Event Title *</Label>
                  <Input
                    id="title"
                    placeholder="Science Fair 2024"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    data-testid="input-event-title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Tell us about the event..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="min-h-24"
                    data-testid="textarea-event-description"
                    maxLength={4000}
                  />
                  <div className="flex justify-end">
                    <span className={`text-xs ${formData.description.length > 4000 ? "text-destructive" : "text-muted-foreground"}`} data-testid="text-character-count">
                      {formData.description.length}/4000
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="eventType">Event Type *</Label>
                      <Select
                        value={formData.eventType}
                        onValueChange={(value: "curricular" | "extracurricular") =>
                          setFormData({ ...formData, eventType: value, extracurricularCategory: "" })
                        }
                      >
                        <SelectTrigger data-testid="select-event-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="curricular">Curricular</SelectItem>
                          <SelectItem value="extracurricular">Extracurricular</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        placeholder="School Auditorium"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        data-testid="input-event-location"
                      />
                    </div>
                  </div>

                  {formData.eventType === "curricular" && (
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject *</Label>
                      <Select
                        value={formData.subject}
                        onValueChange={(value) =>
                          setFormData({ ...formData, subject: value })
                        }
                      >
                        <SelectTrigger data-testid="select-event-subject">
                          <SelectValue placeholder="Select subject" />
                        </SelectTrigger>
                        <SelectContent>
                          {SUBJECTS.map((subject) => (
                            <SelectItem key={subject} value={subject}>
                              {subject}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {formData.eventType === "extracurricular" && (
                    <div className="space-y-2">
                      <Label htmlFor="extracurricularCategory">What kind of extracurricular? *</Label>
                      <Select
                        value={formData.extracurricularCategory}
                        onValueChange={(value) =>
                          setFormData({ ...formData, extracurricularCategory: value })
                        }
                      >
                        <SelectTrigger data-testid="select-extracurricular-category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sports">Sports & Athletics</SelectItem>
                          <SelectItem value="arts">Arts & Design</SelectItem>
                          <SelectItem value="music">Music & Performing Arts</SelectItem>
                          <SelectItem value="technology">Technology & Innovation</SelectItem>
                          <SelectItem value="debate">Debate & Public Speaking</SelectItem>
                          <SelectItem value="science">Science & Research</SelectItem>
                          <SelectItem value="community">Community Service</SelectItem>
                          <SelectItem value="cultural">Cultural & Heritage</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Start Date & Time *</Label>
                    <Input
                      id="startTime"
                      type="datetime-local"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      required
                      data-testid="input-event-start"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endTime">End Date & Time</Label>
                    <Input
                      id="endTime"
                      type="datetime-local"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      data-testid="input-event-end"
                    />
                  </div>
                </div>

                <Separator />

                <ScopeSelector
                  value={selectedScope}
                  onChange={setSelectedScope}
                  label="Event Scope"
                  placeholder="Select event scope"
                />
              </CardContent>
              <CardFooter className="justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                  data-testid="button-cancel-event"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!formData.title.trim() || !formData.startTime || (formData.eventType === "curricular" ? !formData.subject.trim() : !formData.extracurricularCategory) || createEventMutation.isPending || (selectedScope !== null && !hasAccess)}
                  data-testid="button-submit-event"
                >
                  {createEventMutation.isPending ? "Creating..." : "Create Event"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        )}

        {/* Events List */}
        <div className="space-y-4 sm:space-y-6">
          <div className="flex flex-col gap-4">
            <h2 className="text-xl sm:text-2xl font-semibold flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Events
            </h2>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex items-center gap-2 flex-1">
                <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <Select value={filterBy} onValueChange={(value: typeof filterBy) => setFilterBy(value)}>
                  <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-filter-events">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Events</SelectItem>
                    <SelectItem value="upcoming">Upcoming Only</SelectItem>
                    <SelectItem value="past">Past Events</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-4 px-3 py-2 rounded-lg border bg-card">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="type-curricular"
                    checked={typeFilterCheckboxes.curricular}
                    onCheckedChange={(checked) =>
                      setTypeFilterCheckboxes({ ...typeFilterCheckboxes, curricular: checked === true })
                    }
                    data-testid="checkbox-type-curricular"
                  />
                  <Label htmlFor="type-curricular" className="text-sm font-medium cursor-pointer">Curricular</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="type-extracurricular"
                    checked={typeFilterCheckboxes.extracurricular}
                    onCheckedChange={(checked) =>
                      setTypeFilterCheckboxes({ ...typeFilterCheckboxes, extracurricular: checked === true })
                    }
                    data-testid="checkbox-type-extracurricular"
                  />
                  <Label htmlFor="type-extracurricular" className="text-sm font-medium cursor-pointer">Extracurricular</Label>
                </div>
              </div>
              <Select value={sortBy} onValueChange={(value: typeof sortBy) => setSortBy(value)}>
                <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-sort-events">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dateAsc">Date: Soonest First</SelectItem>
                  <SelectItem value="dateDesc">Date: Latest First</SelectItem>
                  <SelectItem value="popular">Most Popular</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading events...</p>
            </div>
          ) : events.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  No events scheduled yet. Create the first one!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {events.map((event) => (
                <EventCard 
                  key={event.id} 
                  event={event} 
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
