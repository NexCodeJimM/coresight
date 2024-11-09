"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Server, Bell, Settings, Users } from "lucide-react";

const routes = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
    color: "text-sky-500",
  },
  {
    label: "Servers",
    icon: Server,
    href: "/dashboard/servers",
    color: "text-violet-500",
  },
  {
    label: "Alerts",
    icon: Bell,
    href: "/dashboard/alerts",
    color: "text-pink-700",
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/dashboard/settings",
    color: "text-gray-500",
  },
  {
    label: "Users",
    icon: Users,
    href: "/dashboard/users",
    color: "text-orange-700",
    adminOnly: true,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <div className="space-y-4 py-4 flex flex-col h-full bg-gray-100 dark:bg-gray-900 text-white">
      <div className="px-3 py-2 flex-1">
        <div className="space-y-1">
          {routes.map((route) => {
            if (route.adminOnly && !session?.user?.isAdmin) return null;

            return (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-gray-700/50 rounded-lg transition",
                  pathname === route.href
                    ? "text-white bg-gray-700/50"
                    : "text-gray-400"
                )}
              >
                <div className="flex items-center flex-1">
                  <route.icon className={cn("h-5 w-5 mr-3", route.color)} />
                  {route.label}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
