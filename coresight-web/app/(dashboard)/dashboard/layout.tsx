import { Metadata } from "next";

export const metadata: Metadata = {
  title: "System Overview | Dashboard",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
