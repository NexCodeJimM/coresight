import { Metadata } from "next";

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/servers/${params.id}`
    );
    const data = await response.json();

    return {
      title: `${data.server?.name || "Server"} | Server Details - CoreSight - Precision Monitoring for Peak Performance`,
    };
  } catch (error) {
    return {
      title: "Server Details - CoreSight - Precision Monitoring for Peak Performance",
    };
  }
}

export default function ServerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
