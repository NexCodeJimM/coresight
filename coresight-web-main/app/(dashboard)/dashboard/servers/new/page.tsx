import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { NewServerForm } from "@/components/dashboard/new-server-form";

export default function NewServerPage() {
  return (
    <DashboardShell>
      <DashboardHeader
        heading="Add New Server"
        description="Add a new server to monitor."
      />
      <div className="grid gap-6">
        <NewServerForm />
      </div>
    </DashboardShell>
  );
}
