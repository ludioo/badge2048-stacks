import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Navigation from "@/components/ui/navigation";
import { StacksProvider } from "@/components/providers/StacksProvider";
import { GlobalErrorHandler } from "@/components/providers/GlobalErrorHandler";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "badge2048 - Play & Earn Badges",
  description: "Play the classic 2048 game and collect badges by achieving high scores",
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <GlobalErrorHandler />
        <StacksProvider>
          <div className="min-h-screen bg-white flex flex-col">
            <Navigation />
            <main className="flex flex-1 flex-col">
              <div className="container mx-auto w-full flex-1 px-4 py-8 sm:py-10">
                {children}
              </div>
            </main>
          </div>
        </StacksProvider>
      </body>
    </html>
  );
}
