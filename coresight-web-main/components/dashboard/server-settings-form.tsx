"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ServerSettingsFormProps {
  server: {
    id: string;
    name: string;
    ip_address: string;
    status: "active" | "inactive" | "maintenance";
  };
}

export function ServerSettingsForm({ server }: ServerSettingsFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const data = {
      name: formData.get("name"),
      ip_address: formData.get("ip_address"),
      status: formData.get("status"),
    };

    try {
      const response = await fetch(`/api/servers/${server.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Failed to update server");

      toast({
        title: "Success",
        description: "Server settings updated successfully.",
      });

      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update server settings.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function onDelete() {
    setLoading(true);
    try {
      const response = await fetch(`/api/servers/${server.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete server");

      toast({
        title: "Success",
        description: "Server deleted successfully.",
      });

      router.push("/dashboard/servers");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete server.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
    }
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Server Settings</CardTitle>
          <CardDescription>
            Update your server's configuration and settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid gap-2">
              <label htmlFor="name">Server Name</label>
              <Input
                id="name"
                name="name"
                defaultValue={server.name}
                required
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="ip_address">IP Address</label>
              <Input
                id="ip_address"
                name="ip_address"
                defaultValue={server.ip_address}
                required
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="status">Status</label>
              <Select name="status" defaultValue={server.status}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-between">
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
              <Dialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button variant="destructive" type="button">
                    Delete Server
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete Server</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete this server? This action
                      cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setDeleteDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={onDelete}
                      disabled={loading}
                    >
                      {loading ? "Deleting..." : "Delete"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
