"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface WebsiteSettings {
  id: string;
  name: string;
  url: string;
  check_interval: number;
  status: "up" | "down";
  category_id: string | null;
}

interface Category {
  id: string;
  name: string;
}

export default function WebsiteSettingsPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<WebsiteSettings | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [websiteRes, categoriesRes] = await Promise.all([
          fetch(`/api/websites/${params.id}`),
          fetch('/api/website-categories')
        ]);

        if (!websiteRes.ok) throw new Error("Failed to load website settings");
        if (!categoriesRes.ok) throw new Error("Failed to load categories");

        const websiteData = await websiteRes.json();
        const categoriesData = await categoriesRes.json();

        if (websiteData.success) {
          setSettings(websiteData.website);
        }
        if (categoriesData.success) {
          setCategories(categoriesData.categories);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load settings",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/websites/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: settings.name,
          url: settings.url,
          checkInterval: settings.check_interval,
          category_id: settings.category_id,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: "Success",
          description: "Website settings updated successfully",
        });
        router.push(`/websites/${params.id}`);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: data.error || "Failed to update website settings",
        });
      }
    } catch (error) {
      console.error("Error updating website settings:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error updating website settings",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setShowDeleteDialog(false);

      const response = await fetch(`/api/websites/${params.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: "Website deleted successfully",
          variant: "success",
        });
        router.push("/websites");
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: data.error || "Failed to delete website",
        });
      }
    } catch (error) {
      console.error("Error deleting website:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete website",
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-9 w-32" />
        <div className="space-y-1">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="flex justify-end">
          <Skeleton className="h-10 w-32" />
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-7 w-48 mb-6" />
            <div className="space-y-4">
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
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!settings) {
    return <div>Website not found</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push(`/websites/${params.id}`)}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Website Details
      </Button>

      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">Website Settings</h1>
          <p className="text-muted-foreground">
            Manage your website monitoring configuration
          </p>
        </div>

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">Delete Website</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                website monitoring configuration and all associated data including
                uptime history and alerts.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete Website
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Website Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Website Name
              </label>
              <Input
                id="name"
                value={settings?.name}
                onChange={(e) =>
                  setSettings(prev => ({ ...prev!, name: e.target.value }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="url" className="text-sm font-medium">
                URL
              </label>
              <Input
                id="url"
                value={settings?.url}
                onChange={(e) =>
                  setSettings(prev => ({ ...prev!, url: e.target.value }))
                }
                placeholder="https://example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="category" className="text-sm font-medium">
                Category
              </label>
              <Select
                value={settings?.category_id || "uncategorized"}
                onValueChange={(value) =>
                  setSettings(prev => ({ 
                    ...prev!, 
                    category_id: value === "uncategorized" ? null : value 
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="uncategorized">Uncategorized</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="interval" className="text-sm font-medium">
                Check Interval
              </label>
              <Select
                value={settings?.check_interval.toString()}
                onValueChange={(value) =>
                  setSettings(prev => ({ ...prev!, check_interval: parseInt(value) }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select interval" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">Every 30 seconds</SelectItem>
                  <SelectItem value="60">Every minute</SelectItem>
                  <SelectItem value="300">Every 5 minutes</SelectItem>
                  <SelectItem value="600">Every 10 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-4 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/websites/${params.id}`)}
          >
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