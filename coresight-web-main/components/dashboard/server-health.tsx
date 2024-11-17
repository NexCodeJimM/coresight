"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatBytes } from "@/lib/utils";
import { Activity, HardDrive, CircuitBoard, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThresholdConfig, DEFAULT_THRESHOLDS } from "@/lib/threshold-config";
import { ThresholdSettings } from "./threshold-settings";
import { useNotifications } from "@/components/notifications/notification-provider";

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
  const { addNotification } = useNotifications();

  const checkThresholds = (data: ServerHealth) => {
    if (data.cpu_usage >= thresholds.cpu.critical) {
      addNotification({
        type: "error",
        title: "CPU Usage Critical",
        message: `CPU usage is at ${data.cpu_usage.toFixed(1)}%`,
        duration: 10000,
      });
    } else if (data.cpu_usage >= thresholds.cpu.warning) {
      addNotification({
        type: "warning",
        title: "CPU Usage Warning",
        message: `CPU usage is at ${data.cpu_usage.toFixed(1)}%`,
        duration: 10000,
      });
    }

    if (data.memory_usage >= thresholds.memory.critical) {
      addNotification({
        type: "error",
        title: "Memory Usage Critical",
        message: `Memory usage is at ${data.memory_usage.toFixed(1)}%`,
        duration: 10000,
      });
    } else if (data.memory_usage >= thresholds.memory.warning) {
      addNotification({
        type: "warning",
        title: "Memory Usage Warning",
        message: `Memory usage is at ${data.memory_usage.toFixed(1)}%`,
        duration: 10000,
      });
    }

    if (data.disk_usage >= thresholds.disk.critical) {
      addNotification({
        type: "error",
        title: "Disk Usage Critical",
        message: `Disk usage is at ${data.disk_usage.toFixed(1)}%`,
        duration: 10000,
      });
    } else if (data.disk_usage >= thresholds.disk.warning) {
      addNotification({
        type: "warning",
        title: "Disk Usage Warning",
        message: `Disk usage is at ${data.disk_usage.toFixed(1)}%`,
        duration: 10000,
      });
    }
  };

  const fetchHealthData = async () => {
    try {
      const response = await fetch(`/api/servers/${serverId}/health`, {
        cache: "no-store",
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
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Raw health data from API:", data);

      if (data.error) {
        throw new Error(data.error);
      }

      const transformedData: ServerHealth = {
        cpu_usage: data.metrics?.cpu || 0,
        memory_usage: data.metrics?.memory || 0,
        memory_total: data.metrics?.memory_total || 0,
        memory_used: data.metrics?.memory_used || 0,
        disk_usage: data.metrics?.disk || 0,
        disk_total: data.metrics?.disk_total || 0,
        disk_used: data.metrics?.disk_used || 0,
        network: {
          bytes_sent: data.metrics?.network?.out || 0,
          bytes_recv: data.metrics?.network?.in || 0,
        },
        uptime: data.system?.uptime || 0,
        is_connected: data.status === "online",
        last_seen: data.lastChecked || new Date().toISOString(),
      };

      setHealth(transformedData);
      checkThresholds(transformedData);
      setError(null);
    } catch (error) {
      console.error("Failed to fetch health data:", {
        error,
        stack: error instanceof Error ? error.stack : undefined,
      });

      setError(
        error instanceof Error
          ? `Connection failed: ${error.message}`
          : "Failed to connect to server"
      );

      addNotification({
        type: "error",
        title: "Connection Error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to connect to server",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthData();
    const interval = setInterval(fetchHealthData, 60000);

    return () => clearInterval(interval);
  }, [serverId]);

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
                value={health?.cpu_usage || 0}
                className={cn(
                  health?.cpu_usage >= thresholds.cpu.critical
                    ? "[&>div]:bg-red-500"
                    : health?.cpu_usage >= thresholds.cpu.warning
                    ? "[&>div]:bg-yellow-500"
                    : "[&>div]:bg-green-500"
                )}
              />
              <p className="text-xs text-muted-foreground">
                {health?.cpu_usage.toFixed(1)}% utilized
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
                value={health?.memory_usage || 0}
                className={cn(
                  health?.memory_usage >= thresholds.memory.critical
                    ? "[&>div]:bg-red-500"
                    : health?.memory_usage >= thresholds.memory.warning
                    ? "[&>div]:bg-yellow-500"
                    : "[&>div]:bg-green-500"
                )}
              />
              <p className="text-xs text-muted-foreground">
                {formatBytes(health?.memory_used || 0)} /{" "}
                {formatBytes(health?.memory_total || 0)}
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
                value={health?.disk_usage || 0}
                className={cn(
                  health?.disk_usage >= thresholds.disk.critical
                    ? "[&>div]:bg-red-500"
                    : health?.disk_usage >= thresholds.disk.warning
                    ? "[&>div]:bg-yellow-500"
                    : "[&>div]:bg-green-500"
                )}
              />
              <p className="text-xs text-muted-foreground">
                {formatBytes(health?.disk_used || 0)} /{" "}
                {formatBytes(health?.disk_total || 0)}
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
                ↑ {formatBytes(health?.network.bytes_sent || 0)}/s
              </div>
              <div className="text-xs text-muted-foreground">
                ↓ {formatBytes(health?.network.bytes_recv || 0)}/s
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
