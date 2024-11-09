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
import { useToast } from "@/hooks/use-toast";

export function NewServerForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const data = {
      name: formData.get("name"),
      ip_address: formData.get("ip_address"),
      hostname: formData.get("hostname"),
    };

    try {
      const response = await fetch("/api/servers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Failed to create server");

      toast({
        title: "Success",
        description: "Server created successfully.",
      });

      router.push("/dashboard/servers");
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create server.",
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
            <label htmlFor="ip_address">IP Address</label>
            <Input
              id="ip_address"
              name="ip_address"
              placeholder="e.g., 192.168.1.100"
              required
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
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Server"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
