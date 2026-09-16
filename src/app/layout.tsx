import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppPreloader } from "@/components/app-preloader";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "CompliScan | Department of Legal Metrology, Lovely Professional University",
  description:
    "AI-powered verification of packaged commodity labels under the Legal Metrology (Packaged Commodities) Rules, 2011.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CompliScan",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <style
          dangerouslySetInnerHTML={{
            __html: `
              @keyframes compliscan-pulse {
                0%, 100% { transform: scale(1); opacity: 1; }
                50% { transform: scale(0.97); opacity: 0.85; }
              }
              @keyframes compliscan-bar {
                0% { transform: translateX(-100%); }
                50% { transform: translateX(30%); }
                100% { transform: translateX(200%); }
              }
              @keyframes compliscan-spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        <AppPreloader />
        {children}
      </body>
    </html>
  );
}
