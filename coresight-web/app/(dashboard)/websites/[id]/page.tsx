"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings, ArrowLeft, ExternalLink } from "lucide-react";
import { WebsiteUptimeGraph } from "@/components/websites/WebsiteUptimeGraph";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

interface TimeRange {
  label: string;
  value: string;
  hours: number;
}

const timeRanges: TimeRange[] = [
  { label: "Last 24 Hours", value: "daily", hours: 24 },
  { label: "Last 7 Days", value: "weekly", hours: 168 },
  { label: "Last 30 Days", value: "monthly", hours: 720 },
  { label: "Last Year", value: "yearly", hours: 8760 },
];

export default function WebsitePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [website, setWebsite] = useState<Website | null>(null);
  const [uptimeData, setUptimeData] = useState<UptimeData | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>(timeRanges[0]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [websiteRes, uptimeRes] = await Promise.all([
          fetch(`/api/websites/${params.id}`),
          fetch(`/api/websites/${params.id}/uptime?hours=${selectedTimeRange.hours}`)
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
        setInitialLoading(false);
      }
    };

    fetchData();

    // Set up polling for updates without showing loading state
    const interval = setInterval(async () => {
      try {
        const [websiteRes, uptimeRes] = await Promise.all([
          fetch(`/api/websites/${params.id}`),
          fetch(`/api/websites/${params.id}/uptime?hours=${selectedTimeRange.hours}`)
        ]);

        if (websiteRes.ok) {
          const websiteData = await websiteRes.json();
          if (websiteData.success) {
            setWebsite(websiteData.website);
          }
        }

        if (uptimeRes.ok) {
          const uptimeData = await uptimeRes.json();
          if (uptimeData.success) {
            setUptimeData(uptimeData.uptime);
          }
        }
      } catch (error) {
        console.error("Error updating data:", error);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [params.id, selectedTimeRange]);

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

  if (initialLoading) {
    return (
      <div className="space-y-8 p-8">
        <Button variant="ghost" size="sm" disabled>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Websites
        </Button>

        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-24 w-full" />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-4 w-24 mt-1" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-7 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[400px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/websites')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Websites
        </Button>
        <div className="mt-8 text-center text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (!website) return null;

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
              <p className="text-xs text-muted-foreground">
                Last {selectedTimeRange.label.toLowerCase()}
              </p>
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

    {/* Time Range Selector */}
    <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Select Range</h2>
        <Select
          value={selectedTimeRange.value}
          onValueChange={(value) => {
            const range = timeRanges.find(r => r.value === value);
            if (range) setSelectedTimeRange(range);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            {timeRanges.map((range) => (
              <SelectItem key={range.value} value={range.value}>
                {range.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

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