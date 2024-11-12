"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatBytes } from "@/lib/utils";
import { Activity, HardDrive, CircuitBoard, Cpu } from "lucide-react";

interface ServerHealth {
  cpu_usage: number;
  memory_usage: number;
  memory_total: number;
  memory_used: number;
  disk_usage: number;
  disk_total: number;
  disk_used: number;
  uptime: number;
  is_connected: boolean;
  last_seen: string;
}

export function ServerHealth({ serverId }: { serverId: string }) {
  const [health, setHealth] = useState<ServerHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    try {
      const response = await fetch(`/api/servers/${serverId}/health`);
      if (!response.ok) throw new Error("Failed to fetch server health");
      const data = await response.json();
      console.log("Updated health data:", data); // Debug log
      setHealth(data);
      setError(null);
    } catch (error) {
      console.error("Failed to fetch server health:", error);
      setError(error instanceof Error ? error.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchHealth();

    // Set up polling interval (every 5 seconds)
    const interval = setInterval(fetchHealth, 5000);

    // Cleanup interval on component unmount
    return () => {
      clearInterval(interval);
    };
  }, [serverId]); // Re-run effect if serverId changes

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
      <div className="p-4 text-red-500 bg-red-50 rounded-md">
        Error loading server health: {error}
      </div>
    );
  }

  if (!health) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
          <Cpu className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Progress value={health.cpu_usage} />
            <p className="text-xs text-muted-foreground">
              {health.cpu_usage.toFixed(1)}% utilized
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
          <CircuitBoard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Progress value={health.memory_usage} />
            <p className="text-xs text-muted-foreground">
              {formatBytes(health.memory_used)} /{" "}
              {formatBytes(health.memory_total)}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Disk Usage</CardTitle>
          <HardDrive className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Progress value={health.disk_usage} />
            <p className="text-xs text-muted-foreground">
              {formatBytes(health.disk_used)} / {formatBytes(health.disk_total)}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Uptime</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="text-2xl font-bold">
              {Math.floor(health.uptime / 86400)}d{" "}
              {Math.floor((health.uptime % 86400) / 3600)}h
            </div>
            <p className="text-xs text-muted-foreground">
              Last reboot: {new Date(health.last_seen).toLocaleDateString()}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
