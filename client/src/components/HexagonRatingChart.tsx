import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";

type HexagonMetrics = {
  metric1: number;
  metric2: number;
  metric3: number;
  metric4: number;
  metric5: number;
  metric6: number;
};

type HexagonRatingChartProps = {
  socialPersonality: HexagonMetrics;
  skillsAbilities: HexagonMetrics;
  interestsHobbies: HexagonMetrics;
  hobbies: string[];
  onSocialChange: (metrics: HexagonMetrics) => void;
  onSkillsChange: (metrics: HexagonMetrics) => void;
  onInterestsChange: (metrics: HexagonMetrics) => void;
  onHobbiesChange: (hobbies: string[]) => void;
  readonly?: boolean;
};

const HexagonChart = ({
  title,
  metrics,
  labels,
  onChange,
  readonly = false,
}: {
  title: string;
  metrics: HexagonMetrics;
  labels: [string, string, string, string, string, string];
  onChange: (metrics: HexagonMetrics) => void;
  readonly?: boolean;
}) => {
  const points = Object.values(metrics);
  const maxRadius = 100;
  const sliceAngle = (Math.PI * 2) / 6;

  const getPoint = (index: number, value: number) => {
    const angle = sliceAngle * index - Math.PI / 2;
    const radius = (value / 10) * maxRadius;
    const x = 150 + radius * Math.cos(angle);
    const y = 150 + radius * Math.sin(angle);
    return `${x},${y}`;
  };

  const polygonPoints = points
    .map((_, i) => getPoint(i, points[i]))
    .join(" ");

  const handleChange = (metricKey: keyof HexagonMetrics, value: number) => {
    // Relative scoring: when one increases, others decrease proportionally
    const total = Object.values(metrics).reduce((a, b) => a + b, 0) - (metrics[metricKey] || 0) + value;
    const targetTotal = 60; // 6 metrics × 10 max = 60 total

    if (total > targetTotal) {
      const excess = total - targetTotal;
      const otherKeys = (Object.keys(metrics) as (keyof HexagonMetrics)[]).filter(
        (k) => k !== metricKey
      );
      const reductionPerKey = excess / otherKeys.length;

      const newMetrics = { ...metrics };
      newMetrics[metricKey] = value;
      otherKeys.forEach((k) => {
        newMetrics[k] = Math.max(0, (newMetrics[k] || 0) - reductionPerKey);
      });
      onChange(newMetrics);
    } else {
      onChange({ ...metrics, [metricKey]: value });
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4">
        <div className="flex-shrink-0">
          <svg width="300" height="300" viewBox="0 0 300 300" className="mx-auto">
            {/* Grid circles */}
            {[2, 4, 6, 8, 10].map((val) => (
              <circle
                key={`grid-${val}`}
                cx="150"
                cy="150"
                r={(val / 10) * 100}
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="1"
              />
            ))}
            {/* Axes */}
            {points.map((_, i) => {
              const angle = sliceAngle * i - Math.PI / 2;
              const endX = 150 + 110 * Math.cos(angle);
              const endY = 150 + 110 * Math.sin(angle);
              return (
                <line
                  key={`axis-${i}`}
                  x1="150"
                  y1="150"
                  x2={endX}
                  y2={endY}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                />
              );
            })}
            {/* Polygon */}
            <polygon
              points={polygonPoints}
              fill="rgba(59, 130, 246, 0.2)"
              stroke="rgb(59, 130, 246)"
              strokeWidth="2"
            />
            {/* Labels and dots */}
            {points.map((_, i) => {
              const angle = sliceAngle * i - Math.PI / 2;
              const dotRadius = (points[i] / 10) * 100;
              const dotX = 150 + dotRadius * Math.cos(angle);
              const dotY = 150 + dotRadius * Math.sin(angle);
              return (
                <circle
                  key={`dot-${i}`}
                  cx={dotX}
                  cy={dotY}
                  r="4"
                  fill="rgb(59, 130, 246)"
                />
              );
            })}
          </svg>
        </div>

        <div className="flex-1 space-y-2">
          {labels.map((label, i) => {
            const key = `metric${i + 1}` as keyof HexagonMetrics;
            return (
              <div key={key} className="flex items-center gap-2">
                <Label className="w-24 text-sm">{label}</Label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={metrics[key] || 0}
                  onChange={(e) =>
                    !readonly && handleChange(key, parseFloat(e.target.value))
                  }
                  disabled={readonly}
                  className="flex-1"
                />
                <span className="w-8 text-sm font-medium text-right">
                  {Math.round((metrics[key] || 0) * 10) / 10}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export function HexagonRatingChart({
  socialPersonality,
  skillsAbilities,
  interestsHobbies,
  hobbies,
  onSocialChange,
  onSkillsChange,
  onInterestsChange,
  onHobbiesChange,
  readonly = false,
}: HexagonRatingChartProps) {
  const [newHobby, setNewHobby] = useState("");

  const addHobby = () => {
    if (newHobby.trim() && hobbies.length < 5) {
      onHobbiesChange([...hobbies, newHobby.trim()]);
      setNewHobby("");
    }
  };

  const removeHobby = (index: number) => {
    onHobbiesChange(hobbies.filter((_, i) => i !== index));
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Top Left: Social Personality */}
      <HexagonChart
        title="الشخصية الاجتماعية"
        metrics={socialPersonality}
        labels={[
          "التعاطف",
          "إدارة الغضب",
          "التعاون",
          "الثقة",
          "تقبل النقد",
          "الإنصات",
        ]}
        onChange={onSocialChange}
        readonly={readonly}
      />

      {/* Top Right: Skills & Abilities */}
      <HexagonChart
        title="المهارات والقدرات"
        metrics={skillsAbilities}
        labels={[
          "حل المشكلات",
          "الإبداع",
          "الذاكرة والتركيز",
          "التخطيط",
          "الاتصال",
          "القيادة",
        ]}
        onChange={onSkillsChange}
        readonly={readonly}
      />

      {/* Bottom Left: Interests & Hobbies */}
      <HexagonChart
        title="الاهتمامات والهوايات"
        metrics={interestsHobbies}
        labels={[
          "فني/إبداعي",
          "رياضي",
          "تقني",
          "لغوي",
          "اجتماعي",
          "طبيعي",
        ]}
        onChange={onInterestsChange}
        readonly={readonly}
      />

      {/* Bottom Right: Hobbies List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">الهوايات (5 على الأكثر)</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="space-y-2">
            {hobbies.map((hobby, i) => (
              <div key={i} className="flex items-center justify-between gap-2 p-2 bg-muted rounded">
                <span className="text-sm">{hobby}</span>
                {!readonly && (
                  <button
                    onClick={() => removeHobby(i)}
                    className="p-1 hover:bg-destructive/20 rounded"
                    data-testid={`button-remove-hobby-${i}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {!readonly && hobbies.length < 5 && (
            <div className="flex gap-2">
              <Input
                placeholder="أضف هواية..."
                value={newHobby}
                onChange={(e) => setNewHobby(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addHobby()}
                data-testid="input-new-hobby"
              />
              <Button onClick={addHobby} size="sm" data-testid="button-add-hobby">
                إضافة
              </Button>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            {hobbies.length}/5 هوايات مضافة
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
