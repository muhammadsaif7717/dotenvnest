"use client";

import { useState, useRef, Suspense } from "react";
import { useTheme } from "next-themes";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icon = {
  Sun: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
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
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  ),
  ArrowRight: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  ),
  Warn: () => (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="shrink-0"
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
};

// ─── Spinner ──────────────────────────────────────────────────────────────────
const Spinner = ({ color = "currentColor" }: { color?: string }) => (
  <span
    className="w-3.5 h-3.5 border-2 rounded-full animate-spin inline-block shrink-0"
    style={{ borderColor: `${color} ${color} ${color} transparent` }}
  />
);

// ─── OTP Input ────────────────────────────────────────────────────────────────
function OtpInput({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const LENGTH = 6;
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(LENGTH, "").split("").slice(0, LENGTH);

  const handleKeyDown = (
    i: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (digits[i]) {
        onChange(value.slice(0, i) + value.slice(i + 1));
      } else if (i > 0) {
        onChange(value.slice(0, i - 1) + value.slice(i));
        inputsRef.current[i - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && i > 0) {
      inputsRef.current[i - 1]?.focus();
    } else if (e.key === "ArrowRight" && i < LENGTH - 1) {
      inputsRef.current[i + 1]?.focus();
    }
  };

  const handleChange = (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    if (!raw) return;

    // paste of multiple digits
    if (raw.length > 1) {
      const next = raw.slice(0, LENGTH);
      onChange(next);
      inputsRef.current[Math.min(next.length, LENGTH - 1)]?.focus();
      return;
    }

    const next = (value.slice(0, i) + raw + value.slice(i + 1)).slice(
      0,
      LENGTH
    );
    onChange(next);
    if (i < LENGTH - 1) inputsRef.current[i + 1]?.focus();
  };

  const handleFocus = (i: number) => {
    const firstEmpty = digits.findIndex((d) => !d);
    if (firstEmpty !== -1 && firstEmpty < i) {
      inputsRef.current[firstEmpty]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, LENGTH);
    onChange(pasted);
    inputsRef.current[Math.min(pasted.length, LENGTH - 1)]?.focus();
  };

  return (
    <div className="flex gap-2 sm:gap-2.5 justify-center">
      {Array.from({ length: LENGTH }, (_, i) => {
        const isFilled = !!digits[i];
        const isActive =
          !disabled &&
          (value.length === i || (value.length === LENGTH && i === LENGTH - 1));

        return (
          <input
            key={i}
            ref={(el) => {
              inputsRef.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digits[i] || ""}
            onChange={(e) => handleChange(i, e)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onFocus={() => handleFocus(i)}
            onPaste={handlePaste}
            disabled={disabled}
            autoComplete="one-time-code"
            className={cn(
              "w-10 h-12 sm:w-11 sm:h-13 text-center text-xl font-bold rounded-lg border-2",
              "transition-all duration-150 outline-none caret-transparent select-none",
              "font-mono bg-white dark:bg-zinc-900",
              "text-foreground",
              isActive
                ? "border-emerald-500 dark:border-emerald-400 ring-2 ring-emerald-500/20 dark:ring-emerald-400/20"
                : isFilled
                  ? "border-emerald-400 dark:border-emerald-700"
                  : "border-zinc-200 dark:border-zinc-800",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          />
        );
      })}
    </div>
  );
}

// ─── Verify Content ────────────────────────────────────────────────────────────
function VerifyContent() {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const canSubmit = code.length === 6;

  const handleResend = async () => {
    if (isResending) return;
    setIsResending(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/resend-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Failed to resend code.");
      }

      setSuccess("A new verification code has been sent to your email.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsResending(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code: code.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Invalid verification code.");
      }

      router.push("/");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

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
        {/* Logo */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
          <span
            className="text-base sm:text-lg font-bold tracking-tight"
            style={{ fontFamily: "'Courier New', monospace" }}
          >
            <span className="text-emerald-500 dark:text-emerald-400">.</span>env
            <span className="text-zinc-300 dark:text-zinc-600 ml-1.5 sm:ml-2 text-xs sm:text-sm font-semibold">
              nest
            </span>
          </span>
        </div>

        {/* Theme toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex items-center gap-1.5 sm:gap-2 h-8 px-2.5 sm:px-3 text-[10px] sm:text-[11px] font-semibold tracking-wide text-zinc-500 dark:text-zinc-500 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 hover:text-zinc-800 dark:hover:text-zinc-100 hover:border-zinc-300 dark:hover:border-zinc-700"
          title="Toggle theme"
        >
          <span className="dark:hidden">
            <Icon.Moon />
          </span>
          <span className="hidden dark:inline">
            <Icon.Sun />
          </span>
          <span className="hidden xs:inline dark:hidden">Dark</span>
          <span className="hidden xs:inline dark:inline">Light</span>
        </Button>
      </header>

      {/* ── Main content ────────────────────────────────────────────────────── */}
      <main className="relative flex flex-1 items-center justify-center px-4 sm:px-6 py-8 sm:py-12 md:py-16">
        <div className="w-full max-w-xs sm:max-w-sm">
          {/* Header text */}
          <div className="mb-6 sm:mb-8">
            <p className="text-[10px] sm:text-[11px] tracking-[0.2em] sm:tracking-[0.25em] uppercase text-zinc-400 dark:text-zinc-500 font-semibold mb-1.5 sm:mb-2">
              Verification Required
            </p>
            <h1
              className="text-2xl sm:text-3xl font-bold tracking-tight"
              style={{ fontFamily: "'Courier New', monospace" }}
            >
              Verify Email
            </h1>
            <p className="text-zinc-400 dark:text-zinc-600 text-xs sm:text-sm mt-1 sm:mt-1.5 tracking-wide">
              We sent a 6-digit code to{" "}
              <span className="text-emerald-500 dark:text-emerald-400">
                {email}
              </span>
              .
            </p>
          </div>

          {/* ── Card ────────────────────────────────────────────────────────── */}
          <Card className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 shadow-sm overflow-hidden p-0">
            {/* VSCode-style title bar */}
            <CardHeader className="flex flex-row items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 space-y-0">
              <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#ff5f56]" />
              <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#ffbd2e]" />
              <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#27c93f]" />
              <span className="ml-1.5 sm:ml-2 text-[10px] sm:text-[11px] text-zinc-400 dark:text-zinc-700 tracking-wider">
                verify.env
              </span>
            </CardHeader>

            {/* Form body */}
            <CardContent className="p-4 sm:p-6">
              <form onSubmit={handleVerify} className="space-y-4 sm:space-y-5">
                {/* OTP Inputs */}
                <div className="space-y-1 sm:space-y-1.5">
                  <p className="text-[10px] sm:text-[11px] tracking-[0.15em] sm:tracking-[0.2em] uppercase text-zinc-400 dark:text-zinc-500 font-semibold text-center mb-3">
                    6-Digit Code
                  </p>
                  <OtpInput
                    value={code}
                    onChange={(v) => {
                      setCode(v);
                      setError(null);
                    }}
                    disabled={isLoading}
                  />
                </div>

                {/* Error alert */}
                {error && (
                  <Alert className="py-2 px-3 sm:px-3.5 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-500 dark:text-red-400">
                    <AlertDescription className="flex items-center gap-2 text-xs leading-snug">
                      <Icon.Warn />
                      <span>{error}</span>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Success alert */}
                {success && (
                  <Alert className="py-2 px-3 sm:px-3.5 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                    <AlertDescription className="text-xs leading-snug">
                      {success}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Submit & Resend Buttons */}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleResend}
                    disabled={isResending}
                    className="flex-1 h-auto py-2.5 sm:py-3 text-xs sm:text-sm font-semibold tracking-wide border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-100"
                  >
                    {isResending ? "Resending..." : "Resend Code"}
                  </Button>

                  <Button
                    type="submit"
                    disabled={!canSubmit || isLoading}
                    className={`
                      flex-1 flex items-center justify-center gap-2 sm:gap-2.5
                      py-2.5 sm:py-3 h-auto rounded-lg
                      text-xs sm:text-sm font-bold tracking-widest uppercase
                      transition-all duration-200
                      ${
                        !canSubmit
                          ? "bg-zinc-100 dark:bg-zinc-900 text-zinc-300 dark:text-zinc-700 border border-zinc-200 dark:border-zinc-800 cursor-not-allowed hover:bg-zinc-100 dark:hover:bg-zinc-900"
                          : isLoading
                            ? "bg-emerald-50 dark:bg-emerald-400/20 text-emerald-500 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 cursor-wait hover:bg-emerald-50 dark:hover:bg-emerald-900/50"
                            : "bg-emerald-500 dark:bg-emerald-400 text-white dark:text-zinc-950 hover:bg-emerald-600 dark:hover:bg-emerald-500 active:scale-[0.98]"
                      }
                    `}
                  >
                    {isLoading ? (
                      <>
                        <Spinner
                          color={theme === "dark" ? "#34d399" : "#10b981"}
                        />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <span>Verify</span>
                        <Icon.ArrowRight />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Spinner />
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
