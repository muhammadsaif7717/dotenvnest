"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ShieldCheck, AlertTriangle } from "lucide-react";

// ─── Spinner ──────────────────────────────────────────────────────────────────
const Spinner = ({ className }: { className?: string }) => (
  <span
    className={cn(
      "w-3.5 h-3.5 border-2 border-t-transparent rounded-full animate-spin inline-block shrink-0",
      className
    )}
  />
);

// ─── PIN Digit Input ──────────────────────────────────────────────────────────
function PinInput({
  length = 6,
  value,
  onChange,
  disabled,
}: {
  length?: number;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const digits = value.padEnd(length, "").split("").slice(0, length);

  const handleKeyDown = (
    i: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (digits[i]) {
        const next = value.slice(0, i) + value.slice(i + 1);
        onChange(next);
      } else if (i > 0) {
        const next = value.slice(0, i - 1) + value.slice(i);
        onChange(next);
        inputsRef.current[i - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && i > 0) {
      inputsRef.current[i - 1]?.focus();
    } else if (e.key === "ArrowRight" && i < length - 1) {
      inputsRef.current[i + 1]?.focus();
    }
  };

  const handleInput = (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    if (!raw) return;

    // Handle paste of multiple digits
    if (raw.length > 1) {
      const pasted = (value + raw).replace(/\D/g, "").slice(0, length);
      onChange(pasted);
      const nextIndex = Math.min(pasted.length, length - 1);
      inputsRef.current[nextIndex]?.focus();
      return;
    }

    const next = (value.slice(0, i) + raw + value.slice(i + 1)).slice(
      0,
      length
    );
    onChange(next);
    if (i < length - 1) inputsRef.current[i + 1]?.focus();
  };

  const handleFocus = (i: number) => {
    // Focus the first empty digit or stay at current
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
      .slice(0, length);
    onChange(pasted);
    const nextIndex = Math.min(pasted.length, length - 1);
    inputsRef.current[nextIndex]?.focus();
  };

  return (
    <div className="flex gap-2 sm:gap-2.5 justify-center">
      {Array.from({ length }, (_, i) => {
        const isFilled = !!digits[i];
        const isActive =
          value.length === i || (value.length === length && i === length - 1);
        return (
          <input
            key={i}
            ref={(el) => {
              inputsRef.current[i] = el;
            }}
            type="password"
            inputMode="numeric"
            maxLength={2}
            value={isFilled ? "•" : ""}
            onChange={(e) => handleInput(i, e)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onFocus={() => handleFocus(i)}
            onPaste={handlePaste}
            disabled={disabled}
            className={cn(
              "w-10 h-12 sm:w-12 sm:h-14 text-center text-lg font-bold rounded-lg border-2 transition-all duration-200 outline-none",
              "font-mono bg-zinc-50 dark:bg-zinc-900 caret-transparent",
              "text-emerald-600 dark:text-emerald-400",
              isActive
                ? "border-emerald-500 dark:border-emerald-400 ring-2 ring-emerald-500/20 dark:ring-emerald-400/20"
                : isFilled
                  ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/30"
                  : "border-zinc-200 dark:border-zinc-800",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          />
        );
      })}
    </div>
  );
}

// ─── Setup PIN Modal ──────────────────────────────────────────────────────────
interface SetupPinModalProps {
  open: boolean;
}

export function SetupPinModal({ open }: SetupPinModalProps) {
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dots, setDots] = useState("");
  const router = useRouter();

  // Animated ellipsis while loading
  useEffect(() => {
    if (!loading) return;
    const id = setInterval(
      () => setDots((d) => (d.length < 3 ? d + "." : "")),
      400
    );
    return () => {
      clearInterval(id);
      setDots("");
    };
  }, [loading]);

  const handleSubmit = async () => {
    setError("");
    if (!/^\d{6}$/.test(pin)) {
      setError("PIN must be exactly 6 digits.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/user/setup-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to setup PIN");
      router.refresh();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && pin.length === 6 && !loading) handleSubmit();
  };

  const isReady = pin.length === 6;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="w-[calc(100vw-1.5rem)] sm:max-w-sm p-0 gap-0 overflow-hidden font-mono rounded-xl border border-zinc-200 dark:border-zinc-800"
        onKeyDown={handleKeyDown}
        // Hide the default close button
        style={{ ["--dialog-close-display" as string]: "none" }}
      >
        {/* Title bar — VSCode style */}
        <div className="flex items-center gap-1.5 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
          <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
          <span className="ml-2 text-[10px] text-zinc-400 dark:text-zinc-600 tracking-wider">
            setup-pin.env
          </span>
        </div>

        {/* Header */}
        <DialogHeader className="px-5 sm:px-6 pt-5 sm:pt-6 pb-0">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            </div>
            <DialogTitle className="text-sm font-bold tracking-wide">
              Setup Encryption PIN
            </DialogTitle>
          </div>
          <p className="text-[11px] sm:text-xs text-zinc-400 dark:text-zinc-600 leading-5 mt-1.5">
            Set a{" "}
            <span className="text-emerald-500 dark:text-emerald-400 font-semibold">
              6-digit PIN
            </span>{" "}
            to encrypt your environment variables. You will only need to do this
            once.
          </p>
        </DialogHeader>

        {/* Body */}
        <div className="px-5 sm:px-6 py-5 sm:py-6 space-y-5">
          {/* PIN Inputs */}
          <div className="space-y-3">
            <PinInput value={pin} onChange={setPin} disabled={loading} />

            {/* Progress bar */}
            <div className="flex gap-1 mt-2">
              {Array.from({ length: 6 }, (_, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex-1 h-0.5 rounded-full transition-all duration-300",
                    i < pin.length
                      ? "bg-emerald-500 dark:bg-emerald-400"
                      : "bg-zinc-200 dark:bg-zinc-800"
                  )}
                />
              ))}
            </div>

            <p
              className={cn(
                "text-center text-[10px] tracking-widest uppercase transition-colors duration-200",
                pin.length === 6
                  ? "text-emerald-500 dark:text-emerald-400"
                  : "text-zinc-300 dark:text-zinc-700"
              )}
            >
              {pin.length === 6 ? "✓ PIN ready" : `${pin.length} / 6 digits`}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertTriangle className="w-3.5 h-3.5 text-red-500 dark:text-red-400 shrink-0" />
              <p className="text-[11px] text-red-500 dark:text-red-400 leading-4">
                {error}
              </p>
            </div>
          )}

          {/* Submit button */}
          <Button
            onClick={handleSubmit}
            disabled={loading || !isReady}
            className={cn(
              "w-full text-xs font-bold tracking-widest uppercase gap-2 h-auto py-3",
              "bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white",
              "disabled:bg-zinc-100 dark:disabled:bg-zinc-800 disabled:text-zinc-300 dark:disabled:text-zinc-600 transition-all"
            )}
          >
            {loading ? (
              <>
                <Spinner className="border-white/40" />
                <span>Saving{dots}</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Save PIN</span>
              </>
            )}
          </Button>

          <p className="text-center text-[9px] sm:text-[10px] text-zinc-300 dark:text-zinc-700 tracking-wide">
            Your PIN is used locally to encrypt stored secrets.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
