"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBytes } from "@/lib/utils";
import { Metrics } from "@/types/server";
import { FiCpu, FiHardDrive } from "react-icons/fi";
import { BiMemoryCard } from "react-icons/bi";
import { AiOutlineNodeIndex } from "react-icons/ai";

interface ServerDetailsProps {
  currentMetrics: Metrics | null;
}

export function ServerDetails({ currentMetrics }: ServerDetailsProps) {
  console.log("Current Metrics:", currentMetrics);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
          <FiCpu className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {currentMetrics?.cpu?.usage?.toFixed(1) ?? "0.0"}%
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
          <BiMemoryCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {currentMetrics?.memory?.usage?.toFixed(1) ?? "0.0"}%
          </div>
          <p className="text-xs text-muted-foreground">
            {formatBytes(currentMetrics?.memory?.used ?? 0)} /{" "}
            {formatBytes(currentMetrics?.memory?.total ?? 0)}
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
            {currentMetrics?.disk?.usage?.toFixed(1) ?? "0.0"}%
          </div>
          <p className="text-xs text-muted-foreground">
            {formatBytes(currentMetrics?.disk?.used ?? 0)} /{" "}
            {formatBytes(currentMetrics?.disk?.total ?? 0)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Network Usage</CardTitle>
          <AiOutlineNodeIndex className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">
              ↑ {formatBytes(currentMetrics?.network?.bytes_sent ?? 0)}/s
            </span>
            <span className="text-sm text-muted-foreground">
              ↓ {formatBytes(currentMetrics?.network?.bytes_recv ?? 0)}/s
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
