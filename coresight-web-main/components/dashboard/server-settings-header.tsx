import { ServerStatus } from "@/components/dashboard/server-status";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";

interface ServerSettingsHeaderProps {
  server: {
    name: string;
    ip_address: string;
    status: "active" | "inactive" | "maintenance";
  };
  activeAlerts: number;
}

export function ServerSettingsHeader({
  server,
  activeAlerts,
}: ServerSettingsHeaderProps) {
  return (
    <DashboardHeader
      heading={server.name}
      description={
        <div className="flex items-center space-x-4">
          <span>{server.ip_address}</span>
          <ServerStatus status={server.status} />
          {activeAlerts > 0 && (
            <Badge
              variant="destructive"
              className="flex items-center space-x-1"
            >
              <AlertTriangle className="h-3 w-3" />
              <span>{activeAlerts} active alerts</span>
            </Badge>
          )}
        </div>
      }
    />
  );
}
