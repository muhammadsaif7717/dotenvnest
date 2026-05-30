"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icon = {
  Sun: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
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
  Save: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  ),
  Warn: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  Check: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  ArrowLeft: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  ),
  X: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  Menu: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  ),
};

// ─── Spinner ──────────────────────────────────────────────────────────────────
const Spinner = ({ color = "#0a0a0a" }: { color?: string }) => (
  <span
    className="w-3.5 h-3.5 border-2 rounded-full animate-spin inline-block"
    style={{ borderColor: `${color} ${color} ${color} transparent` }}
  />
);

// ─── Account Page ─────────────────────────────────────────────────────────────
export default function AccountPage() {
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  useEffect(() => {
    fetch("/api/account")
      .then((res) => res.json())
      .then((data) => {
        if (data.username) {
          setUsername(data.username);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch account info", err);
      })
      .finally(() => {
        setIsFetching(false);
      });
  }, []);

  const canSubmit = username.trim().length > 0 && password.length > 0 && password === confirmPassword;

  const handleUpdateClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || isLoading) return;
    setOldPassword("");
    setError(null);
    setSuccess(null);
    setShowVerifyModal(true);
  };

  const handleVerifyAndSave = async () => {
    if (!oldPassword) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/account", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password, oldPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Failed to update account.");
      }

      setSuccess("Account updated successfully!");
      setPassword(""); // Clear password after successful update
      setConfirmPassword("");
      setShowVerifyModal(false);
      
      // Auto-hide success message
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] text-zinc-800 dark:text-[#e8e8e8] font-mono transition-colors duration-200 flex flex-col">
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

      {/* Verify Modal */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 dark:bg-black/70 backdrop-blur-sm" onClick={!isLoading ? () => setShowVerifyModal(false) : undefined} />
          <div className="relative bg-white dark:bg-[#0e0e0e] border border-zinc-200 dark:border-[#1e1e1e] rounded-xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-[#1a1a1a]">
              <span className="text-sm font-bold text-zinc-800 dark:text-[#e8e8e8] tracking-wide">Verify Identity</span>
              <button onClick={!isLoading ? () => setShowVerifyModal(false) : undefined} className="text-zinc-400 hover:text-zinc-700 dark:hover:text-[#e8e8e8] transition-colors p-1">
                <Icon.X />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <p className="text-xs text-zinc-500 dark:text-[#555]">
                Please enter your current password to authorize this change.
              </p>
              <div className="space-y-1.5">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-300 dark:text-[#333]">
                    <Icon.Lock />
                  </span>
                  <input
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Current Password"
                    autoComplete="current-password"
                    className="w-full bg-zinc-50 dark:bg-[#111] border border-zinc-200 dark:border-[#1e1e1e] rounded-lg pl-9 pr-4 py-3 text-sm text-zinc-800 dark:text-[#e8e8e8] placeholder-zinc-300 dark:placeholder-[#333] focus:outline-none focus:border-emerald-500 dark:focus:border-[#00ff88] focus:ring-1 focus:ring-emerald-500/20 dark:focus:ring-[#00ff88]/20 transition-all"
                    style={{ fontFamily: "'Courier New', monospace" }}
                  />
                </div>
              </div>
              
              {error && (
                <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-red-50 dark:bg-[#ff4444]/8 border border-red-200 dark:border-[#ff4444]/25 text-red-500 dark:text-[#ff4444] text-xs">
                  <Icon.Warn />
                  <span>{error}</span>
                </div>
              )}
            </div>
            <div className="flex gap-2.5 px-6 py-4 border-t border-zinc-100 dark:border-[#1a1a1a] bg-zinc-50 dark:bg-[#0a0a0a]">
              <button
                onClick={() => setShowVerifyModal(false)}
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 rounded-lg bg-white dark:bg-[#111] border border-zinc-200 dark:border-[#1e1e1e] text-sm text-zinc-500 dark:text-[#888] hover:text-zinc-800 dark:hover:text-[#e8e8e8] hover:border-zinc-300 dark:hover:border-[#333] transition-all disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                onClick={handleVerifyAndSave}
                disabled={isLoading || !oldPassword}
                className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2 ${
                  !oldPassword
                    ? "bg-zinc-100 dark:bg-[#111] text-zinc-300 dark:text-[#333] border border-zinc-200 dark:border-[#1e1e1e] cursor-not-allowed"
                    : isLoading
                    ? "bg-emerald-50 dark:bg-[#00ff88]/20 text-emerald-500 dark:text-[#00ff88] border border-emerald-300 dark:border-[#00ff88]/30 cursor-wait"
                    : "bg-emerald-500 dark:bg-[#00ff88] text-white dark:text-[#0a0a0a] hover:bg-emerald-600 dark:hover:bg-[#00e07a] active:scale-95"
                }`}
              >
                {isLoading ? (<><Spinner color="#00ff88" />Verifying...</>) : "Verify & Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Side Menu Overlay */}
      <div 
        className={`fixed inset-0 z-40 bg-black/20 dark:bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          isMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsMenuOpen(false)}
      />
      
      {/* Side Menu Panel */}
      <div 
        className={`fixed top-0 right-0 z-50 h-full w-72 bg-white dark:bg-[#0e0e0e] border-l border-zinc-200 dark:border-[#1a1a1a] shadow-2xl transform transition-transform duration-300 ease-in-out ${
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <span className="text-[11px] tracking-[0.25em] uppercase text-zinc-400 dark:text-[#555] font-bold">
              Menu
            </span>
            <button 
              onClick={() => setIsMenuOpen(false)}
              className="text-zinc-400 dark:text-[#444] hover:text-zinc-700 dark:hover:text-[#e8e8e8] transition-colors p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-[#1a1a1a]"
            >
              <Icon.X />
            </button>
          </div>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                setIsMenuOpen(false);
                router.push("/");
              }}
              className="flex items-center justify-between px-4 py-3.5 rounded-lg border border-zinc-200 dark:border-[#1e1e1e] bg-zinc-50 dark:bg-[#111] text-zinc-600 dark:text-[#aaa] hover:text-zinc-800 dark:hover:text-[#e8e8e8] hover:border-zinc-300 dark:hover:border-[#333] transition-all text-sm font-semibold tracking-wide w-full"
            >
              <div className="flex items-center gap-3">
                <Icon.ArrowLeft />
                <span>Return to Home</span>
              </div>
            </button>
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex items-center justify-between px-4 py-3.5 rounded-lg border border-zinc-200 dark:border-[#1e1e1e] bg-zinc-50 dark:bg-[#111] text-zinc-600 dark:text-[#aaa] hover:text-zinc-800 dark:hover:text-[#e8e8e8] hover:border-zinc-300 dark:hover:border-[#333] transition-all text-sm font-semibold tracking-wide w-full"
            >
              <div className="flex items-center gap-3">
                <span className="dark:hidden"><Icon.Moon /></span>
                <span className="hidden dark:inline"><Icon.Sun /></span>
                <span>Theme</span>
              </div>
              <span className="text-[10px] uppercase tracking-widest text-zinc-400 dark:text-[#555]">
                <span className="dark:hidden">Dark</span>
                <span className="hidden dark:inline">Light</span>
              </span>
            </button>
            <button
              onClick={() => {
                setIsMenuOpen(false);
                handleLogout();
              }}
              className="flex items-center justify-between px-4 py-3.5 rounded-lg border border-red-100 dark:border-[#ff4444]/20 bg-red-50/50 dark:bg-[#ff4444]/5 text-red-500 dark:text-[#ff4444] hover:bg-red-50 dark:hover:bg-[#ff4444]/10 hover:border-red-200 dark:hover:border-[#ff4444]/30 transition-all text-sm font-semibold tracking-wide w-full"
            >
              <div className="flex items-center gap-3">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                <span>Logout</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Top bar */}
      <div className="relative flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-[#141414]">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-[#00ff88] animate-pulse" />
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <span
              className="text-lg font-bold tracking-tight"
              style={{ fontFamily: "'Courier New', monospace" }}
            >
              <span className="text-emerald-500 dark:text-[#00ff88]">.</span>env
              <span className="text-zinc-300 dark:text-[#444] ml-2 text-sm font-semibold">manager</span>
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMenuOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-[#1e1e1e] bg-zinc-50 dark:bg-[#111] text-zinc-500 dark:text-[#555] hover:text-zinc-800 dark:hover:text-[#e8e8e8] hover:border-zinc-300 dark:hover:border-[#333] transition-all text-[11px] font-semibold tracking-wide uppercase"
            title="Open Menu"
          >
            <Icon.Menu />
            Menu
          </button>
        </div>
      </div>

      {/* Center card */}
      <div className="relative flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm">

          {/* Header */}
          <div className="mb-8">
            <p className="text-[11px] tracking-[0.25em] uppercase text-zinc-400 dark:text-[#555] font-semibold mb-2">
              Account Settings
            </p>
            <h1
              className="text-3xl font-bold tracking-tight"
              style={{ fontFamily: "'Courier New', monospace" }}
            >
              Update Profile
            </h1>
            <p className="text-zinc-400 dark:text-[#444] text-sm mt-1.5 tracking-wide">
              Manage your credentials.
            </p>
          </div>

          {/* Card */}
          <div className="rounded-xl border border-zinc-200 dark:border-[#1e1e1e] bg-zinc-50 dark:bg-[#0e0e0e] overflow-hidden shadow-sm">
            {/* VSCode-style title bar */}
            <div className="flex items-center gap-2 px-4 py-2.5 bg-zinc-100 dark:bg-[#0d0d0d] border-b border-zinc-200 dark:border-[#1e1e1e]">
              <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
              <span className="ml-2 text-[11px] text-zinc-400 dark:text-[#333] tracking-wider">
                account.env
              </span>
            </div>

            {isFetching ? (
              <div className="flex items-center justify-center p-12">
                <Spinner color={theme === "dark" ? "#00ff88" : "#10b981"} />
              </div>
            ) : (
              /* Form body */
              <form onSubmit={handleUpdateClick} className="p-6 space-y-5">
                {/* Username */}
                <div className="space-y-1.5">
                  <label className="text-[11px] tracking-[0.2em] uppercase text-zinc-400 dark:text-[#555] font-semibold">
                    New Username
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-300 dark:text-[#333]">
                      <Icon.User />
                    </span>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => { setUsername(e.target.value); setError(null); setSuccess(null); }}
                      placeholder="your_username"
                      autoComplete="username"
                      spellCheck={false}
                      className="w-full bg-white dark:bg-[#111] border border-zinc-200 dark:border-[#1e1e1e] rounded-lg pl-9 pr-4 py-3 text-sm text-zinc-800 dark:text-[#e8e8e8] placeholder-zinc-300 dark:placeholder-[#333] focus:outline-none focus:border-emerald-500 dark:focus:border-[#00ff88] focus:ring-1 focus:ring-emerald-500/20 dark:focus:ring-[#00ff88]/20 transition-all"
                      style={{ fontFamily: "'Courier New', monospace" }}
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label className="text-[11px] tracking-[0.2em] uppercase text-zinc-400 dark:text-[#555] font-semibold">
                    New Password
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-300 dark:text-[#333]">
                      <Icon.Lock />
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(null); setSuccess(null); }}
                      placeholder="••••••••••••"
                      autoComplete="new-password"
                      className="w-full bg-white dark:bg-[#111] border border-zinc-200 dark:border-[#1e1e1e] rounded-lg pl-9 pr-11 py-3 text-sm text-zinc-800 dark:text-[#e8e8e8] placeholder-zinc-300 dark:placeholder-[#333] focus:outline-none focus:border-emerald-500 dark:focus:border-[#00ff88] focus:ring-1 focus:ring-emerald-500/20 dark:focus:ring-[#00ff88]/20 transition-all"
                      style={{ fontFamily: "'Courier New', monospace" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-300 dark:text-[#444] hover:text-zinc-500 dark:hover:text-[#888] transition-colors p-0.5"
                    >
                      {showPassword ? <Icon.EyeOff /> : <Icon.Eye />}
                    </button>
                  </div>
                  <p className="text-[10px] text-zinc-400 dark:text-[#555] mt-1 text-right">
                    You will be logged out on other devices.
                  </p>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <label className="text-[11px] tracking-[0.2em] uppercase text-zinc-400 dark:text-[#555] font-semibold">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-300 dark:text-[#333]">
                      <Icon.Lock />
                    </span>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setError(null); setSuccess(null); }}
                      placeholder="••••••••••••"
                      autoComplete="new-password"
                      className={`w-full bg-white dark:bg-[#111] border rounded-lg pl-9 pr-11 py-3 text-sm text-zinc-800 dark:text-[#e8e8e8] placeholder-zinc-300 dark:placeholder-[#333] focus:outline-none focus:ring-1 transition-all ${
                        confirmPassword && password !== confirmPassword 
                          ? "border-red-300 dark:border-[#ff4444]/50 focus:border-red-500 dark:focus:border-[#ff4444] focus:ring-red-500/20 dark:focus:ring-[#ff4444]/20" 
                          : "border-zinc-200 dark:border-[#1e1e1e] focus:border-emerald-500 dark:focus:border-[#00ff88] focus:ring-emerald-500/20 dark:focus:ring-[#00ff88]/20"
                      }`}
                      style={{ fontFamily: "'Courier New', monospace" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-300 dark:text-[#444] hover:text-zinc-500 dark:hover:text-[#888] transition-colors p-0.5"
                    >
                      {showConfirmPassword ? <Icon.EyeOff /> : <Icon.Eye />}
                    </button>
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-[10px] text-red-500 dark:text-[#ff4444] mt-1 text-right">
                      Passwords do not match.
                    </p>
                  )}
                </div>

                {/* Messages */}
                {error && (
                  <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-red-50 dark:bg-[#ff4444]/8 border border-red-200 dark:border-[#ff4444]/25 text-red-500 dark:text-[#ff4444] text-xs">
                    <Icon.Warn />
                    <span>{error}</span>
                  </div>
                )}
                {success && (
                  <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-emerald-50 dark:bg-[#00ff88]/8 border border-emerald-200 dark:border-[#00ff88]/25 text-emerald-600 dark:text-[#00ff88] text-xs">
                    <Icon.Check />
                    <span>{success}</span>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={!canSubmit || isLoading}
                  className={`w-full flex items-center justify-center gap-2.5 py-3 rounded-lg text-sm font-bold tracking-widest uppercase transition-all duration-200 mt-1 ${
                    !canSubmit
                      ? "bg-zinc-100 dark:bg-[#111] text-zinc-300 dark:text-[#333] border border-zinc-200 dark:border-[#1e1e1e] cursor-not-allowed"
                      : isLoading
                      ? "bg-emerald-50 dark:bg-[#00ff88]/20 text-emerald-500 dark:text-[#00ff88] border border-emerald-300 dark:border-[#00ff88]/30 cursor-wait"
                      : "bg-emerald-500 dark:bg-[#00ff88] text-white dark:text-[#0a0a0a] hover:bg-emerald-600 dark:hover:bg-[#00e07a] active:scale-[0.98]"
                  }`}
                >
                  {isLoading ? (
                    <>
                      <Spinner color={theme === "dark" ? "#00ff88" : "#10b981"} />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Icon.Save />
                      Save Changes
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Footer note */}
          <p className="text-center text-[11px] text-zinc-300 dark:text-[#2a2a2a] mt-6 tracking-widest uppercase">
            ENV VAULT · Secure · Private
          </p>
        </div>
      </div>
    </div>
  );
}
