"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Server, Cpu, HardDrive, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";

interface DashboardStats {
  totalServers: number;
  serversChange: number;
  averageCpu: number;
  cpuChange: number;
  averageStorage: number;
  storageChange: number;
  activeAlerts: number;
  alertsChange: number;
}

function StatsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-3 w-32 bg-gray-200 rounded animate-pulse" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function DashboardStats() {
  const [stats, setStats] = useState<DashboardStats>({
    totalServers: 0,
    serversChange: 0,
    averageCpu: 0,
    cpuChange: 0,
    averageStorage: 0,
    storageChange: 0,
    activeAlerts: 0,
    alertsChange: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/dashboard/stats");
        if (!response.ok) throw new Error("Failed to fetch stats");

        const data = await response.json();
        if (data.success) {
          setStats(data.stats);
        }
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    // Refresh stats every minute
    const interval = setInterval(fetchStats, 60000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <StatsSkeleton />;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Servers</CardTitle>
          <Server className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalServers}</div>
          <p className="text-xs text-muted-foreground">
            {stats.serversChange > 0 ? "+" : ""}
            {stats.serversChange} from last month
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average CPU</CardTitle>
          <Cpu className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.averageCpu.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground">
            {stats.cpuChange > 0 ? "+" : ""}
            {stats.cpuChange.toFixed(1)}% from last hour
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
          <HardDrive className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.averageStorage.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground">
            {stats.storageChange > 0 ? "+" : ""}
            {stats.storageChange.toFixed(1)}% from last week
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activeAlerts}</div>
          <p className="text-xs text-muted-foreground">
            {stats.alertsChange > 0 ? "+" : ""}
            {stats.alertsChange} from yesterday
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
