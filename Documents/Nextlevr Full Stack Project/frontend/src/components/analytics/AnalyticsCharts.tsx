"use client";

import { JSX } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";
import {
  useAnalytics,
  AnalyticsFilters,
  LeadStatusDistribution,
} from "@/hooks/useAnalytics";

export interface AnalyticsChartsProps {
  filters: AnalyticsFilters;
}

const LEAD_STATUS_ORDER: LeadStatusDistribution["status"][] = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "PROPOSAL",
  "CONVERTED",
  "LOST",
];

const LEAD_STATUS_LABELS: Record<string, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  PROPOSAL: "Proposal",
  CONVERTED: "Converted",
  LOST: "Lost",
};

const LEAD_STATUS_COLORS: Record<string, string> = {
  NEW: "hsl(var(--chart-1))",
  CONTACTED: "hsl(var(--chart-2))",
  QUALIFIED: "hsl(var(--chart-3))",
  PROPOSAL: "hsl(var(--chart-4))",
  CONVERTED: "hsl(var(--chart-5))",
  LOST: "hsl(var(--muted-foreground))",
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function ChartCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="text-base font-semibold text-card-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
      <div className="mt-4 h-72">{children}</div>
    </div>
  );
}

function EmptyChart({ message }: { message: string }): JSX.Element {
  return (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}

export function AnalyticsCharts({ filters }: AnalyticsChartsProps): JSX.Element {
  const {
    revenue,
    campaignData,
    leadData,
    clientGrowth,
    leadStatusDistribution,
    loading,
    error,
    fetchAnalytics,
  } = useAnalytics(filters);

  const funnelData = LEAD_STATUS_ORDER
    .map((status) => {
      const item = leadStatusDistribution.find((s) => s.status === status);
      return {
        name: LEAD_STATUS_LABELS[status] ?? status,
        count: item?.count ?? 0,
        color: LEAD_STATUS_COLORS[status] ?? "hsl(var(--chart-1))",
      };
    })
    .filter((item) => item.count > 0);

  const revenueData = revenue
    ? [
        { name: "Total Value", value: revenue.totalValue },
        { name: "Converted Value", value: revenue.convertedValue },
        { name: "Average Value", value: revenue.averageValue },
      ]
    : [];

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="h-96 animate-pulse rounded-xl bg-muted" />
        <div className="h-96 animate-pulse rounded-xl bg-muted" />
        <div className="h-96 animate-pulse rounded-xl bg-muted" />
        <div className="h-96 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
        {error}
        <button
          onClick={() => fetchAnalytics(filters)}
          className="ml-2 underline underline-offset-2 hover:no-underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* Conversion Funnel */}
      <ChartCard
        title="Conversion Funnel"
        description="Lead count by pipeline stage"
      >
        {funnelData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={funnelData}
              layout="vertical"
              margin={{ top: 8, right: 16, bottom: 8, left: 16 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                horizontal={false}
              />
              <XAxis
                type="number"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tickLine={{ stroke: "hsl(var(--border))" }}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tickLine={{ stroke: "hsl(var(--border))" }}
                width={90}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "0.5rem",
                  color: "hsl(var(--card-foreground))",
                }}
                formatter={(value) => [Number(value ?? 0), "Leads"]}
              />
              <Bar dataKey="count" name="Leads" radius={[0, 4, 4, 0]}>
                {funnelData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart message="No lead data available for the selected filters" />
        )}
      </ChartCard>

      {/* Monthly Lead Trends */}
      <ChartCard
        title="Monthly Lead Trends"
        description="Leads and conversions over time"
      >
        {leadData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={leadData}
              margin={{ top: 8, right: 16, bottom: 8, left: 0 }}
            >
              <defs>
                <linearGradient id="trendLeads" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="hsl(var(--chart-1))"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="hsl(var(--chart-1))"
                    stopOpacity={0}
                  />
                </linearGradient>
                <linearGradient id="trendConverted" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="hsl(var(--chart-2))"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="hsl(var(--chart-2))"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
              />
              <XAxis
                dataKey="month"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tickLine={{ stroke: "hsl(var(--border))" }}
              />
              <YAxis
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tickLine={{ stroke: "hsl(var(--border))" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "0.5rem",
                  color: "hsl(var(--card-foreground))",
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area
                type="monotone"
                dataKey="leads"
                name="Leads"
                stroke="hsl(var(--chart-1))"
                fillOpacity={1}
                fill="url(#trendLeads)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="converted"
                name="Converted"
                stroke="hsl(var(--chart-2))"
                fillOpacity={1}
                fill="url(#trendConverted)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart message="No lead trend data available for the selected filters" />
        )}
      </ChartCard>

      {/* Revenue Generated */}
      <ChartCard
        title="Revenue Generated"
        description="Total, converted, and average lead value"
      >
        {revenueData.length > 0 && (revenue?.totalValue ?? 0) > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={revenueData}
              margin={{ top: 8, right: 16, bottom: 8, left: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
              />
              <XAxis
                dataKey="name"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tickLine={{ stroke: "hsl(var(--border))" }}
              />
              <YAxis
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tickLine={{ stroke: "hsl(var(--border))" }}
                tickFormatter={(value: number) =>
                  new Intl.NumberFormat("en-US", {
                    notation: "compact",
                    compactDisplay: "short",
                    maximumFractionDigits: 1,
                  }).format(value)
                }
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "0.5rem",
                  color: "hsl(var(--card-foreground))",
                }}
                formatter={(value) => formatCurrency(Number(value ?? 0))}
              />
              <Bar dataKey="value" name="Revenue" radius={[4, 4, 0, 0]}>
                <Cell fill="hsl(var(--chart-1))" />
                <Cell fill="hsl(var(--chart-2))" />
                <Cell fill="hsl(var(--chart-3))" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart message="No revenue data available for the selected filters" />
        )}
      </ChartCard>

      {/* Client Growth Over Time */}
      <ChartCard
        title="Client Growth Over Time"
        description="New clients added each month"
      >
        {clientGrowth.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={clientGrowth}
              margin={{ top: 8, right: 16, bottom: 8, left: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
              />
              <XAxis
                dataKey="month"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tickLine={{ stroke: "hsl(var(--border))" }}
              />
              <YAxis
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tickLine={{ stroke: "hsl(var(--border))" }}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "0.5rem",
                  color: "hsl(var(--card-foreground))",
                }}
              />
              <Line
                type="monotone"
                dataKey="clients"
                name="New Clients"
                stroke="hsl(var(--chart-4))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--chart-4))", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart message="No client growth data available for the selected filters" />
        )}
      </ChartCard>

      {/* Campaign Performance */}
      <ChartCard
        title="Campaign Performance"
        description="Leads and conversion rate by campaign"
      >
        {campaignData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={campaignData}
              margin={{ top: 8, right: 16, bottom: 8, left: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
              />
              <XAxis
                dataKey="name"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tickLine={{ stroke: "hsl(var(--border))" }}
                interval={0}
                angle={campaignData.length > 4 ? -30 : 0}
                textAnchor={campaignData.length > 4 ? "end" : "middle"}
                height={campaignData.length > 4 ? 60 : 30}
              />
              <YAxis
                yAxisId="left"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tickLine={{ stroke: "hsl(var(--border))" }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                unit="%"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tickLine={{ stroke: "hsl(var(--border))" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "0.5rem",
                  color: "hsl(var(--card-foreground))",
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar
                yAxisId="left"
                dataKey="leadsCount"
                name="Leads"
                fill="hsl(var(--chart-1))"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                yAxisId="right"
                dataKey="conversionRate"
                name="Conversion Rate (%)"
                fill="hsl(var(--chart-3))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart message="No campaign data available for the selected filters" />
        )}
      </ChartCard>
    </div>
  );
}
