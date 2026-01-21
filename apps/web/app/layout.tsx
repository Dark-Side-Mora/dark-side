import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { AuthProvider } from "../lib/auth/auth-context";

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
        <AuthProvider>{children}</AuthProvider>

        {/* Global Toasts */}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
