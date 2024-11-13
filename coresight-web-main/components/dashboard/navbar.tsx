"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Bell } from "lucide-react";
import { useNotifications } from "@/components/notifications/notification-provider";

const routes = [
  {
    label: "Dashboard",
    href: "/dashboard",
    color: "text-sky-500",
  },
  {
    label: "Servers",
    href: "/dashboard/servers",
    color: "text-violet-500",
  },
  {
    label: "Alerts",
    href: "/dashboard/alerts",
    color: "text-pink-700",
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    color: "text-gray-500",
  },
  {
    label: "Users",
    href: "/dashboard/users",
    color: "text-orange-700",
    adminOnly: true,
  },
];

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { notifications } = useNotifications();

  return (
    <header className="border-b">
      <div className="flex h-16 items-center px-4">
        {/* Navigation Links */}
        <nav className="flex-1 flex items-center space-x-4">
          {routes.map((route) => {
            if (route.adminOnly && !session?.user?.isAdmin) return null;

            return (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  pathname === route.href
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                )}
              >
                {route.label}
              </Link>
            );
          })}
        </nav>

        {/* Notifications Bell */}
        <div className="relative mr-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  No new notifications
                </div>
              ) : (
                notifications.map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className="p-4 border-b last:border-0"
                  >
                    <div>
                      <div className="font-medium">{notification.title}</div>
                      <div className="text-sm text-gray-500">
                        {notification.message}
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* User Menu */}
        <div className="ml-auto flex items-center space-x-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {session?.user?.username?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => signOut()}
              >
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
