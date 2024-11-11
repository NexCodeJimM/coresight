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
