"use client";

import { notFound } from "next/navigation";
import { ServerSettingsForm } from "@/components/dashboard/server-settings-form";
import { ServerSettingsHeader } from "@/components/dashboard/server-settings-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { db } from "@/lib/db";
import { ServerDangerZone } from "@/components/dashboard/server-danger-zone";
import { useEffect, useState } from "react";

interface Server {
  id: string;
  name: string;
  description: string | null;
  hostname: string;
  ip_address: string;
  port: string | null;
  status: "active" | "inactive" | "maintenance";
  active_alerts: number;
}

export default function ServerSettingsPage({
  params,
}: {
  params: { id: string };
}) {
  const [server, setServer] = useState<Server | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchServer() {
      try {
        const response = await fetch(`/api/servers/${params.id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch server data");
        }
        const data = await response.json();
        setServer(data);
      } catch (err) {
        console.error("Error fetching server:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch server data"
        );
      } finally {
        setLoading(false);
      }
    }

    fetchServer();
  }, [params.id]);

  if (loading) {
    return (
      <DashboardShell>
        <div>Loading...</div>
      </DashboardShell>
    );
  }

  if (error || !server) {
    return (
      <DashboardShell>
        <div className="text-red-500">{error || "Server not found"}</div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <ServerSettingsHeader
        server={{
          name: server.name,
          ip_address: server.ip_address,
          status: server.status,
        }}
        activeAlerts={server.active_alerts}
      />
      <div className="grid gap-6">
        <ServerSettingsForm server={server} />
        <ServerDangerZone server={server} />
      </div>
    </DashboardShell>
  );
}
