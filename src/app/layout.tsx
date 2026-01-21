import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Read-only admin dashboard",
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-950 text-slate-200`}
      >
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 overflow-x-hidden overflow-y-auto transition-all duration-300">
            {/* Top Bar for Mobile Padding / Spacer if needed, managed by Sidebar fixed pos */}
            <div className="md:hidden h-16" /> 
            
            <div className="container mx-auto px-4 py-6 md:px-8 md:py-8 max-w-7xl">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
