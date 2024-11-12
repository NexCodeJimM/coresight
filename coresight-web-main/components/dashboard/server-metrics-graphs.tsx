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
  cpu_temp: number;
  memory_active: number;
  swap_used: number;
}

interface ServerMetricsGraphsProps {
  serverId: string;
  type?: "performance" | "network" | "disk_io" | "temperature" | "memory";
  title?: string;
  description?: string;
}

export function ServerMetricsGraphs({
  serverId,
  type = "performance",
  title = "Performance Metrics",
  description = "Server resource utilization over time",
}: ServerMetricsGraphsProps) {
  const [data, setData] = useState<MetricsData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch(
          `/api/servers/${serverId}/metrics/history?type=${type}`
        );
        if (!response.ok) throw new Error("Failed to fetch metrics");
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

  if (loading) return null;

  const renderGraphs = () => {
    switch (type) {
      case "network":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data}>
              <XAxis
                dataKey="timestamp"
                tickFormatter={(value) => new Date(value).toLocaleTimeString()}
              />
              <YAxis tickFormatter={(value) => `${formatBytes(value)}/s`} />
              <Tooltip
                labelFormatter={(value) => new Date(value).toLocaleString()}
                formatter={(value: number, name: string) => [
                  formatBytes(value) + "/s",
                  name === "network_in" ? "Inbound" : "Outbound",
                ]}
              />
              <Line
                type="monotone"
                dataKey="network_in"
                name="Inbound"
                stroke="#10b981"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="network_out"
                name="Outbound"
                stroke="#3b82f6"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case "temperature":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data}>
              <XAxis
                dataKey="timestamp"
                tickFormatter={(value) => new Date(value).toLocaleTimeString()}
              />
              <YAxis tickFormatter={(value) => `${value}°C`} />
              <Tooltip
                labelFormatter={(value) => new Date(value).toLocaleString()}
                formatter={(value: number) => [
                  `${value.toFixed(1)}°C`,
                  "CPU Temperature",
                ]}
              />
              <Line
                type="monotone"
                dataKey="cpu_temp"
                name="CPU Temperature"
                stroke="#ef4444"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case "memory":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data}>
              <XAxis
                dataKey="timestamp"
                tickFormatter={(value) => new Date(value).toLocaleTimeString()}
              />
              <YAxis tickFormatter={(value) => formatBytes(value)} />
              <Tooltip
                labelFormatter={(value) => new Date(value).toLocaleString()}
                formatter={(value: number, name: string) => [
                  formatBytes(value),
                  name === "memory_active" ? "Active Memory" : "Swap Used",
                ]}
              />
              <Line
                type="monotone"
                dataKey="memory_active"
                name="Active Memory"
                stroke="#8b5cf6"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="swap_used"
                name="Swap Used"
                stroke="#f59e0b"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      default:
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data}>
              <XAxis
                dataKey="timestamp"
                tickFormatter={(value) => new Date(value).toLocaleTimeString()}
              />
              <YAxis tickFormatter={(value) => `${value}%`} />
              <Tooltip
                labelFormatter={(value) => new Date(value).toLocaleString()}
                formatter={(value: number, name: string) => [
                  `${value.toFixed(1)}%`,
                  name.split("_")[0].toUpperCase(),
                ]}
              />
              <Line
                type="monotone"
                dataKey="cpu_usage"
                name="CPU"
                stroke="#ef4444"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="memory_usage"
                name="Memory"
                stroke="#8b5cf6"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="disk_usage"
                name="Disk"
                stroke="#10b981"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{renderGraphs()}</CardContent>
    </Card>
  );
}
