"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatBytes, cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ServerIcon, AlertCircle } from "lucide-react";

interface ServerMetrics {
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  network_in: number;
  network_out: number;
  timestamp: string;
}

interface Server {
  id: string;
  name: string;
  ip_address: string;
  status: "active" | "inactive" | "maintenance";
  last_seen: string;
  latest_metrics: ServerMetrics;
  active_alerts: number;
}

function getStatusColor(status: Server["status"]) {
  switch (status) {
    case "active":
      return "bg-green-500";
    case "inactive":
      return "bg-red-500";
    case "maintenance":
      return "bg-yellow-500";
    default:
      return "bg-gray-500";
  }
}

function ServerCard({ server }: { server: Server }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          <ServerIcon className="h-4 w-4" />
          <CardTitle className="text-sm font-medium">{server.name}</CardTitle>
        </div>
        <div className="flex items-center space-x-2">
          {server.active_alerts > 0 && (
            <Badge variant="destructive" className="h-6">
              <AlertCircle className="mr-1 h-3 w-3" />
              {server.active_alerts}
            </Badge>
          )}
          <div
            className={cn(
              "h-2 w-2 rounded-full",
              getStatusColor(server.status)
            )}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2">
          <CardDescription>{server.ip_address}</CardDescription>
          {server.latest_metrics && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex flex-col">
                <span className="text-muted-foreground">CPU</span>
                <span className="font-medium">
                  {server.latest_metrics.cpu_usage.toFixed(1)}%
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground">Memory</span>
                <span className="font-medium">
                  {server.latest_metrics.memory_usage.toFixed(1)}%
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground">Disk</span>
                <span className="font-medium">
                  {server.latest_metrics.disk_usage.toFixed(1)}%
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground">Network</span>
                <span className="font-medium">
                  ↑{formatBytes(server.latest_metrics.network_out)}/s
                </span>
              </div>
            </div>
          )}
          <div className="flex justify-end">
            <Link href={`/dashboard/servers/${server.id}`}>
              <Button variant="outline" size="sm">
                View Details
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ServersList() {
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServers = async () => {
      try {
        const response = await fetch("/api/servers");
        const data = await response.json();
        setServers(data);
      } catch (error) {
        console.error("Failed to fetch servers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchServers();
    const interval = setInterval(fetchServers, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return null; // Using Suspense fallback instead
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Servers</CardTitle>
            <CardDescription>
              {servers.length} server{servers.length !== 1 && "s"} monitored
            </CardDescription>
          </div>
          <Link href="/dashboard/servers/new">
            <Button>Add Server</Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {servers.map((server) => (
            <ServerCard key={server.id} server={server} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
