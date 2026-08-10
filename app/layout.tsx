import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SkipLink, LiveAnnouncer } from "@/src/lib/accessibility";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Todo Elephant - Daily Task Planner",
  description: "A beautiful, glassmorphic daily task planner with dashboard, kanban board, list views, AI assistant, and social features.",
  manifest: "/manifest.json",
  themeColor: "#3b82f6",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: true,
  },
  icons: [
    {
      rel: "apple-touch-icon",
      sizes: "192x192",
      url: "/icon-192.png",
    },
    {
      rel: "icon",
      sizes: "512x512",
      url: "/icon-512.png",
    },
  ],
};

const themeScript = `
  (function() {
    var theme = localStorage.getItem('color-scheme');
    if (theme === 'dark' || theme === 'light') {
      document.documentElement.setAttribute('data-theme', theme);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  })()
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {/* PWA Support */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icon-192.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icon-512.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <SkipLink />
        <LiveAnnouncer message="" />
        <WeatherBackground />
        {children}
      </body>
    </html>
  );
}

function WeatherBackground() {
  // Simple weather that just shows background based on time of day
  const now = new Date();
  const hour = now.getHours();
  const isDaytime = hour >= 6 && hour < 18;

  return (
    <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-b transition-all duration-1000 ${
        isDaytime
          ? "from-sky-200 via-blue-100 to-slate-200 dark:from-slate-800 dark:via-slate-900 dark:to-slate-950"
          : "from-indigo-900 via-purple-900 to-slate-900"
      }`} />
    </div>
  );
}
