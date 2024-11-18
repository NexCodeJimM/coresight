import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { ServerStatusList } from "@/components/dashboard/ServerStatusList";
import { RecentAlerts } from "@/components/dashboard/RecentAlerts";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <DashboardHeader session={session} />
      <DashboardStats />
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-7">
        <ServerStatusList className="col-span-4" />
        <RecentAlerts className="col-span-3" />
      </div>
    </div>
  );
}
