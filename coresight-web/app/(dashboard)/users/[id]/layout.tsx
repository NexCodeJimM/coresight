import { Metadata } from "next";

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/users/${params.id}`
    );
    const data = await response.json();
    const user = data.user;

    return {
      title: `${user.first_name} ${user.last_name} | User Profile - CoreSight - Precision Monitoring for Peak Performance`,
    };
  } catch (error) {
    return {
      title: "User Profile - CoreSight - Precision Monitoring for Peak Performance",
    };
  }
}

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
