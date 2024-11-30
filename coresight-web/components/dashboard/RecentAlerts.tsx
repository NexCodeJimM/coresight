"use client";

import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";

interface Alert {
  id: string;
  severity: "critical" | "high" | "medium" | "low";
  message: string;
  server_name?: string;
  website_name?: string;
  created_at: string;
}

interface RecentAlertsProps extends React.HTMLAttributes<HTMLDivElement> {}

export function RecentAlerts({ className, ...props }: RecentAlertsProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await fetch("/api/alerts/recent");
        if (!response.ok) {
          console.error("Failed to fetch alerts:", response.statusText);
          throw new Error("Failed to fetch alerts");
        }

        const data = await response.json();
        if (data.success) {
          setAlerts(data.alerts);
        } else {
          console.error("Failed to fetch alerts:", data.error);
        }
      } catch (error) {
        console.error("Error fetching alerts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
    // Refresh alerts every 30 seconds
    const interval = setInterval(fetchAlerts, 30000);

    return () => clearInterval(interval);
  }, []);

  const getTimeAgo = (timestamp: string) => {
    const seconds = Math.floor(
      (new Date().getTime() - new Date(timestamp).getTime()) / 1000
    );

    if (seconds < 60) return `${seconds} seconds ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days !== 1 ? "s" : ""} ago`;
  };

  if (loading) {
    return (
      <Card className={cn("col-span-3", className)} {...props}>
        <CardHeader>
          <CardTitle>Recent Alerts</CardTitle>
          <CardDescription>Latest system alerts and notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center">
                <div className="space-y-2 w-full">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-16 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                  </div>
                  <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("col-span-3", className)} {...props}>
      <CardHeader>
        <CardTitle>Recent Alerts</CardTitle>
        <CardDescription>Latest system alerts and notifications</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {alerts.length > 0 ? (
            alerts.map((alert) => (
              <div key={alert.id} className="flex items-center">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        alert.severity === "critical"
                          ? "destructive"
                          : alert.severity === "high"
                          ? "warning"
                          : "default"
                      }
                    >
                      {alert.severity}
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      {getTimeAgo(alert.created_at)}
                    </p>
                  </div>
                  <p className="text-sm font-medium leading-none">
                    {alert.message}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {alert.server_name 
                      ? `Server: ${alert.server_name}`
                      : alert.website_name 
                      ? `Website: ${alert.website_name}`
                      : ''}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center">
              No recent alerts
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
