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
}

export function ServerList() {
  const [servers, setServers] = useState<Server[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const fetchServers = async () => {
    try {
      const response = await fetch("/api/servers");
      if (!response.ok) throw new Error("Failed to fetch servers");
      const data = await response.json();
      setServers(data);
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

  // Use a mutation observer to detect DOM changes that might indicate route changes
  useEffect(() => {
    const observer = new MutationObserver(fetchServers);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
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
                <StatusBadge status={server.status} />
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

function StatusBadge({ status }: { status: Server["status"] }) {
  const variants = {
    active: "bg-green-100 text-green-800",
    inactive: "bg-red-100 text-red-800",
    maintenance: "bg-yellow-100 text-yellow-800",
  };

  const labels = {
    active: "Online",
    inactive: "Offline",
    maintenance: "Maintenance",
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
