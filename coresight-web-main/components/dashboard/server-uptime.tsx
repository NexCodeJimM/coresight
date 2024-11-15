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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUptime() {
      try {
        const url = serverId
          ? `/api/servers/${serverId}/uptime`
          : "/api/servers/uptime";

        console.log("Fetching uptime from:", url);

        const response = await fetch(url, {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch uptime data: ${response.status}`);
        }

        const data = await response.json();
        console.log("Received uptime data:", data);

        // Transform the data to match the expected format
        const transformedData = Array.isArray(data) ? data : [data];
        const formattedData = transformedData.map((server) => ({
          serverId: server.id || server.serverId,
          serverName: server.name || server.serverName,
          status: server.status || "offline",
          lastChecked: server.last_checked || server.lastChecked,
          uptime: typeof server.uptime === "number" ? server.uptime : 0,
          lastDowntime: server.last_downtime || server.lastDowntime,
        }));

        console.log("Transformed uptime data:", formattedData);
        setUptimeData(formattedData);
        setError(null);
      } catch (error) {
        console.error("Error fetching uptime:", error);
        setError(
          error instanceof Error ? error.message : "Failed to fetch uptime data"
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchUptime();
    const interval = setInterval(fetchUptime, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [serverId]);

  function formatUptime(seconds: number): string {
    if (!seconds || seconds <= 0) return "0d 0h 0m";

    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    return `${days}d ${hours}h ${minutes}m`;
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Server Uptime</CardTitle>
          <CardDescription>Loading uptime data...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Server Uptime</CardTitle>
          <CardDescription className="text-red-500">
            Error: {error}
          </CardDescription>
        </CardHeader>
      </Card>
    );
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
          {uptimeData.length === 0 ? (
            <p className="text-muted-foreground">No uptime data available</p>
          ) : (
            uptimeData.map((data) => (
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
                    variant={
                      data.status === "online" ? "default" : "destructive"
                    }
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
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
