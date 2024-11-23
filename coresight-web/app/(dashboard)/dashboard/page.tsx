import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { RecentAlerts } from "@/components/dashboard/RecentAlerts";
import { ServerStatusList } from "@/components/dashboard/ServerStatusList";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  return (
    <div className="flex flex-col gap-8">
      <DashboardHeader session={session} />
      <DashboardStats />
      <div className="grid gap-4 md:grid-cols-7">
        <ServerStatusList className="md:col-span-4" />
        <RecentAlerts className="md:col-span-3" />
      </div>
    </div>
  );
}

export const metadata = {
  title: "Dashboard",
};
