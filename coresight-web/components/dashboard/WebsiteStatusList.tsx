"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { ExternalLink } from "lucide-react";

interface Website {
  id: string;
  name: string;
  url: string;
  status: "up" | "down";
  last_checked: string | null;
  response_time: number | null;
}

export function WebsiteStatusList() {
  const router = useRouter();
  const [websites, setWebsites] = useState<Website[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWebsites = async () => {
      try {
        const response = await fetch("/api/websites");
        if (!response.ok) throw new Error("Failed to fetch websites");

        const data = await response.json();
        if (data.success) {
          setWebsites(data.websites);
        }
      } catch (error) {
        console.error("Error fetching websites:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWebsites();
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchWebsites, 30000);

    return () => clearInterval(interval);
  }, []);

  const formatLastChecked = (date: string | null) => {
    if (!date) return "Never";
    return new Date(date).toLocaleString("en-US", {
      timeZone: "Asia/Manila",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Website Status</CardTitle>
          <Skeleton className="h-9 w-24" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 border rounded-lg animate-pulse"
              >
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-gray-200 rounded" />
                  <div className="h-3 w-48 bg-gray-200 rounded" />
                </div>
                <div className="h-6 w-16 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (websites.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Website Status</CardTitle>
          <Button variant="outline" onClick={() => router.push('/websites')}>
            View Websites
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center">
            No websites monitored yet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Website Status</CardTitle>
        <Button variant="outline" onClick={() => router.push('/websites')}>
          View Websites
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {websites.slice(0, 3).map((website) => (
            <div
              key={website.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
              onClick={() => router.push(`/websites/${website.id}`)}
            >
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold">{website.name}</h3>
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
                    onClick={(e) => e.stopPropagation()}
                  >
                    {website.url}
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                  <span>•</span>
                  <span>Last checked: {formatLastChecked(website.last_checked)}</span>
                  {website.response_time && (
                    <>
                      <span>•</span>
                      <span>{website.response_time}ms</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
          {websites.length > 3 && (
            <p className="text-sm text-center text-muted-foreground">
              +{websites.length - 3} more websites
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 