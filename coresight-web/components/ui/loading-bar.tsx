"use client";

import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { usePathname } from "next/navigation";

export function LoadingBar() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
      setProgress(0);
    }, 500);

    return () => clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    if (loading) {
      const timer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(timer);
            return 100;
          }
          return prev + 10;
        });
      }, 50);

      return () => clearInterval(timer);
    }
  }, [loading]);

  if (!loading) return null;

  return (
    <Progress
      value={progress}
      className="fixed top-0 left-0 right-0 z-50 h-1 rounded-none"
    />
  );
}
