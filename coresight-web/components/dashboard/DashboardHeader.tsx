"use client";

import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Session } from "next-auth";

interface DashboardHeaderProps {
  session: Session | null;
}

export function DashboardHeader({ session }: DashboardHeaderProps) {
  return (
    <div className="flex items-center justify-between space-y-2">
      <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      <div className="flex items-center space-x-2">
        {session?.user.role === "admin" && (
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Server
          </Button>
        )}
      </div>
    </div>
  );
}
