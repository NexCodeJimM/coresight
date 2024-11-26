import { Metadata } from "next";

export const metadata: Metadata = {
  title: "System Overview | Dashboard - CoreSight - Precision Monitoring for Peak Performance",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
