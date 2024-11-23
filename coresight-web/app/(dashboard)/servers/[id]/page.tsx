"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { ServerDetails } from "@/components/servers/ServerDetails";
import { ServerMetricsHistory } from "@/components/servers/ServerMetricsHistory";
import { ServerProcesses } from "@/components/servers/ServerProcesses";
import {
  ServerDetails as IServerDetails,
  Metrics,
  Process,
} from "@/types/server";

export default function ServerPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [metrics, setMetrics] = useState<Metrics[]>([]);
  const [currentMetrics, setCurrentMetrics] = useState<Metrics | null>(null);
  const [serverDetails, setServerDetails] = useState<IServerDetails | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showProcesses, setShowProcesses] = useState(false);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [loadingProcesses, setLoadingProcesses] = useState(false);

  // Separate useEffect for current metrics (10-second updates)
  useEffect(() => {
    let isMounted = true;

    const fetchCurrentMetrics = async () => {
      try {
        const response = await fetch(
          `/api/servers/${params.id}/metrics/current`
        );
        if (!response.ok) throw new Error("Failed to fetch current metrics");

        const data = await response.json();
        console.log("Current metrics response:", data); // Debug log

        if (isMounted && data.success) {
          setCurrentMetrics(data.current);
        }
      } catch (error) {
        console.error("Error fetching current metrics:", error);
      }
    };

    fetchCurrentMetrics();
    const interval = setInterval(fetchCurrentMetrics, 10000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [params.id]);

  // Separate useEffect for historical metrics (5-minute updates)
  useEffect(() => {
    let isMounted = true;

    const fetchHistoricalMetrics = async () => {
      try {
        const response = await fetch(
          `/api/servers/${params.id}/metrics/history`
        );
        if (!response.ok) throw new Error("Failed to fetch historical metrics");

        const data = await response.json();
        if (isMounted && data.success) {
          setMetrics(data.history);
        }
      } catch (error) {
        console.error("Error fetching historical metrics:", error);
      }
    };

    fetchHistoricalMetrics();
    const interval = setInterval(fetchHistoricalMetrics, 5 * 60 * 1000); // 5 minutes

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [params.id]);

  // Initial server details fetch
  useEffect(() => {
    let isMounted = true;

    const fetchServerDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/servers/${params.id}`);
        if (!response.ok) throw new Error("Failed to fetch server details");

        const data = await response.json();
        if (isMounted && data.success) {
          setServerDetails(data.server);
        }
      } catch (error) {
        console.error("Error fetching server details:", error);
        if (isMounted) {
          setError(
            error instanceof Error
              ? error.message
              : "Failed to load server details"
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchServerDetails();

    return () => {
      isMounted = false;
    };
  }, [params.id]);

  // Format timestamp for graphs
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Manila",
    });
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

      {/* Current Metrics */}
      <ServerDetails currentMetrics={currentMetrics} />

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4">
        <ServerProcesses
          showProcesses={showProcesses}
          setShowProcesses={setShowProcesses}
          loadingProcesses={loadingProcesses}
          setLoadingProcesses={setLoadingProcesses}
          processes={processes}
          setProcesses={setProcesses}
          serverId={params.id}
        />
        <Button
          variant="outline"
          onClick={() => router.push(`/servers/${params.id}/settings`)}
          className="flex items-center gap-2"
        >
          <Settings className="h-4 w-4" />
          Settings
        </Button>
      </div>

      {/* Metrics History */}
      <ServerMetricsHistory
        metrics={metrics}
        formatTimestamp={formatTimestamp}
      />
    </div>
  );
}
