"use client";

import { useState, useEffect } from "react";
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
import { useToast } from "@/hooks/use-toast";

export function NewServerForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [influxDefaults, setInfluxDefaults] = useState({
    org: "",
    bucket: "",
    token: "",
  });

  useEffect(() => {
    async function fetchDefaults() {
      try {
        const response = await fetch("/api/influxdb/defaults");
        if (response.ok) {
          const data = await response.json();
          setInfluxDefaults(data);
        }
      } catch (error) {
        console.error("Error fetching InfluxDB defaults:", error);
      }
    }
    fetchDefaults();
  }, []);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://165.22.237.60:3000";

    const formValues = {
      name: formData.get("name")?.toString().trim() || "",
      description: formData.get("description")?.toString().trim() || "",
      hostname: formData.get("hostname")?.toString().trim() || "",
      ip_address: formData.get("ip_address")?.toString().trim() || "",
      port: parseInt(formData.get("port")?.toString() || "3000"),
      org: formData.get("org")?.toString().trim() || influxDefaults.org,
      bucket:
        formData.get("bucket")?.toString().trim() || influxDefaults.bucket,
      token: formData.get("token")?.toString().trim() || influxDefaults.token,
    };

    console.log("Sending form values:", {
      ...formValues,
      token: formValues.token ? "***" : "not set",
    });

    try {
      const response = await fetch(`${apiUrl}/api/servers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formValues),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create server");
      }

      const result = await response.json();
      console.log("Server response:", result);

      toast({
        title: "Success",
        description: "Server created successfully.",
      });

      router.push("/dashboard/servers");
      router.refresh();
    } catch (error) {
      console.error("Error creating server:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to create server.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Server Details</CardTitle>
        <CardDescription>
          Enter the details of the server you want to monitor.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-2">
            <label htmlFor="name">Server Name</label>
            <Input
              id="name"
              name="name"
              placeholder="e.g., Production DB Server"
              required
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="description">Description</label>
            <Input
              id="description"
              name="description"
              placeholder="e.g., Main production database server"
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="hostname">Hostname</label>
            <Input
              id="hostname"
              name="hostname"
              placeholder="e.g., intel-test-server-ca"
              required
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="ip_address">IP Address</label>
            <Input
              id="ip_address"
              name="ip_address"
              placeholder="e.g., 192.168.1.100"
              required
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="port">Port</label>
            <Input
              id="port"
              name="port"
              type="number"
              placeholder="8086"
              required
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="org">Organization</label>
            <Input
              id="org"
              name="org"
              placeholder="e.g., EFI"
              required
              defaultValue={influxDefaults.org}
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="bucket">Bucket</label>
            <Input
              id="bucket"
              name="bucket"
              placeholder="e.g., efi_servers"
              required
              defaultValue={influxDefaults.bucket}
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="token">Token</label>
            <Input
              id="token"
              name="token"
              type="password"
              placeholder="Your InfluxDB token"
              required
              defaultValue={influxDefaults.token}
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Server"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
