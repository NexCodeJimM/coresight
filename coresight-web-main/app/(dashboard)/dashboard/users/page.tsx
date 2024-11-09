import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { UsersList } from "@/components/dashboard/users-list";
import { CreateUserButton } from "@/components/dashboard/create-user-button";
import { UsersListSkeleton } from "@/components/dashboard/users-list-skeleton";

export default async function UsersPage() {
  const session = await getServerSession();

  if (!session?.user?.isAdmin) {
    redirect("/dashboard");
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading="User Management"
        description="Manage user accounts and permissions."
      >
        <CreateUserButton />
      </DashboardHeader>
      <div className="grid gap-6">
        <Suspense fallback={<UsersListSkeleton />}>
          <UsersList />
        </Suspense>
      </div>
    </DashboardShell>
  );
}
