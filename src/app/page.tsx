"use client";

import { useState, useRef, useCallback } from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { postEnv, getAllEnv, deleteAEnv, updateAEnv, EnvProject } from "@/lib/api";

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
} from "lucide-react";

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
}: {
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  fileName?: string;
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
          onChange={(e) => onChange(e.target.value)}
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
  onSave: (id: string, name: string, content: string) => Promise<void>;
  onClose: () => void;
}) {
  const [name, setName] = useState(env?.projectName ?? "");
  const [content, setContent] = useState(env?.envContent ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [prevEnv, setPrevEnv] = useState<EnvProject | null>(env);
  if (env !== prevEnv) {
    setPrevEnv(env);
    setName(env?.projectName ?? "");
    setContent(env?.envContent ?? "");
    setError(false);
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setContent(ev.target?.result as string);
    reader.readAsText(file);
  };

  const handleSave = async () => {
    if (!env || !name.trim() || !content.trim()) return;
    setIsSaving(true);
    setError(false);
    try {
      await onSave(env._id, name.trim(), content.trim());
      onClose();
    } catch {
      setError(true);
    } finally {
      setIsSaving(false);
    }
  };

  const unchanged =
    name.trim() === env?.projectName && content.trim() === env?.envContent;

  return (
    <Dialog open={open} onOpenChange={(o) => !isSaving && !o && onClose()}>
      <DialogContent className="w-[calc(100vw-1.5rem)] sm:w-[calc(100vw-3rem)] sm:max-w-xl md:max-w-2xl max-h-[90dvh] p-0 gap-0 overflow-hidden font-mono rounded-xl">
        <DialogHeader className="px-4 sm:px-6 py-3 sm:py-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shrink-0">
              <span className="text-emerald-500 dark:text-emerald-400 text-[9px] font-bold">.ev</span>
            </div>
            <DialogTitle className="text-sm font-bold tracking-wide">Update Env</DialogTitle>
          </div>
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
                className="font-mono text-xs sm:text-sm bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500 h-auto py-2.5 sm:py-3"
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
                  Upload .env
                </Button>
                <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
              </div>
              <EnvEditor value={content} onChange={setContent} rows={8} />
            </div>

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
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || unchanged || !name.trim() || !content.trim()}
            className={cn(
              "flex-1 text-xs sm:text-sm font-bold tracking-widest uppercase gap-2 h-auto py-2.5 sm:py-3",
              "bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white",
              "disabled:bg-zinc-100 dark:disabled:bg-zinc-800 disabled:text-zinc-300 dark:disabled:text-zinc-600"
            )}
          >
            {isSaving ? (
              <><Spinner className="border-white/40" /><span>Saving…</span></>
            ) : (
              <><Save className="w-3.5 h-3.5" /><span>Save Changes</span></>
            )}
          </Button>
        </DialogFooter>
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
}: {
  env: EnvProject;
  idx: number;
  copiedId: string | null;
  isDeletingId: string | null;
  onCopy: (e: EnvProject) => void;
  onDownload: (e: EnvProject) => void;
  onEdit: (e: EnvProject) => void;
  onDelete: (e: EnvProject) => void;
}) {
  const isCopied = copiedId === env._id;
  const isDeleting = isDeletingId === env._id;

  const keyCount = env.envContent
    .split("\n")
    .filter((l) => l.trim() && !l.trim().startsWith("#") && l.includes("=")).length;

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
          <span className="text-emerald-500 dark:text-emerald-400 text-[9px] sm:text-[10px] font-bold">.ev</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm font-semibold text-zinc-800 dark:text-zinc-100 truncate">
            {env.projectName}
          </p>
          <p className="text-[10px] sm:text-[11px] text-zinc-400 dark:text-zinc-600 mt-0.5">
            {keyCount} keys · {formatDate(env.createdAt)}
          </p>
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 ml-2 sm:ml-3">
        {/* Copy */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCopy(env)}
              className={cn(
                "h-7 sm:h-8 px-2 sm:px-2.5 gap-1 sm:gap-1.5 text-[10px] sm:text-[11px] font-semibold tracking-wide border transition-all",
                isCopied
                  ? "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-700 text-emerald-500 dark:text-emerald-400"
                  : "border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-200"
              )}
            >
              {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              <span className="hidden md:inline">{isCopied ? "Copied" : "Copy"}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Copy env content</TooltipContent>
        </Tooltip>

        {/* Download */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDownload(env)}
              className="h-7 sm:h-8 px-2 sm:px-2.5 gap-1 sm:gap-1.5 text-[10px] sm:text-[11px] font-semibold tracking-wide border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-200"
            >
              <Download className="w-3 h-3" />
              <span className="hidden md:inline">Download</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Download .env</TooltipContent>
        </Tooltip>

        {/* Edit */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(env)}
              className="h-7 sm:h-8 px-2 sm:px-2.5 gap-1 sm:gap-1.5 text-[10px] sm:text-[11px] font-semibold tracking-wide border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-200"
            >
              <Pencil className="w-3 h-3" />
              <span className="hidden md:inline">Edit</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Edit project</TooltipContent>
        </Tooltip>

        {/* Delete */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(env)}
              disabled={isDeleting}
              className="h-7 sm:h-8 px-2 sm:px-2.5 gap-1 sm:gap-1.5 text-[10px] sm:text-[11px] font-semibold tracking-wide border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-50"
            >
              {isDeleting ? <Spinner className="border-red-400/60" /> : <Trash2 className="w-3 h-3" />}
              <span className="hidden md:inline">Delete</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Delete project</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function HomePage() {
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  // Post tab
  const [projectName, setProjectName] = useState("");
  const [envText, setEnvText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Envs tab
  const [envs, setEnvs] = useState<EnvProject[]>([]);
  const [isLoadingEnvs, setIsLoadingEnvs] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [hasFetchedEnvs, setHasFetchedEnvs] = useState(false);

  // Per-item state
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EnvProject | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [updateTarget, setUpdateTarget] = useState<EnvProject | null>(null);

  const fetchEnvs = useCallback(async () => {
    setIsLoadingEnvs(true);
    try {
      const data = await getAllEnv();
      setEnvs(data);
      setHasFetchedEnvs(true);
    } catch {
      // silently fail
    } finally {
      setIsLoadingEnvs(false);
    }
  }, []);

  const handleTabChange = (tab: string) => {
    if (tab === "envs" && !hasFetchedEnvs) fetchEnvs();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setEnvText(ev.target?.result as string);
    reader.readAsText(file);
  };

  const handleSave = async () => {
    if (!projectName.trim() || !envText.trim()) return;
    setIsSaving(true);
    setSaveStatus("idle");
    try {
      await postEnv({ projectName: projectName.trim(), envContent: envText.trim() });
      setSaveStatus("success");
      setProjectName("");
      setEnvText("");
      setHasFetchedEnvs(false);
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } finally {
      setIsSaving(false);
    }
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
    link.download = ".env";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeletingId(deleteTarget._id);
    try {
      await deleteAEnv(deleteTarget._id);
      setEnvs((prev) => prev.filter((e) => e._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch {
      // could show toast
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleUpdate = async (id: string, name: string, content: string) => {
    await updateAEnv(id, { projectName: name, envContent: content });
    setEnvs((prev) =>
      prev.map((e) => (e._id === id ? { ...e, projectName: name, envContent: content } : e))
    );
  };

  const filteredEnvs = envs
    .filter((e) => e.projectName.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sortOrder === "asc" ? diff : -diff;
    });

  return (
    <TooltipProvider>
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
                  ENV VAULT
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
          <Tabs defaultValue="post" onValueChange={handleTabChange}>
            <TabsList className="mb-6 sm:mb-8 h-auto p-0 bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden w-fit">
              <TabsTrigger
                value="post"
                className="px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold tracking-widest uppercase rounded-none data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-none dark:data-[state=active]:bg-emerald-500 dark:data-[state=active]:text-white text-zinc-400 dark:text-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-300 border-r border-zinc-200 dark:border-zinc-800"
              >
                <Plus className="w-3 h-3 mr-1 sm:mr-1.5" />
                Post
              </TabsTrigger>
              <TabsTrigger
                value="envs"
                className="px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold tracking-widest uppercase rounded-none data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-none dark:data-[state=active]:bg-emerald-500 dark:data-[state=active]:text-white text-zinc-400 dark:text-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-300"
              >
                All Envs
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

              {/* Search + Sort + Refresh */}
              <div className="flex gap-2">
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 dark:text-zinc-600 pointer-events-none" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search projects…"
                    className="font-mono text-xs sm:text-sm bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 pl-9 h-auto py-2.5 sm:py-3 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500 placeholder:text-zinc-300 dark:placeholder:text-zinc-700"
                  />
                </div>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSortOrder((s) => (s === "desc" ? "asc" : "desc"))}
                      className="gap-1.5 h-auto py-2.5 sm:py-3 px-2.5 sm:px-3 border-zinc-200 dark:border-zinc-800 text-zinc-500 shrink-0"
                    >
                      <ArrowUpDown
                        className="w-3.5 h-3.5 transition-transform"
                        style={{ transform: sortOrder === "asc" ? "scaleY(-1)" : "scaleY(1)" }}
                      />
                      <span className="hidden sm:inline text-xs font-semibold tracking-wide">
                        {sortOrder === "desc" ? "Newest" : "Oldest"}
                      </span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Toggle sort order</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchEnvs}
                      disabled={isLoadingEnvs}
                      className="h-auto py-2.5 sm:py-3 w-9 sm:w-10 p-0 border-zinc-200 dark:border-zinc-800 text-zinc-500 shrink-0"
                    >
                      <RefreshCw className={cn("w-3.5 h-3.5", isLoadingEnvs && "animate-spin")} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Refresh</TooltipContent>
                </Tooltip>
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
                    />
                  ))}
                </div>
              )}

              {filteredEnvs.length > 0 && (
                <p className="text-[10px] sm:text-[11px] text-zinc-300 dark:text-zinc-700 text-center tracking-widest uppercase pt-1 sm:pt-2">
                  {filteredEnvs.length} project{filteredEnvs.length !== 1 ? "s" : ""}
                  {searchQuery && ` matching "${searchQuery}"`}
                </p>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </TooltipProvider>
  );
}