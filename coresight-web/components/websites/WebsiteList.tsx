"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Website {
  id: string;
  name: string;
  url: string;
  status: "up" | "down";
  last_checked: string | null;
  response_time: number | null;
  category_id: string | null;
  category_name: string | null;
}

interface Category {
  id: string;
  name: string;
}

export function WebsiteList() {
  const router = useRouter();
  const [websites, setWebsites] = useState<Website[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [websitesRes, categoriesRes] = await Promise.all([
          fetch("/api/websites"),
          fetch("/api/website-categories")
        ]);

        if (!websitesRes.ok) throw new Error("Failed to fetch websites");
        if (!categoriesRes.ok) throw new Error("Failed to fetch categories");
        
        const websitesData = await websitesRes.json();
        const categoriesData = await categoriesRes.json();

        if (websitesData.success) {
          setWebsites(websitesData.websites);
        }
        if (categoriesData.success) {
          setCategories(categoriesData.categories);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchData, 30000);

    return () => clearInterval(interval);
  }, []);

  const formatLastChecked = (date: string | null) => {
    if (!date) return "Never";
    return new Date(date).toLocaleString("en-US", {
      timeZone: "Asia/Manila",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="w-[200px] h-10 bg-gray-200 rounded animate-pulse" />
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-6">
            <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-4" />
            <div className="space-y-4">
              {[...Array(2)].map((_, j) => (
                <div
                  key={j}
                  className="flex items-center justify-between p-4 border rounded-lg animate-pulse"
                >
                  <div className="space-y-2">
                    <div className="h-4 w-32 bg-gray-200 rounded" />
                    <div className="h-3 w-48 bg-gray-200 rounded" />
                  </div>
                  <div className="h-6 w-16 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    );
  }

  // Filter websites based on selected category
  const filteredWebsites = selectedCategory === "all" 
    ? websites 
    : selectedCategory === "uncategorized"
    ? websites.filter(website => !website.category_id)
    : websites.filter(website => website.category_id === selectedCategory);

  // Group websites by category
  const websitesByCategory = filteredWebsites.reduce((acc, website) => {
    const categoryId = website.category_id || 'uncategorized';
    if (!acc[categoryId]) {
      acc[categoryId] = [];
    }
    acc[categoryId].push(website);
    return acc;
  }, {} as Record<string, Website[]>);

  if (websites.length === 0) {
    return (
      <Card className="p-8 text-center">
        <h3 className="text-lg font-semibold">No websites monitored</h3>
        <p className="text-muted-foreground mt-2">
          Add a website to start monitoring its uptime.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Category Filter */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Filter by category:</span>
        <Select
          value={selectedCategory}
          onValueChange={setSelectedCategory}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="uncategorized">Uncategorized</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Websites List */}
      <Accordion type="multiple" className="space-y-4">
        {categories.map((category) => {
          const categoryWebsites = websitesByCategory[category.id] || [];
          if (categoryWebsites.length === 0) return null;

          return (
            <AccordionItem key={category.id} value={category.id}>
              <AccordionTrigger className="text-lg font-semibold">
                {category.name} ({categoryWebsites.length})
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-4">
                  {categoryWebsites.map((website) => (
                    <div
                      key={website.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/websites/${website.id}`)}
                    >
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold">{website.name}</h3>
                          <Badge variant={website.status === "up" ? "success" : "destructive"}>
                            {website.status === "up" ? "Online" : "Offline"}
                          </Badge>
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                          <a 
                            href={website.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center hover:text-foreground"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {website.url}
                            <ExternalLink className="ml-1 h-3 w-3" />
                          </a>
                          <span>•</span>
                          <span>Last checked: {formatLastChecked(website.last_checked)}</span>
                          {website.response_time && (
                            <>
                              <span>•</span>
                              <span>{website.response_time}ms</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}

        {/* Uncategorized websites */}
        {websitesByCategory['uncategorized']?.length > 0 && (
          <AccordionItem value="uncategorized">
            <AccordionTrigger className="text-lg font-semibold">
              Uncategorized ({websitesByCategory['uncategorized'].length})
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-4">
                {websitesByCategory['uncategorized'].map((website) => (
                  <div
                    key={website.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/websites/${website.id}`)}
                  >
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold">{website.name}</h3>
                        <Badge variant={website.status === "up" ? "success" : "destructive"}>
                          {website.status === "up" ? "Online" : "Offline"}
                        </Badge>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                        <a 
                          href={website.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center hover:text-foreground"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {website.url}
                          <ExternalLink className="ml-1 h-3 w-3" />
                        </a>
                        <span>•</span>
                        <span>Last checked: {formatLastChecked(website.last_checked)}</span>
                        {website.response_time && (
                          <>
                            <span>•</span>
                            <span>{website.response_time}ms</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </div>
  );
} 