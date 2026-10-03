"use client";

import { JSX } from "react";
import {
  Users,
  Megaphone,
  UserPlus,
  ClipboardList,
  TrendingUp,
  DollarSign,
} from "lucide-react";
import { DashboardStats, RevenueStats } from "@/hooks/useAnalytics";

export interface StatsCardsProps {
  stats: DashboardStats | null;
  revenue: RevenueStats | null;
}

interface StatItem {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent: string;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function StatsCards({ stats, revenue }: StatsCardsProps): JSX.Element {
  const items: StatItem[] = [
    {
      label: "Total Clients",
      value: stats ? String(stats.totalClients) : "—",
      icon: <Users className="h-5 w-5" />,
      accent: "bg-chart-1 text-chart-5",
    },
    {
      label: "Active Campaigns",
      value: stats ? String(stats.activeCampaigns) : "—",
      icon: <Megaphone className="h-5 w-5" />,
      accent: "bg-chart-2 text-chart-5",
    },
    {
      label: "Leads Generated",
      value: stats ? String(stats.leadsGenerated) : "—",
      icon: <UserPlus className="h-5 w-5" />,
      accent: "bg-chart-3 text-chart-5",
    },
    {
      label: "Tasks Pending",
      value: stats ? String(stats.tasksPending) : "—",
      icon: <ClipboardList className="h-5 w-5" />,
      accent: "bg-chart-4 text-chart-5",
    },
    {
      label: "Conversion Rate",
      value: stats ? `${stats.conversionRate}%` : "—",
      icon: <TrendingUp className="h-5 w-5" />,
      accent: "bg-chart-5 text-white",
    },
    {
      label: "Total Revenue",
      value: revenue ? formatCurrency(revenue.totalValue) : "—",
      icon: <DollarSign className="h-5 w-5" />,
      accent: "bg-primary text-primary-foreground",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-border bg-card p-5 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                {item.label}
              </p>
              <p className="text-2xl font-semibold tracking-tight text-card-foreground">
                {item.value}
              </p>
            </div>
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-lg ${item.accent}`}
            >
              {item.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
