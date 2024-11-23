"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlusCircle, Edit2, UserCog } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AddUserDialog } from "@/components/users/AddUserDialog";
import { Card, CardContent } from "@/components/ui/card";

interface User {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  role: "admin" | "staff";
  profile_picture: string | null;
  last_login: string | null;
  is_admin: boolean;
}

function UserCardSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(5)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="grid grid-cols-[2fr,1fr,1fr,100px] items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse" />
                <div className="space-y-1">
                  <div className="h-4 w-[200px] bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 w-[150px] bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
              <div className="flex justify-center">
                <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="flex justify-end gap-2">
                <div className="h-8 w-8 rounded bg-gray-200 animate-pulse" />
                <div className="h-8 w-8 rounded bg-gray-200 animate-pulse" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function UsersPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users");
      if (!response.ok) throw new Error("Failed to fetch users");

      const data = await response.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async () => {
    setShowAddDialog(false);
    await fetchUsers();
  };

  const formatDate = (date: string | null) => {
    if (!date) {
      return "Never";
    }

    try {
      const now = new Date();
      const loginDate = new Date(date);

      // Check if the date is invalid
      if (isNaN(loginDate.getTime())) {
        return "Never";
      }

      // Check if date is in the future (invalid)
      if (loginDate > now) {
        return "Never";
      }

      // Convert both dates to UTC to avoid timezone issues
      const diffInSeconds = Math.floor(
        (now.getTime() - loginDate.getTime()) / 1000
      );

      // More precise time display with proper bounds checking
      if (diffInSeconds < 0) return "Never"; // Handle future dates
      if (diffInSeconds < 5) return "Just now";
      if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
      if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
      }
      if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
      }
      if (diffInSeconds < 604800) {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days} ${days === 1 ? "day" : "days"} ago`;
      }

      // For older dates, show the full date in user's local timezone
      return new Intl.DateTimeFormat(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone, // Use local timezone
      }).format(loginDate);
    } catch (error) {
      console.error("Error formatting date:", error, "for date value:", date);
      return "Never";
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="h-8 w-32 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="h-9 w-28 bg-gray-200 rounded animate-pulse" />
        </div>
        <UserCardSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Users</h2>
          <p className="text-muted-foreground">
            {session?.user.is_admin
              ? "Manage user access and permissions"
              : "View team members"}
          </p>
        </div>
        {session?.user.is_admin && (
          <>
            <Button onClick={() => setShowAddDialog(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add User
            </Button>
            <AddUserDialog
              open={showAddDialog}
              onOpenChange={setShowAddDialog}
              onSuccess={handleAddUser}
            />
          </>
        )}
      </div>

      <div className="space-y-2">
        {users.map((user) => (
          <Card key={user.id} className="hover:bg-accent/5 transition-colors">
            <CardContent className="p-4">
              <div className="grid grid-cols-[2fr,1fr,1fr,100px] items-center gap-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.profile_picture || ""} />
                    <AvatarFallback>
                      {`${user.first_name[0]}${user.last_name[0]}`}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">
                      {user.first_name} {user.last_name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {user.email}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center">
                  <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                    Role
                  </div>
                  <Badge
                    variant={user.role === "admin" ? "default" : "secondary"}
                    className="w-fit"
                  >
                    {user.role === "admin" ? "Admin" : "Staff"}
                  </Badge>
                </div>

                <div className="flex flex-col">
                  <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                    Last Login
                  </div>
                  <span className="text-sm">{formatDate(user.last_login)}</span>
                </div>

                <div className="flex flex-col items-end">
                  <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                    Actions
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => router.push(`/users/${user.id}`)}
                    >
                      <UserCog className="h-4 w-4" />
                      <span className="sr-only">View user</span>
                    </Button>
                    {session?.user.is_admin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => router.push(`/users/${user.id}/edit`)}
                      >
                        <Edit2 className="h-4 w-4" />
                        <span className="sr-only">Edit user</span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
