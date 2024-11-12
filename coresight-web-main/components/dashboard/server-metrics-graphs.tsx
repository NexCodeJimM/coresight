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
        const timestamp = new Date().getTime();
        const response = await fetch(
          `/api/servers/${serverId}/metrics/history?type=${type}&t=${timestamp}`,
          {
            cache: "no-store",
          }
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
    const interval = setInterval(fetchMetrics, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [serverId, type]);

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
