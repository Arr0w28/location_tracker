import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Atsumu — 3D Travel Diary",
  description: "Capture and visualize your travel memories on an interactive 3D globe.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans scroll-smooth", sans.variable, cormorant.variable)}>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased text-foreground selection:bg-primary/20",
          sans.variable
        )}
      >
        {children}
        <Toaster theme="light" position="top-center" closeButton richColors />
      </body>
    </html>
  );
}
