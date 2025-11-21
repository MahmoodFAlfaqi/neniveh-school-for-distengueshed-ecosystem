import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, User as UserIcon, BookOpen } from "lucide-react";

type Schedule = {
  id: string;
  scopeId: string;
  dayOfWeek: number;
  periodNumber: number;
  teacherName: string | null;
  subject: string | null;
};

type User = {
  grade: number | null;
  className: string | null;
};

type Scope = {
  id: string;
  name: string;
};

export default function SchedulePage() {
  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  const { data: scopes } = useQuery<Scope[]>({
    queryKey: ["/api/scopes"],
  });

  const classScope = scopes?.find(
    (s) => s.name === `Class ${user?.grade}-${user?.className}`
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

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const periods = [1, 2, 3, 4, 5, 6, 7];

  const getScheduleForSlot = (dayIndex: number, periodNum: number): Schedule | undefined => {
    return schedules.find(
      (s) => s.dayOfWeek === dayIndex + 1 && s.periodNumber === periodNum
    );
  };

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
            Class Schedule
          </h1>
          <p className="text-muted-foreground mt-2">
            Weekly schedule for Class {user.grade}-{user.className}
          </p>
        </div>

        {schedulesLoading ? (
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-96 w-full" />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Your Timetable</CardTitle>
              <CardDescription>
                {schedules.length > 0
                  ? `${schedules.length} class periods scheduled this week`
                  : "No schedule entries yet"}
              </CardDescription>
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
                      <tr key={period} className="border-b hover-elevate">
                        <td className="p-3 font-medium bg-muted/50">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Period {period}
                          </div>
                        </td>
                        {days.map((day, dayIndex) => {
                          const schedule = getScheduleForSlot(dayIndex, period);
                          return (
                            <td
                              key={day}
                              className="p-2"
                              data-testid={`schedule-cell-${dayIndex + 1}-${period}`}
                            >
                              {schedule ? (
                                <div className="space-y-1 p-2 rounded-lg border bg-card hover-elevate">
                                  <div className="flex items-center gap-1 text-sm font-semibold">
                                    <BookOpen className="w-3 h-3" />
                                    {schedule.subject || "No Subject"}
                                  </div>
                                  {schedule.teacherName && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                      <UserIcon className="w-3 h-3" />
                                      {schedule.teacherName}
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

              {schedules.length === 0 && (
                <div className="mt-8 text-center">
                  <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">
                    No schedule entries have been created yet for your class.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
