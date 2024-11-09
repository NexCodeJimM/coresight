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
  const [metrics, setMetrics] = useState({
    totalServers: 0,
    activeServers: 0,
    totalAlerts: 0,
    criticalAlerts: 0,
  });

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch("/api/dashboard/metrics");
        const data = await response.json();
        setMetrics(data);
      } catch (error) {
        console.error("Failed to fetch metrics:", error);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

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
