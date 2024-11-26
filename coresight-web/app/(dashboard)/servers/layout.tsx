import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Server Management - CoreSight - Precision Monitoring for Peak Performance",
};

export default function ServersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
