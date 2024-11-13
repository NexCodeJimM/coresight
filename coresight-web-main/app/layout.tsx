import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import AuthProvider from "@/components/auth-provider";
import { NotificationProvider } from "@/components/notifications/notification-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Coresight Monitoring",
  description: "Server monitoring system",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.className} min-h-screen bg-background antialiased`}
        style={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
        }}
      >
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <NotificationProvider>
              {children}
              <Toaster />
            </NotificationProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
