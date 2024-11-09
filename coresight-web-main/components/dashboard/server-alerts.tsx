"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Alert {
  id: string;
  type: "cpu" | "memory" | "disk" | "network";
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  created_at: string;
  status: "active" | "resolved";
}

interface ServerAlertsProps {
  serverId: string;
}

export function ServerAlerts({ serverId }: ServerAlertsProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await fetch(`/api/servers/${serverId}/alerts`);
        if (!response.ok) throw new Error("Failed to fetch alerts");
        const data = await response.json();
        setAlerts(data);
      } catch (error) {
        console.error("Failed to fetch alerts:", error);
        toast({
          title: "Error",
          description: "Failed to fetch server alerts",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, [serverId, toast]);

  const handleResolve = async (alertId: string) => {
    try {
      const response = await fetch(`/api/alerts/${alertId}/resolve`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to resolve alert");

      setAlerts((prev) =>
        prev.map((alert) =>
          alert.id === alertId
            ? { ...alert, status: "resolved" as const }
            : alert
        )
      );

      toast({
        title: "Success",
        description: "Alert resolved successfully",
      });
    } catch (error) {
      console.error("Error resolving alert:", error);
      toast({
        title: "Error",
        description: "Failed to resolve alert",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Server Alerts</CardTitle>
        <CardDescription>Recent alerts and notifications</CardDescription>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">
            No active alerts
          </p>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-center justify-between space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <AlertTriangle
                    className={cn(
                      "h-4 w-4",
                      alert.severity === "critical" && "text-red-500",
                      alert.severity === "high" && "text-orange-500",
                      alert.severity === "medium" && "text-yellow-500",
                      alert.severity === "low" && "text-blue-500"
                    )}
                  />
                  <div>
                    <p className="text-sm font-medium">{alert.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(alert.created_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge
                    variant={
                      alert.severity === "critical" ? "destructive" : "default"
                    }
                  >
                    {alert.severity}
                  </Badge>
                  {alert.status === "active" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResolve(alert.id)}
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
