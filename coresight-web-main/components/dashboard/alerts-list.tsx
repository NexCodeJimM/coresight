"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { AlertTriangle, Bell, CheckCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Alert {
  id: string;
  server_id: string;
  server_name: string;
  type: "cpu" | "memory" | "disk" | "network";
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  status: "active" | "resolved";
  created_at: string;
  resolved_at: string | null;
}

function getSeverityColor(severity: Alert["severity"]) {
  switch (severity) {
    case "critical":
      return "text-red-500";
    case "high":
      return "text-orange-500";
    case "medium":
      return "text-yellow-500";
    case "low":
      return "text-blue-500";
    default:
      return "text-gray-500";
  }
}

function AlertItem({ alert }: { alert: Alert }) {
  const [isResolving, setIsResolving] = useState(false);
  const { toast } = useToast();

  const handleResolve = async () => {
    setIsResolving(true);
    try {
      const response = await fetch(`/api/alerts/${alert.id}/resolve`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to resolve alert");

      toast({
        title: "Alert resolved",
        description: "The alert has been marked as resolved.",
      });
    } catch (error) {
      console.error("Error resolving alert:", error);
      toast({
        title: "Error",
        description: "Failed to resolve the alert. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <div className="mb-4 last:mb-0">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <AlertTriangle
            className={cn("h-4 w-4", getSeverityColor(alert.severity))}
          />
          <Link
            href={`/dashboard/servers/${alert.server_id}`}
            className="font-medium hover:underline"
          >
            {alert.server_name}
          </Link>
        </div>
        <div className="flex items-center space-x-2">
          <Badge
            variant={alert.severity === "critical" ? "destructive" : "default"}
          >
            {alert.severity}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handleResolve}
            disabled={isResolving}
          >
            <CheckCircle className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">{alert.message}</p>
      <p className="text-xs text-muted-foreground mt-1">
        {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
      </p>
    </div>
  );
}

export function AlertsList() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await fetch("/api/alerts");
        if (!response.ok) throw new Error("Failed to fetch alerts");
        const data = await response.json();
        setAlerts(data);
      } catch (error) {
        console.error("Failed to fetch alerts:", error);
        toast({
          title: "Error",
          description: "Failed to fetch alerts. Please refresh the page.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [toast]);

  if (loading) {
    return null; // Using Suspense fallback instead
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <div>
              <CardTitle>Active Alerts</CardTitle>
              <CardDescription>
                {alerts.length} alert{alerts.length !== 1 && "s"} requiring
                attention
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {alerts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No active alerts
            </p>
          ) : (
            alerts.map((alert) => <AlertItem key={alert.id} alert={alert} />)
          )}
        </div>
      </CardContent>
    </Card>
  );
}
