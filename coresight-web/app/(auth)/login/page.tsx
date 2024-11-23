"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case "CredentialsSignin":
        return "Invalid email or password. Please try again.";
      case "Email is required":
        return "Please enter your email address.";
      case "Password is required":
        return "Please enter your password.";
      case "ETIMEDOUT":
        return "Unable to connect to the server. Please check your internet connection or try again later.";
      case "Account not found":
        return "This account doesn't exist. Please check your email or contact your administrator.";
      default:
        if (error?.includes('ETIMEDOUT') || error?.includes('timeout')) {
          return "Unable to connect to the server. Please check your internet connection or try again later.";
        }
        return error || "An error occurred. Please try again.";
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!formData.email) {
      setError("Email is required");
      setIsLoading(false);
      return;
    }

    if (!formData.password) {
      setError("Password is required");
      setIsLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      setIsLoading(false);
      return;
    }

    try {
      console.log("Attempting sign in...");
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
        callbackUrl: "/dashboard",
      });

      console.log("Sign in result:", result);

      if (result?.error) {
        if (result.error.includes('ETIMEDOUT')) {
          setError('ETIMEDOUT');
        } else if (result.error.includes('not found')) {
          setError('Account not found');
        } else {
          setError(result.error);
        }
        return;
      }

      if (result?.ok) {
        router.push(result.url || "/dashboard");
      }
    } catch (error: any) {
      console.error("Sign in error:", error);
      if (error?.message?.includes('ETIMEDOUT')) {
        setError('ETIMEDOUT');
      } else if (error?.response?.status === 404) {
        setError('Account not found');
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 bg-black dark:bg-gray-900 lg:block">
        <div className="flex h-full items-center justify-center p-8">
          <div className="text-white">
            <blockquote className="space-y-2">
              <p className="text-lg">
                Monitoring system that provides real-time visibility into the performance and health of your infrastructure.
              </p>
              <footer className="text-sm">Developer</footer>
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
              priority
            />
            <h1 className="text-2xl font-semibold">Welcome back</h1>
            <p className="text-sm text-muted-foreground">
              Enter your credentials to access your account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/30">
                <div className="flex">
                  <div className="flex-shrink-0">
                    {/* You can add an error icon here if desired */}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-800 dark:text-red-200">
                      {getErrorMessage(error)}
                    </p>
                  </div>
                </div>
              </div>
            )}

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
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, password: e.target.value }))
                }
                className="w-full pr-10"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="sr-only">
                  {showPassword ? "Hide password" : "Show password"}
                </span>
              </Button>
            </div>

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
