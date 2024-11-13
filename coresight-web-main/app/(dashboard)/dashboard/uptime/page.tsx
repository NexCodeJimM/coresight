import { Suspense } from "react";
import { ServerUptime } from "@/components/dashboard/server-uptime";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";

export default function UptimePage() {
  return (
    <DashboardShell>
      <DashboardHeader
        heading="Server Uptime"
        description="Monitor server availability and uptime status"
      />
      <div className="grid gap-4">
        <Suspense fallback={<div>Loading uptime data...</div>}>
          <ServerUptime />
        </Suspense>
      </div>
    </DashboardShell>
  );
}
