"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icon = {
  Sun: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  ),
  Moon: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  ),
};

const Spinner = ({ color = "currentColor" }: { color?: string }) => (
  <span
    className="w-4 h-4 border-2 rounded-full animate-spin inline-block shrink-0"
    style={{ borderColor: `${color} ${color} ${color} transparent` }}
  />
);

function CliAuthContent() {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"authenticating" | "error">("authenticating");

  useEffect(() => {
    const cliPort = searchParams.get("cli_port");

    if (!cliPort) {
      router.push("/");
      return;
    }

    const authenticateCli = async () => {
      try {
        const res = await fetch("/api/cli/auth-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        if (res.ok) {
          const data = await res.json();
          // Send token back to local CLI server
          window.location.href = `http://localhost:${cliPort}/?token=${data.token}`;
        } else {
          // If unauthorized or other error, redirect to login page with port
          router.push(`/login?cli_port=${cliPort}`);
        }
      } catch (error) {
        console.error("Failed to authenticate CLI:", error);
        setStatus("error");
      }
    };

    authenticateCli();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen min-h-dvh bg-background text-foreground font-mono transition-colors duration-200 flex flex-col">
      {/* Grid background – light */}
      <div
        className="fixed inset-0 pointer-events-none dark:hidden"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      {/* Grid background – dark */}
      <div
        className="fixed inset-0 pointer-events-none hidden dark:block"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <header className="relative flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-zinc-100 dark:border-zinc-900">
        <div className="flex items-center gap-2 sm:gap-2.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
          <span
            className="text-base sm:text-lg font-bold tracking-tight"
            style={{ fontFamily: "'Courier New', monospace" }}
          >
            <span className="text-emerald-500 dark:text-emerald-400">.</span>env<span className="text-zinc-300 dark:text-zinc-600 ml-1.5 sm:ml-2 text-xs sm:text-sm font-semibold">nest</span>
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex items-center gap-1.5 sm:gap-2 h-8 px-2.5 sm:px-3 text-[10px] sm:text-[11px] font-semibold tracking-wide text-zinc-500 dark:text-zinc-500 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 hover:text-zinc-800 dark:hover:text-zinc-100 hover:border-zinc-300 dark:hover:border-zinc-700"
          title="Toggle theme"
        >
          <span className="dark:hidden"><Icon.Moon /></span>
          <span className="hidden dark:inline"><Icon.Sun /></span>
          <span className="hidden xs:inline dark:hidden">Dark</span>
          <span className="hidden xs:inline dark:inline">Light</span>
        </Button>
      </header>

      {/* ── Main content ────────────────────────────────────────────────────── */}
      <main className="relative flex flex-1 items-center justify-center px-4 sm:px-6 py-8 sm:py-12 md:py-16">
        <div className="flex flex-col items-center justify-center space-y-4">
          {status === "authenticating" ? (
            <>
              <Spinner color={theme === "dark" ? "#34d399" : "#10b981"} />
              <p className="text-zinc-600 dark:text-zinc-400 text-sm tracking-widest uppercase">
                Authenticating CLI...
              </p>
            </>
          ) : (
            <>
              <p className="text-red-500 dark:text-red-400 text-sm tracking-widest uppercase">
                Failed to authenticate CLI
              </p>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="mt-4 text-xs font-semibold uppercase tracking-wider"
              >
                Try Again
              </Button>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default function CliAuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><Spinner /></div>}>
      <CliAuthContent />
    </Suspense>
  );
}
