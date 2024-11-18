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

interface Metrics {
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  network_usage: number;
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
        setMetrics(data.history);
        setCurrentMetrics(data.current);
      } catch (error) {
        console.error("Error fetching metrics:", error);
      }
    };

    const fetchProcesses = async () => {
      try {
        const response = await fetch(`/api/servers/${params.id}/processes`);
        const data = await response.json();
        setProcesses(data);
      } catch (error) {
        console.error("Error fetching processes:", error);
      }
    };

    fetchMetrics();
    fetchProcesses();

    // Poll for updates every 30 seconds
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, [params.id]);

  return (
    <div className="space-y-8 p-8">
      {/* Current Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="CPU Usage"
          value={`${currentMetrics?.cpu_usage.toFixed(1)}%`}
          icon={<FiCpu className="h-4 w-4" />}
        />
        <MetricCard
          title="Memory Usage"
          value={`${currentMetrics?.memory_usage.toFixed(1)}%`}
          icon={<BiMemoryCard className="h-4 w-4" />}
        />
        <MetricCard
          title="Disk Usage"
          value={`${currentMetrics?.disk_usage.toFixed(1)}%`}
          icon={<FiHardDrive className="h-4 w-4" />}
        />
        <MetricCard
          title="Network Usage"
          value={`${currentMetrics?.network_usage.toFixed(1)} MB/s`}
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
                <XAxis dataKey="timestamp" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="cpu_usage" stroke="#8884d8" />
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
                <XAxis dataKey="timestamp" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="memory_usage" stroke="#82ca9d" />
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
  value: string;
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
