"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Process {
  pid: number;
  name: string;
  cpu: number;
  memory: number;
  status: string;
}

export function ServerProcesses({ serverId }: { serverId: string }) {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProcesses() {
      try {
        const response = await fetch(`/api/servers/${serverId}/processes`);
        if (!response.ok) {
          throw new Error("Failed to fetch processes");
        }
        const data = await response.json();
        setProcesses(data);
        setError(null);
      } catch (error) {
        console.error("Error fetching processes:", error);
        setError("Failed to load processes");
      } finally {
        setIsLoading(false);
      }
    }

    fetchProcesses();
    const interval = setInterval(fetchProcesses, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [serverId]);

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Processes</CardTitle>
          <CardDescription>Error: {error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Running Processes</CardTitle>
        <CardDescription>
          Active system processes and resource usage
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>PID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>CPU %</TableHead>
              <TableHead>Memory %</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {processes.map((process) => (
              <TableRow key={process.pid}>
                <TableCell>{process.pid}</TableCell>
                <TableCell>{process.name}</TableCell>
                <TableCell>{process.cpu.toFixed(1)}%</TableCell>
                <TableCell>{process.memory.toFixed(1)}%</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      process.status === "running" ? "default" : "secondary"
                    }
                  >
                    {process.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
