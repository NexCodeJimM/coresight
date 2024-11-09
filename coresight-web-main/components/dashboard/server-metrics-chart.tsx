"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatBytes } from "@/lib/utils";

interface MetricsData {
  timestamp: string;
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  network_in: number;
  network_out: number;
}

interface ServerMetricsChartProps {
  serverId: string;
  type?: "performance" | "network" | "disk_io";
  title?: string;
  description?: string;
}

export function ServerMetricsChart({
  serverId,
  type = "performance",
  title = "Performance Metrics",
  description = "Server resource utilization over time",
}: ServerMetricsChartProps) {
  const [data, setData] = useState<MetricsData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch(
          `/api/servers/${serverId}/metrics/history?hours=24&type=${type}`
        );
        const metrics = await response.json();
        setData(metrics);
      } catch (error) {
        console.error("Failed to fetch metrics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [serverId, type]);

  if (loading) {
    return null;
  }

  const renderLines = () => {
    switch (type) {
      case "network":
        return (
          <>
            <Line
              type="monotone"
              dataKey="network_in"
              name="Network In"
              stroke="hsl(var(--chart-1))"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="network_out"
              name="Network Out"
              stroke="hsl(var(--chart-2))"
              strokeWidth={2}
            />
          </>
        );
      case "disk_io":
        return (
          <>
            <Line
              type="monotone"
              dataKey="disk_read"
              name="Disk Read"
              stroke="hsl(var(--chart-3))"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="disk_write"
              name="Disk Write"
              stroke="hsl(var(--chart-4))"
              strokeWidth={2}
            />
          </>
        );
      default:
        return (
          <>
            <Line
              type="monotone"
              dataKey="cpu_usage"
              name="CPU Usage"
              stroke="hsl(var(--chart-1))"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="memory_usage"
              name="Memory Usage"
              stroke="hsl(var(--chart-2))"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="disk_usage"
              name="Disk Usage"
              stroke="hsl(var(--chart-3))"
              strokeWidth={2}
            />
          </>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis
                dataKey="timestamp"
                tickFormatter={(value: string) =>
                  new Date(value).toLocaleTimeString()
                }
              />
              <YAxis />
              <Tooltip
                labelFormatter={(value: string) =>
                  new Date(value).toLocaleString()
                }
                formatter={(value: number, name: string) => {
                  if (name.includes("network") || name.includes("disk")) {
                    return [formatBytes(value), name];
                  }
                  return [`${value}%`, name];
                }}
              />
              {renderLines()}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
