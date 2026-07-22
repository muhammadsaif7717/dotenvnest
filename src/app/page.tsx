"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { postEnv, getAllEnv, deleteAEnv, updateAEnv, shareEnv, leaveSharedEnv, EnvProject, SharedUser } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// shadcn/ui imports
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import {
  Save,
  Copy,
  Check,
  Pencil,
  Trash2,
  Upload,
  Search,
  ArrowUpDown,
  RefreshCw,
  AlertTriangle,
  Sun,
  Moon,
  Menu,
  LogOut,
  User,
  FileText,
  Plus,
  Download,
  X,
  UserPlus,
  UserMinus,
  Users,
  ChevronDown,
  Clock,
  Calendar,
  Tag,
  FolderOpen,
  UserCheck,
  Share2,
} from "lucide-react";
import { computeDiff } from "@/lib/diff";

// ─── Spinner ──────────────────────────────────────────────────────────────────
const Spinner = ({ className }: { className?: string }) => (
  <span
    className={cn(
      "w-3.5 h-3.5 border-2 border-t-transparent rounded-full animate-spin inline-block shrink-0",
      className
    )}
  />
);

// ─── VSCode-style Env Editor ──────────────────────────────────────────────────
function EnvEditor({
  value,
  onChange,
  rows = 14,
  fileName = ".env",
  readOnly = false,
}: {
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  fileName?: string;
  readOnly?: boolean;
}) {
  const keyCount = value
    .split("\n")
    .filter((l) => l.trim() && !l.trim().startsWith("#") && l.includes("="))
    .length;

  const lineCount = (value || "\n").split("\n").length;

  return (
    <div className="rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 focus-within:border-emerald-500 dark:focus-within:border-emerald-400 focus-within:ring-1 focus-within:ring-emerald-500/20 transition-all">
      {/* Title bar */}
      <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#ff5f56]" />
        <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#ffbd2e]" />
        <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#27c93f]" />
        <span className="ml-1 sm:ml-2 text-[10px] sm:text-[11px] text-zinc-400 dark:text-zinc-600 tracking-wider truncate">
          {fileName}
        </span>
        {value && (
          <Badge
            variant="outline"
            className="ml-auto text-[9px] sm:text-[10px] py-0 px-1.5 h-4 text-zinc-400 dark:text-zinc-600 border-zinc-200 dark:border-zinc-700 shrink-0"
          >
            {keyCount} keys
          </Badge>
        )}
      </div>

      {/* Editor body */}
      <div className="flex bg-zinc-50 dark:bg-zinc-950">
        {/* Line numbers */}
        <div
          aria-hidden
          className="select-none px-2 sm:px-3 pt-3 text-right text-zinc-300 dark:text-zinc-700 text-xs leading-6 border-r border-zinc-200 dark:border-zinc-800 shrink-0"
          style={{ minWidth: lineCount >= 10 ? "2.75rem" : "2rem" }}
        >
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        {/* Textarea */}
        <textarea
          value={value}
          onChange={(e) => !readOnly && onChange(e.target.value)}
          readOnly={readOnly}
          placeholder={"DATABASE_URL=mongodb://...\nAPI_KEY=your_key\nSECRET=your_secret"}
          rows={rows}
          spellCheck={false}
          className="flex-1 bg-transparent pl-3 sm:pl-4 pr-3 sm:pr-4 pt-3 pb-3 text-xs sm:text-sm text-emerald-700 dark:text-emerald-300 placeholder-zinc-300 dark:placeholder-zinc-700 focus:outline-none resize-none leading-6 w-full min-w-0"
          style={{ fontFamily: "'Courier New', monospace" }}
        />
      </div>
    </div>
  );
}

// ─── Update Modal ─────────────────────────────────────────────────────────────
function UpdateModal({
  env,
  open,
  onSave,
  onClose,
}: {
  env: EnvProject | null;
  open: boolean;
  onSave: (id: string, name: string, content: string, tags: string[]) => Promise<void>;
  onClose: () => void;
}) {
  const [name, setName] = useState(env?.projectName ?? "");
  const [content, setContent] = useState(env?.envContent ?? "");
  const [tagsString, setTagsString] = useState(env?.tags?.join(", ") ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [prevEnv, setPrevEnv] = useState<EnvProject | null>(env);
  if (env !== prevEnv) {
    setPrevEnv(env);
    setName(env?.projectName ?? "");
    setContent(env?.envContent ?? "");
    setTagsString(env?.tags?.join(", ") ?? "");
    setError(false);
  }

  const isReadOnly = Boolean(env?.isShared && env?.userRole === "viewer");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setContent(ev.target?.result as string);
    reader.readAsText(file);
  };

  const handleSave = async () => {
    if (!env || !name.trim() || !content.trim() || isReadOnly) return;
    setIsSaving(true);
    setError(false);
    try {
      const tags = tagsString.split(",").map(t => t.trim()).filter(Boolean);
      await onSave(env._id, name.trim(), content.trim(), tags);
      onClose();
    } catch {
      setError(true);
    } finally {
      setIsSaving(false);
    }
  };

  const unchanged =
    name.trim() === env?.projectName && content.trim() === env?.envContent && tagsString.trim() === (env?.tags?.join(", ") ?? "");

  const diffs = useMemo(() => computeDiff(env?.envContent ?? "", content), [env?.envContent, content]);
  const hasChanges = diffs.some(d => d.status !== "unchanged");

  return (
    <Dialog open={open} onOpenChange={(o) => !isSaving && !o && onClose()}>
      <DialogContent className="w-[calc(100vw-1.5rem)] sm:w-[calc(100vw-3rem)] sm:max-w-xl md:max-w-2xl max-h-[90dvh] p-0 gap-0 overflow-hidden font-mono rounded-xl">
        <DialogHeader className="px-4 sm:px-6 py-3 sm:py-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shrink-0">
              <span className="text-emerald-500 dark:text-emerald-400 text-[9px] font-bold">.ev</span>
            </div>
            <DialogTitle className="text-sm font-bold tracking-wide">
              {isReadOnly ? "View Env (Read-Only)" : "Update Env"}
            </DialogTitle>
          </div>
          <DialogDescription className="sr-only">
            Update your project's environment variables configurations.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[58dvh] sm:max-h-[62dvh]">
          <div className="px-4 sm:px-6 py-4 sm:py-5 space-y-4 sm:space-y-5">
            <div className="space-y-1.5">
              <Label className="text-[10px] sm:text-[11px] tracking-[0.2em] uppercase text-zinc-400 dark:text-zinc-500 font-semibold">
                Project Name
              </Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isReadOnly}
                className="font-mono text-xs sm:text-sm bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500 h-auto py-2.5 sm:py-3"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] sm:text-[11px] tracking-[0.2em] uppercase text-zinc-400 dark:text-zinc-500 font-semibold">
                Tags (comma separated)
              </Label>
              <Input
                value={tagsString}
                onChange={(e) => setTagsString(e.target.value)}
                disabled={isReadOnly}
                placeholder="Personal, API, Prod..."
                className="font-mono text-xs sm:text-sm bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500 placeholder:text-zinc-300 dark:placeholder:text-zinc-700 h-auto py-2.5 sm:py-3"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label className="text-[10px] sm:text-[11px] tracking-[0.2em] uppercase text-zinc-400 dark:text-zinc-500 font-semibold">
                  Environment Variables
                </Label>
                {!isReadOnly && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[10px] sm:text-[11px] h-7 px-2 sm:px-2.5 gap-1.5 text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 border-zinc-200 dark:border-zinc-700"
                    >
                      <Upload className="w-3 h-3" />
                      Upload .env
                    </Button>
                    <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
                  </>
                )}
              </div>
              <EnvEditor value={content} onChange={setContent} rows={8} readOnly={isReadOnly} />
            </div>

            {!isReadOnly && hasChanges && (
              <div className="space-y-1.5 mt-2">
                <Label className="text-[10px] sm:text-[11px] tracking-[0.2em] uppercase text-zinc-400 dark:text-zinc-500 font-semibold">
                  Changes Preview
                </Label>
                <div className="bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md p-2.5 text-xs font-mono space-y-1 max-h-32 overflow-y-auto">
                  {diffs.filter(d => d.status !== "unchanged").map(d => (
                    <div key={d.key} className="flex gap-2 items-center">
                      {d.status === "added" && <span className="text-emerald-500 font-semibold">+ {d.key}</span>}
                      {d.status === "removed" && <span className="text-red-500 font-semibold">- {d.key}</span>}
                      {d.status === "changed" && <span className="text-amber-500 font-semibold">~ {d.key} <span className="text-zinc-400 text-[10px] font-normal">(modified)</span></span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <p className="text-red-500 dark:text-red-400 text-xs">
                Failed to update. Please try again.
              </p>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="flex-row gap-2 px-4 sm:px-6 py-3 sm:py-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 text-xs sm:text-sm border-zinc-200 dark:border-zinc-700 h-auto py-2.5 sm:py-3"
          >
            {isReadOnly ? "Close" : "Cancel"}
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || unchanged || !name.trim() || !content.trim() || isReadOnly}
            className={cn(
              "flex-1 text-xs sm:text-sm font-bold tracking-widest uppercase gap-2 h-auto py-2.5 sm:py-3",
              "bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white",
              "disabled:bg-zinc-100 dark:disabled:bg-zinc-800 disabled:text-zinc-300 dark:disabled:text-zinc-600"
            )}
          >
            {isSaving ? (
              <><Spinner className="border-white/40" /><span>Saving…</span></>
            ) : isReadOnly ? (
              <span>Read-Only Mode</span>
            ) : (
              <><Save className="w-3.5 h-3.5" /><span>Save Changes</span></>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Share Modal ─────────────────────────────────────────────────────────────
interface ShareModalProps {
  env: EnvProject | null;
  open: boolean;
  onClose: () => void;
}

function ShareModal({ env, open, onClose }: ShareModalProps) {
  const [emailInput, setEmailInput] = useState("");
  const [emails, setEmails] = useState<string[]>([]);
  const [role, setRole] = useState<"viewer" | "editor">("viewer");
  const [sharedList, setSharedList] = useState<SharedUser[]>(env?.sharedWith ?? []);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const queryClient = useQueryClient();

  const [prevEnv, setPrevEnv] = useState<EnvProject | null>(env);
  if (env !== prevEnv) {
    setPrevEnv(env);
    setSharedList(env?.sharedWith ?? []);
    setEmails([]);
    setEmailInput("");
    setRole("viewer");
    setError("");
    setSuccess(false);
  }

  const handleAddEmail = () => {
    const trimmed = emailInput.trim().toLowerCase();
    if (!trimmed) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (emails.includes(trimmed) || sharedList.some((s) => s.email === trimmed)) {
      setError("Email already added.");
      return;
    }

    setEmails([...emails, trimmed]);
    setEmailInput("");
    setError("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "Tab" || e.key === ",") {
      e.preventDefault();
      handleAddEmail();
    }
  };

  const removeChip = (email: string) => {
    setEmails(emails.filter((e) => e !== email));
  };

  const handleSave = async () => {
    if (!env) return;
    setIsSaving(true);
    setError("");
    setSuccess(false);

    const newShares: SharedUser[] = emails.map((email) => ({
      email,
      role,
    }));
    const updatedList = [...sharedList, ...newShares];

    try {
      await shareEnv(env._id, updatedList);
      setSharedList(updatedList);
      setEmails([]);
      setSuccess(true);
      queryClient.invalidateQueries({ queryKey: ["envs"] });
      setTimeout(() => setSuccess(false), 2000);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to update sharing permissions.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRoleChange = async (email: string, newRole: "viewer" | "editor") => {
    if (!env) return;
    const updatedList = sharedList.map((item) =>
      item.email === email ? { ...item, role: newRole } : item
    );
    setSharedList(updatedList);
    try {
      await shareEnv(env._id, updatedList);
      queryClient.invalidateQueries({ queryKey: ["envs"] });
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to update role.");
    }
  };

  const handleRevoke = async (email: string) => {
    if (!env) return;
    const updatedList = sharedList.filter((item) => item.email !== email);
    setSharedList(updatedList);
    try {
      await shareEnv(env._id, updatedList);
      queryClient.invalidateQueries({ queryKey: ["envs"] });
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to revoke access.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !isSaving && !o && onClose()}>
      <DialogContent className="w-[calc(100vw-1.5rem)] sm:max-w-md font-mono rounded-xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-4 sm:px-6 py-3 sm:py-4 border-b border-zinc-100 dark:border-zinc-800">
          <DialogTitle className="text-sm font-bold tracking-wide flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-emerald-500" />
            Share Project: {env?.projectName}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Manage sharing permissions and user access levels for this project.
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 sm:p-6 space-y-4 max-h-[70dvh] overflow-y-auto">
          <div className="space-y-1.5">
            <Label className="text-[10px] sm:text-[11px] tracking-[0.2em] uppercase text-zinc-400 dark:text-zinc-500 font-semibold">
              Invite Users by Email
            </Label>
            <div className="flex gap-2">
              <div className="flex-1 flex flex-wrap gap-1.5 p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md focus-within:ring-1 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all">
                {emails.map((email) => (
                  <Badge
                    key={email}
                    variant="secondary"
                    className="text-[10px] py-0.5 px-2 bg-zinc-200 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 flex items-center gap-1 font-mono uppercase tracking-wide shrink-0"
                  >
                    {email}
                    <button
                      type="button"
                      onClick={() => removeChip(email)}
                      className="text-zinc-400 hover:text-red-500"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </Badge>
                ))}
                <input
                  type="text"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={handleAddEmail}
                  placeholder={emails.length === 0 ? "developer@domain.com" : ""}
                  className="flex-1 bg-transparent border-0 outline-none text-xs sm:text-sm font-mono text-zinc-800 dark:text-zinc-100 min-w-[80px]"
                />
              </div>

              <select
                value={role}
                onChange={(e) => setRole(e.target.value as "viewer" | "editor")}
                className="font-mono text-xs sm:text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md px-2 py-1.5 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500 outline-none text-zinc-600 dark:text-zinc-400"
              >
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
              </select>
            </div>
            <p className="text-[9px] text-zinc-400 dark:text-zinc-600">
              Press Enter, Tab, or Comma after typing an email to add it.
            </p>
          </div>

          {error && <p className="text-red-500 dark:text-red-400 text-xs">{error}</p>}
          {success && (
            <p className="text-emerald-500 dark:text-emerald-400 text-xs flex items-center gap-1.5 animate-pulse">
              <Check className="w-3.5 h-3.5" />
              Permissions updated successfully!
            </p>
          )}

          <Button
            onClick={handleSave}
            disabled={emails.length === 0 || isSaving}
            className="w-full text-xs font-bold tracking-widest uppercase gap-2 bg-emerald-500 hover:bg-emerald-600 text-white h-9"
          >
            {isSaving ? <Spinner className="border-white/40" /> : <Save className="w-3.5 h-3.5" />}
            Grant Access
          </Button>

          <Separator className="my-2" />

          <div className="space-y-2">
            <Label className="text-[10px] sm:text-[11px] tracking-[0.2em] uppercase text-zinc-400 dark:text-zinc-500 font-semibold block">
              Current Access
            </Label>
            {sharedList.length === 0 ? (
              <p className="text-xs text-zinc-400 dark:text-zinc-600 italic">
                This project is currently private.
              </p>
            ) : (
              <div className="space-y-2.5">
                {sharedList.map((item) => (
                  <div
                    key={item.email}
                    className="flex items-center justify-between p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800"
                  >
                    <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 truncate max-w-[180px] sm:max-w-[240px]">
                      {item.email}
                    </span>

                    <div className="flex items-center gap-2">
                      <select
                        value={item.role}
                        onChange={(e) =>
                          handleRoleChange(item.email, e.target.value as "viewer" | "editor")
                        }
                        className="font-mono text-[10px] sm:text-xs bg-transparent border-0 outline-none text-zinc-500 dark:text-zinc-400 cursor-pointer"
                      >
                        <option value="viewer">Viewer</option>
                        <option value="editor">Editor</option>
                      </select>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRevoke(item.email)}
                        className="h-6 w-6 p-0 text-zinc-400 hover:text-red-500 dark:hover:text-red-400 border-zinc-200 dark:border-zinc-800 hover:bg-red-50 dark:hover:bg-red-950/20"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Env List Item ────────────────────────────────────────────────────────────
function EnvItem({
  env,
  idx,
  copiedId,
  isDeletingId,
  onCopy,
  onDownload,
  onEdit,
  onDelete,
  onShare,
  onLeave,
}: {
  env: EnvProject;
  idx: number;
  copiedId: string | null;
  isDeletingId: string | null;
  onCopy: (e: EnvProject) => void;
  onDownload: (e: EnvProject) => void;
  onEdit: (e: EnvProject) => void;
  onDelete: (e: EnvProject) => void;
  onShare: (e: EnvProject) => void;
  onLeave: (e: EnvProject) => void;
}) {
  const isCopied = copiedId === env._id;
  const isDeleting = isDeletingId === env._id;

  const keyCount = env.envContent
    ? env.envContent.split("\n").filter((l) => l.trim() && !l.trim().startsWith("#") && l.includes("=")).length
    : 0;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  return (
    <div className="group flex items-center justify-between px-3 sm:px-5 py-3 sm:py-4 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-white dark:hover:bg-zinc-900 transition-all duration-200">
      {/* Left */}
      <div className="flex items-center gap-2 sm:gap-3 md:gap-4 min-w-0 flex-1">
        <span className="text-[10px] text-zinc-300 dark:text-zinc-700 w-4 sm:w-5 text-right font-semibold tabular-nums shrink-0 hidden sm:block">
          {idx + 1}
        </span>
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-md bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shrink-0">
          <span className="text-emerald-500 dark:text-emerald-400 text-[9px] sm:text-[10px] font-bold font-mono">.env</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-1.5">
            <p className="text-xs sm:text-sm font-semibold text-zinc-800 dark:text-zinc-100 truncate">
              {env.projectName}
            </p>
            {env.isShared ? (
              <div className="flex items-center gap-1.5 flex-wrap">
                <Badge
                  variant="secondary"
                  className="text-[9px] font-mono font-medium text-zinc-555 dark:text-zinc-455 px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800/40 border border-zinc-200/50 dark:border-zinc-800/40 flex items-center gap-1 normal-case max-w-full"
                >
                  <User className="w-2.5 h-2.5 text-zinc-400 shrink-0" />
                  <span className="shrink-0 hidden sm:inline">Shared by:</span>
                  <span className="font-semibold text-zinc-750 dark:text-zinc-250 truncate block">{env.ownerEmail}</span>
                </Badge>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[8px] font-semibold tracking-wider uppercase px-1.5 py-0 h-4 rounded-full border shrink-0",
                    env.userRole === "editor"
                      ? "border-emerald-250/60 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400"
                      : "border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-455"
                  )}
                >
                  {env.userRole}
                </Badge>
              </div>
            ) : env.sharedWith && env.sharedWith.length > 0 ? (
              <div className="flex items-center gap-1.5 flex-wrap">
                <Badge
                  variant="secondary"
                  className="text-[9px] font-mono font-medium text-emerald-700 dark:text-emerald-455 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/10 border border-emerald-100/70 dark:border-emerald-900/30 flex items-center gap-1 normal-case shrink-0"
                >
                  <Users className="w-2.5 h-2.5 text-emerald-555" />
                  <span>Shared with {env.sharedWith.length}</span> 
                </Badge>
              </div>
            ) : null}
            <p className="text-[10px] sm:text-[11px] text-zinc-400 dark:text-zinc-600 flex flex-wrap gap-1.5 items-center">
              <span>{keyCount} keys</span>
              <span>·</span>
              <span>{formatDate(env.createdAt)}</span>
              {env.tags && env.tags.length > 0 && (
                <>
                  <span>·</span>
                  {env.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-[8px] sm:text-[9px] px-1.5 py-0 h-4 border-zinc-200 dark:border-zinc-800 bg-zinc-100/70 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{tag}</Badge>
                  ))}
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Right: actions dock */}
      <div className="flex items-center gap-1 p-0.5 sm:p-1 bg-zinc-100/50 dark:bg-zinc-800/10 border border-zinc-200/50 dark:border-zinc-800/50 rounded-lg shrink-0 ml-2 sm:ml-3">
        {/* Copy */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onCopy(env)}
          className={cn(
            "h-7 sm:h-8 px-2 sm:px-2.5 gap-1 sm:gap-1.5 text-[10px] sm:text-[11px] font-semibold tracking-wide transition-all duration-200 rounded-md shadow-none hover:shadow-sm",
            isCopied
              ? "bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold"
              : "text-zinc-655 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/70 hover:text-zinc-900 dark:hover:text-zinc-100"
          )}
        >
          {isCopied ? <Check className="w-3.5 h-3.5 animate-in zoom-in-50" /> : <Copy className="w-3.5 h-3.5" />}
          <span className="hidden md:inline">{isCopied ? "Copied" : "Copy"}</span>
        </Button>

        {/* Download */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDownload(env)}
          className="h-7 sm:h-8 w-7 sm:w-8 md:w-auto md:px-2.5 p-0 gap-1 sm:gap-1.5 text-[10px] sm:text-[11px] font-semibold tracking-wide text-zinc-550 dark:text-zinc-455 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/70 hover:text-zinc-900 dark:hover:text-zinc-100 hover:shadow-sm transition-all duration-200 rounded-md"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Download</span>
        </Button>

        {/* Edit */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(env)}
          className="h-7 sm:h-8 px-2 sm:px-2.5 gap-1 sm:gap-1.5 text-[10px] sm:text-[11px] font-semibold tracking-wide text-zinc-650 dark:text-zinc-450 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/70 hover:text-zinc-900 dark:hover:text-zinc-100 hover:shadow-sm transition-all duration-200 rounded-md"
        >
          <Pencil className="w-3.5 h-3.5" />
          <span className="hidden md:inline">
            {env.isShared && env.userRole === "viewer" ? "View" : "Edit"}
          </span>
        </Button>

        {/* Conditionally render Share or Leave or Delete */}
        {env.isShared ? (
          /* Leave button for shared items */
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onLeave(env)}
            className="h-7 sm:h-8 w-7 sm:w-8 md:w-auto md:px-2.5 p-0 gap-1 sm:gap-1.5 text-[10px] sm:text-[11px] font-semibold tracking-wide text-zinc-500 hover:bg-red-500/10 dark:hover:bg-red-500/20 hover:text-red-550 dark:hover:text-red-400 hover:shadow-sm transition-all duration-200 rounded-md"
          >
            <UserMinus className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Leave</span>
          </Button>
        ) : (
          /* Share & Delete buttons for owned items */
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onShare(env)}
              className="h-7 sm:h-8 w-7 sm:w-8 md:w-auto md:px-2.5 p-0 gap-1 sm:gap-1.5 text-[10px] sm:text-[11px] font-semibold tracking-wide text-zinc-500 hover:bg-emerald-500/10 dark:hover:bg-emerald-500/20 hover:text-emerald-555 dark:hover:text-emerald-450 hover:shadow-sm transition-all duration-200 rounded-md"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Share</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(env)}
              disabled={isDeleting}
              className="h-7 sm:h-8 w-7 sm:w-8 md:w-auto md:px-2.5 p-0 gap-1 sm:gap-1.5 text-[10px] sm:text-[11px] font-semibold tracking-wide text-zinc-555 dark:text-zinc-455 hover:bg-red-500/10 dark:hover:bg-red-500/20 hover:text-red-555 dark:hover:text-red-455 hover:shadow-sm disabled:opacity-50 transition-all duration-200 rounded-md"
            >
              {isDeleting ? <Spinner className="border-red-400/60" /> : <Trash2 className="w-3.5 h-3.5" />}
              <span className="hidden md:inline">Delete</span>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}



import { SetupPinModal } from "@/components/SetupPinModal";

interface SortOption {
  value: "desc" | "asc" | "lastModified";
  label: string;
  icon: any;
}

const sortOptions: SortOption[] = [
  { value: "desc", label: "Newest First", icon: Clock },
  { value: "asc", label: "Oldest First", icon: Calendar },
  { value: "lastModified", label: "Last Modified", icon: RefreshCw },
];

function SortTagDropdown({
  sortOrder,
  onSortOrderChange,
  tagFilter,
  onTagFilterChange,
  allTags,
}: {
  sortOrder: "desc" | "asc" | "lastModified";
  onSortOrderChange: (sort: "desc" | "asc" | "lastModified") => void;
  tagFilter: string;
  onTagFilterChange: (tag: string) => void;
  allTags: string[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeSort = sortOptions.find((o) => o.value === sortOrder) || sortOptions[0];
  const IconComponent = activeSort.icon;

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="font-mono text-xs sm:text-sm bg-zinc-50/90 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-md px-3 h-9 sm:h-10 text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100 flex items-center gap-2 justify-between min-w-[130px] sm:min-w-[155px] text-left shrink-0 shadow-sm transition-all focus:ring-1 focus:ring-emerald-500/20"
      >
        <span className="font-semibold text-zinc-700 dark:text-zinc-300 truncate">
          {activeSort.label}
        </span>
        <ChevronDown className={cn("w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 shrink-0 ml-1.5", isOpen && "rotate-180")} />
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-60 rounded-xl border border-zinc-200/80 dark:border-zinc-850 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md shadow-2xl z-50 overflow-hidden py-2 animate-in fade-in slide-in-from-top-1 duration-100">
          <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
            <div className="py-1">
              <div className="px-3.5 py-1 text-[9px] font-bold tracking-widest text-zinc-400 dark:text-zinc-500 uppercase">
                Sort By
              </div>
              <div className="space-y-1 mt-1 px-1.5">
                {sortOptions.map((opt) => {
                  const isSelected = opt.value === sortOrder;
                  const OptIcon = opt.icon;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => {
                        onSortOrderChange(opt.value);
                        setIsOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 text-xs font-mono text-left transition-colors rounded-lg",
                        isSelected
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold"
                          : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100/55 dark:hover:bg-zinc-900/55 hover:text-zinc-800 dark:hover:text-zinc-200"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <OptIcon className={cn("w-3.5 h-3.5 shrink-0", isSelected ? "text-emerald-500" : "text-zinc-400")} />
                        {opt.label}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <Separator className="my-2 opacity-50 dark:opacity-40" />
            <div className="py-1">
              <div className="px-3.5 py-1 text-[9px] font-bold tracking-widest text-zinc-400 dark:text-zinc-500 uppercase">
                Filter by Tag
              </div>
              <div className="space-y-1 mt-1 px-1.5">
                <button
                  onClick={() => {
                    onTagFilterChange("All");
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 text-xs font-mono text-left transition-colors rounded-lg",
                    tagFilter === "All"
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold"
                      : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100/55 dark:hover:bg-zinc-900/55 hover:text-zinc-800 dark:hover:text-zinc-200"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <Tag className={cn("w-3.5 h-3.5 shrink-0", tagFilter === "All" ? "text-emerald-500" : "text-zinc-450")} />
                    All Tags
                  </span>
                  {tagFilter === "All" && <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                </button>

                {allTags.map((tag) => {
                  const isSelected = tagFilter === tag;
                  return (
                    <button
                      key={tag}
                      onClick={() => {
                        onTagFilterChange(tag);
                        setIsOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 text-xs font-mono text-left transition-colors rounded-lg",
                        isSelected
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold"
                          : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100/55 dark:hover:bg-zinc-900/55 hover:text-zinc-800 dark:hover:text-zinc-200"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <Tag className={cn("w-3.5 h-3.5 shrink-0", isSelected ? "text-emerald-500" : "text-zinc-400")} />
                        {tag}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function HomePage() {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("envs");

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  // Post tab
  const [projectName, setProjectName] = useState("");
  const [envText, setEnvText] = useState("");
  const [tagsString, setTagsString] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const queryClient = useQueryClient();

  // Envs tab
  const [page, setPage] = useState(1);
  const limit = 10;

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc" | "lastModified">("desc");
  const [tagFilter, setTagFilter] = useState<string>("All");


  const { data: paginatedData, isLoading: isLoadingEnvs, refetch, error: envsError } = useQuery({
    queryKey: ["envs", page, searchQuery, typeFilter],
    queryFn: () => getAllEnv(page, limit, searchQuery, typeFilter),
    retry: false,
  });

  const envs = paginatedData?.data || [];
  const hasMore = paginatedData?.hasMore || false;
  
  // Check if we need to show the Setup PIN modal
  const showSetupPin = Boolean(envsError && (envsError as { response?: { status?: number } }).response?.status === 403);



  // Per-item state
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EnvProject | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [updateTarget, setUpdateTarget] = useState<EnvProject | null>(null);
  const [shareTarget, setShareTarget] = useState<EnvProject | null>(null);
  const [leaveTarget, setLeaveTarget] = useState<EnvProject | null>(null);
  const [isLeavingId, setIsLeavingId] = useState<string | null>(null);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setEnvText(ev.target?.result as string);
    reader.readAsText(file);
  };

  const postMutation = useMutation({
    mutationFn: postEnv,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["envs"] });
      setSaveStatus("success");
      setProjectName("");
      setEnvText("");
      setTagsString("");
      setTimeout(() => {
        setSaveStatus("idle");
        setActiveTab("envs");
      }, 1500);
    },
    onError: () => {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    },
    onSettled: () => {
      setIsSaving(false);
    }
  });

  const handleSave = () => {
    if (!projectName.trim() || !envText.trim()) return;
    setIsSaving(true);
    setSaveStatus("idle");
    const tags = tagsString.split(",").map(t => t.trim()).filter(Boolean);
    postMutation.mutate({ projectName: projectName.trim(), envContent: envText.trim(), tags });
  };

  const handleCopy = (env: EnvProject) => {
    navigator.clipboard.writeText(env.envContent).then(() => {
      setCopiedId(env._id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleDownload = (env: EnvProject) => {
    const blob = new Blob([env.envContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${env.projectName}.env`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const deleteMutation = useMutation({
    mutationFn: deleteAEnv,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["envs"] });
      setDeleteTarget(null);
    },
    onSettled: () => {
      setIsDeletingId(null);
    }
  });

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    setIsDeletingId(deleteTarget._id);
    deleteMutation.mutate(deleteTarget._id);
  };

  const updateMutation = useMutation({
    mutationFn: ({ id, name, content, tags }: { id: string, name: string, content: string, tags: string[] }) => 
      updateAEnv(id, { projectName: name, envContent: content, tags }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["envs"] });
    }
  });

  const handleUpdate = async (id: string, name: string, content: string, tags: string[]) => {
    await updateMutation.mutateAsync({ id, name, content, tags });
  };

  const allTags = Array.from(new Set(envs.flatMap(e => e.tags || []))).sort();

  const leaveMutation = useMutation({
    mutationFn: leaveSharedEnv,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["envs"] });
      setLeaveTarget(null);
    },
    onSettled: () => {
      setIsLeavingId(null);
    }
  });

  const handleLeaveConfirm = () => {
    if (!leaveTarget) return;
    setIsLeavingId(leaveTarget._id);
    leaveMutation.mutate(leaveTarget._id);
  };

  const filteredEnvs = envs
    .filter((e) => tagFilter === "All" || (e.tags && e.tags.includes(tagFilter)))
    .sort((a, b) => {
      if (sortOrder === "lastModified") {
        const aTime = a.lastModified ? new Date(a.lastModified).getTime() : new Date(a.createdAt).getTime();
        const bTime = b.lastModified ? new Date(b.lastModified).getTime() : new Date(b.createdAt).getTime();
        return bTime - aTime;
      }
      const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sortOrder === "asc" ? diff : -diff;
    });

  return (
    <TooltipProvider>
      <SetupPinModal open={showSetupPin} />
      <div className="min-h-screen min-h-dvh bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 font-mono transition-colors duration-200">

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

        {/* ── Delete AlertDialog ─────────────────────────────────────────────── */}
        <AlertDialog
          open={!!deleteTarget}
          onOpenChange={(o) => !isDeletingId && !o && setDeleteTarget(null)}
        >
          <AlertDialogContent className="w-[calc(100vw-1.5rem)] sm:max-w-sm font-mono rounded-xl">
            <AlertDialogHeader>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 flex items-center justify-center shrink-0 text-red-500">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <AlertDialogTitle className="text-sm font-bold tracking-wide">
                    Delete Project?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-xs mt-1.5 leading-5">
                    This will permanently delete{" "}
                    <span className="text-zinc-800 dark:text-zinc-100 font-semibold break-all">
                      {deleteTarget?.projectName}
                    </span>{" "}
                    and all its environment variables. This cannot be undone.
                  </AlertDialogDescription>
                </div>
              </div>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-row gap-2 mt-2">
              <AlertDialogCancel disabled={!!isDeletingId} className="flex-1 text-xs sm:text-sm h-auto py-2.5">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                disabled={!!isDeletingId}
                className="flex-1 bg-red-50 dark:bg-red-950 border border-red-300 dark:border-red-700 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900 text-xs sm:text-sm gap-2 h-auto py-2.5"
              >
                {isDeletingId ? (
                  <><Spinner className="border-red-400/40" /><span>Deleting…</span></>
                ) : (
                  <><Trash2 className="w-3.5 h-3.5" /><span>Delete</span></>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* ── Update Modal ───────────────────────────────────────────────────── */}
        <UpdateModal
          env={updateTarget}
          open={!!updateTarget}
          onSave={handleUpdate}
          onClose={() => setUpdateTarget(null)}
        />

        {/* ── Page content ───────────────────────────────────────────────────── */}
        <div className="relative max-w-3xl mx-auto px-3 sm:px-5 md:px-6 py-6 sm:py-8 md:py-12">

          {/* ── Header ──────────────────────────────────────────────────────── */}
          <div className="mb-7 sm:mb-10">
            <div className="flex items-center justify-between mb-1.5 sm:mb-2">

              {/* Branding */}
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] sm:text-[11px] tracking-[0.2em] sm:tracking-[0.25em] uppercase text-zinc-400 dark:text-zinc-600 font-semibold">
                  DOTENVNEST
                </span>
              </div>

              {/* Sheet menu */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-[10px] sm:text-[11px] font-semibold tracking-wide uppercase gap-1.5 h-8 px-2.5 sm:px-3 border-zinc-200 dark:border-zinc-800"
                  >
                    <Menu className="w-3.5 h-3.5" />
                    <span className="hidden xs:inline">Menu</span>
                  </Button>
                </SheetTrigger>

                <SheetContent side="right" className="w-[270px] sm:w-72 font-mono p-0">
                  <SheetHeader className="px-5 sm:px-6 py-4 sm:py-5 border-b border-zinc-100 dark:border-zinc-800">
                    <SheetTitle className="text-[11px] tracking-[0.25em] uppercase text-zinc-400 dark:text-zinc-500 font-bold text-left">
                      Menu
                    </SheetTitle>
                  </SheetHeader>

                  <div className="p-4 sm:p-5 flex flex-col gap-2 sm:gap-2.5">
                    <Button
                      variant="outline"
                      className="justify-start gap-3 h-10 sm:h-11 text-sm font-semibold tracking-wide border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100"
                      onClick={() => router.push("/account")}
                    >
                      <User className="w-4 h-4" />
                      Account
                    </Button>

                    <Button
                      variant="outline"
                      className="justify-between h-10 sm:h-11 text-sm font-semibold tracking-wide border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100"
                      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    >
                      <div className="flex items-center gap-3">
                        {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                        Theme
                      </div>
                      <Badge variant="outline" className="text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                        {theme === "dark" ? "Light" : "Dark"}
                      </Badge>
                    </Button>

                    <Separator className="my-0.5" />

                    <Button
                      variant="outline"
                      className="justify-start gap-3 h-10 sm:h-11 text-sm font-semibold tracking-wide border-red-100 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/30 text-red-500 dark:text-red-400 hover:bg-red-50 hover:border-red-200 dark:hover:bg-red-950/50"
                      onClick={handleLogout}
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Title */}
            <h1
              className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mt-2 sm:mt-3"
              style={{ fontFamily: "'Courier New', monospace" }}
            >
              <span className="text-emerald-500 dark:text-emerald-400">.</span>env
              <span className="text-zinc-300 dark:text-zinc-700 ml-2 sm:ml-3 text-lg sm:text-xl md:text-2xl">
                manager
              </span>
            </h1>
            <p className="text-zinc-400 dark:text-zinc-600 text-xs sm:text-sm mt-1 sm:mt-1.5 tracking-wide">
              Store and manage your project environment files securely.
            </p>
          </div>

          {/* ── Tabs ──────────────────────────────────────────────────────────── */}
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="mb-6 sm:mb-8 h-auto p-0 bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden w-fit">
              <TabsTrigger
                value="envs"
                className="px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold tracking-widest uppercase rounded-none data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-none dark:data-[state=active]:bg-emerald-500 dark:data-[state=active]:text-white text-zinc-400 dark:text-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-300 border-r border-zinc-200 dark:border-zinc-800"
              >
                All Envs
              </TabsTrigger>
              <TabsTrigger
                value="post"
                className="px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold tracking-widest uppercase rounded-none data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-none dark:data-[state=active]:bg-emerald-500 dark:data-[state=active]:text-white text-zinc-400 dark:text-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-300"
              >
                <Plus className="w-3 h-3 mr-1 sm:mr-1.5" />
                Post
              </TabsTrigger>
            </TabsList>

            {/* ── POST TAB ──────────────────────────────────────────────────── */}
            <TabsContent value="post" className="mt-0 space-y-4 sm:space-y-5">
              <div className="space-y-1.5">
                <Label className="text-[10px] sm:text-[11px] tracking-[0.2em] uppercase text-zinc-400 dark:text-zinc-500 font-semibold">
                  Project Name
                </Label>
                <Input
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="my-awesome-project"
                  className="font-mono text-xs sm:text-sm bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500 placeholder:text-zinc-300 dark:placeholder:text-zinc-700 h-auto py-2.5 sm:py-3"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] sm:text-[11px] tracking-[0.2em] uppercase text-zinc-400 dark:text-zinc-500 font-semibold">
                  Tags (comma separated)
                </Label>
                <Input
                  value={tagsString}
                  onChange={(e) => setTagsString(e.target.value)}
                  placeholder="Personal, API, Prod..."
                  className="font-mono text-xs sm:text-sm bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500 placeholder:text-zinc-300 dark:placeholder:text-zinc-700 h-auto py-2.5 sm:py-3"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Label className="text-[10px] sm:text-[11px] tracking-[0.2em] uppercase text-zinc-400 dark:text-zinc-500 font-semibold">
                    Environment Variables
                  </Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[10px] sm:text-[11px] h-7 px-2 sm:px-2.5 gap-1.5 text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 border-zinc-200 dark:border-zinc-700"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Upload .env</span>
                  </Button>
                  <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
                </div>
                <EnvEditor value={envText} onChange={setEnvText} rows={12} />
              </div>

              <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 pt-1">
                <Button
                  onClick={handleSave}
                  disabled={isSaving || !projectName.trim() || !envText.trim()}
                  className={cn(
                    "gap-2 text-xs sm:text-sm font-bold tracking-widest uppercase transition-all h-auto py-2.5 sm:py-3 px-4 sm:px-5",
                    "bg-emerald-500 hover:bg-emerald-600 text-white",
                    "disabled:bg-zinc-100 dark:disabled:bg-zinc-900 disabled:text-zinc-300 dark:disabled:text-zinc-600"
                  )}
                >
                  {isSaving ? (
                    <><Spinner className="border-white/40" /><span>Saving…</span></>
                  ) : (
                    <><Save className="w-3.5 h-3.5" /><span>Save Env</span></>
                  )}
                </Button>
                {saveStatus === "success" && (
                  <span className="text-emerald-500 dark:text-emerald-400 text-xs sm:text-sm flex items-center gap-1.5 animate-pulse">
                    <Check className="w-3.5 h-3.5" />
                    Saved successfully!
                  </span>
                )}
                {saveStatus === "error" && (
                  <span className="text-red-500 dark:text-red-400 text-xs sm:text-sm">
                    Failed to save. Try again.
                  </span>
                )}
              </div>
            </TabsContent>

            {/* ── ENVS TAB ──────────────────────────────────────────────────── */}
            <TabsContent value="envs" className="mt-0 space-y-3 sm:space-y-4">

              {/* Search + Filters Toolbar */}
              <div className="flex flex-col sm:flex-row gap-2">
                {/* Search */}
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 dark:text-zinc-600 pointer-events-none" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPage(1);
                    }}
                    placeholder="Search projects…"
                    className="font-mono text-xs sm:text-sm bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 pl-9 pr-9 h-9 sm:h-10 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500 placeholder:text-zinc-300 dark:placeholder:text-zinc-700 w-full"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setPage(1);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Pill Tabs for View Source */}
                  <div className="bg-zinc-100/80 dark:bg-zinc-900/80 p-0.5 rounded-lg flex items-center border border-zinc-200/50 dark:border-zinc-800/50 h-9 sm:h-10 shrink-0">
                    {[
                      { id: "all", tooltip: "All Projects", icon: FolderOpen },
                      { id: "owned", tooltip: "My Projects", icon: User },
                      { id: "sharedWithMe", tooltip: "Shared with me", icon: UserCheck },
                      { id: "sharedWithOthers", tooltip: "Shared with others", icon: Share2 },
                    ].map((tab) => {
                      const isActive = typeFilter === tab.id;
                      const TabIcon = tab.icon;
                      return (
                        <Tooltip key={tab.id}>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => {
                                setTypeFilter(tab.id);
                                setPage(1);
                              }}
                              className={cn(
                                "p-1.5 sm:p-2 rounded-md transition-all duration-150 shrink-0 select-none flex items-center justify-center",
                                isActive
                                  ? "bg-white dark:bg-zinc-950 text-emerald-500 dark:text-emerald-400 shadow-sm border border-zinc-250/20 dark:border-zinc-800/50"
                                  : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                              )}
                            >
                              <TabIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="font-mono text-[10px] tracking-wide uppercase">
                            {tab.tooltip}
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>

                  {/* Sort & Tag Dropdown */}
                  <SortTagDropdown
                    sortOrder={sortOrder}
                    onSortOrderChange={(sort) => {
                      setSortOrder(sort);
                      setPage(1);
                    }}
                    tagFilter={tagFilter}
                    onTagFilterChange={(tag) => {
                      setTagFilter(tag);
                      setPage(1);
                    }}
                    allTags={allTags}
                  />
                </div>
              </div>

              {/* List */}
              {isLoadingEnvs ? (
                <div className="space-y-2 sm:space-y-2.5">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-[60px] sm:h-[68px] rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 animate-pulse"
                    />
                  ))}
                </div>
              ) : filteredEnvs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 sm:py-20 text-zinc-300 dark:text-zinc-700">
                  <FileText className="w-9 h-9 sm:w-10 sm:h-10 mb-3 sm:mb-4 stroke-1" />
                  <p className="text-xs sm:text-sm tracking-widest uppercase">
                    {searchQuery ? "No matches found" : "No env files yet"}
                  </p>
                  {!searchQuery && (
                    <p className="text-xs mt-1 text-zinc-200 dark:text-zinc-800">
                      Post your first env file to get started
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-2.5">
                  {filteredEnvs.map((env, idx) => (
                    <EnvItem
                      key={env._id}
                      env={env}
                      idx={idx}
                      copiedId={copiedId}
                      isDeletingId={isDeletingId}
                      onCopy={handleCopy}
                      onDownload={handleDownload}
                      onEdit={(e) => setUpdateTarget(e)}
                      onDelete={(e) => setDeleteTarget(e)}
                      onShare={(e) => setShareTarget(e)}
                      onLeave={(e) => setLeaveTarget(e)}
                    />
                  ))}
                </div>
              )}

              {filteredEnvs.length > 0 && (
                <div className="flex flex-col gap-4 pt-4">
                  <div className="flex items-center justify-between px-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1 || isLoadingEnvs}
                      className="font-mono text-[10px] tracking-widest uppercase border-zinc-200 dark:border-zinc-800"
                    >
                      Previous
                    </Button>
                    <p className="text-[10px] sm:text-[11px] text-zinc-300 dark:text-zinc-700 tracking-widest uppercase">
                      Page {page}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => p + 1)}
                      disabled={!hasMore || isLoadingEnvs}
                      className="font-mono text-[10px] tracking-widest uppercase border-zinc-200 dark:border-zinc-800"
                    >
                      Next
                    </Button>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-zinc-300 dark:text-zinc-700 text-center tracking-widest uppercase">
                    {filteredEnvs.length} project{filteredEnvs.length !== 1 ? "s" : ""} on this page
                    {searchQuery && ` matching "${searchQuery}"`}
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* ── Leave AlertDialog ─────────────────────────────────────────────── */}
      <AlertDialog
        open={!!leaveTarget}
        onOpenChange={(o) => !isLeavingId && !o && setLeaveTarget(null)}
      >
        <AlertDialogContent className="w-[calc(100vw-1.5rem)] sm:max-w-sm font-mono rounded-xl">
          <AlertDialogHeader>
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 flex items-center justify-center shrink-0 text-red-500">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <AlertDialogTitle className="text-sm font-bold tracking-wide">
                  Leave Shared Project?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-xs mt-1.5 leading-5">
                  Are you sure you want to leave{" "}
                  <span className="text-zinc-800 dark:text-zinc-100 font-semibold break-all">
                    {leaveTarget?.projectName}
                  </span>
                  ? You will lose access to its environment variables.
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 mt-2">
            <AlertDialogCancel disabled={!!isLeavingId} className="flex-1 text-xs sm:text-sm h-auto py-2.5">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLeaveConfirm}
              disabled={!!isLeavingId}
              className="flex-1 bg-red-50 dark:bg-red-950 border border-red-300 dark:border-red-700 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900 text-xs sm:text-sm gap-2 h-auto py-2.5"
            >
              {isLeavingId ? (
                <><Spinner className="border-red-400/40" /><span>Leaving…</span></>
              ) : (
                <><LogOut className="w-3.5 h-3.5" /><span>Leave</span></>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Share Modal ───────────────────────────────────────────────────── */}
      <ShareModal
        env={shareTarget}
        open={!!shareTarget}
        onClose={() => setShareTarget(null)}
      />
    </TooltipProvider>
  );
}