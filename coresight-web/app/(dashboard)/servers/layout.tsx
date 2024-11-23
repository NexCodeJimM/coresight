import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Server Management",
};

export default function ServersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
