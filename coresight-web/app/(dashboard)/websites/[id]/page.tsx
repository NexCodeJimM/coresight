"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings, ArrowLeft, ExternalLink } from "lucide-react";
import { WebsiteUptimeGraph } from "@/components/websites/WebsiteUptimeGraph";

interface Website {
  id: string;
  name: string;
  url: string;
  status: "up" | "down";
  last_checked: string | null;
  response_time: number | null;
  check_interval: number;
}

interface UptimeData {
  percentage: number;
  avgResponseTime: number;
  history: {
    status: "up" | "down";
    response_time: number | null;
    timestamp: string;
  }[];
}

export default function WebsitePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [website, setWebsite] = useState<Website | null>(null);
  const [uptimeData, setUptimeData] = useState<UptimeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWebsiteDetails = async () => {
      try {
        setLoading(true);
        const [websiteRes, uptimeRes] = await Promise.all([
          fetch(`/api/websites/${params.id}`),
          fetch(`/api/websites/${params.id}/uptime`)
        ]);

        if (!websiteRes.ok) throw new Error("Failed to fetch website details");
        if (!uptimeRes.ok) throw new Error("Failed to fetch uptime data");

        const websiteData = await websiteRes.json();
        const uptimeData = await uptimeRes.json();

        if (websiteData.success) {
          setWebsite(websiteData.website);
        }
        if (uptimeData.success) {
          setUptimeData(uptimeData.uptime);
        }
      } catch (error) {
        console.error("Error fetching website details:", error);
        setError(error instanceof Error ? error.message : "Failed to load website details");
      } finally {
        setLoading(false);
      }
    };

    fetchWebsiteDetails();
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchWebsiteDetails, 30000);

    return () => clearInterval(interval);
  }, [params.id]);

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

  if (!website) return null;

  const formatLastChecked = (date: string | null) => {
    if (!date) return "Never";
    return new Date(date).toLocaleString("en-US", {
      timeZone: "Asia/Manila",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });
  };

  const formatInterval = (seconds: number) => {
    if (seconds < 60) return `${seconds} seconds`;
    return `${seconds / 60} minutes`;
  };

  return (
    <div className="space-y-8 p-8">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push('/websites')}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Websites
      </Button>

      {/* Website Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold">Website Details</h1>
        <div className="border-b pb-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold">{website.name}</h2>
                <Badge variant={website.status === "up" ? "success" : "destructive"}>
                  {website.status === "up" ? "Online" : "Offline"}
                </Badge>
              </div>
              <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                <a 
                  href={website.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center hover:text-foreground"
                >
                  {website.url}
                  <ExternalLink className="ml-1 h-3 w-3" />
                </a>
                <span>•</span>
                <span>Checks every {formatInterval(website.check_interval)}</span>
                <span>•</span>
                <span>Last checked: {formatLastChecked(website.last_checked)}</span>
                {website.response_time && (
                  <>
                    <span>•</span>
                    <span>Response time: {website.response_time}ms</span>
                  </>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => router.push(`/websites/${params.id}/settings`)}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </div>
        </div>
      </div>

      {/* Uptime Stats */}
      {uptimeData && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{uptimeData.percentage}%</div>
              <p className="text-xs text-muted-foreground">Last 24 hours</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{uptimeData.avgResponseTime}ms</div>
              <p className="text-xs text-muted-foreground">Average</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <Badge variant={website.status === "up" ? "success" : "destructive"}>
                  {website.status === "up" ? "Online" : "Offline"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">Current status</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Uptime Graph */}
      {uptimeData && (
        <Card>
          <CardHeader>
            <CardTitle>Uptime History</CardTitle>
          </CardHeader>
          <CardContent>
            <WebsiteUptimeGraph data={uptimeData.history} />
          </CardContent>
        </Card>
      )}
    </div>
  );
} 