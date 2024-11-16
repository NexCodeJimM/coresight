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

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://165.22.237.60:3000";
        const response = await fetch(`${apiUrl}/api/dashboard/metrics`, {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Server response:", {
            status: response.status,
            statusText: response.statusText,
            body: errorText,
          });
          throw new Error(`Failed to fetch metrics: ${response.statusText}`);
        }

        const data = await response.json();
        setMetrics(data);
        setError(null);
      } catch (error) {
        console.error("Failed to fetch metrics:", error);
        setError(
          error instanceof Error ? error.message : "Failed to load metrics"
        );
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

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
