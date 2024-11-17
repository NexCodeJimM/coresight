"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatBytes } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  description: string;
  className?: string;
}

interface DashboardMetrics {
  totalServers: number;
  activeServers: number;
  totalAlerts: number;
  criticalAlerts: number;
}

function MetricCard({ title, value, description, className }: MetricCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

export function ServerMetrics() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalServers: 0,
    activeServers: 0,
    totalAlerts: 0,
    criticalAlerts: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/dashboard/metrics", {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setMetrics(data);
        setError(null);
      } catch (error) {
        console.error("Failed to fetch metrics:", error);
        setError(
          error instanceof Error ? error.message : "Failed to load metrics"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000);

    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <>
        <MetricCard
          title="Total Servers"
          value="..."
          description="Loading..."
        />
        <MetricCard
          title="Active Servers"
          value="..."
          description="Loading..."
        />
        <MetricCard title="Total Alerts" value="..." description="Loading..." />
        <MetricCard
          title="Critical Alerts"
          value="..."
          description="Loading..."
          className="border-destructive"
        />
      </>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-destructive">
        Error loading metrics: {error}
      </div>
    );
  }

  return (
    <>
      <MetricCard
        title="Total Servers"
        value={metrics.totalServers}
        description="Total monitored servers"
      />
      <MetricCard
        title="Active Servers"
        value={metrics.activeServers}
        description="Currently active servers"
      />
      <MetricCard
        title="Total Alerts"
        value={metrics.totalAlerts}
        description="Active alerts across all servers"
      />
      <MetricCard
        title="Critical Alerts"
        value={metrics.criticalAlerts}
        description="High priority alerts requiring attention"
        className="border-destructive"
      />
    </>
  );
}
