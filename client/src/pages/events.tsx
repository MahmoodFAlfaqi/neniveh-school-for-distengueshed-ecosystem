import { useState } from "react";
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
import { Calendar, MapPin, Clock, Users, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

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

function EventCard({ event, globalScopeId }: { event: Event; globalScopeId: string }) {
  const { toast } = useToast();
  const [showAttendees, setShowAttendees] = useState(false);

  const { data: attendees = [], isLoading: loadingAttendees } = useQuery<Attendee[]>({
    queryKey: ["/api/events", event.id, "attendees"],
    enabled: showAttendees,
    queryFn: async () => {
      const response = await fetch(`/api/events/${event.id}/attendees`);
      if (!response.ok) throw new Error("Failed to fetch attendees");
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
      queryClient.invalidateQueries({ queryKey: ["/api/events", globalScopeId] });
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
              <Avatar className="h-6 w-6">
                <AvatarImage src={event.createdByAvatarUrl || undefined} />
                <AvatarFallback>{event.createdByName.charAt(0)}</AvatarFallback>
              </Avatar>
              <span>{event.createdByName}</span>
              <Badge variant="outline" className="text-xs">
                {event.createdByRole}
              </Badge>
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
                  </div>
                ))}
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </CardFooter>
    </Card>
  );
}

export default function EventsPage() {
  const { toast } = useToast();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    eventType: "extracurricular" as "curricular" | "extracurricular",
    startTime: "",
    endTime: "",
    location: "",
  });

  // Fetch all scopes to find the global scope
  const { data: scopes = [] } = useQuery<Array<{
    id: string;
    name: string;
    type: string;
  }>>({
    queryKey: ["/api/scopes"],
  });

  // Get the global scope ID
  const globalScope = scopes.find(s => s.type === "global");

  // Fetch global events (using global scope ID)
  const { data: events = [], isLoading } = useQuery<Event[]>({
    queryKey: ["/api/events", globalScope?.id],
    enabled: !!globalScope,
    queryFn: async () => {
      const response = await fetch(`/api/events?scopeId=${globalScope!.id}`);
      if (!response.ok) throw new Error("Failed to fetch events");
      return response.json();
    },
  });

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
      if (!globalScope) {
        throw new Error("Global scope not found");
      }
      return await apiRequest("POST", "/api/events", {
        ...data,
        scopeId: globalScope.id,
        startTime: new Date(data.startTime),
        endTime: data.endTime ? new Date(data.endTime) : null,
      });
    },
    onSuccess: () => {
      toast({
        title: "Event created",
        description: "Your event has been posted to the Public Square",
      });
      setFormData({
        title: "",
        description: "",
        eventType: "extracurricular",
        startTime: "",
        endTime: "",
        location: "",
      });
      setShowCreateForm(false);
      queryClient.invalidateQueries({ queryKey: ["/api/events", globalScope?.id] });
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
    if (formData.title.trim() && formData.startTime) {
      createEventMutation.mutate(formData);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Events</h1>
            <p className="text-muted-foreground">
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
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="eventType">Event Type *</Label>
                    <Select
                      value={formData.eventType}
                      onValueChange={(value: "curricular" | "extracurricular") =>
                        setFormData({ ...formData, eventType: value })
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
                  disabled={!formData.title.trim() || !formData.startTime || createEventMutation.isPending}
                  data-testid="button-submit-event"
                >
                  {createEventMutation.isPending ? "Creating..." : "Create Event"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        )}

        {/* Events List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Upcoming Events
          </h2>

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
            events.map((event) => (
              <EventCard 
                key={event.id} 
                event={event} 
                globalScopeId={globalScope!.id} 
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
