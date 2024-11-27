"use client";

import * as React from "react";
import { UserNav } from "@/components/layout/UserNav";
import Link from "next/link";
import { Bell, Moon, Sun } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface Alert {
  id: string;
  severity: "critical" | "warning" | "info";
  message: string;
  server_name: string;
  created_at: string;
}

interface Notification {
  id: string;
  type: string;
  message: string;
  data: any;
  is_read: boolean;
  created_at: string;
}

export function Navbar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const [alertsRes, notificationsRes] = await Promise.all([
          fetch("/api/alerts/recent"),
          fetch("/api/notifications")
        ]);

        if (!alertsRes.ok || !notificationsRes.ok) 
          throw new Error("Failed to fetch notifications");

        const alertsData = await alertsRes.json();
        const notificationsData = await notificationsRes.json();

        if (alertsData.success) {
          setAlerts(alertsData.alerts);
        }

        if (notificationsData.success) {
          // Combine alerts and notifications for display
          const allNotifications = [
            ...alertsData.alerts,
            ...notificationsData.notifications
          ].sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );

          // Update unread count
          setUnreadCount(
            allNotifications.filter((item) => {
              const notifTime = new Date(item.created_at);
              const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
              return notifTime > hourAgo && !item.is_read;
            }).length
          );
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);

    return () => clearInterval(interval);
  }, []);

  const getTimeAgo = (timestamp: string) => {
    const seconds = Math.floor(
      (new Date().getTime() - new Date(timestamp).getTime()) / 1000
    );

    if (seconds < 60) return `${seconds} seconds ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days !== 1 ? "s" : ""} ago`;
  };

  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === path;
    }
    return pathname?.startsWith(path);
  };

  const handleMarkAllRead = async () => {
    try {
      const response = await fetch("/api/notifications", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        }
      });

      if (response.ok) {
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  };

  return (
    <div className="border-b">
      <div className="flex h-16 items-center px-4">
        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard"
            className={cn(
              "font-bold text-xl transition-colors",
              isActive("/") && "text-primary"
            )}
          >
            CORESIGHT
          </Link>
          <nav className="flex items-center space-x-4">
            <Link
              href="/dashboard"
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                isActive("/dashboard")
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              Dashboard
            </Link>
            <Link
              href="/servers"
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                isActive("/servers") ? "text-primary" : "text-muted-foreground"
              )}
            >
              Servers
            </Link>
            <Link
              href="/websites"
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                isActive("/websites") ? "text-primary" : "text-muted-foreground"
              )}
            >
              Websites
            </Link>
            <Link
              href="/users"
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                isActive("/users") ? "text-primary" : "text-muted-foreground"
              )}
            >
              Users
            </Link>
          </nav>
        </div>
        <div className="ml-auto flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="relative"
          >
            {mounted && (
              <>
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </>
            )}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="flex items-center justify-between py-2 px-4 border-b">
                <span className="font-semibold">Notifications</span>
                {alerts.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMarkAllRead}
                  >
                    Mark all as read
                  </Button>
                )}
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {alerts.length > 0 ? (
                  alerts.map((alert) => (
                    <DropdownMenuItem
                      key={alert.id}
                      className="flex flex-col items-start p-4"
                    >
                      <div className="flex items-center gap-2 w-full">
                        <Badge
                          variant={
                            alert.severity === "critical"
                              ? "destructive"
                              : alert.severity === "warning"
                              ? "warning"
                              : "default"
                          }
                        >
                          {alert.severity}
                        </Badge>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {getTimeAgo(alert.created_at)}
                        </span>
                      </div>
                      <p className="text-sm mt-1">{alert.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {alert.server_name}
                      </p>
                    </DropdownMenuItem>
                  ))
                ) : (
                  <div className="py-4 px-4 text-center text-sm text-muted-foreground">
                    No new notifications
                  </div>
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          <UserNav />
        </div>
      </div>
    </div>
  );
}
