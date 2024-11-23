"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ServerSettings {
  id: string;
  name: string;
  ip_address: string;
  hostname: string;
  description: string | null;
  port: string;
  org: string | null;
  bucket: string | null;
  token: string | null;
  status: string;
}

export default function ServerSettingsPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<ServerSettings | null>(null);
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    const fetchServerSettings = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/servers/${params.id}`);
        const data = await response.json();

        if (response.ok && data.success) {
          // Pre-fill the form with server data
          setSettings({
            id: data.server.id,
            name: data.server.name || "",
            ip_address: data.server.ip_address || "",
            hostname: data.server.hostname || "",
            description: data.server.description || "",
            port: data.server.port || "3000",
            org: data.server.org || "",
            bucket: data.server.bucket || "",
            token: data.server.token || "",
            status: data.server.status || "active",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: data.error || "Failed to load server settings",
          });
        }
      } catch (error) {
        console.error("Error fetching server settings:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Error loading server settings",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchServerSettings();
  }, [params.id, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/servers/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: settings.name,
          description: settings.description,
          hostname: settings.hostname,
          ip_address: settings.ip_address,
          port: settings.port,
          org: settings.org,
          bucket: settings.bucket,
          token: settings.token,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: "Success",
          description: "Server settings updated successfully",
        });
        router.push("/servers");
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: data.error || "Failed to update server settings",
        });
      }
    } catch (error) {
      console.error("Error updating server settings:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error updating server settings",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setShowDeleteDialog(false);

      const response = await fetch(`/api/servers/${params.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: "Server deleted successfully",
        });
        router.push("/servers");
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: data.error || "Failed to delete server",
        });
      }
    } catch (error) {
      console.error("Error deleting server:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete server",
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        {/* Back Button Skeleton */}
        <Skeleton className="h-9 w-32" />

        {/* Header Skeleton */}
        <div className="space-y-1">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-5 w-96" />
        </div>

        {/* Delete Button Skeleton */}
        <div className="flex justify-end">
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Basic Information Card Skeleton */}
        <div className="space-y-6">
          <div className="rounded-lg border bg-card">
            <div className="p-6">
              <Skeleton className="h-7 w-48 mb-6" />
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-24 w-full" />
                </div>
              </div>
            </div>
          </div>

          {/* InfluxDB Settings Card Skeleton */}
          <div className="rounded-lg border bg-card">
            <div className="p-6">
              <Skeleton className="h-7 w-48 mb-6" />
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons Skeleton */}
          <div className="flex justify-end space-x-4">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      </div>
    );
  }

  if (!settings) {
    return <div>Server not found</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push(`/servers/${params.id}`)}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Server Details
      </Button>

      <div className="space-y-1">
        <h1 className="text-3xl font-bold">Server Settings</h1>
        <p className="text-muted-foreground">
          Manage your server configuration and settings
        </p>
      </div>

      <div className="flex justify-end">
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">Delete Server</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                server and all associated data including metrics, processes, and
                alerts.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete Server
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Server Name
                </label>
                <Input
                  id="name"
                  value={settings.name}
                  onChange={(e) =>
                    setSettings({ ...settings, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="ip_address" className="text-sm font-medium">
                  IP Address
                </label>
                <Input
                  id="ip_address"
                  value={settings.ip_address}
                  onChange={(e) =>
                    setSettings({ ...settings, ip_address: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="hostname" className="text-sm font-medium">
                  Hostname
                </label>
                <Input
                  id="hostname"
                  value={settings.hostname}
                  onChange={(e) =>
                    setSettings({ ...settings, hostname: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="port" className="text-sm font-medium">
                  Port
                </label>
                <Input
                  id="port"
                  value={settings.port}
                  onChange={(e) =>
                    setSettings({ ...settings, port: e.target.value })
                  }
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description
              </label>
              <Textarea
                id="description"
                value={settings.description || ""}
                onChange={(e) =>
                  setSettings({ ...settings, description: e.target.value })
                }
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>InfluxDB Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="org" className="text-sm font-medium">
                  Organization
                </label>
                <Input
                  id="org"
                  value={settings.org || ""}
                  onChange={(e) =>
                    setSettings({ ...settings, org: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="bucket" className="text-sm font-medium">
                  Bucket
                </label>
                <Input
                  id="bucket"
                  value={settings.bucket || ""}
                  onChange={(e) =>
                    setSettings({ ...settings, bucket: e.target.value })
                  }
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="token" className="text-sm font-medium">
                Token
              </label>
              <Input
                id="token"
                type="password"
                value={settings.token || ""}
                onChange={(e) =>
                  setSettings({ ...settings, token: e.target.value })
                }
                required
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
