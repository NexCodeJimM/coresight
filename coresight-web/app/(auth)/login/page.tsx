"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Handle error from URL
  useEffect(() => {
    const errorType = searchParams.get("error");
    if (errorType) {
      setError("Invalid email or password");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      console.log("Attempting to sign in with:", formData.email);

      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
        callbackUrl: "/dashboard",
      });

      console.log("Sign in result:", result);

      if (result?.error) {
        console.error("Sign in error:", result.error);
        setError("Invalid email or password");
        return;
      }

      if (result?.ok) {
        console.log("Sign in successful, redirecting...");
        router.push("/dashboard");
        router.refresh();
      }
    } catch (error) {
      console.error("Sign in error:", error);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 bg-black lg:block">
        <div className="flex h-full items-center justify-center p-8">
          <div className="text-white">
            <blockquote className="space-y-2">
              <p className="text-lg">
                &quot;This monitoring system has transformed how we manage our
                infrastructure.&quot;
              </p>
              <footer className="text-sm">Sofia Davis</footer>
            </blockquote>
          </div>
        </div>
      </div>

      <div className="flex w-full flex-col justify-center px-4 lg:w-1/2 lg:px-8">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8">
            <Image
              src="/logo.png"
              alt="Logo"
              width={40}
              height={40}
              className="mb-4"
            />
            <h1 className="text-2xl font-semibold">Welcome back</h1>
            <p className="text-sm text-muted-foreground">
              Enter your credentials to access your account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder="name@example.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                className="w-full"
                required
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, password: e.target.value }))
                }
                className="w-full"
                required
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Need an account?{" "}
            <Link
              href="/contact-admin"
              className="font-medium text-primary hover:underline"
            >
              Contact administrator
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
