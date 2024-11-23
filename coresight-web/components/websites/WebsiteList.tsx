"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Settings, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";

interface Website {
  id: string;
  name: string;
  url: string;
  status: "up" | "down";
  last_checked: string | null;
  response_time: number | null;
  check_interval: number;
}

export function WebsiteList() {
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

  if (loading) {
    return (
      <div className="grid gap-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (websites.length === 0) {
    return (
      <Card className="p-8 text-center">
        <h3 className="text-lg font-semibold">No websites monitored</h3>
        <p className="text-muted-foreground mt-2">
          Add a website to start monitoring its uptime.
        </p>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {websites.map((website) => (
        <Card key={website.id} className="p-6">
          <div className="flex items-center justify-between">
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
              size="sm"
              onClick={() => router.push(`/websites/${website.id}`)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
} 