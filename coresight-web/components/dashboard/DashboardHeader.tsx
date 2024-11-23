"use client";

import { Session } from "next-auth";

interface DashboardHeaderProps {
  session: Session | null;
}

export function DashboardHeader({ session }: DashboardHeaderProps) {
  return (
    <div className="flex flex-col space-y-2">
      <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      <p className="text-muted-foreground">
        Monitor and manage your server infrastructure from a single view.
      </p>
    </div>
  );
}
