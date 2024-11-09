import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ServerHeader } from "@/components/dashboard/server-header";
import { ServerMetricsChart } from "@/components/dashboard/server-metrics-chart";
import { ServerAlerts } from "@/components/dashboard/server-alerts";
import { ServerActions } from "@/components/dashboard/server-actions";
import { ServerHealth } from "@/components/dashboard/server-health";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ServerDetailSkeleton } from "@/components/dashboard/server-detail-skeleton";
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
        {/* Health Overview */}
        <Suspense fallback={<ServerDetailSkeleton />}>
          <ServerHealth serverId={server.id} />
        </Suspense>

        {/* Performance Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <div className="col-span-4">
            <Suspense fallback={<ServerDetailSkeleton />}>
              <ServerMetricsChart serverId={server.id} />
            </Suspense>
          </div>
          <div className="col-span-3">
            <Suspense fallback={<ServerDetailSkeleton />}>
              <ServerActions server={server} />
            </Suspense>
          </div>
        </div>

        {/* Network Traffic */}
        <div className="grid gap-4 md:grid-cols-2">
          <Suspense fallback={<ServerDetailSkeleton />}>
            <ServerMetricsChart
              serverId={server.id}
              type="network"
              title="Network Traffic"
              description="Inbound and outbound network traffic"
            />
          </Suspense>
          <Suspense fallback={<ServerDetailSkeleton />}>
            <ServerMetricsChart
              serverId={server.id}
              type="disk_io"
              title="Disk I/O"
              description="Read and write operations per second"
            />
          </Suspense>
        </div>

        {/* Server Alerts */}
        <Suspense fallback={<ServerDetailSkeleton />}>
          <ServerAlerts serverId={server.id} />
        </Suspense>
      </div>
    </DashboardShell>
  );
}
