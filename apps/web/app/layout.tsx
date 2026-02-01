import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { AuthProvider } from "../lib/auth/auth-context";
import { OrganizationProvider } from "@/lib/organization/OrganizationContext";
import { ProjectContextProvider } from "@/lib/project/ProjectContext";
import { Shell } from "@/components/ui/Shell";

export const metadata: Metadata = {
  title: "CI-Insight | Unified CI/CD Intelligence",
  description:
    "A smart full-stack platform for visualizing and analyzing CI/CD pipelines.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        <OrganizationProvider>
          <ProjectContextProvider>
            <AuthProvider>
              <Shell>{children}</Shell>
            </AuthProvider>
          </ProjectContextProvider>
        </OrganizationProvider>
        {/* Global Toasts */}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
