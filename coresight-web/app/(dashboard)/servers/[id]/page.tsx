"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

interface NetworkUsage {
  upload_rate: number;
  download_rate: number;
  total_rate: number;
}

interface Metrics {
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  network_usage: NetworkUsage;
  timestamp: string;
}

interface Process {
  pid: number;
  name: string;
  cpu_usage: number;
  memory_usage: number;
}

export default function ServerInformation({
  params,
}: {
  params: { id: string };
}) {
  const [metrics, setMetrics] = useState<Metrics[]>([]);
  const [currentMetrics, setCurrentMetrics] = useState<Metrics | null>(null);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [showProcesses, setShowProcesses] = useState(false);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch(`/api/servers/${params.id}/metrics`);
        const data = await response.json();

        if (data.success) {
          setCurrentMetrics(data.current);
          setMetrics(data.history || []);
        }
      } catch (error) {
        console.error("Error fetching metrics:", error);
      }
    };

    const fetchProcesses = async () => {
      try {
        const response = await fetch(`/api/servers/${params.id}/processes`);
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          setProcesses(data.data);
        } else {
          setProcesses([]);
        }
      } catch (error) {
        console.error("Error fetching processes:", error);
        setProcesses([]);
      }
    };

    fetchMetrics();
    fetchProcesses();

    // Poll for updates every 10 seconds
    const interval = setInterval(fetchMetrics, 10000);
    return () => clearInterval(interval);
  }, [params.id]);

  // Format timestamp for graphs
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Manila", // Set to your local timezone
    });
  };

  // Format tooltip values
  const formatTooltipValue = (value: number, type: string) => {
    switch (type) {
      case "network":
        return `${value.toFixed(1)} MB/s`;
      default:
        return `${value.toFixed(1)}%`;
    }
  };

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label, type }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow border">
          <p className="font-medium">{formatTimestamp(label)}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {formatTooltipValue(entry.value, type)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 p-8">
      {/* Current Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="CPU Usage"
          value={`${currentMetrics?.cpu_usage?.toFixed(1) || "0"}%`}
          icon={<FiCpu className="h-4 w-4" />}
        />
        <MetricCard
          title="Memory Usage"
          value={`${currentMetrics?.memory_usage?.toFixed(1) || "0"}%`}
          icon={<BiMemoryCard className="h-4 w-4" />}
        />
        <MetricCard
          title="Disk Usage"
          value={`${currentMetrics?.disk_usage?.toFixed(1) || "0"}%`}
          icon={<FiHardDrive className="h-4 w-4" />}
        />
        <MetricCard
          title="Network Usage"
          value={
            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">
                ↑{" "}
                {currentMetrics?.network_usage?.upload_rate?.toFixed(1) || "0"}{" "}
                MB/s
              </span>
              <span className="text-sm text-muted-foreground">
                ↓{" "}
                {currentMetrics?.network_usage?.download_rate?.toFixed(1) ||
                  "0"}{" "}
                MB/s
              </span>
            </div>
          }
          icon={<AiOutlineNodeIndex className="h-4 w-4" />}
        />
      </div>

      {/* History Graphs */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>CPU History</CardTitle>
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
                  content={(props) => <CustomTooltip {...props} type="cpu" />}
                />
                <Line
                  type="monotone"
                  dataKey="cpu_usage"
                  stroke="#8884d8"
                  strokeWidth={2}
                  dot={false}
                  name="CPU"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Memory History</CardTitle>
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
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="memory_usage"
                  stroke="#82ca9d"
                  strokeWidth={2}
                  dot={false}
                  name="Memory"
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
                <YAxis tickFormatter={(value) => `${value.toFixed(1)} MB/s`} />
                <Tooltip
                  content={(props) => (
                    <CustomTooltip {...props} type="network" />
                  )}
                />
                <Line
                  type="monotone"
                  dataKey="network_usage.upload_rate"
                  stroke="#8884d8"
                  strokeWidth={2}
                  dot={false}
                  name="Upload"
                />
                <Line
                  type="monotone"
                  dataKey="network_usage.download_rate"
                  stroke="#82ca9d"
                  strokeWidth={2}
                  dot={false}
                  name="Download"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Processes Dialog */}
      <Dialog open={showProcesses} onOpenChange={setShowProcesses}>
        <DialogTrigger asChild>
          <Button>View Processes</Button>
        </DialogTrigger>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Running Processes</DialogTitle>
          </DialogHeader>
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
              {Array.isArray(processes) &&
                processes.map((process) => (
                  <TableRow key={process.pid}>
                    <TableCell>{process.pid}</TableCell>
                    <TableCell>{process.name}</TableCell>
                    <TableCell>{process.cpu_usage?.toFixed(1)}%</TableCell>
                    <TableCell>{process.memory_usage?.toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | React.ReactNode;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
