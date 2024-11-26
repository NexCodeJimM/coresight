import { Metadata } from "next";

export const metadata: Metadata = {
  title: "User Management - CoreSight - Precision Monitoring for Peak Performance",
};

export default function UsersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
