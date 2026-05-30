"use client";

import { useState, useRef, useCallback } from "react";
import axios from "axios";

type Tab = "post" | "envs";
type SortOrder = "desc" | "asc";

interface EnvProject {
  _id: string;
  projectName: string;
  envContent: string;
  createdAt: string;
}

// ─── Icon helpers ───────────────────────────────────────────────────────────
const Icon = {
  Save: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  ),
  Copy: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  ),
  Check: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Edit: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  Trash: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  ),
  X: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  Upload: () => (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
  Search: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  Sort: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="16" y2="12" />
      <line x1="8" y1="18" x2="11" y2="18" />
      <polyline points="3 9 6 12 3 15" />
    </svg>
  ),
  Refresh: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  ),
  Warn: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
};

// ─── Spinner ────────────────────────────────────────────────────────────────
const Spinner = ({ color = "#0a0a0a" }: { color?: string }) => (
  <span
    className="w-3.5 h-3.5 border-2 border-t-transparent rounded-full animate-spin inline-block"
    style={{ borderColor: `${color} ${color} ${color} transparent` }}
  />
);

// ─── VSCode Editor ───────────────────────────────────────────────────────────
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

  return (
    <div className="rounded-lg overflow-hidden border border-[#1e1e1e] focus-within:border-[#00ff88] focus-within:ring-1 focus-within:ring-[#00ff88]/20 transition-all">
      <div className="flex items-center gap-2 px-4 py-2 bg-[#0d0d0d] border-b border-[#1e1e1e]">
        <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
        <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
        <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
        <span className="ml-2 text-[11px] text-[#333] tracking-wider">{fileName}</span>
        {value && (
          <span className="ml-auto text-[10px] text-[#444]">{keyCount} keys</span>
        )}
      </div>
      <div className="flex bg-[#0e0e0e]">
        <div className="select-none px-3 pt-3 text-right text-[#2a2a2a] text-xs leading-6 min-w-[2.5rem] border-r border-[#1a1a1a]">
          {(value || "\n").split("\n").map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={"DATABASE_URL=mongodb://...\nAPI_KEY=your_key\nSECRET=your_secret"}
          rows={rows}
          spellCheck={false}
          className="flex-1 bg-transparent pl-4 pr-4 pt-3 pb-3 text-sm text-[#c8f7a8] placeholder-[#2a2a2a] focus:outline-none resize-none leading-6 w-full"
          style={{ fontFamily: "'Courier New', monospace" }}
        />
      </div>
    </div>
  );
}

// ─── Delete Confirm Dialog ───────────────────────────────────────────────────
function DeleteDialog({
  projectName,
  onConfirm,
  onCancel,
  isDeleting,
}: {
  projectName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={!isDeleting ? onCancel : undefined}
      />
      {/* Dialog */}
      <div className="relative bg-[#111] border border-[#2a2a2a] rounded-xl w-full max-w-sm p-6 shadow-2xl">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-[#ff4444]/10 border border-[#ff4444]/20 flex items-center justify-center flex-shrink-0 text-[#ff4444]">
            <Icon.Warn />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#e8e8e8] tracking-wide">
              Delete Project?
            </h3>
            <p className="text-xs text-[#555] mt-1.5 leading-5">
              This will permanently delete{" "}
              <span className="text-[#e8e8e8] font-semibold">{projectName}</span>{" "}
              and all its environment variables. This action cannot be undone.
            </p>
          </div>
        </div>

        <div className="flex gap-2.5 mt-6">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="flex-1 px-4 py-2.5 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-sm text-[#888] hover:text-[#e8e8e8] hover:border-[#333] transition-all disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 px-4 py-2.5 rounded-lg bg-[#ff4444]/10 border border-[#ff4444]/30 text-sm text-[#ff4444] hover:bg-[#ff4444]/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isDeleting ? (
              <>
                <Spinner color="#ff4444" />
                Deleting...
              </>
            ) : (
              <>
                <Icon.Trash />
                Delete
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Update Modal ────────────────────────────────────────────────────────────
function UpdateModal({
  env,
  onSave,
  onClose,
}: {
  env: EnvProject;
  onSave: (id: string, name: string, content: string) => Promise<void>;
  onClose: () => void;
}) {
  const [name, setName] = useState(env.projectName);
  const [content, setContent] = useState(env.envContent);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setContent(ev.target?.result as string);
    reader.readAsText(file);
  };

  const handleSave = async () => {
    if (!name.trim() || !content.trim()) return;
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

  const unchanged = name.trim() === env.projectName && content.trim() === env.envContent;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={!isSaving ? onClose : undefined}
      />
      {/* Modal */}
      <div className="relative bg-[#0e0e0e] border border-[#1e1e1e] rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden">
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1a1a1a]">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded bg-[#141414] border border-[#1e1e1e] flex items-center justify-center">
              <span className="text-[#00ff88] text-[9px] font-bold">.ev</span>
            </div>
            <span className="text-sm font-bold text-[#e8e8e8] tracking-wide">
              Update Env
            </span>
          </div>
          <button
            onClick={!isSaving ? onClose : undefined}
            className="text-[#444] hover:text-[#e8e8e8] transition-colors p-1"
          >
            <Icon.X />
          </button>
        </div>

        {/* Modal body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Project name */}
          <div className="space-y-1.5">
            <label className="text-[11px] tracking-[0.2em] uppercase text-[#555] font-semibold">
              Project Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#111] border border-[#1e1e1e] rounded-lg px-4 py-3 text-sm text-[#e8e8e8] placeholder-[#333] focus:outline-none focus:border-[#00ff88] focus:ring-1 focus:ring-[#00ff88]/20 transition-all"
            />
          </div>

          {/* Env editor */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] tracking-[0.2em] uppercase text-[#555] font-semibold">
                Environment Variables
              </label>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 text-[11px] text-[#555] hover:text-[#00ff88] transition-colors tracking-wide border border-[#1e1e1e] hover:border-[#00ff88]/30 rounded px-2.5 py-1"
              >
                <Icon.Upload />
                Upload .env file
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".env,.txt"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
            <EnvEditor value={content} onChange={setContent} rows={12} />
          </div>

          {error && (
            <p className="text-[#ff4444] text-xs flex items-center gap-1.5">
              Failed to update. Please try again.
            </p>
          )}
        </div>

        {/* Modal footer */}
        <div className="flex gap-2.5 px-6 py-4 border-t border-[#1a1a1a] bg-[#0a0a0a]">
          <button
            onClick={!isSaving ? onClose : undefined}
            disabled={isSaving}
            className="flex-1 px-4 py-2.5 rounded-lg bg-[#111] border border-[#1e1e1e] text-sm text-[#888] hover:text-[#e8e8e8] hover:border-[#333] transition-all disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || unchanged || !name.trim() || !content.trim()}
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2 ${
              unchanged || !name.trim() || !content.trim()
                ? "bg-[#111] text-[#333] border border-[#1e1e1e] cursor-not-allowed"
                : isSaving
                ? "bg-[#00ff88]/20 text-[#00ff88] border border-[#00ff88]/30 cursor-wait"
                : "bg-[#00ff88] text-[#0a0a0a] hover:bg-[#00e07a] active:scale-95"
            }`}
          >
            {isSaving ? (
              <>
                <Spinner />
                Saving...
              </>
            ) : (
              <>
                <Icon.Save />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function HomePage() {
  const [activeTab, setActiveTab] = useState<Tab>("post");

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
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [hasFetchedEnvs, setHasFetchedEnvs] = useState(false);

  // Per-item action state
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EnvProject | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [updateTarget, setUpdateTarget] = useState<EnvProject | null>(null);

  const fetchEnvs = useCallback(async () => {
    setIsLoadingEnvs(true);
    try {
      const res = await axios.get("/api/envs");
      setEnvs(res.data);
      setHasFetchedEnvs(true);
    } catch {
      /* silently fail */
    } finally {
      setIsLoadingEnvs(false);
    }
  }, []);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
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
      await axios.post("/api/envs", {
        projectName: projectName.trim(),
        envContent: envText.trim(),
      });
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

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeletingId(deleteTarget._id);
    try {
      await axios.delete(`/api/envs/${deleteTarget._id}`);
      setEnvs((prev) => prev.filter((e) => e._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch {
      /* could show toast */
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleUpdate = async (id: string, name: string, content: string) => {
    await axios.put(`/api/envs/${id}`, { projectName: name, envContent: content });
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

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const countEnvKeys = (content: string) =>
    content.split("\n").filter((l) => l.trim() && !l.trim().startsWith("#") && l.includes("=")).length;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e8e8e8] font-mono">
      {/* Grid bg */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Modals */}
      {deleteTarget && (
        <DeleteDialog
          projectName={deleteTarget.projectName}
          onConfirm={handleDeleteConfirm}
          onCancel={() => !isDeletingId && setDeleteTarget(null)}
          isDeleting={isDeletingId === deleteTarget._id}
        />
      )}
      {updateTarget && (
        <UpdateModal
          env={updateTarget}
          onSave={handleUpdate}
          onClose={() => setUpdateTarget(null)}
        />
      )}

      <div className="relative max-w-3xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse" />
            <span className="text-[11px] tracking-[0.25em] uppercase text-[#555] font-semibold">
              ENV VAULT
            </span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight" style={{ fontFamily: "'Courier New', monospace" }}>
            <span className="text-[#00ff88]">.</span>env
            <span className="text-[#444] ml-3 text-2xl">manager</span>
          </h1>
          <p className="text-[#444] text-sm mt-2 tracking-wide">
            Store and manage your project environment files securely.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 mb-8 border border-[#1e1e1e] rounded-lg overflow-hidden w-fit">
          {(["post", "envs"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`px-6 py-2.5 text-sm font-semibold tracking-widest uppercase transition-all duration-200 ${
                activeTab === tab
                  ? "bg-[#00ff88] text-[#0a0a0a]"
                  : "bg-[#111] text-[#555] hover:text-[#aaa] hover:bg-[#161616]"
              }`}
            >
              {tab === "post" ? "+ Post" : "All Envs"}
            </button>
          ))}
        </div>

        {/* ─── POST TAB ─── */}
        {activeTab === "post" && (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[11px] tracking-[0.2em] uppercase text-[#555] font-semibold">
                Project Name
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="my-awesome-project"
                className="w-full bg-[#111] border border-[#1e1e1e] rounded-lg px-4 py-3 text-sm text-[#e8e8e8] placeholder-[#333] focus:outline-none focus:border-[#00ff88] focus:ring-1 focus:ring-[#00ff88]/20 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] tracking-[0.2em] uppercase text-[#555] font-semibold">
                  Environment Variables
                </label>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 text-[11px] text-[#555] hover:text-[#00ff88] transition-colors tracking-wide border border-[#1e1e1e] hover:border-[#00ff88]/30 rounded px-2.5 py-1"
                >
                  <Icon.Upload />
                  Upload .env file
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".env,.txt"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>
              <EnvEditor value={envText} onChange={setEnvText} />
            </div>

            <div className="flex items-center gap-4 pt-2">
              <button
                onClick={handleSave}
                disabled={isSaving || !projectName.trim() || !envText.trim()}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold tracking-widest uppercase transition-all duration-200 ${
                  !projectName.trim() || !envText.trim()
                    ? "bg-[#111] text-[#333] border border-[#1e1e1e] cursor-not-allowed"
                    : isSaving
                    ? "bg-[#00ff88]/20 text-[#00ff88] border border-[#00ff88]/30 cursor-wait"
                    : "bg-[#00ff88] text-[#0a0a0a] hover:bg-[#00e07a] active:scale-95"
                }`}
              >
                {isSaving ? (
                  <>
                    <Spinner />
                    Saving...
                  </>
                ) : (
                  <>
                    <Icon.Save />
                    Save Env
                  </>
                )}
              </button>

              {saveStatus === "success" && (
                <span className="text-[#00ff88] text-sm flex items-center gap-1.5 animate-pulse">
                  <Icon.Check />
                  Saved successfully!
                </span>
              )}
              {saveStatus === "error" && (
                <span className="text-[#ff4444] text-sm flex items-center gap-1.5">
                  Failed to save. Try again.
                </span>
              )}
            </div>
          </div>
        )}

        {/* ─── ENVS TAB ─── */}
        {activeTab === "envs" && (
          <div className="space-y-5">
            {/* Search + Sort + Refresh */}
            <div className="flex gap-3">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#444]">
                  <Icon.Search />
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search projects..."
                  className="w-full bg-[#111] border border-[#1e1e1e] rounded-lg pl-9 pr-4 py-2.5 text-sm text-[#e8e8e8] placeholder-[#333] focus:outline-none focus:border-[#00ff88] focus:ring-1 focus:ring-[#00ff88]/20 transition-all"
                />
              </div>
              <button
                onClick={() => setSortOrder((s) => (s === "desc" ? "asc" : "desc"))}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#111] border border-[#1e1e1e] rounded-lg text-sm text-[#555] hover:text-[#e8e8e8] hover:border-[#333] transition-all whitespace-nowrap"
              >
                <span style={{ transform: sortOrder === "asc" ? "scaleY(-1)" : "scaleY(1)", display: "inline-block", transition: "transform 0.2s" }}>
                  <Icon.Sort />
                </span>
                {sortOrder === "desc" ? "Newest" : "Oldest"}
              </button>
              <button
                onClick={fetchEnvs}
                disabled={isLoadingEnvs}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-[#111] border border-[#1e1e1e] rounded-lg text-sm text-[#555] hover:text-[#e8e8e8] hover:border-[#333] transition-all"
              >
                <span className={isLoadingEnvs ? "animate-spin" : ""}><Icon.Refresh /></span>
              </button>
            </div>

            {/* List */}
            {isLoadingEnvs ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-[72px] rounded-lg bg-[#111] border border-[#1a1a1a] animate-pulse" />
                ))}
              </div>
            ) : filteredEnvs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-[#2a2a2a]">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mb-4">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <p className="text-sm tracking-widest uppercase">
                  {searchQuery ? "No matches found" : "No env files yet"}
                </p>
                {!searchQuery && (
                  <p className="text-xs mt-1 text-[#222]">Post your first env file to get started</p>
                )}
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredEnvs.map((env, idx) => (
                  <div
                    key={env._id}
                    className="group flex items-center justify-between px-5 py-4 bg-[#0e0e0e] border border-[#1a1a1a] rounded-lg hover:border-[#222] hover:bg-[#111] transition-all duration-200"
                  >
                    {/* Left: index + icon + info */}
                    <div className="flex items-center gap-4 min-w-0">
                      <span className="text-[10px] text-[#2a2a2a] w-5 text-right font-semibold tabular-nums flex-shrink-0">
                        {idx + 1}
                      </span>
                      <div className="w-8 h-8 rounded-md bg-[#141414] border border-[#1e1e1e] flex items-center justify-center flex-shrink-0">
                        <span className="text-[#00ff88] text-[10px] font-bold">.ev</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#e8e8e8] truncate">
                          {env.projectName}
                        </p>
                        <p className="text-[11px] text-[#333] mt-0.5">
                          {countEnvKeys(env.envContent)} keys · {formatDate(env.createdAt)}
                        </p>
                      </div>
                    </div>

                    {/* Right: action buttons */}
                    <div className="flex items-center gap-1.5 flex-shrink-0 ml-4">
                      {/* Copy */}
                      <button
                        onClick={() => handleCopy(env)}
                        title="Copy env content"
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-semibold tracking-wide border transition-all ${
                          copiedId === env._id
                            ? "bg-[#00ff88]/10 border-[#00ff88]/30 text-[#00ff88]"
                            : "bg-[#141414] border-[#1e1e1e] text-[#555] hover:text-[#e8e8e8] hover:border-[#333]"
                        }`}
                      >
                        {copiedId === env._id ? <Icon.Check /> : <Icon.Copy />}
                        <span className="hidden sm:inline">
                          {copiedId === env._id ? "Copied" : "Copy"}
                        </span>
                      </button>

                      {/* Update */}
                      <button
                        onClick={() => setUpdateTarget(env)}
                        title="Edit project"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-semibold tracking-wide border bg-[#141414] border-[#1e1e1e] text-[#555] hover:text-[#e8e8e8] hover:border-[#333] transition-all"
                      >
                        <Icon.Edit />
                        <span className="hidden sm:inline">Edit</span>
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => setDeleteTarget(env)}
                        title="Delete project"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-semibold tracking-wide border bg-[#141414] border-[#1e1e1e] text-[#555] hover:text-[#ff4444] hover:border-[#ff4444]/30 hover:bg-[#ff4444]/5 transition-all"
                      >
                        <Icon.Trash />
                        <span className="hidden sm:inline">Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {filteredEnvs.length > 0 && (
              <p className="text-[11px] text-[#2a2a2a] text-center tracking-widest uppercase pt-2">
                {filteredEnvs.length} project{filteredEnvs.length !== 1 ? "s" : ""}
                {searchQuery && ` matching "${searchQuery}"`}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}