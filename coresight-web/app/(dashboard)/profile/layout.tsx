import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile Settings - CoreSight - Precision Monitoring for Peak Performance",
  description: "Manage your profile settings and preferences",
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
} 