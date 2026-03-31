import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "../lib/LanguageContext";
import SidebarWrapper from "../components/SidebarWrapper";
import { PostHogProvider } from "../components/PostHogProvider";
import { PostHogPageView } from "../components/PostHogPageView";
import { Suspense } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Axioma AI.Tech — Inteligência Financeira",
  description: "Plataforma de inteligência financeira com IA para PMEs",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <PostHogProvider>
          <Suspense fallback={null}>
            <PostHogPageView />
          </Suspense>
          <LanguageProvider>
            <div className="flex min-h-screen">
              <SidebarWrapper />
              <main className="flex-1 overflow-auto min-w-0 pt-16 md:pt-0">
                {children}
              </main>
            </div>
          </LanguageProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}