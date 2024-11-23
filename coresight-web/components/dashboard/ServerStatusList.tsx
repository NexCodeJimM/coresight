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
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PlusCircle } from "lucide-react";
import { AddServerDialog } from "@/components/servers/AddServerDialog";
import { useSession } from "next-auth/react";

interface ServerStatus {
  id: string;
  name: string;
  ip_address: string;
  status: "online" | "offline";
  cpu: number;
  memory: number;
}

interface ServerStatusListProps extends React.HTMLAttributes<HTMLDivElement> {}

export function ServerStatusList({
  className,
  ...props
}: ServerStatusListProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [servers, setServers] = useState<ServerStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const checkServerStatus = async (server: ServerStatus) => {
    try {
      // First try to directly access the server's health endpoint
      const healthResponse = await fetch(
        `http://${server.ip_address}:3001/health`,
        {
          next: { revalidate: 0 },
          headers: {
            "Cache-Control": "no-cache",
          },
        }
      );

      if (healthResponse.ok) {
        return {
          ...server,
          status: "online" as const,
        };
      }
    } catch (error) {
      console.error(
        `Error checking direct health for server ${server.id}:`,
        error
      );
    }

    // If direct access fails, return offline status
    return {
      ...server,
      status: "offline" as const,
    };
  };

  const fetchServerStatus = async () => {
    try {
      const response = await fetch("/api/servers/status");
      if (!response.ok) throw new Error("Failed to fetch server status");

      const data = await response.json();
      if (data.success) {
        // Check status for each server
        const serversWithStatus = await Promise.all(
          data.servers.map((server: ServerStatus) => checkServerStatus(server))
        );
        setServers(serversWithStatus);
      }
    } catch (error) {
      console.error("Error fetching server status:", error);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and interval setup
  useEffect(() => {
    fetchServerStatus();
    const interval = setInterval(fetchServerStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  // Handle dialog close and refresh
  const handleDialogChange = (open: boolean) => {
    setShowAddDialog(open);
    if (!open) {
      // Refresh the server list when dialog closes
      fetchServerStatus();
    }
  };

  if (loading) {
    return (
      <Card className={cn("col-span-4", className)} {...props}>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Server Status</CardTitle>
            <CardDescription>Overview of all monitored servers</CardDescription>
          </div>
          <div className="flex gap-2">
            {session?.user.role === "admin" && (
              <Button disabled>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Server
              </Button>
            )}
            <Button variant="outline" disabled>
              View Servers
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center">
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-[200px] bg-gray-200 rounded animate-pulse" />
                  <div className="h-2 w-[300px] bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("col-span-4", className)} {...props}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Server Status</CardTitle>
          <CardDescription>Overview of all monitored servers</CardDescription>
        </div>
        <div className="flex gap-2">
          {session?.user.role === "admin" && (
            <>
              <Button onClick={() => setShowAddDialog(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Server
              </Button>
              <AddServerDialog
                open={showAddDialog}
                onOpenChange={handleDialogChange}
              />
            </>
          )}
          <Button variant="outline" onClick={() => router.push("/servers")}>
            View Servers
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {servers.map((server) => (
            <div key={server.id} className="flex items-center">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium leading-none">
                    {server.name}
                  </p>
                  <Badge
                    variant={
                      server.status === "online" ? "success" : "destructive"
                    }
                    className={cn(
                      server.status === "online" &&
                        "bg-green-500 hover:bg-green-600/80"
                    )}
                  >
                    {server.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-4">
                  <Progress value={server.cpu} className="w-[60%]" />
                  <div className="flex items-center gap-1.5">
                    <div className="w-16 text-sm">CPU {server.cpu}%</div>
                    <div className="w-16 text-sm">RAM {server.memory}%</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
