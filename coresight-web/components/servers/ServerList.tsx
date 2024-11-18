"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Settings, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface Server {
  id: string;
  name: string;
  ip_address: string;
  hostname: string;
  description: string;
  status: "active" | "inactive" | "maintenance";
  last_seen: string;
  uptime: number;
  current_status?: "online" | "offline";
  port: string | number;
}

export function ServerList() {
  const [servers, setServers] = useState<Server[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const checkServerStatus = async (server: Server) => {
    try {
      // First try to directly access the server's health endpoint using port 3001
      const healthResponse = await fetch(
        `http://${server.ip_address}:3001/health`,
        {
          next: { revalidate: 0 },
          headers: {
            "Cache-Control": "no-cache",
          },
        }
      );

      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        return {
          ...server,
          current_status: "online",
          last_seen: new Date().toISOString(),
          uptime: healthData.uptime || 0,
        };
      }
    } catch (error) {
      console.error(
        `Error checking direct health for server ${server.id}:`,
        error
      );
    }

    // If direct access fails, try through the backend
    try {
      const response = await fetch(`/api/servers/${server.id}/health`);
      if (!response.ok) throw new Error("Server health check failed");
      const data = await response.json();
      return {
        ...server,
        current_status: data.status,
        last_seen: data.lastChecked,
        uptime: data.system?.uptime || 0,
      };
    } catch (error) {
      console.error(`Error checking server ${server.id} status:`, error);
      return {
        ...server,
        current_status: "offline",
      };
    }
  };

  const fetchServers = async () => {
    try {
      const response = await fetch("/api/servers");
      if (!response.ok) throw new Error("Failed to fetch servers");
      const data = await response.json();

      // Check status for each server
      const serversWithStatus = await Promise.all(
        data.map((server: Server) => checkServerStatus(server))
      );

      setServers(serversWithStatus);
    } catch (error) {
      console.error("Error fetching servers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServers();
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchServers, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return <ServerListSkeleton />;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden md:table-cell">IP Address</TableHead>
            <TableHead className="hidden md:table-cell">Uptime</TableHead>
            <TableHead className="hidden md:table-cell">Last Seen</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {servers.map((server) => (
            <TableRow key={server.id}>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">{server.name}</span>
                  <span className="text-sm text-muted-foreground hidden md:inline">
                    {server.hostname}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <StatusBadge status={server.current_status || "offline"} />
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {server.ip_address}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {formatUptime(server.uptime)}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {new Date(server.last_seen).toLocaleString()}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Link href={`/servers/${server.id}/settings`}>
                    <Button variant="ghost" size="icon">
                      <Settings className="h-4 w-4" />
                      <span className="sr-only">Settings</span>
                    </Button>
                  </Link>
                  <Link href={`/servers/${server.id}`}>
                    <Button variant="ghost" size="icon">
                      <ExternalLink className="h-4 w-4" />
                      <span className="sr-only">View Details</span>
                    </Button>
                  </Link>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function StatusBadge({ status }: { status: "online" | "offline" }) {
  const variants = {
    online: "bg-green-100 text-green-800",
    offline: "bg-red-100 text-red-800",
  };

  const labels = {
    online: "Online",
    offline: "Offline",
  };

  return (
    <Badge variant="outline" className={variants[status]}>
      {labels[status]}
    </Badge>
  );
}

function formatUptime(uptime: number) {
  const days = Math.floor(uptime / 86400);
  const hours = Math.floor((uptime % 86400) / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function ServerListSkeleton() {
  return (
    <div className="rounded-md border">
      <div className="p-4">
        <div className="space-y-3">
          <div className="h-4 w-[250px] bg-gray-200 rounded animate-pulse" />
          <div className="space-y-8">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex justify-between items-center">
                <div className="space-y-2">
                  <div className="h-4 w-[200px] bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 w-[150px] bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
