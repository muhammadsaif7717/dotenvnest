import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ThemeProvider from "@/contexts/themeProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import QueryProvider from "@/contexts/QueryProvider";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DotEnvNest",
  description: "A secure, beautiful, and open-source platform to store and manage your project environment files (.env).",
  keywords: ["dotenv", "environment variables", "env manager", "secure storage", "nextjs", "open source", "developer tools"],
  authors: [{ name: "MD. SAIF ISLAM", url: "https://github.com/muhammadsaif7717" }],
  creator: "MD. SAIF ISLAM",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://github.com/muhammadsaif7717/dotenvnest",
    title: "DotEnvNest - Secure .env Manager",
    description: "Store, manage, and sync your project environment files securely with DotEnvNest. Built for developers by developers.",
    siteName: "DotEnvNest",
  },
  twitter: {
    card: "summary_large_image",
    title: "DotEnvNest - Secure .env Manager",
    description: "Store, manage, and sync your project environment files securely with DotEnvNest.",
    creator: "@muhammadsaif7717",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "DotEnvNest"
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
    suppressHydrationWarning
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <QueryProvider>
            <TooltipProvider>
              {children}
            </TooltipProvider>
          </QueryProvider>
        </ThemeProvider>
        <Script
          id="service-worker-registration"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) { },
                    function(err) { }
                  );
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
