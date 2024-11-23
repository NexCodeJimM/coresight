"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Edit2, Mail, User, Calendar, Clock, Shield, ArrowLeft } from "lucide-react";
import { Separator } from "@/components/ui/separator";

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
  created_at: string;
}

export default function UserProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`/api/users/${params.id}`);
        if (!response.ok) throw new Error("Failed to fetch user");

        const data = await response.json();
        if (data.success) {
          setUser(data.user);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [params.id]);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="h-24 w-24 rounded-full bg-gray-200 animate-pulse" />
              <div className="space-y-2">
                <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) return null;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Manila",
    });
  };

  return (
    <div className="p-6 space-y-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push('/users')}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Users
      </Button>

      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">User Profile</h2>
        {session?.user.is_admin && (
          <Button
            onClick={() => router.push(`/users/${params.id}/edit`)}
            variant="outline"
          >
            <Edit2 className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        {/* Profile Overview */}
        <Card className="md:col-span-4">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src={user?.profile_picture || ""} />
                <AvatarFallback className="text-xl">
                  {user ? `${user.first_name[0]}${user.last_name[0]}` : ""}
                </AvatarFallback>
              </Avatar>
              <h3 className="text-2xl font-semibold">
                {user?.first_name} {user?.last_name}
              </h3>
              <p className="text-muted-foreground mt-1">{user?.email}</p>
              <Badge
                variant={user?.role === "admin" ? "default" : "secondary"}
                className="mt-4"
              >
                {user?.role === "admin" ? "Admin" : "Staff"}
              </Badge>

              <Separator className="my-6" />

              <div className="w-full space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm text-muted-foreground">Username</p>
                    <p className="font-medium">{user?.username}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                    <Mail className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{user?.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                    <Shield className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm text-muted-foreground">
                      Account Type
                    </p>
                    <p className="font-medium">
                      {user?.is_admin ? "Administrator" : "Regular User"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Activity */}
        <div className="md:col-span-8 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="flex items-center gap-4 p-4 rounded-lg border bg-card">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                      <Calendar className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Account Created
                      </p>
                      <p className="font-medium">
                        {user ? formatDate(user.created_at) : "-"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 rounded-lg border bg-card">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                      <Clock className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Last Login
                      </p>
                      <p className="font-medium">
                        {user?.last_login
                          ? formatDate(user.last_login)
                          : "Never"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Additional activity info can go here */}
              </div>
            </CardContent>
          </Card>

          {/* Additional sections can go here */}
        </div>
      </div>
    </div>
  );
}
