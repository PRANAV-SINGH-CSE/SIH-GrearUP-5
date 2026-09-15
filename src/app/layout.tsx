import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

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
};

export const metadata: Metadata = {
  title: "CompliScan | Department of Legal Metrology, Government of India",
  description:
    "AI-powered verification of packaged commodity labels under the Legal Metrology (Packaged Commodities) Rules, 2011.",
  manifest: "/manifest.json",
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
        {/* Instant Native Splash Preloader (Eliminates Android WebView White Screen) */}
        <div
          id="compliscan-preloader"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
            transition: "opacity 0.35s ease-out",
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            padding: "24px",
            textAlign: "center",
            pointerEvents: "auto",
          }}
        >
          {/* Logo & Emblem Icon Container */}
          <div
            style={{
              animation: "compliscan-pulse 2s infinite ease-in-out",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginBottom: "24px",
            }}
          >
            {/* Blue Shield Icon */}
            <div
              style={{
                width: "68px",
                height: "68px",
                borderRadius: "20px",
                background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 10px 25px -5px rgba(37, 99, 235, 0.4)",
                marginBottom: "16px",
              }}
            >
              <svg
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ffffff"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <polyline points="9 12 11 14 15 10" />
              </svg>
            </div>

            {/* Department Text */}
            <div
              style={{
                fontSize: "12px",
                fontWeight: 800,
                color: "#1e293b",
                letterSpacing: "0.4px",
                textTransform: "uppercase",
              }}
            >
              Department of Legal Metrology
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "#64748b",
                fontWeight: 600,
                marginTop: "2px",
              }}
            >
              Government of India
            </div>

            {/* CompliScan Brand */}
            <div
              style={{
                fontSize: "26px",
                fontWeight: 900,
                color: "#0f172a",
                letterSpacing: "-0.5px",
                marginTop: "8px",
              }}
            >
              Compli<span style={{ color: "#2563eb" }}>Scan</span>
            </div>
            <div
              style={{
                fontSize: "12px",
                color: "#475569",
                fontWeight: 600,
                marginTop: "2px",
              }}
            >
              Scan. Verify. Stay Compliant.
            </div>
          </div>

          {/* Animated Tricolor Bar */}
          <div
            style={{
              width: "180px",
              height: "4px",
              background: "#e2e8f0",
              borderRadius: "999px",
              overflow: "hidden",
              position: "relative",
              marginBottom: "14px",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                width: "55%",
                background:
                  "linear-gradient(90deg, #ff9933, #2563eb, #138808)",
                borderRadius: "999px",
                animation: "compliscan-bar 1.4s infinite ease-in-out",
              }}
            />
          </div>

          {/* Status Hint */}
          <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>
            Initializing Legal Metrology Engine...
          </div>
        </div>

        {/* Client Preloader Dismissal Script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('DOMContentLoaded', function() {
                setTimeout(function() {
                  var p = document.getElementById('compliscan-preloader');
                  if (p) {
                    p.style.opacity = '0';
                    p.style.pointerEvents = 'none';
                    setTimeout(function() { p.remove(); }, 380);
                  }
                }, 1000);
              });
            `,
          }}
        />

        {children}
      </body>
    </html>
  );
}
