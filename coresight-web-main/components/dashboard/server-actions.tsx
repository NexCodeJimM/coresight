"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  PowerIcon,
  RefreshCw,
  Settings,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ServerActionsProps {
  server: {
    id: string;
    name: string;
    status: "active" | "inactive" | "maintenance";
  };
}

export function ServerActions({ server }: ServerActionsProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const handleAction = async (action: string) => {
    setIsLoading(action);
    try {
      const response = await fetch(`/api/servers/${server.id}/actions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) throw new Error(`Failed to ${action} server`);

      toast({
        title: "Success",
        description: `Server ${action} action completed successfully.`,
      });
    } catch (error) {
      console.error(`Error performing ${action}:`, error);
      toast({
        title: "Error",
        description: `Failed to ${action} server. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Server Actions</CardTitle>
        <CardDescription>Manage server operations</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <Button
            variant="outline"
            onClick={() => handleAction("restart")}
            disabled={!!isLoading}
          >
            {isLoading === "restart" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Restart
          </Button>
          <Button
            variant={server.status === "active" ? "destructive" : "default"}
            onClick={() =>
              handleAction(server.status === "active" ? "stop" : "start")
            }
            disabled={!!isLoading}
          >
            {isLoading === "stop" || isLoading === "start" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <PowerIcon className="mr-2 h-4 w-4" />
            )}
            {server.status === "active" ? "Stop" : "Start"}
          </Button>
          <Button
            variant="outline"
            onClick={() => handleAction("maintenance")}
            disabled={!!isLoading}
          >
            {isLoading === "maintenance" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Settings className="mr-2 h-4 w-4" />
            )}
            Maintenance Mode
          </Button>
          <Button
            variant="outline"
            onClick={() => handleAction("check")}
            disabled={!!isLoading}
          >
            {isLoading === "check" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <AlertTriangle className="mr-2 h-4 w-4" />
            )}
            Health Check
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
