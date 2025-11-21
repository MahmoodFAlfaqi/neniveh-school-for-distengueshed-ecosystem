import { useRoute, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Clock, MapPin, User as UserIcon, ArrowLeft } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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

type User = {
  id: string;
  username: string;
  photoUrl: string | null;
};

type RSVP = {
  eventId: string;
};

export default function EventDetail() {
  const [, params] = useRoute("/events/:id");
  const { toast } = useToast();
  const eventId = params?.id;

  const { data: event, isLoading: eventLoading } = useQuery<Event>({
    queryKey: ["/api/events", eventId],
    enabled: !!eventId,
  });

  const { data: user } = useQuery<User>({
    queryKey: ["/api/auth/me"],
  });

  const { data: rsvps = [] } = useQuery<RSVP[]>({
    queryKey: ["/api/rsvps"],
    enabled: !!user,
  });

  const { data: attendees = [] } = useQuery<User[]>({
    queryKey: [`/api/events/${eventId}/attendees`],
    enabled: !!eventId,
  });

  const isRsvped = rsvps.some(r => r.eventId === eventId);

  const rsvpMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/events/${eventId}/rsvp`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rsvps"] });
      queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/attendees`] });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({
        title: "Success",
        description: isRsvped ? "RSVP cancelled" : "RSVP confirmed!",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update RSVP",
      });
    },
  });

  if (eventLoading) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6">
          <Skeleton className="h-10 w-64 mb-6" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Event Not Found</h3>
              <p className="text-sm text-muted-foreground max-w-md mb-4">
                The event you're looking for doesn't exist or has been removed.
              </p>
              <Link href="/schedule">
                <Button>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Schedule
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const startDate = new Date(event.startTime);
  const endDate = event.endTime ? new Date(event.endTime) : null;

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div>
          <Link href="/schedule">
            <Button variant="ghost" size="sm" className="mb-4" data-testid="button-back">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Schedule
            </Button>
          </Link>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Calendar className="w-8 h-8" />
            {event.title}
          </h1>
        </div>

        <Card>
          <CardContent className="p-6">
            {event.imageUrl && (
              <div className="mb-6 rounded-lg overflow-hidden">
                <img
                  src={event.imageUrl}
                  alt={event.title}
                  className="w-full h-64 object-cover"
                />
              </div>
            )}

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
                <p className="text-base">
                  {event.description || "No description provided"}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Start Time
                  </h3>
                  <p className="text-base">
                    {startDate.toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </p>
                </div>

                {endDate && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      End Time
                    </h3>
                    <p className="text-base">
                      {endDate.toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                )}

                {event.location && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Location
                    </h3>
                    <p className="text-base">{event.location}</p>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Event Type</h3>
                  <p className="text-base capitalize">{event.eventType.replace('_', ' ')}</p>
                </div>
              </div>

              <div className="pt-4">
                <Button
                  onClick={() => rsvpMutation.mutate()}
                  disabled={rsvpMutation.isPending}
                  variant={isRsvped ? "outline" : "default"}
                  className="w-full md:w-auto"
                  data-testid="button-rsvp"
                >
                  {rsvpMutation.isPending
                    ? "Processing..."
                    : isRsvped
                    ? "Cancel RSVP"
                    : "RSVP to Event"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Attendees ({attendees.length})</CardTitle>
            <CardDescription>
              People who have RSVPed to this event
            </CardDescription>
          </CardHeader>
          <CardContent>
            {attendees.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No attendees yet. Be the first to RSVP!
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {attendees.map((attendee) => (
                  <div
                    key={attendee.id}
                    className="flex items-center gap-3 p-3 rounded-lg border"
                    data-testid={`attendee-${attendee.id}`}
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={attendee.photoUrl || undefined} />
                      <AvatarFallback>
                        <UserIcon className="w-5 h-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {attendee.username}
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
