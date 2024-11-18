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
  Legend,
} from "recharts";
import { formatBytes } from "@/lib/utils";

interface MetricDataPoint {
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

interface ServerInfo {
  ip_address: string;
  port: string;
}

export function ServerMetricsGraphs({
  serverId,
  type = "performance",
  title = "Performance Metrics",
  description = "Server resource utilization over time",
}: ServerMetricsGraphsProps) {
  const [data, setData] = useState<MetricDataPoint[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetricsHistory = async () => {
      try {
        setLoading(true);
        console.log(`Requesting metrics history for server: ${serverId}`);

        const response = await fetch(
          `/api/servers/${serverId}/metrics/history?hours=24`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || "Failed to fetch metrics");
        }

        // Transform the data if needed
        const transformedData = result.data.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp).toISOString(),
          cpu_usage: parseFloat(item.cpu_usage || 0),
          memory_usage: parseFloat(item.memory_usage || 0),
          disk_usage: parseFloat(item.disk_usage || 0),
          network_in: parseFloat(item.network_in || 0),
          network_out: parseFloat(item.network_out || 0),
          cpu_temp: parseFloat(item.cpu_temp || 0),
          memory_active: parseFloat(item.memory_active || 0),
          swap_used: parseFloat(item.swap_used || 0),
        }));

        setData(transformedData);
        setError(null);
      } catch (error) {
        console.error("Failed to fetch metrics history:", error);
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load metrics history"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchMetricsHistory();
    const interval = setInterval(fetchMetricsHistory, 60000);

    return () => clearInterval(interval);
  }, [serverId]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="text-sm font-medium">
            {new Date(label).toLocaleTimeString()}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value.toFixed(2)}
              {entry.unit}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderGraphs = () => {
    switch (type) {
      case "network":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data}>
              <XAxis
                dataKey="timestamp"
                tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                stroke="#888888"
              />
              <YAxis
                tickFormatter={(value) => `${formatBytes(value)}/s`}
                stroke="#888888"
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="network_in"
                name="Inbound"
                stroke="#10b981"
                dot={false}
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="network_out"
                name="Outbound"
                stroke="#3b82f6"
                dot={false}
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
                stroke="#888888"
              />
              <YAxis tickFormatter={(value) => `${value}°C`} stroke="#888888" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="cpu_temp"
                name="CPU Temperature"
                stroke="#ef4444"
                dot={false}
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
                stroke="#888888"
              />
              <YAxis
                tickFormatter={(value) => formatBytes(value)}
                stroke="#888888"
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="memory_active"
                name="Active Memory"
                stroke="#8b5cf6"
                dot={false}
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="swap_used"
                name="Swap Used"
                stroke="#f59e0b"
                dot={false}
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
                stroke="#888888"
              />
              <YAxis tickFormatter={(value) => `${value}%`} stroke="#888888" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="cpu_usage"
                name="CPU"
                stroke="#ef4444"
                dot={false}
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="memory_usage"
                name="Memory"
                stroke="#8b5cf6"
                dot={false}
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="disk_usage"
                name="Disk"
                stroke="#10b981"
                dot={false}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        );
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center">
            Loading...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center text-destructive">
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

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
