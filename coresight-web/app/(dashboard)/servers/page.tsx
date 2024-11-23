import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ServerList } from "@/components/servers/ServerList";
import { ServerHeader } from "@/components/servers/ServerHeader";

export default async function ServersPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <ServerHeader session={session} />
      <ServerList />
    </div>
  );
}

export const metadata = {
  title: "Servers",
};
