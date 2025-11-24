import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit2 } from "lucide-react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";

type HexagonMetric = {
  metric: string;
  arabicLabel: string;
  value: number;
  max: number;
};

type HexagonTendencyChartProps = {
  title: string;
  description: string;
  metrics: HexagonMetric[];
  color: string;
  isOwnProfile: boolean;
  onEdit?: () => void;
};

export function HexagonTendencyChart({
  title,
  description,
  metrics,
  color,
  isOwnProfile,
  onEdit,
}: HexagonTendencyChartProps) {
  const totalPoints = metrics.reduce((sum, m) => sum + m.value, 0);
  const maxTotalPoints = 33;

  const chartData = metrics.map((m) => ({
    metric: m.arabicLabel,
    value: m.value,
    fullMark: m.max,
  }));

  return (
    <Card data-testid={`card-${title.toLowerCase().replace(/\s+/g, "-")}`}>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {isOwnProfile && onEdit && (
            <Button
              size="sm"
              variant="outline"
              onClick={onEdit}
              data-testid={`button-edit-${title.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <Edit2 className="w-3 h-3 mr-1" />
              Edit
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={chartData}>
                <PolarGrid strokeDasharray="3 3" />
                <PolarAngleAxis 
                  dataKey="metric" 
                  tick={{ fill: "hsl(var(--foreground))", fontSize: 11 }}
                />
                <PolarRadiusAxis angle={90} domain={[0, 10]} tick={{ fontSize: 10 }} />
                <Radar
                  name={title}
                  dataKey="value"
                  stroke={color}
                  fill={color}
                  fillOpacity={0.6}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            {metrics.map((m) => (
              <div
                key={m.metric}
                className="flex items-center justify-between p-2 rounded-md bg-muted/30"
                data-testid={`metric-${m.metric}`}
              >
                <span className="text-xs text-muted-foreground truncate">{m.arabicLabel}</span>
                <span className="font-medium ml-2">{m.value}/10</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-sm font-medium">Total Points Used:</span>
            <span className={`text-lg font-bold ${totalPoints > maxTotalPoints ? "text-destructive" : "text-primary"}`}>
              {totalPoints}/{maxTotalPoints}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
