import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "3D Travel Diary",
  description: "Capture and visualize your travel memories on an interactive 3D globe.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("dark", "font-sans", inter.variable)}>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased text-foreground selection:bg-primary/20",
          inter.variable
        )}
      >
        {children}
        <Toaster theme="dark" position="top-center" closeButton richColors />
      </body>
    </html>
  );
}
