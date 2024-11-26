"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { MoreVertical, PlusCircle } from "lucide-react";
import { WebsiteList } from "@/components/websites/WebsiteList";
import { AddWebsiteDialog } from "@/components/websites/AddWebsiteDialog";
import { CategoryDialog } from "@/components/websites/CategoryDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function WebsitesPage() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleWebsiteAdded = () => {
    setShowAddDialog(false);
    setRefreshKey(prev => prev + 1); // Trigger refresh
  };

  const handleCategoryChange = () => {
    setShowCategoryDialog(false);
    setRefreshKey(prev => prev + 1); // Trigger refresh
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Websites</h1>
          <p className="text-muted-foreground">
            Monitor your websites uptime and performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowAddDialog(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Website
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowCategoryDialog(true)}>
                Manage Categories
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <WebsiteList key={refreshKey} />
      
      <AddWebsiteDialog 
        open={showAddDialog} 
        onOpenChange={setShowAddDialog}
        onSuccess={handleWebsiteAdded}
      />

      <CategoryDialog
        open={showCategoryDialog}
        onOpenChange={setShowCategoryDialog}
        onCategoriesChange={handleCategoryChange}
      />
    </div>
  );
} 