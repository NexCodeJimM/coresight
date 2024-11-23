"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { WebsiteList } from "@/components/websites/WebsiteList";
import { AddWebsiteDialog } from "@/components/websites/AddWebsiteDialog";

export default function WebsitesPage() {
  const [showAddDialog, setShowAddDialog] = useState(false);

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Websites</h1>
          <p className="text-muted-foreground">
            Monitor your websites uptime and performance
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Website
        </Button>
      </div>

      <WebsiteList />
      
      <AddWebsiteDialog 
        open={showAddDialog} 
        onOpenChange={setShowAddDialog} 
      />
    </div>
  );
} 