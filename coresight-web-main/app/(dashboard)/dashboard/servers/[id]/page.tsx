export const dynamic = "force-dynamic";
export const revalidate = 0;

import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ServerHeader } from "@/components/dashboard/server-header";
import { ServerMetricsGraphs } from "@/components/dashboard/server-metrics-graphs";
import { ServerHealth } from "@/components/dashboard/server-health";
import { ServerProcesses } from "@/components/dashboard/server-processes";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { db } from "@/lib/db";

async function getServer(id: string) {
  try {
    const [servers] = await db.query(
      `SELECT 
        s.*,
        (
          SELECT COUNT(*) 
          FROM alerts 
          WHERE server_id = s.id AND status = 'active'
        ) as active_alerts,
        (
          SELECT JSON_OBJECT(
            'cpu_usage', sm.cpu_usage,
            'memory_usage', sm.memory_usage,
            'disk_usage', sm.disk_usage,
            'network_in', sm.network_in,
            'network_out', sm.network_out,
            'timestamp', sm.timestamp
          )
          FROM server_metrics sm
          WHERE sm.server_id = s.id
          ORDER BY sm.timestamp DESC
          LIMIT 1
        ) as latest_metrics
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

export default async function ServerPage({
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
      <ServerHeader server={server} />
      <div className="grid gap-6">
        <Suspense>
          <ServerHealth serverId={server.id} />
        </Suspense>

        <div className="grid gap-6 md:grid-cols-2">
          <Suspense>
            <ServerMetricsGraphs
              serverId={server.id}
              type="network"
              title="Network Traffic"
              description="Inbound and outbound network traffic"
            />
          </Suspense>
          <Suspense>
            <ServerMetricsGraphs
              serverId={server.id}
              type="temperature"
              title="CPU Temperature"
              description="CPU temperature over time"
            />
          </Suspense>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Suspense>
            <ServerMetricsGraphs
              serverId={server.id}
              type="memory"
              title="Memory Usage"
              description="Active memory and swap usage"
            />
          </Suspense>
          <Suspense>
            <ServerMetricsGraphs
              serverId={server.id}
              type="performance"
              title="System Performance"
              description="CPU, Memory, and Disk usage"
            />
          </Suspense>
        </div>

        <Suspense>
          <ServerProcesses serverId={server.id} />
        </Suspense>
      </div>
    </DashboardShell>
  );
}
