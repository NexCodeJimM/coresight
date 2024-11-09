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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Trash2 } from "lucide-react";

interface ServerDangerZoneProps {
  server: {
    id: string;
    name: string;
  };
}

export function ServerDangerZone({ server }: ServerDangerZoneProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

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
    <Card className="border-destructive">
      <CardHeader>
        <CardTitle className="text-destructive">Danger Zone</CardTitle>
        <CardDescription>
          Actions in this section can lead to irreversible changes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Server
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Server</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete {server.name}? This action
                cannot be undone and will remove all associated data including
                metrics and alerts.
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
                {loading ? "Deleting..." : "Delete Server"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
