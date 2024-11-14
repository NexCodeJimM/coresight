import { Suspense } from "react";
import { ServerMetrics } from "@/components/dashboard/server-metrics";
import { AlertsList } from "@/components/dashboard/alerts-list";
import { ServersList } from "@/components/dashboard/servers-list";
import { ServerUptime } from "@/components/dashboard/server-uptime";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { ServersListSkeleton } from "@/components/dashboard/servers-list-skeleton";
import { AlertsListSkeleton } from "@/components/dashboard/alerts-list-skeleton";

export default function DashboardPage() {
  return (
    <DashboardShell>
      <DashboardHeader
        heading="Dashboard"
        description="Monitor your server metrics and system health."
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Suspense fallback={<DashboardSkeleton />}>
          <ServerMetrics />
        </Suspense>
      </div>
      <div className="my-6">
        <Suspense fallback={<DashboardSkeleton />}>
          <ServerUptime />
        </Suspense>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4">
          <Suspense fallback={<ServersListSkeleton />}>
            <ServersList />
          </Suspense>
        </div>
        <div className="col-span-3">
          <Suspense fallback={<AlertsListSkeleton />}>
            <AlertsList />
          </Suspense>
        </div>
      </div>
    </DashboardShell>
  );
}
