import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function EventsPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Events</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>School Events</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Events calendar coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
}
