import { Suspense } from "react";
import { ServersList } from "@/components/dashboard/servers-list";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ServersListSkeleton } from "@/components/dashboard/servers-list-skeleton";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";

export default function ServersPage() {
  return (
    <DashboardShell>
      <DashboardHeader
        heading="Servers"
        description="Manage your server infrastructure."
      >
        <Link href="/dashboard/servers/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Server
          </Button>
        </Link>
      </DashboardHeader>
      <div className="grid gap-4">
        <Suspense fallback={<ServersListSkeleton />}>
          <ServersList />
        </Suspense>
      </div>
    </DashboardShell>
  );
}
