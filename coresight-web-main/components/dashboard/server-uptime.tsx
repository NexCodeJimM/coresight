"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface UptimeData {
  serverId: string;
  serverName: string;
  status: "online" | "offline";
  lastChecked: string;
  uptime: number; // in seconds
  lastDowntime?: string;
}

export function ServerUptime({ serverId }: { serverId?: string }) {
  const [uptimeData, setUptimeData] = useState<UptimeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchUptime() {
      try {
        const url = serverId
          ? `/api/servers/${serverId}/uptime`
          : "/api/servers/uptime";
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch uptime data");
        const data = await response.json();
        setUptimeData(Array.isArray(data) ? data : [data]);
      } catch (error) {
        console.error("Error fetching uptime:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUptime();
    const interval = setInterval(fetchUptime, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [serverId]);

  function formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    return `${days}d ${hours}h ${minutes}m`;
  }

  if (isLoading) {
    return <div>Loading uptime data...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Server Uptime</CardTitle>
        <CardDescription>
          Monitor server availability and uptime
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {uptimeData.map((data) => (
            <div
              key={data.serverId}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div>
                <h3 className="font-medium">{data.serverName}</h3>
                <p className="text-sm text-muted-foreground">
                  Last checked: {new Date(data.lastChecked).toLocaleString()}
                </p>
                {data.lastDowntime && (
                  <p className="text-sm text-muted-foreground">
                    Last downtime:{" "}
                    {new Date(data.lastDowntime).toLocaleString()}
                  </p>
                )}
              </div>
              <div className="text-right">
                <Badge
                  variant={data.status === "online" ? "default" : "destructive"}
                  className={cn(
                    data.status === "online" &&
                      "bg-green-500 hover:bg-green-600"
                  )}
                >
                  {data.status}
                </Badge>
                <p className="mt-1 text-sm font-mono">
                  Uptime: {formatUptime(data.uptime)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
