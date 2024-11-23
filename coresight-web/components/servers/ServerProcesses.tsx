"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Process } from "@/types/server";
import { useEffect } from "react";

interface ServerProcessesProps {
  showProcesses: boolean;
  setShowProcesses: (show: boolean) => void;
  loadingProcesses: boolean;
  setLoadingProcesses: (loading: boolean) => void;
  processes: Process[];
  setProcesses: (processes: Process[]) => void;
  serverId: string;
}

export function ServerProcesses({
  showProcesses,
  setShowProcesses,
  loadingProcesses,
  setLoadingProcesses,
  processes,
  setProcesses,
  serverId,
}: ServerProcessesProps) {
  useEffect(() => {
    const fetchProcesses = async () => {
      if (!showProcesses) return;
      try {
        setLoadingProcesses(true);
        const response = await fetch(`/api/servers/${serverId}/processes`);
        const data = await response.json();

        if (response.ok && data.success) {
          setProcesses(data.data);
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
    }
  }, [showProcesses, serverId, setLoadingProcesses, setProcesses]);

  return (
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
                <TableHead>Disk %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processes.map((process) => (
                <TableRow key={process.pid}>
                  <TableCell>{process.pid}</TableCell>
                  <TableCell>{process.name}</TableCell>
                  <TableCell>{process.cpu_usage.toFixed(1)}%</TableCell>
                  <TableCell>{process.memory_usage.toFixed(1)}%</TableCell>
                  <TableCell>{process.disk_usage?.toFixed(1) || '0.0'}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
}
