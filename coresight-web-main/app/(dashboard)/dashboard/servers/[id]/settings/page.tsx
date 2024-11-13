import { notFound } from "next/navigation";
import { ServerSettingsForm } from "@/components/dashboard/server-settings-form";
import { ServerSettingsHeader } from "@/components/dashboard/server-settings-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { db } from "@/lib/db";
import { ServerDangerZone } from "@/components/dashboard/server-danger-zone";

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

async function getServer(id: string): Promise<Server | null> {
  try {
    const [servers] = await db.query(
      `SELECT 
        s.*,
        (
          SELECT COUNT(*) 
          FROM alerts 
          WHERE server_id = s.id AND status = 'active'
        ) as active_alerts,
        COALESCE(s.status, 'inactive') as status
      FROM servers s 
      WHERE s.id = ?`,
      [id]
    );
    const server = (servers as any[])[0];
    if (!server) return null;
    return {
      ...server,
      status: server.status || "inactive",
    } as Server;
  } catch (error) {
    console.error("Failed to fetch server:", error);
    return null;
  }
}

export default async function ServerSettingsPage({
  params,
}: {
  params: { id: string };
}) {
  const server = await getServer(params.id);

  if (!server) {
    notFound();
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
