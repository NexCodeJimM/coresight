"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    const response = await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });

    if (response?.error) {
      setError("Invalid email or password");
      toast({
        title: "Error",
        description: "Invalid email or password",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="w-full max-w-md space-y-8 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Coresight Monitoring</h1>
          <p className="mt-2 text-gray-600">Sign in to your account</p>
        </div>
        <form onSubmit={onSubmit} className="mt-8 space-y-6">
          {error && (
            <div className="text-sm text-red-500 text-center">{error}</div>
          )}
          <div className="space-y-4">
            <div>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Email address"
                required
              />
            </div>
            <div>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Password"
                required
              />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}
