"use client";

import { JSX } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { TaskStats } from "@/hooks/useAnalytics";

export interface TaskChartProps {
  data: TaskStats | null;
}

const STATUS_COLORS: Record<string, string> = {
  TODO: "hsl(var(--chart-1))",
  IN_PROGRESS: "hsl(var(--chart-2))",
  REVIEW: "hsl(var(--chart-3))",
  COMPLETED: "hsl(var(--chart-4))",
};

const STATUS_LABELS: Record<string, string> = {
  TODO: "Todo",
  IN_PROGRESS: "In Progress",
  REVIEW: "Review",
  COMPLETED: "Completed",
};

export function TaskChart({ data }: TaskChartProps): JSX.Element {
  const chartData =
    data?.byStatus.map((item) => ({
      name: STATUS_LABELS[item.status] ?? item.status,
      value: item.count,
      color: STATUS_COLORS[item.status] ?? "hsl(var(--chart-5))",
    })) ?? [];

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="text-base font-semibold text-card-foreground">
        Task Distribution
      </h3>
      <p className="text-sm text-muted-foreground">
        Tasks grouped by current status
      </p>
      <div className="mt-4 h-72">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
                nameKey="name"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "0.5rem",
                  color: "hsl(var(--card-foreground))",
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No task data available
          </div>
        )}
      </div>
    </div>
  );
}
