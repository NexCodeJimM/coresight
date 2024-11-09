"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatBytes } from "@/lib/utils";
import { Activity, HardDrive, Cpu, WifiOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ServerHealth {
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  uptime: number;
  total_memory: number;
  total_disk: number;
  used_memory: number;
  used_disk: number;
  is_connected: boolean;
}

export function ServerHealth({ serverId }: { serverId: string }) {
  const [health, setHealth] = useState<ServerHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const response = await fetch(`/api/servers/${serverId}/health`);
        if (!response.ok) {
          setIsConnected(false);
          throw new Error("Failed to fetch server health");
        }
        const data = await response.json();
        setHealth(data);
        setIsConnected(true);
      } catch (error) {
        console.error("Failed to fetch server health:", error);
        setHealth(null);
        setIsConnected(false);
        toast({
          title: "Connection Error",
          description:
            "Unable to connect to the server. Please check the agent status.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [serverId, toast]);

  if (!isConnected) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="col-span-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Server Status</CardTitle>
            <WifiOff className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-center text-sm text-muted-foreground">
              Unable to connect to server agent. Please check if the agent is
              running.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading || !health) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Progress value={0} />
                <p className="text-xs text-muted-foreground">
                  Loading metrics...
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const {
    cpu_usage = 0,
    memory_usage = 0,
    disk_usage = 0,
    uptime = 0,
    total_memory = 0,
    total_disk = 0,
    used_memory = 0,
    used_disk = 0,
  } = health;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
          <Cpu className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Progress value={cpu_usage} />
            <p className="text-xs text-muted-foreground">
              {cpu_usage.toFixed(1)}% utilized
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Progress value={memory_usage} />
            <p className="text-xs text-muted-foreground">
              {formatBytes(used_memory)} / {formatBytes(total_memory)}
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
            <Progress value={disk_usage} />
            <p className="text-xs text-muted-foreground">
              {formatBytes(used_disk)} / {formatBytes(total_disk)}
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
              {Math.floor(uptime / 86400)}d{" "}
              {Math.floor((uptime % 86400) / 3600)}h
            </div>
            <p className="text-xs text-muted-foreground">
              Last reboot:{" "}
              {new Date(Date.now() - uptime * 1000).toLocaleDateString()}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
