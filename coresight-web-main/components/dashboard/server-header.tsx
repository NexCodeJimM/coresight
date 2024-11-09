import { ServerStatus } from "@/components/dashboard/server-status";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import Link from "next/link";

interface ServerHeaderProps {
  server: {
    id: string;
    name: string;
    ip_address: string;
    status: "active" | "inactive" | "maintenance";
  };
}

export function ServerHeader({ server }: ServerHeaderProps) {
  return (
    <DashboardHeader
      heading={server.name}
      description={
        <div className="flex items-center space-x-4">
          <span>{server.ip_address}</span>
          <ServerStatus status={server.status} />
        </div>
      }
    >
      <Link href={`/dashboard/servers/${server.id}/settings`}>
        <Button variant="outline" size="sm">
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </Button>
      </Link>
    </DashboardHeader>
  );
}
