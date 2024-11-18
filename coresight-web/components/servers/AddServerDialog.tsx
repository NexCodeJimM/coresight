"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AddServerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddServerDialog({ open, onOpenChange }: AddServerDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const serverData = {
      name: formData.get("name"),
      ip_address: formData.get("ip_address"),
      hostname: formData.get("hostname"),
      description: formData.get("description"),
      port: formData.get("port") || "3000",
      org: formData.get("org"),
      bucket: formData.get("bucket"),
      token: formData.get("token"),
    };

    try {
      const response = await fetch("http://143.198.84.214:3000/api/servers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(serverData),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to add server");
      }

      toast({
        title: "Success",
        description: data.message || "Server has been added successfully.",
      });
      onOpenChange(false);
      router.refresh();
    } catch (error: any) {
      console.error("Error adding server:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to add server. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInfluxDefaults = async () => {
    try {
      const response = await fetch(
        "http://143.198.84.214:3000/api/influxdb/defaults"
      );
      if (response.ok) {
        const defaults = await response.json();
        const form = document.querySelector("form") as HTMLFormElement;
        if (form) {
          const orgInput = form.querySelector(
            '[name="org"]'
          ) as HTMLInputElement;
          const bucketInput = form.querySelector(
            '[name="bucket"]'
          ) as HTMLInputElement;
          if (orgInput) orgInput.value = defaults.org;
          if (bucketInput) bucketInput.value = defaults.bucket;
        }
      }
    } catch (error) {
      console.error("Error fetching InfluxDB defaults:", error);
    }
  };

  useEffect(() => {
    if (open) {
      fetchInfluxDefaults();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[430px] h-[90vh] max-h-[600px] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>Add New Server</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 px-6">
          <form onSubmit={handleSubmit} className="space-y-4 pb-6">
            <div className="grid w-full gap-1.5">
              <Label htmlFor="name">Server Name</Label>
              <Input required id="name" name="name" />
            </div>
            <div className="grid w-full gap-1.5">
              <Label htmlFor="ip_address">IP Address</Label>
              <Input required id="ip_address" name="ip_address" />
            </div>
            <div className="grid w-full gap-1.5">
              <Label htmlFor="hostname">Hostname</Label>
              <Input required id="hostname" name="hostname" />
            </div>
            <div className="grid w-full gap-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" />
            </div>
            <div className="grid w-full gap-1.5">
              <Label htmlFor="port">Port</Label>
              <Input id="port" name="port" defaultValue="3000" />
            </div>
            <div className="grid w-full gap-1.5">
              <Label htmlFor="org">InfluxDB Organization</Label>
              <Input required id="org" name="org" />
            </div>
            <div className="grid w-full gap-1.5">
              <Label htmlFor="bucket">InfluxDB Bucket</Label>
              <Input required id="bucket" name="bucket" />
            </div>
            <div className="grid w-full gap-1.5">
              <Label htmlFor="token">InfluxDB Token</Label>
              <Input required type="password" id="token" name="token" />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Adding..." : "Add Server"}
            </Button>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
