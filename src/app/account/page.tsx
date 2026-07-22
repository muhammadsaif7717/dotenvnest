"use client";

import React, { useState } from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icon = {
  Sun: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  ),
  Moon: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  ),
  Lock: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  Shield: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  User: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Mail: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  ),
  Eye: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  EyeOff: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ),
  Warn: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-px">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  Check: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="shrink-0 mt-px">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  ArrowLeft: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  ),
  ChevronRight: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  Menu: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  ),
  Logout: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  Home: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  Terminal: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" y1="19" x2="20" y2="19" />
    </svg>
  ),
  Copy: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  ),
  CheckCircle: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
};

// ─── Spinner ──────────────────────────────────────────────────────────────────
const Spinner = ({ className }: { className?: string }) => (
  <span
    className={cn(
      "w-3.5 h-3.5 border-2 border-t-transparent rounded-full animate-spin inline-block shrink-0",
      className
    )}
  />
);

// ─── Field Label ──────────────────────────────────────────────────────────────
function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <Label className="text-[10px] tracking-[0.18em] uppercase text-zinc-400 dark:text-zinc-600 font-semibold">
      {children}
    </Label>
  );
}

// ─── Styled Input ─────────────────────────────────────────────────────────────
function StyledInput({
  icon,
  error,
  right,
  ...props
}: React.ComponentProps<typeof Input> & {
  icon?: React.ReactNode;
  error?: boolean;
  right?: React.ReactNode;
}) {
  return (
    <div className="relative">
      {icon && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-300 dark:text-zinc-700 pointer-events-none">
          {icon}
        </span>
      )}
      <Input
        {...props}
        className={cn(
          "font-mono text-xs sm:text-sm bg-zinc-50 dark:bg-zinc-900 h-auto py-2.5 sm:py-3 transition-all",
          icon ? "pl-9" : "pl-3",
          right ? "pr-10" : "pr-3",
          error
            ? "border-red-300 dark:border-red-800 focus-visible:border-red-400 focus-visible:ring-red-500/15"
            : "border-zinc-200 dark:border-zinc-800 focus-visible:border-emerald-500 dark:focus-visible:border-emerald-400 focus-visible:ring-emerald-500/20",
          props.className
        )}
        style={{ fontFamily: "'Courier New', monospace" }}
      />
      {right && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          {right}
        </div>
      )}
    </div>
  );
}

// ─── Modal titlebar (VSCode dots) ─────────────────────────────────────────────
function ModalTitleBar({ filename }: { filename: string }) {
  return (
    <div className="flex items-center gap-1.5 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
      <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
      <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
      <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
      <span className="ml-2 text-[10px] text-zinc-400 dark:text-zinc-600 tracking-wider font-mono">{filename}</span>
    </div>
  );
}

// ─── Alert inline ─────────────────────────────────────────────────────────────
function InlineAlert({ type, message }: { type: "error" | "success"; message: string }) {
  const isError = type === "error";
  return (
    <div className={cn(
      "flex items-start gap-2 px-3 py-2.5 rounded-lg border text-[11px] font-mono",
      isError
        ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-500 dark:text-red-400"
        : "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400"
    )}>
      {isError ? <Icon.Warn /> : <Icon.Check />}
      <span>{message}</span>
    </div>
  );
}

// ─── Modal footer buttons ─────────────────────────────────────────────────────
function ModalFooter({
  onCancel,
  onConfirm,
  confirmLabel = "Continue",
  confirmDisabled,
  loading,
  loadingLabel = "Saving…",
  cancelLabel = "Cancel",
}: {
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel?: string;
  confirmDisabled?: boolean;
  loading?: boolean;
  loadingLabel?: string;
  cancelLabel?: string;
}) {
  return (
    <DialogFooter className="flex-row gap-2 px-5 sm:px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
      <Button
        variant="outline"
        onClick={onCancel}
        disabled={loading}
        className="flex-1 h-auto py-2.5 text-xs font-semibold tracking-wide border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-100"
      >
        {cancelLabel}
      </Button>
      <Button
        onClick={onConfirm}
        disabled={confirmDisabled || loading}
        className={cn(
          "flex-1 h-auto py-2.5 text-xs font-bold tracking-widest uppercase gap-2",
          "bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white",
          "disabled:bg-zinc-100 dark:disabled:bg-zinc-800 disabled:text-zinc-300 dark:disabled:text-zinc-600 transition-all"
        )}
      >
        {loading ? (
          <><Spinner className="border-white/40" /><span>{loadingLabel}</span></>
        ) : (
          confirmLabel
        )}
      </Button>
    </DialogFooter>
  );
}

// ─── Setting Row ──────────────────────────────────────────────────────────────
function SettingRow({
  icon,
  label,
  sublabel,
  tag,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  tag?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full group flex items-center justify-between px-4 py-3.5 sm:py-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200 text-left"
    >
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        {/* Icon box */}
        <div className="w-8 h-8 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shrink-0 text-zinc-400 dark:text-zinc-600 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/40 group-hover:border-emerald-200 dark:group-hover:border-emerald-800 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-all">
          {icon}
        </div>
        {/* Text */}
        <div className="min-w-0">
          <p className="text-xs sm:text-sm font-semibold text-zinc-800 dark:text-zinc-100 tracking-wide">
            {label}
          </p>
          {sublabel && (
            <p className="text-[10px] sm:text-[11px] text-zinc-400 dark:text-zinc-600 mt-0.5 truncate">
              {sublabel}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-3">
        {tag && (
          <span className="hidden sm:inline text-[9px] tracking-widest uppercase px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 text-zinc-300 dark:text-zinc-700 font-semibold">
            {tag}
          </span>
        )}
        <span className="text-zinc-300 dark:text-zinc-700 group-hover:text-emerald-400 dark:group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all">
          <Icon.ChevronRight />
        </span>
      </div>
    </button>
  );
}

// ─── Account Page ─────────────────────────────────────────────────────────────
export default function AccountPage() {
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  const [currentEmail, setCurrentEmail] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmNewPin, setConfirmNewPin] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeModal, setActiveModal] = useState<"email" | "password" | "pin" | "verify" | "otp" | null>(null);

  const [pendingAction, setPendingAction] = useState<"email" | "password" | "pin" | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);


  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const { isFetching, refetch } = useQuery({
    queryKey: ["account"],
    queryFn: async () => {
      const res = await fetch("/api/account");
      if (res.status === 401) {
        router.push("/login");
        return null;
      }
      const data = await res.json();
      if (data.email) {
        setCurrentEmail(data.email);
        setEmailInput(data.email);
      }
      return data;
    },
    refetchOnWindowFocus: false,
  });

  const resetForms = () => {
    setEmailInput(currentEmail);
    setPassword(""); setConfirmPassword("");
    setCurrentPin(""); setNewPin(""); setConfirmNewPin("");
    setOldPassword(""); setError(null); setSuccess(null);
  };

  const closeModal = () => {
    setActiveModal(null);
    setPendingAction(null);
    setTimeout(resetForms, 300);
  };

  const handleOpenModal = (type: "email" | "password" | "pin") => {
    resetForms();
    setActiveModal(type);
  };

  const proceedToVerify = (action: "email" | "password" | "pin") => {
    setError(null); setSuccess(null);
    setPendingAction(action);
    setActiveModal("verify");
  };

  const accountMutation = useMutation({
    mutationFn: async () => {
      if (pendingAction === "email" || pendingAction === "password") {
        const payload: { oldPassword: string; email?: string; password?: string } = { oldPassword };
        if (pendingAction === "email") payload.email = emailInput.trim();
        if (pendingAction === "password") payload.password = password;
        const res = await fetch("/api/account", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "Failed to update account.");
        return data;
      } else if (pendingAction === "pin") {
        const res = await fetch("/api/user/change-pin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currentPin, newPin }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to update PIN.");
        return data;
      }
      return { success: true };
    },
    onSuccess: (data: { requireVerification?: boolean }) => {
      setSuccess("Updated successfully!");
      if (data && data.requireVerification) {
        setTimeout(() => {
          router.push(`/verify?email=${encodeURIComponent(emailInput.trim())}`);
        }, 1000);
      } else {
        refetch();
        setTimeout(closeModal, 1500);
      }
    },
    onError: (err: Error) => {
      setError(err.message || "Something went wrong.");
    },
    onSettled: () => setIsLoading(false),
  });

  const handleVerifyAndSave = () => {
    if (!oldPassword) return;
    setIsLoading(true); setError(null); setSuccess(null);
    accountMutation.mutate();
  };


  const isEmailValid = emailInput.trim().length > 0 && emailInput !== currentEmail;
  const isPasswordValid = password.length > 0 && password === confirmPassword;
  const isPinValid = currentPin.length === 6 && newPin.length === 6 && newPin === confirmNewPin;

  const dialogBaseClass = "w-[calc(100vw-1.5rem)] sm:max-w-sm p-0 gap-0 overflow-hidden font-mono rounded-xl border border-zinc-200 dark:border-zinc-800";

  return (
    <div className="min-h-screen min-h-dvh bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 font-mono transition-colors duration-200">

      {/* Grid background – light */}
      <div className="fixed inset-0 pointer-events-none dark:hidden" style={{ backgroundImage: "linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
      {/* Grid background – dark */}
      <div className="fixed inset-0 pointer-events-none hidden dark:block" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

      {/* ── Side Menu Sheet ───────────────────────────────────────────────── */}
      <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <SheetContent side="right" className="w-[270px] sm:w-72 font-mono p-0 border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <SheetHeader className="px-5 sm:px-6 py-4 sm:py-5 border-b border-zinc-100 dark:border-zinc-800">
            <SheetTitle className="text-[11px] tracking-[0.25em] uppercase text-zinc-400 dark:text-zinc-600 font-bold text-left">
              Menu
            </SheetTitle>
          </SheetHeader>
          <div className="p-4 sm:p-5 flex flex-col gap-2.5">
            <Button
              variant="outline"
              onClick={() => { setIsMenuOpen(false); router.push("/"); }}
              className="justify-start gap-3 h-10 sm:h-11 text-sm font-semibold tracking-wide border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100"
            >
              <Icon.Home />
              Return to Home
            </Button>
            <Button
              variant="outline"
              className="justify-between h-10 sm:h-11 text-sm font-semibold tracking-wide border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <div className="flex items-center gap-3">
                {theme === "dark" ? <Icon.Sun /> : <Icon.Moon />}
                Theme
              </div>
              <span className="text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
                {theme === "dark" ? "Light" : "Dark"}
              </span>
            </Button>
            <Separator className="my-0.5" />
            <Button
              variant="outline"
              className="justify-start gap-3 h-10 sm:h-11 text-sm font-semibold tracking-wide border-red-100 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/30 text-red-500 dark:text-red-400 hover:bg-red-50 hover:border-red-200 dark:hover:bg-red-950/50"
              onClick={() => { setIsMenuOpen(false); handleLogout(); }}
            >
              <Icon.Logout />
              Logout
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <header className="relative border-b border-zinc-100 dark:border-zinc-900 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-base sm:text-lg font-bold tracking-tight" style={{ fontFamily: "'Courier New', monospace" }}>
            <span className="text-emerald-500 dark:text-emerald-400">.</span>env
            <span className="text-zinc-300 dark:text-zinc-700 ml-1.5 text-xs sm:text-sm font-semibold">nest</span>
          </span>
        </Link>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMenuOpen(true)}
          className="text-[10px] sm:text-[11px] font-semibold tracking-wide uppercase gap-1.5 h-8 px-2.5 sm:px-3 border-zinc-200 dark:border-zinc-800"
        >
          <Icon.Menu />
          <span className="hidden xs:inline">Menu</span>
        </Button>
      </header>

      {/* ── Main ─────────────────────────────────────────────────────────── */}
      <main className="relative max-w-xl mx-auto px-4 sm:px-6 py-8 sm:py-12 md:py-16">

        {/* Page heading */}
        <div className="mb-8 sm:mb-10">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-[10px] sm:text-[11px] tracking-[0.22em] uppercase text-zinc-400 dark:text-zinc-600 font-semibold">
              Account Settings
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ fontFamily: "'Courier New', monospace" }}>
            Update Profile
          </h1>
          <p className="text-zinc-400 dark:text-zinc-600 text-xs sm:text-sm mt-1.5 tracking-wide">
            Manage your credentials securely.
          </p>
        </div>

        {/* VSCode card */}
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          {/* Title bar */}
          <div className="flex items-center gap-1.5 px-3 sm:px-4 py-2.5 bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
            <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
            <span className="ml-2 text-[10px] text-zinc-400 dark:text-zinc-600 tracking-wider">account.env</span>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-5 space-y-2.5">
            {isFetching ? (
              <div className="flex items-center justify-center py-12">
                <Spinner className="border-emerald-500/40 border-t-emerald-500" />
              </div>
            ) : (
              <>
                <SettingRow
                  icon={<Icon.Mail />}
                  label="Change Email"
                  sublabel={currentEmail || "Loading…"}
                  tag="CREDENTIAL"
                  onClick={() => handleOpenModal("email")}
                />
                <SettingRow
                  icon={<Icon.Lock />}
                  label="Change Password"
                  sublabel="Update your account password"
                  tag="SECURITY"
                  onClick={() => handleOpenModal("password")}
                />
                <SettingRow
                  icon={<Icon.Shield />}
                  label="Change PIN"
                  sublabel="Update your 6-digit encryption PIN"
                  tag="ENCRYPT"
                  onClick={() => handleOpenModal("pin")}
                />
              </>
            )}
          </div>
        </div>



        {/* Footer note */}
        <p className="text-center text-[9px] sm:text-[10px] text-zinc-200 dark:text-zinc-800 mt-6 sm:mt-8 tracking-widest uppercase">
          DOTENVNEST · Secure · Private
        </p>
      </main>

      {/* ══════════════════════════════════════════════════════════════════
          DIALOGS
      ══════════════════════════════════════════════════════════════════ */}

      {/* 1. Email Modal */}
      <Dialog open={activeModal === "email"} onOpenChange={(o: boolean) => !o && closeModal()}>
        <DialogContent className={dialogBaseClass}>
          <ModalTitleBar filename="change-email.env" />
          <DialogHeader className="px-5 sm:px-6 pt-5 pb-0">
            <DialogTitle className="text-sm font-bold tracking-wide flex items-center gap-2.5">
              <span className="w-6 h-6 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-500 dark:text-zinc-400">
                <Icon.Mail />
              </span>
              Change Email
            </DialogTitle>
          </DialogHeader>
          <div className="px-5 sm:px-6 py-5 space-y-4">
            <div className="space-y-1.5">
              <FieldLabel>Current Email</FieldLabel>
              <div className="text-xs font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2.5 text-zinc-500 dark:text-zinc-500 truncate">
                {currentEmail}
              </div>
            </div>
            <div className="space-y-1.5">
              <FieldLabel>New Email</FieldLabel>
              <StyledInput
                type="email"
                value={emailInput}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmailInput(e.target.value)}
                placeholder="new@example.com"
                autoComplete="email"
                icon={<Icon.Mail />}
              />
            </div>
          </div>
          <ModalFooter
            onCancel={closeModal}
            onConfirm={() => proceedToVerify("email")}
            confirmDisabled={!isEmailValid}
          />
        </DialogContent>
      </Dialog>

      {/* 2. Password Modal */}
      <Dialog open={activeModal === "password"} onOpenChange={(o: boolean) => !o && closeModal()}>
        <DialogContent className={dialogBaseClass}>
          <ModalTitleBar filename="change-password.env" />
          <DialogHeader className="px-5 sm:px-6 pt-5 pb-0">
            <DialogTitle className="text-sm font-bold tracking-wide flex items-center gap-2.5">
              <span className="w-6 h-6 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-500 dark:text-zinc-400">
                <Icon.Lock />
              </span>
              Change Password
            </DialogTitle>
          </DialogHeader>
          <div className="px-5 sm:px-6 py-5 space-y-4">
            <div className="space-y-1.5">
              <FieldLabel>New Password</FieldLabel>
              <StyledInput
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                autoComplete="new-password"
                icon={<Icon.Lock />}
                right={
                  <button
                    type="button"
                    onClick={() => setShowPassword((s: boolean) => !s)}
                    className="p-1 text-zinc-300 dark:text-zinc-700 hover:text-zinc-500 dark:hover:text-zinc-400 transition-colors"
                  >
                    {showPassword ? <Icon.EyeOff /> : <Icon.Eye />}
                  </button>
                }
              />
            </div>
            <div className="space-y-1.5">
              <FieldLabel>Confirm New Password</FieldLabel>
              <StyledInput
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                autoComplete="new-password"
                icon={<Icon.Lock />}
                error={confirmPassword.length > 0 && password !== confirmPassword}
                right={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((s: boolean) => !s)}
                    className="p-1 text-zinc-300 dark:text-zinc-700 hover:text-zinc-500 dark:hover:text-zinc-400 transition-colors"
                  >
                    {showConfirmPassword ? <Icon.EyeOff /> : <Icon.Eye />}
                  </button>
                }
              />
              {confirmPassword.length > 0 && password !== confirmPassword && (
                <p className="text-[10px] text-red-500 dark:text-red-400 text-right tracking-wide">
                  Passwords do not match
                </p>
              )}
            </div>
            <p className="text-[10px] text-zinc-300 dark:text-zinc-700 text-right tracking-wide">
              You will be logged out on other devices.
            </p>
          </div>
          <ModalFooter
            onCancel={closeModal}
            onConfirm={() => proceedToVerify("password")}
            confirmDisabled={!isPasswordValid}
          />
        </DialogContent>
      </Dialog>

      {/* 3. PIN Modal */}
      <Dialog open={activeModal === "pin"} onOpenChange={(o: boolean) => !o && closeModal()}>
        <DialogContent className={dialogBaseClass}>
          <ModalTitleBar filename="change-pin.env" />
          <DialogHeader className="px-5 sm:px-6 pt-5 pb-0">
            <DialogTitle className="text-sm font-bold tracking-wide flex items-center gap-2.5">
              <span className="w-6 h-6 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-500 dark:text-zinc-400">
                <Icon.Shield />
              </span>
              Change Security PIN
            </DialogTitle>
          </DialogHeader>
          <div className="px-5 sm:px-6 py-5 space-y-4">
            {[
              { label: "Current PIN", value: currentPin, setter: setCurrentPin },
              { label: "New PIN", value: newPin, setter: setNewPin, error: newPin.length > 0 && newPin.length !== 6 },
              { label: "Confirm New PIN", value: confirmNewPin, setter: setConfirmNewPin, error: confirmNewPin.length > 0 && newPin !== confirmNewPin },
            ].map(({ label, value, setter, error }) => (
              <div key={label} className="space-y-1.5">
                <FieldLabel>{label}</FieldLabel>
                <StyledInput
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={value}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setter(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="••••••"
                  icon={<Icon.Lock />}
                  error={error}
                />
                {/* PIN progress dots */}
                <div className="flex gap-1 px-0.5">
                  {Array.from({ length: 6 }, (_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex-1 h-0.5 rounded-full transition-all duration-200",
                        i < value.length
                          ? "bg-emerald-500 dark:bg-emerald-400"
                          : "bg-zinc-200 dark:bg-zinc-800"
                      )}
                    />
                  ))}
                </div>
              </div>
            ))}
            {confirmNewPin.length > 0 && newPin !== confirmNewPin && (
              <p className="text-[10px] text-red-500 dark:text-red-400 text-right tracking-wide -mt-2">
                PINs do not match
              </p>
            )}
          </div>
          <ModalFooter
            onCancel={closeModal}
            onConfirm={() => proceedToVerify("pin")}
            confirmDisabled={!isPinValid}
          />
        </DialogContent>
      </Dialog>

      {/* 4. Verify Identity */}
      <Dialog
        open={activeModal === "verify"}
        onOpenChange={(o: boolean) => { if (!isLoading && !o) closeModal(); }}
      >
        <DialogContent className={dialogBaseClass}>
          <ModalTitleBar filename="verify-identity.env" />
          <DialogHeader className="px-5 sm:px-6 pt-5 pb-0">
            <DialogTitle className="text-sm font-bold tracking-wide flex items-center gap-2.5">
              <span className="w-6 h-6 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-500 dark:text-zinc-400">
                <Icon.Lock />
              </span>
              Verify Identity
            </DialogTitle>
          </DialogHeader>
          <div className="px-5 sm:px-6 py-5 space-y-4">
            <p className="text-[11px] text-zinc-400 dark:text-zinc-600 leading-5">
              Enter your current password to authorize this change.
            </p>
            <div className="space-y-1.5">
              <FieldLabel>Current Password</FieldLabel>
              <StyledInput
                type="password"
                value={oldPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOldPassword(e.target.value)}
                placeholder="••••••••••••"
                autoComplete="current-password"
                icon={<Icon.Lock />}
                onKeyDown={(e: React.KeyboardEvent) => e.key === "Enter" && !isLoading && oldPassword && handleVerifyAndSave()}
              />
            </div>
            {error && <InlineAlert type="error" message={error} />}
            {success && <InlineAlert type="success" message={success} />}
          </div>
          <ModalFooter
            onCancel={() => setActiveModal(pendingAction)}
            cancelLabel="Back"
            onConfirm={handleVerifyAndSave}
            confirmLabel="Verify & Save"
            loadingLabel="Verifying…"
            confirmDisabled={!oldPassword || !!success}
            loading={isLoading}
          />
        </DialogContent>
      </Dialog>

    </div>
  );
}