"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ServerCardProps {
  server: {
    id: string;
    name: string;
    hostname: string;
    ip_address: string;
    status: "active" | "inactive" | "maintenance";
    active_alerts: number;
  };
}

export function ServerCard({ server }: ServerCardProps) {
  const statusColors = {
    active: "bg-green-500",
    inactive: "bg-gray-500",
    maintenance: "bg-yellow-500",
  };

  return (
    <Link href={`/dashboard/servers/${server.id}`}>
      <Card className="hover:bg-accent/50 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{server.name}</CardTitle>
          <Badge
            variant="secondary"
            className={`${statusColors[server.status]} text-white`}
          >
            {server.status}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            <p>{server.hostname}</p>
            <p>{server.ip_address}</p>
          </div>
          {server.active_alerts > 0 && (
            <Badge variant="destructive" className="mt-2">
              {server.active_alerts} Active Alert
              {server.active_alerts > 1 ? "s" : ""}
            </Badge>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
