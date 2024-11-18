"use client";

import * as React from "react";
import { UserNav } from "@/components/layout/UserNav";
import Link from "next/link";

export function Navbar() {
  return (
    <div className="border-b">
      <div className="flex h-16 items-center px-4">
        <div className="flex items-center space-x-4">
          <Link href="/" className="font-bold text-xl">
            CORESIGHT
          </Link>
          <nav className="flex items-center space-x-4">
            <Link href="/dashboard" className="text-sm font-medium">
              Dashboard
            </Link>
            <Link href="/servers" className="text-sm font-medium">
              Servers
            </Link>
          </nav>
        </div>
        <div className="ml-auto flex items-center space-x-4">
          <UserNav />
        </div>
      </div>
    </div>
  );
}
