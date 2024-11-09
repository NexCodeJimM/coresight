import { notFound } from "next/navigation";
import { ServerSettingsForm } from "@/components/dashboard/server-settings-form";
import { ServerSettingsHeader } from "@/components/dashboard/server-settings-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { db } from "@/lib/db";
import { ServerDangerZone } from "@/components/dashboard/server-danger-zone";

async function getServer(id: string) {
  try {
    const [servers] = await db.query(
      `SELECT 
        s.*,
        (
          SELECT COUNT(*) 
          FROM alerts 
          WHERE server_id = s.id AND status = 'active'
        ) as active_alerts
      FROM servers s 
      WHERE s.id = ?`,
      [id]
    );
    const server = (servers as any[])[0];
    if (!server) return null;
    return server;
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
        server={server}
        activeAlerts={server.active_alerts}
      />
      <div className="grid gap-6">
        <ServerSettingsForm server={server} />
        <ServerDangerZone server={server} />
      </div>
    </DashboardShell>
  );
}
