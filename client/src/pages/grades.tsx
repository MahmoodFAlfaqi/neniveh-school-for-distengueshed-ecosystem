import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, BookOpen } from "lucide-react";
import { Link } from "wouter";

export default function Grades() {
  const grades = [
    { number: 1, description: "First Grade" },
    { number: 2, description: "Second Grade" },
    { number: 3, description: "Third Grade" },
    { number: 4, description: "Fourth Grade" },
    { number: 5, description: "Fifth Grade" },
    { number: 6, description: "Sixth Grade" },
  ];

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Grades</h1>
          <p className="text-muted-foreground mt-2">
            Explore news, events, and classes for each grade level
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {grades.map((grade) => (
            <Link 
              key={grade.number} 
              href={`/grades/${grade.number}`}
              data-testid={`card-grade-${grade.number}`}
            >
              <Card className="hover-elevate active-elevate-2 transition-all cursor-pointer">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl">Grade {grade.number}</CardTitle>
                    <Badge variant="outline" className="text-lg px-3 py-1">
                      {grade.number}
                    </Badge>
                  </div>
                  <CardDescription>{grade.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      <span>Classes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>Students</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
