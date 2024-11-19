"use client";

import React from "react";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { FiCpu, FiHardDrive } from "react-icons/fi";
import { BiMemoryCard } from "react-icons/bi";
import { AiOutlineNodeIndex } from "react-icons/ai";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ServerDetails {
  id: string;
  name: string;
  ip_address: string;
  hostname: string;
  description: string;
  status: string;
}

interface Metrics {
  id: string;
  server_id: string;
  cpu_usage: number;
  memory_usage: number;
  memory_total: number;
  memory_used: number;
  disk_usage: number;
  disk_total: number;
  disk_used: number;
  network_usage: number;
  network_in: number;
  network_out: number;
  temperature: number | null;
  timestamp: string;
}

interface Process {
  pid: number;
  name: string;
  cpu_usage: number;
  memory_usage: number;
}

export default function ServerPage({ params }: { params: { id: string } }) {
  const [metrics, setMetrics] = useState<Metrics[]>([]);
  const [currentMetrics, setCurrentMetrics] = useState<Metrics | null>(null);
  const [serverDetails, setServerDetails] = useState<ServerDetails | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showProcesses, setShowProcesses] = useState(false);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [loadingProcesses, setLoadingProcesses] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        if (!isMounted) return;

        // Fetch server details
        const detailsResponse = await fetch(`/api/servers/${params.id}`);
        const detailsData = await detailsResponse.json();

        if (!detailsResponse.ok) {
          throw new Error(
            detailsData.error || "Failed to fetch server details"
          );
        }

        if (isMounted) {
          setServerDetails(detailsData.server);
        }

        // Fetch metrics
        const metricsResponse = await fetch(
          `/api/servers/${params.id}/metrics`
        );
        const metricsData = await metricsResponse.json();

        if (!metricsResponse.ok) {
          throw new Error(metricsData.error || "Failed to fetch metrics");
        }

        if (isMounted) {
          setCurrentMetrics(metricsData.current);
          setMetrics(metricsData.history || []);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "An error occurred");
          setLoading(false);
        }
        console.error("Error fetching data:", err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000); // Refresh every 10 seconds

    // Cleanup function
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [params.id]);

  useEffect(() => {
    const fetchProcesses = async () => {
      if (!showProcesses) return;

      try {
        setLoadingProcesses(true);
        const response = await fetch(`/api/servers/${params.id}/processes`);
        const data = await response.json();

        if (response.ok && data.success) {
          setProcesses(data.data || []);
        } else {
          console.error("Failed to fetch processes:", data.error);
        }
      } catch (error) {
        console.error("Error fetching processes:", error);
      } finally {
        setLoadingProcesses(false);
      }
    };

    if (showProcesses) {
      fetchProcesses();
      // Refresh processes every 5 seconds while dialog is open
      const interval = setInterval(fetchProcesses, 5000);
      return () => clearInterval(interval);
    }
  }, [params.id, showProcesses]);

  // Format timestamp for graphs
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Manila",
    });
  };

  // Format bytes to human readable format
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-8">
      {/* Server Header */}
      {serverDetails && (
        <div className="border-b pb-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">{serverDetails.name}</h1>
              <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                <span>{serverDetails.ip_address}</span>
                <span>•</span>
                <span>{serverDetails.hostname}</span>
              </div>
              {serverDetails.description && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {serverDetails.description}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Current Metrics Cards */}
      {currentMetrics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
              <FiCpu className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {currentMetrics.cpu_usage.toFixed(1)}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Memory Usage
              </CardTitle>
              <BiMemoryCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {currentMetrics.memory_usage.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {formatBytes(currentMetrics.memory_used)} /{" "}
                {formatBytes(currentMetrics.memory_total)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Disk Usage</CardTitle>
              <FiHardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {currentMetrics.disk_usage.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {formatBytes(currentMetrics.disk_used)} /{" "}
                {formatBytes(currentMetrics.disk_total)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Network Usage
              </CardTitle>
              <AiOutlineNodeIndex className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">
                  ↑ {formatBytes(currentMetrics.network_out)}/s
                </span>
                <span className="text-sm text-muted-foreground">
                  ↓ {formatBytes(currentMetrics.network_in)}/s
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add the button here, after the cards */}
      <div className="flex justify-end">
        <Dialog open={showProcesses} onOpenChange={setShowProcesses}>
          <DialogTrigger asChild>
            <Button>View Processes</Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Running Processes</DialogTitle>
            </DialogHeader>
            {loadingProcesses ? (
              <div className="flex justify-center p-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>CPU %</TableHead>
                    <TableHead>Memory %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processes.map((process) => (
                    <TableRow key={process.pid}>
                      <TableCell>{process.pid}</TableCell>
                      <TableCell>{process.name}</TableCell>
                      <TableCell>{process.cpu_usage.toFixed(1)}%</TableCell>
                      <TableCell>{process.memory_usage.toFixed(1)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* History Graphs */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>CPU & Memory History</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics}>
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={formatTimestamp}
                  interval="preserveStartEnd"
                  minTickGap={50}
                />
                <YAxis
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                  labelFormatter={formatTimestamp}
                  formatter={(value: number) => [`${value.toFixed(1)}%`]}
                />
                <Line
                  type="monotone"
                  dataKey="cpu_usage"
                  stroke="#8884d8"
                  name="CPU"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="memory_usage"
                  stroke="#82ca9d"
                  name="Memory"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Network History</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics}>
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={formatTimestamp}
                  interval="preserveStartEnd"
                  minTickGap={50}
                />
                <YAxis tickFormatter={(value) => `${formatBytes(value)}/s`} />
                <Tooltip
                  labelFormatter={formatTimestamp}
                  formatter={(value: number) => [formatBytes(value) + "/s"]}
                />
                <Line
                  type="monotone"
                  dataKey="network_in"
                  stroke="#82ca9d"
                  name="Download"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="network_out"
                  stroke="#8884d8"
                  name="Upload"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
