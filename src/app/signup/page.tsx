"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";

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
  Lock: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  User: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Eye: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  EyeOff: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ),
  ArrowRight: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  ),
  Warn: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
};

// ─── Spinner ──────────────────────────────────────────────────────────────────
const Spinner = ({ color = "#0a0a0a" }: { color?: string }) => (
  <span
    className="w-3.5 h-3.5 border-2 rounded-full animate-spin inline-block shrink-0"
    style={{ borderColor: `${color} ${color} ${color} transparent` }}
  />
);

// ─── Signup Page ───────────────────────────────────────────────────────────────
export default function SignupPage() {
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = email.trim().length > 0 && password.length > 0;

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Invalid credentials.");
      }

      if (data.requireVerification) {
        router.push(`/verify?email=${encodeURIComponent(email.trim())}`);
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen min-h-dvh bg-white dark:bg-[#0a0a0a] text-zinc-800 dark:text-[#e8e8e8] font-mono transition-colors duration-200 flex flex-col">

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
      <header className="relative flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-zinc-100 dark:border-[#141414]">
        {/* Logo */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-[#00ff88] animate-pulse" />
          <span
            className="text-base sm:text-lg font-bold tracking-tight"
            style={{ fontFamily: "'Courier New', monospace" }}
          >
            <span className="text-emerald-500 dark:text-[#00ff88]">.</span>env<span className="text-zinc-300 dark:text-[#444] ml-1.5 sm:ml-2 text-xs sm:text-sm font-semibold">nest</span>
          </span>
        </div>

        {/* Theme toggle – shadcn Button variant ghost */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex items-center gap-1.5 sm:gap-2 h-8 px-2.5 sm:px-3 text-[10px] sm:text-[11px] font-semibold tracking-wide text-zinc-500 dark:text-[#555] border-zinc-200 dark:border-[#1e1e1e] bg-zinc-50 dark:bg-[#111] hover:text-zinc-800 dark:hover:text-[#e8e8e8] hover:border-zinc-300 dark:hover:border-[#333]"
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
        <div className="w-full max-w-xs sm:max-w-sm">

          {/* Header text */}
          <div className="mb-6 sm:mb-8">
            <p className="text-[10px] sm:text-[11px] tracking-[0.2em] sm:tracking-[0.25em] uppercase text-zinc-400 dark:text-[#555] font-semibold mb-1.5 sm:mb-2">
              Secure Access
            </p>
            <h1
              className="text-2xl sm:text-3xl font-bold tracking-tight"
              style={{ fontFamily: "'Courier New', monospace" }}
            >
              Sign up
            </h1>
            <p className="text-zinc-400 dark:text-[#444] text-xs sm:text-sm mt-1 sm:mt-1.5 tracking-wide">
              Access your .env nest.
            </p>
          </div>

          {/* ── Card ────────────────────────────────────────────────────────── */}
          <Card className="rounded-xl border border-zinc-200 dark:border-[#1e1e1e] bg-zinc-50 dark:bg-[#0e0e0e] shadow-sm overflow-hidden p-0">

            {/* VSCode-style title bar */}
            <CardHeader className="flex flex-row items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-zinc-100 dark:bg-[#0d0d0d] border-b border-zinc-200 dark:border-[#1e1e1e] space-y-0">
              <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#ff5f56]" />
              <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#ffbd2e]" />
              <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#27c93f]" />
              <span className="ml-1.5 sm:ml-2 text-[10px] sm:text-[11px] text-zinc-400 dark:text-[#333] tracking-wider">
                auth.env
              </span>
            </CardHeader>

            {/* Form body */}
            <CardContent className="p-4 sm:p-6">
              <form onSubmit={handleSignup} className="space-y-4 sm:space-y-5">

                {/* Username */}
                <div className="space-y-1 sm:space-y-1.5">
                  <Label className="text-[10px] sm:text-[11px] tracking-[0.15em] sm:tracking-[0.2em] uppercase text-zinc-400 dark:text-[#555] font-semibold">
                    Email
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-300 dark:text-[#333] pointer-events-none">
                      <Icon.User />
                    </span>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(null); }}
                      placeholder="you@example.com"
                      autoComplete="email"
                      spellCheck={false}
                      className="w-full bg-white dark:bg-[#111] border-zinc-200 dark:border-[#1e1e1e] pl-9 pr-4 py-2.5 sm:py-3 text-xs sm:text-sm text-zinc-800 dark:text-[#e8e8e8] placeholder-zinc-300 dark:placeholder-[#333] focus-visible:ring-emerald-500/20 dark:focus-visible:ring-[#00ff88]/20 focus-visible:border-emerald-500 dark:focus-visible:border-[#00ff88] h-auto rounded-lg"
                      style={{ fontFamily: "'Courier New', monospace" }}
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1 sm:space-y-1.5">
                  <Label className="text-[10px] sm:text-[11px] tracking-[0.15em] sm:tracking-[0.2em] uppercase text-zinc-400 dark:text-[#555] font-semibold">
                    Password
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-300 dark:text-[#333] pointer-events-none">
                      <Icon.Lock />
                    </span>
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(null); }}
                      placeholder="••••••••••••"
                      autoComplete="current-password"
                      className="w-full bg-white dark:bg-[#111] border-zinc-200 dark:border-[#1e1e1e] pl-9 pr-10 py-2.5 sm:py-3 text-xs sm:text-sm text-zinc-800 dark:text-[#e8e8e8] placeholder-zinc-300 dark:placeholder-[#333] focus-visible:ring-emerald-500/20 dark:focus-visible:ring-[#00ff88]/20 focus-visible:border-emerald-500 dark:focus-visible:border-[#00ff88] h-auto rounded-lg"
                      style={{ fontFamily: "'Courier New', monospace" }}
                    />
                    {/* Toggle password visibility */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 h-7 w-7 text-zinc-300 dark:text-[#444] hover:text-zinc-500 dark:hover:text-[#888] hover:bg-transparent"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <Icon.EyeOff /> : <Icon.Eye />}
                    </Button>
                  </div>
                </div>

                {/* Error alert */}
                {error && (
                  <Alert className="py-2 px-3 sm:px-3.5 bg-red-50 dark:bg-[#ff4444]/8 border-red-200 dark:border-[#ff4444]/25 text-red-500 dark:text-[#ff4444]">
                    <AlertDescription className="flex items-center gap-2 text-xs leading-snug">
                      <Icon.Warn />
                      <span>{error}</span>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={!canSubmit || isLoading}
                  className={`
                    w-full flex items-center justify-center gap-2 sm:gap-2.5
                    py-2.5 sm:py-3 h-auto rounded-lg
                    text-xs sm:text-sm font-bold tracking-widest uppercase
                    transition-all duration-200 mt-1
                    ${!canSubmit
                      ? "bg-zinc-100 dark:bg-[#111] text-zinc-300 dark:text-[#333] border border-zinc-200 dark:border-[#1e1e1e] cursor-not-allowed hover:bg-zinc-100 dark:hover:bg-[#111]"
                      : isLoading
                      ? "bg-emerald-50 dark:bg-[#00ff88]/20 text-emerald-500 dark:text-[#00ff88] border border-emerald-300 dark:border-[#00ff88]/30 cursor-wait hover:bg-emerald-50 dark:hover:bg-[#00ff88]/20"
                      : "bg-emerald-500 dark:bg-[#00ff88] text-white dark:text-[#0a0a0a] hover:bg-emerald-600 dark:hover:bg-[#00e07a] active:scale-[0.98]"
                    }
                  `}
                >
                  {isLoading ? (
                    <>
                      <Spinner color={theme === "dark" ? "#00ff88" : "#10b981"} />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign Up</span>
                      <Icon.ArrowRight />
                    </>
                  )}
                </Button>

              </form>
            </CardContent>
          </Card>

          {/* Footer note */}
          <p className="text-center text-[9px] sm:text-[11px] text-zinc-300 dark:text-[#555] mt-4 tracking-widest">
            Already have an account? <a href="/login" className="text-emerald-500 dark:text-[#00ff88] hover:underline">Sign in</a>
          </p>
          <p className="text-center text-[9px] sm:text-[11px] text-zinc-300 dark:text-[#2a2a2a] mt-2 tracking-widest uppercase">
            DOTENVNEST · Secure · Private
          </p>
        </div>
      </main>
    </div>
  );
}