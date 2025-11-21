import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TeachersPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Teachers</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Teacher Directory</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Teacher profiles and reviews coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
}
