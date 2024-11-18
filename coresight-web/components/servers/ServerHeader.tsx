"use client";

import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Session } from "next-auth";
import { AddServerDialog } from "./AddServerDialog";
import { useState } from "react";

interface ServerHeaderProps {
  session: Session | null;
}

export function ServerHeader({ session }: ServerHeaderProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);

  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Servers</h2>
        <p className="text-muted-foreground">
          Manage and monitor your server infrastructure
        </p>
      </div>
      {session?.user.role === "admin" && (
        <>
          <Button onClick={() => setShowAddDialog(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Server
          </Button>
          <AddServerDialog
            open={showAddDialog}
            onOpenChange={setShowAddDialog}
          />
        </>
      )}
    </div>
  );
}
