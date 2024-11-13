"use client";

import { useEffect, useState } from "react";
import { ServerCard } from "@/components/dashboard/server-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Server {
  id: string;
  name: string;
  hostname: string;
  ip_address: string;
  status: "active" | "inactive" | "maintenance";
  active_alerts: number;
}

export function ServersList() {
  const [servers, setServers] = useState<Server[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchServers() {
      try {
        const response = await fetch("/api/servers");
        if (!response.ok) {
          throw new Error("Failed to fetch servers");
        }
        const data = await response.json();
        setServers(Array.isArray(data) ? data : []);
        setError(null);
      } catch (error) {
        console.error("Error fetching servers:", error);
        setError("Failed to load servers");
      } finally {
        setIsLoading(false);
      }
    }

    fetchServers();
  }, []);

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Servers</CardTitle>
          <CardDescription>Error: {error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Servers</CardTitle>
          <CardDescription>Loading servers...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Servers</CardTitle>
        <CardDescription>
          {servers.length === 0
            ? "No servers found"
            : `Monitoring ${servers.length} servers`}
        </CardDescription>
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
