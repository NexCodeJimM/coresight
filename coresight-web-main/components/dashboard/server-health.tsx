"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatBytes } from "@/lib/utils";
import { Activity, HardDrive, CircuitBoard, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThresholdConfig, DEFAULT_THRESHOLDS } from "@/lib/threshold-config";
import { ThresholdSettings } from "./threshold-settings";

interface ServerHealth {
  cpu_usage: number;
  memory_usage: number;
  memory_total: number;
  memory_used: number;
  disk_usage: number;
  disk_total: number;
  disk_used: number;
  network: {
    bytes_sent: number;
    bytes_recv: number;
  };
  uptime: number;
  is_connected: boolean;
  last_seen: string;
}

export function ServerHealth({ serverId }: { serverId: string }) {
  const [health, setHealth] = useState<ServerHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [thresholds, setThresholds] =
    useState<ThresholdConfig>(DEFAULT_THRESHOLDS);

  // Separate data fetching function
  const fetchHealthData = async () => {
    try {
      // Add timestamp to prevent caching
      const timestamp = new Date().getTime();
      const response = await fetch(
        `/api/servers/${serverId}/health?t=${timestamp}`,
        {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Fetched health data:", data); // Debug log

      if (data.error) {
        throw new Error(data.error);
      }

      setHealth(data);
      setError(null);
    } catch (error) {
      console.error("Failed to fetch health data:", error);
      setError(error instanceof Error ? error.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthData();
    // Update more frequently - every 2 seconds
    const interval = setInterval(fetchHealthData, 2000);

    return () => clearInterval(interval);
  }, [serverId]);

  // Loading state
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Progress value={0} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-red-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Error loading server health
            </h3>
            <div className="mt-2 text-sm text-red-700">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  if (!health) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">System Health</h2>
        <ThresholdSettings thresholds={thresholds} onUpdate={setThresholds} />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* CPU Card */}
        <Card className="relative">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Progress
                value={health.cpu_usage}
                className={cn(
                  health.cpu_usage >= thresholds.cpu.critical
                    ? "[&>div]:bg-red-500"
                    : health.cpu_usage >= thresholds.cpu.warning
                    ? "[&>div]:bg-yellow-500"
                    : "[&>div]:bg-green-500"
                )}
              />
              <p className="text-xs text-muted-foreground">
                {health.cpu_usage.toFixed(1)}% utilized
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Memory Card */}
        <Card className="relative">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <CircuitBoard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Progress
                value={health.memory_usage}
                className={cn(
                  health.memory_usage >= thresholds.memory.critical
                    ? "[&>div]:bg-red-500"
                    : health.memory_usage >= thresholds.memory.warning
                    ? "[&>div]:bg-yellow-500"
                    : "[&>div]:bg-green-500"
                )}
              />
              <p className="text-xs text-muted-foreground">
                {formatBytes(health.memory_used)} /{" "}
                {formatBytes(health.memory_total)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Disk Card */}
        <Card className="relative">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disk Usage</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Progress
                value={health.disk_usage}
                className={cn(
                  health.disk_usage >= thresholds.disk.critical
                    ? "[&>div]:bg-red-500"
                    : health.disk_usage >= thresholds.disk.warning
                    ? "[&>div]:bg-yellow-500"
                    : "[&>div]:bg-green-500"
                )}
              />
              <p className="text-xs text-muted-foreground">
                {formatBytes(health.disk_used)} /{" "}
                {formatBytes(health.disk_total)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Network Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Network I/O</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">
                ↑ {formatBytes(health.network.bytes_sent)}/s
              </div>
              <div className="text-xs text-muted-foreground">
                ↓ {formatBytes(health.network.bytes_recv)}/s
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
