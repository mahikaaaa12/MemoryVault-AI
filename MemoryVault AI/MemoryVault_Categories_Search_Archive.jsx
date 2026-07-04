import { useState, useEffect, useRef, useCallback, createContext, useContext, useMemo } from "react";

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const TYPE_CONFIG = {
  note:         { label: "Note",         color: "#3B82F6", icon: "file-text",    bg: "rgba(59,130,246,0.12)"  },
  conversation: { label: "Conversation", color: "#10B981", icon: "message-circle",bg: "rgba(16,185,129,0.12)" },
  meeting:      { label: "Meeting",      color: "#F97316", icon: "users",         bg: "rgba(249,115,22,0.12)" },
  voice_memo:   { label: "Voice Memo",   color: "#EC4899", icon: "mic",           bg: "rgba(236,72,153,0.12)" },
  image:        { label: "Image",        color: "#A855F7", icon: "image",          bg: "rgba(168,85,247,0.12)" },
  document:     { label: "Document",    color: "#14B8A6", icon: "file",           bg: "rgba(20,184,166,0.12)" },
  activity:     { label: "Activity",    color: "#F59E0B", icon: "activity",       bg: "rgba(245,158,11,0.12)" },
};

const CATEGORY_PALETTE = ["#3B82F6", "#EC4899", "#10B981", "#F97316", "#A855F7", "#14B8A6", "#F59E0B", "#6B7290", "#22C55E", "#EF4444"];
const CATEGORY_ICON_CHOICES = ["folder", "users", "star", "layers", "sparkling", "activity", "tag", "brain", "zap", "file-text"];

const DEFAULT_CATEGORIES = [
  { id: "cat-work",     name: "Work",     icon: "users",     color: "#3B82F6", description: "Meetings, projects, and professional notes" },
  { id: "cat-personal", name: "Personal", icon: "star",      color: "#EC4899", description: "Reflections, journal entries, and life moments" },
  { id: "cat-learning", name: "Learning", icon: "layers",    color: "#14B8A6", description: "Reading notes, courses, and things you're studying" },
  { id: "cat-ideas",    name: "Ideas",    icon: "sparkling", color: "#A855F7", description: "Brainstorms, sparks of inspiration, and concepts" },
  { id: "cat-health",   name: "Health",   icon: "activity",  color: "#F59E0B", description: "Fitness, wellness, and medical notes" },
  { id: "cat-travel",   name: "Travel",   icon: "folder",    color: "#F97316", description: "Trips, itineraries, and travel memories" },
  { id: "cat-finance",  name: "Finance",  icon: "tag",       color: "#10B981", description: "Budgets, expenses, and money matters" },
  { id: "cat-other",    name: "Other",    icon: "file-text", color: "#6B7290", description: "Everything that doesn't fit elsewhere" },
];

// Backward-compatible flat list of category names, kept in sync with the categories context
const CATEGORIES = DEFAULT_CATEGORIES.map(c => c.name);

// ─── GLOBAL STYLES ────────────────────────────────────────────────────────────
const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg-canvas: #0B0C15; --bg-shell: #0E1020; --bg-surface: #12132A;
      --bg-surface-raised: #181A33; --bg-surface-active: #1C1740;
      --border-subtle: #21233F; --border-default: #2A2D4D; --border-focus: #7C3AED;
      --text-primary: #F8FAFC; --text-secondary: #A1A8C3; --text-tertiary: #6B7290;
      --accent-400: #9F75F0; --accent-500: #8B5CF6; --accent-600: #7C3AED; --accent-700: #6320D6;
      --success: #22C55E; --danger: #EF4444; --warning: #F59E0B; --favorite-gold: #FBBF24;
      --radius-sm: 6px; --radius-md: 10px; --radius-lg: 14px; --radius-xl: 20px; --radius-full: 9999px;
      --shadow-xs: 0 1px 2px rgba(0,0,0,0.4); --shadow-sm: 0 2px 8px rgba(0,0,0,0.35);
      --shadow-md: 0 8px 24px rgba(0,0,0,0.45); --shadow-lg: 0 16px 48px rgba(0,0,0,0.55);
      --shadow-glow-accent: 0 0 32px rgba(124,58,237,0.35);
    }
    html, body, #root { height: 100%; }
    body { font-family: 'Inter', -apple-system, sans-serif; background: var(--bg-canvas); color: var(--text-primary); -webkit-font-smoothing: antialiased; }
    ::selection { background: rgba(124,58,237,0.3); }
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: var(--bg-canvas); }
    ::-webkit-scrollbar-thumb { background: var(--border-default); border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: var(--text-tertiary); }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes scaleIn { from { opacity: 0; transform: scale(0.96) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
    @keyframes shimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes pulse-dot { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.6; transform: scale(0.85); } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes toastIn { from { opacity: 0; transform: translateX(100%) scale(0.95); } to { opacity: 1; transform: translateX(0) scale(1); } }
    @keyframes cardIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes bounceIn { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
    .page-fade { animation: fadeIn 0.2s ease-out both; }
    .card-enter { animation: cardIn 0.25s cubic-bezier(0.16,1,0.3,1) both; }
    .modal-enter { animation: scaleIn 0.2s cubic-bezier(0.16,1,0.3,1) both; }
    .toast-enter { animation: toastIn 0.3s cubic-bezier(0.16,1,0.3,1) both; }
    .memory-card { transition: border-color 150ms, transform 150ms, box-shadow 150ms, background 150ms; }
    .memory-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-sm); background: var(--bg-surface-raised) !important; border-color: var(--border-default) !important; }
    .icon-btn { transition: color 150ms, background 150ms; border-radius: 50%; }
    .icon-btn:hover { background: rgba(255,255,255,0.06); }
    .nav-item { transition: background 150ms, color 150ms; }
    .nav-item:hover { background: var(--bg-surface); }
    .tag-chip { transition: background 150ms, border-color 150ms; cursor: pointer; }
    .tag-chip:hover { background: rgba(255,255,255,0.1) !important; }
    .search-mark { background: rgba(124,58,237,0.35); color: var(--text-primary); border-radius: 3px; padding: 0 1px; }
    .category-card { transition: border-color 150ms, transform 150ms, box-shadow 150ms, background 150ms; }
    .category-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-sm); background: var(--bg-surface-raised) !important; border-color: var(--border-default) !important; }
    .recent-chip { transition: background 150ms, border-color 150ms; }
    .recent-chip:hover { background: var(--bg-surface-raised) !important; border-color: var(--border-default) !important; }
    @keyframes dotBounce { 0%, 80%, 100% { transform: scale(0.7); opacity: 0.5; } 40% { transform: scale(1); opacity: 1; } }
    .ai-dot { animation: dotBounce 1s infinite; }
    .btn-primary { background: linear-gradient(135deg, #722CE4 0%, #5B21B6 100%); transition: filter 150ms, box-shadow 150ms, transform 100ms; }
    .btn-primary:hover { filter: brightness(1.08); box-shadow: var(--shadow-glow-accent); }
    .btn-primary:active { transform: scale(0.98); }
    .overlay-backdrop { background: rgba(5,6,12,0.7); backdrop-filter: blur(4px); }
    .glass-panel { background: rgba(18,19,42,0.88); backdrop-filter: blur(20px) saturate(140%); border: 1px solid rgba(255,255,255,0.08); }
    [contenteditable]:focus { outline: none; }
    [contenteditable]:empty:before { content: attr(data-placeholder); color: var(--text-tertiary); pointer-events: none; }
    @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }
  `}</style>
);

// ─── LUCIDE ICONS ─────────────────────────────────────────────────────────────
const ICONS = {
  "file-text": `<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>`,
  "message-circle": `<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>`,
  "users": `<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>`,
  "mic": `<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>`,
  "image": `<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>`,
  "file": `<path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/>`,
  "activity": `<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>`,
  "search": `<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>`,
  "plus": `<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>`,
  "x": `<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>`,
  "star": `<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>`,
  "pin": `<line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17H19V15L17 9V3H7V9L5 15V17Z"/>`,
  "archive": `<polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/>`,
  "trash-2": `<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>`,
  "edit-2": `<path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>`,
  "more-horizontal": `<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>`,
  "tag": `<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>`,
  "filter": `<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>`,
  "sort-desc": `<path d="M11 11L7 15 3 11"/><path d="M7 15V4"/><path d="M21 6H12"/><path d="M19 10H12"/><path d="M17 14H12"/>`,
  "clock": `<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>`,
  "check": `<polyline points="20 6 9 17 4 12"/>`,
  "check-circle": `<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>`,
  "alert-circle": `<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>`,
  "info": `<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>`,
  "sparkling": `<path d="M12 3L13.5 8.5L19 10L13.5 11.5L12 17L10.5 11.5L5 10L10.5 8.5L12 3Z"/><path d="M5 3L5.8 5.5L8 6L5.8 6.5L5 9L4.2 6.5L2 6L4.2 5.5L5 3Z"/><path d="M19 14L19.6 16L21 16.5L19.6 17L19 19L18.4 17L17 16.5L18.4 16L19 14Z"/>`,
  "brain": `<path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.44-4.24Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.44-4.24Z"/>`,
  "link": `<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>`,
  "paperclip": `<path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>`,
  "upload": `<polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>`,
  "eye": `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`,
  "copy": `<rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>`,
  "rotate-ccw": `<polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/>`,
  "folder": `<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>`,
  "grid": `<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>`,
  "list": `<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>`,
  "chevron-down": `<polyline points="6 9 12 15 18 9"/>`,
  "chevron-right": `<polyline points="9 18 15 12 9 6"/>`,
  "arrow-left": `<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>`,
  "zap": `<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>`,
  "layers": `<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>`,
  "refresh-cw": `<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>`,
  "sliders": `<line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>`,
  "bold": `<path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>`,
  "italic": `<line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/>`,
  "underline": `<path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"/><line x1="4" y1="21" x2="20" y2="21"/>`,
  "list-ordered": `<line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/>`,
  "type": `<polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/>`,
  "minus": `<line x1="5" y1="12" x2="19" y2="12"/>`,
  "maximize-2": `<polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>`,
  "cpu": `<rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3"/>`,
  "hash": `<line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/>`,
  "bar-chart-2": `<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>`,
  "calendar": `<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>`,
  "inbox": `<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>`,
  "alert-triangle": `<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>`,
  "sliders-horizontal": `<line x1="21" y1="4" x2="14" y2="4"/><line x1="10" y1="4" x2="3" y2="4"/><line x1="21" y1="12" x2="12" y2="12"/><line x1="8" y1="12" x2="3" y2="12"/><line x1="21" y1="20" x2="16" y2="20"/><line x1="12" y1="20" x2="3" y2="20"/><line x1="14" y1="2" x2="14" y2="6"/><line x1="8" y1="10" x2="8" y2="14"/><line x1="16" y1="18" x2="16" y2="22"/>`,
};

const Icon = ({ name, size = 16, color = "currentColor", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, ...style }}
    dangerouslySetInnerHTML={{ __html: ICONS[name] || ICONS["file-text"] }}
  />
);

// ─── TOAST SYSTEM ─────────────────────────────────────────────────────────────
const ToastCtx = createContext(null);
const useToast = () => useContext(ToastCtx);

const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((msg, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), type === "error" ? 6000 : 4000);
  }, []);
  const removeToast = useCallback((id) => setToasts(p => p.filter(t => t.id !== id)), []);
  return (
    <ToastCtx.Provider value={{ addToast }}>
      {children}
      <div style={{ position: "fixed", bottom: 24, right: 24, display: "flex", flexDirection: "column", gap: 8, zIndex: 9999 }}>
        {toasts.map(t => {
          const icon = { success: "check-circle", error: "alert-circle", info: "info", warning: "alert-circle" }[t.type];
          const color = { success: "var(--success)", error: "var(--danger)", info: "var(--accent-400)", warning: "var(--warning)" }[t.type];
          const bar = { success: "#22C55E", error: "#EF4444", info: "#7C3AED", warning: "#F59E0B" }[t.type];
          return (
            <div key={t.id} className="toast-enter" style={{
              display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 16px",
              background: "var(--bg-surface-raised)", border: "1px solid var(--border-default)",
              borderLeft: `3px solid ${bar}`, borderRadius: "var(--radius-md)",
              boxShadow: "var(--shadow-md)", minWidth: 280, maxWidth: 380,
            }}>
              <Icon name={icon} size={18} color={color} style={{ marginTop: 1 }} />
              <span style={{ fontSize: 13, color: "var(--text-primary)", flex: 1, lineHeight: 1.5 }}>{t.msg}</span>
              <button onClick={() => removeToast(t.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)", padding: 0, lineHeight: 1 }}>
                <Icon name="x" size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
};

// ─── MEMORY DATA STORE ────────────────────────────────────────────────────────
const MemoryCtx = createContext(null);
const useMemories = () => useContext(MemoryCtx);

const SEED_MEMORIES = [
  { id: "m1", type: "note", title: "Midnight thought on consciousness", content: "<p>What if consciousness is simply the universe experiencing itself? The boundary between self and world seems less like a wall and more like a membrane—porous, shifting, defined only by attention.</p><p>The idea of a 'hard problem' might itself be a cognitive artifact.</p>", summary: "Philosophical reflection on consciousness as a permeable boundary rather than a fixed division between self and world.", tags: ["philosophy", "consciousness", "ideas"], category: "Ideas", isFavorite: true, isPinned: true, isArchived: false, isDeleted: false, attachments: [], relatedIds: ["m3"], createdAt: new Date(Date.now() - 2 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: "m2", type: "meeting", title: "Q3 Product Strategy Meeting", content: "<p>Discussed roadmap priorities for Q3. Key decisions:</p><ul><li>Memory search gets priority over analytics dashboard</li><li>AI tagging to be rolled out in phases</li><li>Mobile PWA by end of quarter</li></ul><p>Action items: Sarah owns search spec, Alex on AI pipeline, Marcus on mobile audit.</p>", summary: "Q3 planning session covering roadmap priorities: search first, phased AI tagging, mobile PWA by quarter end.", tags: ["work", "strategy", "product"], category: "Work", isFavorite: false, isPinned: true, isArchived: false, isDeleted: false, attachments: [{ name: "Q3_Roadmap.pdf", size: "2.4 MB", type: "application/pdf" }], relatedIds: ["m5"], createdAt: new Date(Date.now() - 5 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 5 * 86400000).toISOString() },
  { id: "m3", type: "note", title: "Design principles from Dieter Rams", content: "<p>Good design is innovative. Good design makes a product useful. Good design is aesthetic. Good design makes a product understandable.</p><p>The less design, the better. Restraint is the hardest skill and the most valuable one.</p>", summary: "Notes on Dieter Rams' ten principles of good design with personal reflections on restraint as the core skill.", tags: ["design", "principles", "learning"], category: "Learning", isFavorite: true, isPinned: false, isArchived: false, isDeleted: false, attachments: [], relatedIds: ["m1"], createdAt: new Date(Date.now() - 8 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 8 * 86400000).toISOString() },
  { id: "m4", type: "conversation", title: "Chat with Sarah about remote work", content: "<p>Sarah shared that she's been most productive between 6–9 AM before notifications start. She uses the Pomodoro method but with 50-min blocks.</p><p>We talked about how async communication changes team trust dynamics—visibility becomes a proxy for reliability when presence isn't observable.</p>", summary: "Discussion on remote work productivity rhythms and how async communication reshapes team trust dynamics.", tags: ["remote-work", "productivity", "team"], category: "Work", isFavorite: false, isPinned: false, isArchived: false, isDeleted: false, attachments: [], relatedIds: [], createdAt: new Date(Date.now() - 10 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 10 * 86400000).toISOString() },
  { id: "m5", type: "voice_memo", title: "Voice memo: App idea brainstorm", content: "<p>Idea: a memory app that uses spaced repetition not for facts but for feelings—resurfaces an old journal entry when the AI detects you're in a similar emotional context.</p><p>The key insight is that memory isn't retrieval, it's reconstruction. Every recall changes the memory slightly.</p>", summary: "Brainstorm on emotion-aware spaced repetition for personal memories, noting that recall is reconstruction not retrieval.", tags: ["ideas", "startup", "ai", "memory"], category: "Ideas", isFavorite: true, isPinned: false, isArchived: false, isDeleted: false, attachments: [{ name: "brainstorm_audio.m4a", size: "3.1 MB", type: "audio/mp4" }], relatedIds: ["m2"], createdAt: new Date(Date.now() - 14 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 14 * 86400000).toISOString() },
  { id: "m6", type: "activity", title: "Morning run insights", content: "<p>6.2 km in 31 minutes. Heart rate peaked at 172 bpm on the hill section. Felt strong after the first km warm-up.</p><p>Mental clarity was notably better post-run. The ideas about the memory app came during the cooldown walk.</p>", summary: "Morning run: 6.2km in 31min, peak HR 172. Notable mental clarity boost post-exercise triggering creative thinking.", tags: ["fitness", "health", "running"], category: "Health", isFavorite: false, isPinned: false, isArchived: false, isDeleted: false, attachments: [], relatedIds: [], createdAt: new Date(Date.now() - 1 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 1 * 86400000).toISOString() },
  { id: "m7", type: "document", title: "Reading notes: Thinking Fast and Slow", content: "<p>System 1 (fast) vs System 2 (slow) thinking. The availability heuristic explains why vivid, recent events distort our probability estimates.</p><p>Most of our decisions are made by System 1 and rationalized afterward. The 'what you see is all there is' (WYSIATI) effect.</p>", summary: "Core concepts from Kahneman's dual-process theory: System 1/2 thinking, availability heuristic, and WYSIATI bias.", tags: ["reading", "psychology", "cognitive-bias", "learning"], category: "Learning", isFavorite: false, isPinned: false, isArchived: true, isDeleted: false, attachments: [{ name: "thinking_fast_slow.pdf", size: "890 KB", type: "application/pdf" }], relatedIds: [], createdAt: new Date(Date.now() - 20 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 20 * 86400000).toISOString() },
  { id: "m8", type: "image", title: "Sunset at the lake — photo journal", content: "<p>The light was this impossible amber color, like the sky was apologizing for the whole day. Drove out to Lake Merced on a whim after the meeting.</p><p>Sometimes the best memories are the unplanned ones. No agenda, no output. Just witness.</p>", summary: "Spontaneous lake visit after work producing a reflective journal entry about presence and unplanned moments.", tags: ["personal", "nature", "reflection", "photography"], category: "Personal", isFavorite: true, isPinned: false, isArchived: false, isDeleted: false, attachments: [{ name: "lake_sunset.jpg", size: "4.2 MB", type: "image/jpeg" }], relatedIds: [], createdAt: new Date(Date.now() - 3 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 3 * 86400000).toISOString() },
];

const delay = (ms) => new Promise(r => setTimeout(r, ms));

const MemoryProvider = ({ children }) => {
  const [memories, setMemories] = useState(SEED_MEMORIES);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [aiLoading, setAiLoading] = useState(false);

  const getMemory = useCallback((id) => memories.find(m => m.id === id), [memories]);

  const createCategory = useCallback((data) => {
    const id = "cat-" + Date.now();
    const cat = { id, icon: "folder", color: CATEGORY_PALETTE[0], description: "", ...data };
    setCategories(p => [...p, cat]);
    return cat;
  }, []);

  const updateCategory = useCallback((id, updates) => {
    setCategories(p => p.map(c => {
      if (c.id !== id) return c;
      const next = { ...c, ...updates };
      // keep memory.category in sync if the name changed
      if (updates.name && updates.name !== c.name) {
        setMemories(pm => pm.map(m => m.category === c.name ? { ...m, category: updates.name } : m));
      }
      return next;
    }));
  }, []);

  const deleteCategory = useCallback((id, reassignTo = "Other") => {
    setCategories(p => {
      const target = p.find(c => c.id === id);
      if (target) {
        setMemories(pm => pm.map(m => m.category === target.name ? { ...m, category: reassignTo } : m));
      }
      return p.filter(c => c.id !== id);
    });
  }, []);

  const createMemory = useCallback(async (data) => {
    const id = "m" + Date.now();
    const now = new Date().toISOString();
    const mem = {
      id, isFavorite: false, isPinned: false, isArchived: false, isDeleted: false,
      attachments: [], relatedIds: [], summary: "", tags: [],
      createdAt: now, updatedAt: now, ...data,
    };
    setMemories(p => [mem, ...p]);
    return mem;
  }, []);

  const updateMemory = useCallback((id, updates) => {
    setMemories(p => p.map(m => m.id === id ? { ...m, ...updates, updatedAt: new Date().toISOString() } : m));
  }, []);

  const deleteMemory = useCallback((id, permanent = false) => {
    if (permanent) {
      setMemories(p => p.filter(m => m.id !== id));
    } else {
      setMemories(p => p.map(m => m.id === id ? { ...m, isDeleted: true, deletedAt: new Date().toISOString() } : m));
    }
  }, []);

  const restoreMemory = useCallback((id) => {
    setMemories(p => p.map(m => m.id === id ? { ...m, isDeleted: false, deletedAt: null, isArchived: false } : m));
  }, []);

  const toggleFavorite = useCallback((id) => {
    setMemories(p => p.map(m => m.id === id ? { ...m, isFavorite: !m.isFavorite } : m));
  }, []);

  const togglePin = useCallback((id) => {
    setMemories(p => p.map(m => m.id === id ? { ...m, isPinned: !m.isPinned } : m));
  }, []);

  const toggleArchive = useCallback((id) => {
    setMemories(p => p.map(m => m.id === id ? { ...m, isArchived: !m.isArchived, isDeleted: false } : m));
  }, []);

  const generateAISummary = useCallback(async (content, title) => {
    setAiLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6", max_tokens: 1000,
          messages: [{ role: "user", content: `Generate a concise 1-2 sentence summary for this memory:\n\nTitle: ${title}\n\nContent: ${content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()}\n\nReturn ONLY the summary, no quotes, no preamble.` }],
        }),
      });
      const data = await res.json();
      return data.content?.[0]?.text?.trim() || "";
    } catch { return ""; }
    finally { setAiLoading(false); }
  }, []);

  const generateAITags = useCallback(async (content, title, category) => {
    setAiLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6", max_tokens: 1000,
          messages: [{ role: "user", content: `Generate 3-5 relevant lowercase tags (single words or hyphenated) for this memory:\n\nTitle: ${title}\nCategory: ${category}\nContent: ${content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()}\n\nReturn ONLY a JSON array of tag strings, e.g. ["tag1","tag2","tag3"]. No other text.` }],
        }),
      });
      const data = await res.json();
      const text = data.content?.[0]?.text?.trim() || "[]";
      const cleaned = text.replace(/```json|```/g, "").trim();
      return JSON.parse(cleaned);
    } catch { return []; }
    finally { setAiLoading(false); }
  }, []);

  const findRelatedMemories = useCallback(async (content, title, currentId) => {
    setAiLoading(true);
    try {
      const others = memories.filter(m => m.id !== currentId && !m.isDeleted).map(m => ({ id: m.id, title: m.title, tags: m.tags, summary: m.summary }));
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6", max_tokens: 1000,
          messages: [{ role: "user", content: `Given this memory:\nTitle: ${title}\nContent: ${content.replace(/<[^>]+>/g, " ").slice(0, 500)}\n\nFind the 1-3 most related memories from this list:\n${JSON.stringify(others)}\n\nReturn ONLY a JSON array of IDs, e.g. ["m1","m3"]. No other text. If none are relevant, return [].` }],
        }),
      });
      const data = await res.json();
      const text = data.content?.[0]?.text?.trim() || "[]";
      const cleaned = text.replace(/```json|```/g, "").trim();
      return JSON.parse(cleaned);
    } catch { return []; }
    finally { setAiLoading(false); }
  }, [memories]);

  const aiSearch = useCallback(async (query, pool) => {
    setAiLoading(true);
    try {
      const slim = pool.map(m => ({ id: m.id, title: m.title, tags: m.tags, summary: m.summary, category: m.category }));
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6", max_tokens: 1000,
          messages: [{ role: "user", content: `A user is searching their personal memory app for: "${query}"\n\nHere are their memories:\n${JSON.stringify(slim)}\n\nReturn ONLY a JSON array, ranked by relevance, of objects {"id": "...", "reason": "short reason under 12 words"} for memories that genuinely match the intent of the query (not just keyword overlap). Omit irrelevant ones. Return [] if nothing matches. No other text.` }],
        }),
      });
      const data = await res.json();
      const text = data.content?.[0]?.text?.trim() || "[]";
      const cleaned = text.replace(/```json|```/g, "").trim();
      return JSON.parse(cleaned);
    } catch { return []; }
    finally { setAiLoading(false); }
  }, []);

  return (
    <MemoryCtx.Provider value={{
      memories, getMemory, createMemory, updateMemory, deleteMemory,
      restoreMemory, toggleFavorite, togglePin, toggleArchive,
      generateAISummary, generateAITags, findRelatedMemories, aiLoading,
      categories, createCategory, updateCategory, deleteCategory, aiSearch,
    }}>
      {children}
    </MemoryCtx.Provider>
  );
};

// ─── UTILITY FUNCTIONS ────────────────────────────────────────────────────────
const relativeTime = (iso) => {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000), hr = Math.floor(diff / 3600000), day = Math.floor(diff / 86400000);
  if (min < 1) return "Just now";
  if (min < 60) return `${min}m ago`;
  if (hr < 24) return `${hr}h ago`;
  if (day < 7) return `${day}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const stripHtml = (html) => html?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() || "";

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Splits text around case-insensitive matches of query, wrapping matches in <mark>-styled spans
const highlightText = (text, query) => {
  if (!query || !text) return text;
  const parts = text.split(new RegExp(`(${escapeRegex(query)})`, "ig"));
  if (parts.length === 1) return text;
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase()
      ? <mark key={i} className="search-mark">{part}</mark>
      : <span key={i}>{part}</span>
  );
};

const timeBucket = (iso) => {
  const diff = Date.now() - new Date(iso).getTime();
  const day = diff / 86400000;
  if (day < 1) return "Today";
  if (day < 7) return "This Week";
  if (day < 30) return "This Month";
  return "Earlier";
};

// ─── ICON BADGE ───────────────────────────────────────────────────────────────
const TypeBadge = ({ type, size = 32 }) => {
  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.note;
  return (
    <div style={{ width: size, height: size, borderRadius: "var(--radius-md)", background: cfg.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <Icon name={cfg.icon} size={size * 0.5} color="white" />
    </div>
  );
};

// ─── TAG CHIP ─────────────────────────────────────────────────────────────────
const TagChip = ({ tag, onRemove, onClick, active }) => (
  <span className="tag-chip" onClick={onClick} style={{
    display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px",
    background: active ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.06)",
    border: `1px solid ${active ? "rgba(124,58,237,0.4)" : "transparent"}`,
    borderRadius: "var(--radius-sm)", fontSize: 12, color: active ? "var(--accent-400)" : "var(--text-secondary)",
    userSelect: "none",
  }}>
    <Icon name="hash" size={10} />
    {tag}
    {onRemove && (
      <span onClick={e => { e.stopPropagation(); onRemove(); }} style={{ cursor: "pointer", color: "var(--text-tertiary)", lineHeight: 1 }}>
        <Icon name="x" size={11} />
      </span>
    )}
  </span>
);

// ─── BUTTON ───────────────────────────────────────────────────────────────────
const Btn = ({ children, variant = "primary", size = "md", onClick, disabled, loading, style = {}, title }) => {
  const base = { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: "Inter, sans-serif", fontWeight: 600, border: "none", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1, transition: "all 150ms", flexShrink: 0 };
  const sizes = { sm: { height: 32, padding: "0 12px", fontSize: 13 }, md: { height: 40, padding: "0 16px", fontSize: 14 }, lg: { height: 44, padding: "0 20px", fontSize: 14 } };
  const variants = {
    primary: { color: "white", borderRadius: "var(--radius-md)" },
    secondary: { background: "var(--bg-surface-raised)", color: "var(--text-primary)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)" },
    ghost: { background: "transparent", color: "var(--text-secondary)", borderRadius: "var(--radius-md)" },
    danger: { background: "#EF4444", color: "white", borderRadius: "var(--radius-md)" },
    outline: { background: "transparent", color: "var(--text-secondary)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)" },
  };
  const cls = variant === "primary" ? "btn-primary" : "";
  return (
    <button className={cls} onClick={disabled || loading ? undefined : onClick} title={title}
      style={{ ...base, ...sizes[size], ...variants[variant], ...style }}>
      {loading ? <div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> : children}
    </button>
  );
};

// ─── RICH TEXT EDITOR ─────────────────────────────────────────────────────────
const RichEditor = ({ value, onChange, placeholder = "Start writing your memory..." }) => {
  const editorRef = useRef(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (editorRef.current && !isInitialized.current) {
      editorRef.current.innerHTML = value || "";
      isInitialized.current = true;
    }
  }, []);

  const exec = (cmd, val = null) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
  };

  const handleInput = () => {
    if (onChange) onChange(editorRef.current?.innerHTML || "");
  };

  const toolbarBtns = [
    { cmd: "bold", icon: "bold", title: "Bold" },
    { cmd: "italic", icon: "italic", title: "Italic" },
    { cmd: "underline", icon: "underline", title: "Underline" },
    { sep: true },
    { cmd: "insertUnorderedList", icon: "list", title: "Bullet list" },
    { cmd: "insertOrderedList", icon: "list-ordered", title: "Numbered list" },
    { sep: true },
    { cmd: "formatBlock", val: "h3", icon: "type", title: "Heading" },
    { cmd: "formatBlock", val: "p", icon: "minus", title: "Paragraph" },
  ];

  return (
    <div style={{ border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 2, padding: "8px 12px", borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-surface-raised)", flexWrap: "wrap" }}>
        {toolbarBtns.map((btn, i) => btn.sep ? (
          <div key={i} style={{ width: 1, height: 20, background: "var(--border-subtle)", margin: "0 4px" }} />
        ) : (
          <button key={btn.cmd + btn.val} title={btn.title} onMouseDown={e => { e.preventDefault(); exec(btn.cmd, btn.val); }}
            style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 6px", borderRadius: "var(--radius-sm)", color: "var(--text-secondary)", display: "flex", alignItems: "center", transition: "background 150ms, color 150ms" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "var(--text-primary)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--text-secondary)"; }}>
            <Icon name={btn.icon} size={14} />
          </button>
        ))}
      </div>
      {/* Content area */}
      <div ref={editorRef} contentEditable data-placeholder={placeholder} onInput={handleInput}
        style={{ minHeight: 200, padding: "16px", fontSize: 14, lineHeight: 1.7, color: "var(--text-primary)", background: "var(--bg-surface)", outline: "none" }}
      />
      <style>{`
        [contenteditable] h3 { font-size: 16px; font-weight: 600; margin: 8px 0 4px; }
        [contenteditable] ul, [contenteditable] ol { padding-left: 20px; margin: 6px 0; }
        [contenteditable] li { margin: 3px 0; }
        [contenteditable] p { margin: 4px 0; }
      `}</style>
    </div>
  );
};

// ─── ATTACHMENT UPLOAD ────────────────────────────────────────────────────────
const AttachmentUpload = ({ attachments, onChange }) => {
  const inputRef = useRef(null);
  const formatSize = (bytes) => {
    if (typeof bytes === "string") return bytes;
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  };

  const handleFiles = (files) => {
    const newAtts = Array.from(files).map(f => ({ name: f.name, size: formatSize(f.size), type: f.type }));
    onChange([...attachments, ...newAtts]);
  };

  const [dragging, setDragging] = useState(false);

  return (
    <div>
      <div onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragging ? "var(--accent-600)" : "var(--border-default)"}`,
          borderRadius: "var(--radius-md)", padding: "16px 20px", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 12, transition: "border-color 150ms",
          background: dragging ? "rgba(124,58,237,0.05)" : "transparent",
        }}>
        <Icon name="upload" size={18} color="var(--text-tertiary)" />
        <div>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 500 }}>Drop files here or click to upload</p>
          <p style={{ fontSize: 12, color: "var(--text-tertiary)" }}>Attach images, PDFs, audio, or any file</p>
        </div>
        <input ref={inputRef} type="file" multiple style={{ display: "none" }} onChange={e => handleFiles(e.target.files)} />
      </div>
      {attachments.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
          {attachments.map((att, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "var(--bg-surface-raised)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
              <Icon name="paperclip" size={14} color="var(--text-tertiary)" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{att.name}</p>
                <p style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{att.size}</p>
              </div>
              <button onClick={() => onChange(attachments.filter((_, j) => j !== i))}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)", padding: 4 }}>
                <Icon name="x" size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── MEMORY FORM MODAL ────────────────────────────────────────────────────────
const MemoryFormModal = ({ memory, onClose, onSave }) => {
  const { generateAISummary, generateAITags, findRelatedMemories, aiLoading, memories, categories } = useMemories();
  const { addToast } = useToast();

  const isEdit = !!memory?.id;
  const [form, setForm] = useState({
    type: "note", title: "", content: "", summary: "", tags: [], category: "Personal",
    isFavorite: false, isPinned: false, attachments: [],
    ...(memory || {}),
  });
  const [tagInput, setTagInput] = useState("");
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const [aiTagsLoading, setAiTagsLoading] = useState(false);
  const [aiRelatedLoading, setAiRelatedLoading] = useState(false);
  const [relatedIds, setRelatedIds] = useState(memory?.relatedIds || []);
  const [saving, setSaving] = useState(false);

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const addTag = (tag) => {
    const t = tag.toLowerCase().replace(/\s+/g, "-").trim();
    if (t && !form.tags.includes(t)) set("tags", [...form.tags, t]);
  };

  const handleTagInput = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(tagInput);
      setTagInput("");
    }
  };

  const handleAISummary = async () => {
    if (!form.content) { addToast("Add some content first", "warning"); return; }
    setAiSummaryLoading(true);
    const s = await generateAISummary(form.content, form.title);
    if (s) { set("summary", s); addToast("AI summary generated ✨", "success"); }
    else addToast("Couldn't generate summary", "error");
    setAiSummaryLoading(false);
  };

  const handleAITags = async () => {
    if (!form.content) { addToast("Add some content first", "warning"); return; }
    setAiTagsLoading(true);
    const tags = await generateAITags(form.content, form.title, form.category);
    if (tags?.length) {
      const merged = [...new Set([...form.tags, ...tags])];
      set("tags", merged);
      addToast(`Added ${tags.length} AI-suggested tags ✨`, "success");
    } else addToast("Couldn't generate tags", "error");
    setAiTagsLoading(false);
  };

  const handleAIRelated = async () => {
    if (!form.content) { addToast("Add some content first", "warning"); return; }
    setAiRelatedLoading(true);
    const ids = await findRelatedMemories(form.content, form.title, memory?.id);
    setRelatedIds(ids);
    addToast(ids.length ? `Found ${ids.length} related memories ✨` : "No strong matches found", ids.length ? "success" : "info");
    setAiRelatedLoading(false);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { addToast("Title is required", "error"); return; }
    setSaving(true);
    await delay(300);
    onSave({ ...form, relatedIds });
    setSaving(false);
  };

  return (
    <div className="overlay-backdrop" style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div className="modal-enter" style={{
        width: "100%", maxWidth: 760, maxHeight: "90vh", display: "flex", flexDirection: "column",
        background: "rgba(18,19,42,0.96)", backdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.08)", borderRadius: "var(--radius-xl)",
        boxShadow: "var(--shadow-lg)", overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "20px 24px", borderBottom: "1px solid var(--border-subtle)" }}>
          <TypeBadge type={form.type} size={36} />
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>{isEdit ? "Edit memory" : "New memory"}</h2>
            <p style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 2 }}>{isEdit ? "Update your memory" : "Capture a thought, conversation, or moment"}</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)", padding: 6, borderRadius: "50%", transition: "color 150ms, background 150ms" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "var(--text-primary)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--text-tertiary)"; }}>
            <Icon name="x" size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Type selector */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 10 }}>Memory type</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {Object.entries(TYPE_CONFIG).map(([k, v]) => (
                  <button key={k} onClick={() => set("type", k)} style={{
                    display: "flex", alignItems: "center", gap: 6, padding: "7px 12px",
                    background: form.type === k ? `${v.color}20` : "var(--bg-surface-raised)",
                    border: `1px solid ${form.type === k ? v.color + "60" : "var(--border-subtle)"}`,
                    borderRadius: "var(--radius-md)", cursor: "pointer", fontSize: 13, fontWeight: 500,
                    color: form.type === k ? v.color : "var(--text-secondary)", transition: "all 150ms",
                    fontFamily: "Inter, sans-serif",
                  }}>
                    <Icon name={v.icon} size={13} color={form.type === k ? v.color : "var(--text-tertiary)"} />
                    {v.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 8 }}>Title *</label>
              <input value={form.title} onChange={e => set("title", e.target.value)}
                placeholder="Give this memory a title..."
                style={{ width: "100%", background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", padding: "10px 14px", fontSize: 15, fontWeight: 600, color: "var(--text-primary)", fontFamily: "Inter, sans-serif", outline: "none", transition: "border-color 150ms" }}
                onFocus={e => e.target.style.borderColor = "var(--accent-600)"}
                onBlur={e => e.target.style.borderColor = "var(--border-default)"}
              />
            </div>

            {/* Content */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 8 }}>Content</label>
              <RichEditor value={form.content} onChange={v => set("content", v)} />
            </div>

            {/* AI Summary */}
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>AI Summary</label>
                <Btn size="sm" variant="ghost" onClick={handleAISummary} loading={aiSummaryLoading} style={{ color: "var(--accent-400)", fontSize: 12 }}>
                  <Icon name="sparkling" size={13} color="var(--accent-400)" /> Generate
                </Btn>
              </div>
              <textarea value={form.summary} onChange={e => set("summary", e.target.value)}
                placeholder="AI-generated summary will appear here, or write your own..."
                rows={3}
                style={{ width: "100%", background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", padding: "10px 14px", fontSize: 13, color: "var(--text-secondary)", fontFamily: "Inter, sans-serif", outline: "none", resize: "vertical", transition: "border-color 150ms", lineHeight: 1.6 }}
                onFocus={e => e.target.style.borderColor = "var(--accent-600)"}
                onBlur={e => e.target.style.borderColor = "var(--border-default)"}
              />
            </div>

            {/* Tags */}
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Tags</label>
                <Btn size="sm" variant="ghost" onClick={handleAITags} loading={aiTagsLoading} style={{ color: "var(--accent-400)", fontSize: 12 }}>
                  <Icon name="sparkling" size={13} color="var(--accent-400)" /> Suggest
                </Btn>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "8px 12px", background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", minHeight: 44, cursor: "text" }}
                onClick={() => document.getElementById("tag-input")?.focus()}>
                {form.tags.map(t => <TagChip key={t} tag={t} onRemove={() => set("tags", form.tags.filter(x => x !== t))} />)}
                <input id="tag-input" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={handleTagInput}
                  placeholder={form.tags.length ? "" : "Add tags (press Enter)..."}
                  style={{ flex: 1, minWidth: 120, background: "none", border: "none", outline: "none", fontSize: 13, color: "var(--text-primary)", fontFamily: "Inter, sans-serif" }}
                />
              </div>
            </div>

            {/* Category + toggles */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 8 }}>Category</label>
                <select value={form.category} onChange={e => set("category", e.target.value)}
                  style={{ width: "100%", background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", padding: "10px 14px", fontSize: 13, color: "var(--text-primary)", fontFamily: "Inter, sans-serif", outline: "none", cursor: "pointer" }}>
                  {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, justifyContent: "flex-end", paddingBottom: 4 }}>
                {[
                  { key: "isFavorite", icon: "star", label: "Favorite", color: "var(--favorite-gold)" },
                  { key: "isPinned", icon: "pin", label: "Pinned", color: "var(--accent-400)" },
                ].map(({ key, icon, label, color }) => (
                  <label key={key} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                    <div onClick={() => set(key, !form[key])} style={{
                      width: 40, height: 22, borderRadius: "var(--radius-full)", background: form[key] ? "var(--accent-600)" : "var(--bg-surface-raised)",
                      border: `1px solid ${form[key] ? "var(--accent-600)" : "var(--border-default)"}`,
                      position: "relative", transition: "background 200ms, border-color 200ms", flexShrink: 0,
                    }}>
                      <div style={{ position: "absolute", top: 2, left: form[key] ? 20 : 2, width: 16, height: 16, borderRadius: "50%", background: form[key] ? "white" : "var(--text-tertiary)", transition: "left 200ms" }} />
                    </div>
                    <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-secondary)" }}>
                      <Icon name={icon} size={13} color={form[key] ? color : "var(--text-tertiary)"} />
                      {label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Attachments */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 8 }}>Attachments</label>
              <AttachmentUpload attachments={form.attachments} onChange={v => set("attachments", v)} />
            </div>

            {/* Related memories */}
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Related memories</label>
                <Btn size="sm" variant="ghost" onClick={handleAIRelated} loading={aiRelatedLoading} style={{ color: "var(--accent-400)", fontSize: 12 }}>
                  <Icon name="sparkling" size={13} color="var(--accent-400)" /> Find
                </Btn>
              </div>
              {relatedIds.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {relatedIds.map(rid => {
                    const rel = memories.find(m => m.id === rid);
                    if (!rel) return null;
                    const cfg = TYPE_CONFIG[rel.type];
                    return (
                      <div key={rid} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "var(--bg-surface-raised)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
                        <Icon name={cfg.icon} size={14} color={cfg.color} />
                        <span style={{ flex: 1, fontSize: 13, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{rel.title}</span>
                        <button onClick={() => setRelatedIds(p => p.filter(x => x !== rid))} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)" }}>
                          <Icon name="x" size={13} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p style={{ fontSize: 13, color: "var(--text-tertiary)", padding: "12px 0" }}>No related memories yet. Click "Find" to let AI discover connections.</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10, padding: "16px 24px", borderTop: "1px solid var(--border-subtle)" }}>
          <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
          <Btn onClick={handleSave} loading={saving}>
            <Icon name="check" size={15} color="white" />
            {isEdit ? "Save changes" : "Create memory"}
          </Btn>
        </div>
      </div>
    </div>
  );
};

// ─── DELETE CONFIRM MODAL ─────────────────────────────────────────────────────
const DeleteModal = ({ memory, onClose, onConfirm, permanent = false }) => (
  <div className="overlay-backdrop" style={{ position: "fixed", inset: 0, zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
    <div className="modal-enter" style={{ width: "100%", maxWidth: 440, background: "rgba(18,19,42,0.96)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "var(--radius-xl)", boxShadow: "var(--shadow-lg)", padding: 28 }}>
      <div style={{ width: 56, height: 56, borderRadius: "var(--radius-xl)", background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
        <Icon name="trash-2" size={24} color="var(--danger)" />
      </div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
        {permanent ? "Delete permanently?" : "Move to trash?"}
      </h2>
      <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 24 }}>
        {permanent ? `"${memory.title}" will be permanently deleted and cannot be recovered.` : `"${memory.title}" will be moved to trash. You can restore it later.`}
      </p>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn variant="danger" onClick={onConfirm}>
          <Icon name="trash-2" size={15} color="white" />
          {permanent ? "Delete forever" : "Move to trash"}
        </Btn>
      </div>
    </div>
  </div>
);

// ─── MEMORY DETAIL MODAL ──────────────────────────────────────────────────────
const MemoryDetailModal = ({ memory, onClose, onEdit, onDelete, onToggleFav, onTogglePin, onToggleArchive }) => {
  const { memories } = useMemories();
  const cfg = TYPE_CONFIG[memory.type] || TYPE_CONFIG.note;
  const related = memory.relatedIds?.map(id => memories.find(m => m.id === id)).filter(Boolean) || [];

  return (
    <div className="overlay-backdrop" style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div className="modal-enter" style={{ width: "100%", maxWidth: 680, maxHeight: "90vh", display: "flex", flexDirection: "column", background: "rgba(18,19,42,0.96)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "var(--radius-xl)", boxShadow: "var(--shadow-lg)", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "22px 24px", borderBottom: "1px solid var(--border-subtle)" }}>
          <TypeBadge type={memory.type} size={40} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: cfg.color }}>{cfg.label}</span>
              {memory.isFavorite && <Icon name="star" size={13} color="var(--favorite-gold)" style={{ fill: "var(--favorite-gold)" }} />}
              {memory.isPinned && <Icon name="pin" size={13} color="var(--accent-400)" />}
              {memory.isArchived && <span style={{ fontSize: 11, padding: "1px 7px", background: "rgba(161,168,195,0.1)", borderRadius: "var(--radius-sm)", color: "var(--text-tertiary)" }}>Archived</span>}
              <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--text-tertiary)" }}>{relativeTime(memory.createdAt)}</span>
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.3 }}>{memory.title}</h2>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)", padding: 6, borderRadius: "50%" }} onMouseEnter={e => e.currentTarget.style.color = "var(--text-primary)"} onMouseLeave={e => e.currentTarget.style.color = "var(--text-tertiary)"}>
            <Icon name="x" size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
          {/* Action bar */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
            {[
              { icon: "edit-2", label: "Edit", onClick: onEdit },
              { icon: "star", label: memory.isFavorite ? "Unfavorite" : "Favorite", onClick: onToggleFav, active: memory.isFavorite, activeColor: "var(--favorite-gold)" },
              { icon: "pin", label: memory.isPinned ? "Unpin" : "Pin", onClick: onTogglePin, active: memory.isPinned, activeColor: "var(--accent-400)" },
              { icon: "archive", label: memory.isArchived ? "Unarchive" : "Archive", onClick: onToggleArchive },
              { icon: "trash-2", label: "Delete", onClick: onDelete, danger: true },
            ].map(a => (
              <button key={a.label} onClick={a.onClick} style={{
                display: "flex", alignItems: "center", gap: 6, padding: "6px 12px",
                background: a.active ? `${a.activeColor}15` : "var(--bg-surface-raised)",
                border: `1px solid ${a.active ? a.activeColor + "40" : "var(--border-subtle)"}`,
                borderRadius: "var(--radius-md)", cursor: "pointer", fontSize: 13, fontWeight: 500,
                color: a.danger ? "var(--danger)" : a.active ? a.activeColor : "var(--text-secondary)",
                fontFamily: "Inter, sans-serif", transition: "all 150ms",
              }}>
                <Icon name={a.icon} size={13} color={a.danger ? "var(--danger)" : a.active ? a.activeColor : "var(--text-tertiary)"} />
                {a.label}
              </button>
            ))}
          </div>

          {/* Summary */}
          {memory.summary && (
            <div style={{ padding: "12px 16px", background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: "var(--radius-md)", marginBottom: 20, display: "flex", gap: 10 }}>
              <Icon name="sparkling" size={16} color="var(--accent-400)" style={{ marginTop: 1, flexShrink: 0 }} />
              <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>{memory.summary}</p>
            </div>
          )}

          {/* Content */}
          <div style={{ fontSize: 14, lineHeight: 1.8, color: "var(--text-primary)" }}
            dangerouslySetInnerHTML={{ __html: memory.content || '<p style="color:var(--text-tertiary)">No content</p>' }}
          />
          <style>{`
            .memory-content h3 { font-size: 16px; font-weight: 600; margin: 12px 0 6px; }
            .memory-content ul, .memory-content ol { padding-left: 20px; margin: 8px 0; }
            .memory-content li { margin: 4px 0; }
          `}</style>

          {/* Tags */}
          {memory.tags?.length > 0 && (
            <div style={{ marginTop: 20, display: "flex", flexWrap: "wrap", gap: 6 }}>
              {memory.tags.map(t => <TagChip key={t} tag={t} />)}
            </div>
          )}

          {/* Category */}
          <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <Icon name="folder" size={14} color="var(--text-tertiary)" />
            <span style={{ fontSize: 13, color: "var(--text-tertiary)" }}>{memory.category}</span>
          </div>

          {/* Attachments */}
          {memory.attachments?.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Attachments</p>
              {memory.attachments.map((att, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "var(--bg-surface-raised)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)", marginBottom: 6 }}>
                  <Icon name="paperclip" size={14} color="var(--text-tertiary)" />
                  <span style={{ flex: 1, fontSize: 13, color: "var(--text-secondary)" }}>{att.name}</span>
                  <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{att.size}</span>
                </div>
              ))}
            </div>
          )}

          {/* Related */}
          {related.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Related memories</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {related.map(r => {
                  const rc = TYPE_CONFIG[r.type];
                  return (
                    <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "var(--bg-surface-raised)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: rc.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon name={rc.icon} size={14} color="white" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.title}</p>
                        <p style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{relativeTime(r.createdAt)}</p>
                      </div>
                      <Icon name="link" size={14} color="var(--text-tertiary)" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── MEMORY CARD ──────────────────────────────────────────────────────────────
const MemoryCard = ({ memory, onClick, onEdit, onDelete, onToggleFav, onTogglePin, onToggleArchive, style = {}, animDelay = 0 }) => {
  const cfg = TYPE_CONFIG[memory.type] || TYPE_CONFIG.note;
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const snippet = stripHtml(memory.content).slice(0, 120) + (stripHtml(memory.content).length > 120 ? "…" : "");

  return (
    <div className="memory-card card-enter" onClick={onClick} style={{
      background: "var(--bg-surface)", border: "1px solid var(--border-subtle)",
      borderRadius: "var(--radius-lg)", padding: "20px", cursor: "pointer",
      display: "flex", flexDirection: "column", gap: 12, position: "relative",
      animationDelay: `${animDelay}ms`, ...style,
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <TypeBadge type={memory.type} size={28} />
          <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: cfg.color }}>{cfg.label}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }} onClick={e => e.stopPropagation()}>
          {memory.isFavorite && <Icon name="star" size={14} color="var(--favorite-gold)" style={{ fill: "var(--favorite-gold)" }} />}
          {memory.isPinned && <Icon name="pin" size={14} color="var(--accent-400)" />}
          <div ref={menuRef} style={{ position: "relative" }}>
            <button className="icon-btn" onClick={e => { e.stopPropagation(); setMenuOpen(p => !p); }}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)", padding: 4, display: "flex" }}>
              <Icon name="more-horizontal" size={15} />
            </button>
            {menuOpen && (
              <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, minWidth: 180, background: "rgba(18,19,42,0.96)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-md)", zIndex: 100, overflow: "hidden", padding: 4 }}>
                {[
                  { icon: "edit-2", label: "Edit", action: onEdit },
                  { icon: "star", label: memory.isFavorite ? "Remove favorite" : "Add to favorites", action: onToggleFav },
                  { icon: "pin", label: memory.isPinned ? "Unpin" : "Pin", action: onTogglePin },
                  { icon: "archive", label: memory.isArchived ? "Unarchive" : "Archive", action: onToggleArchive },
                  { sep: true },
                  { icon: "trash-2", label: "Delete", action: onDelete, danger: true },
                ].map((item, i) => item.sep ? (
                  <div key={i} style={{ height: 1, background: "var(--border-subtle)", margin: "4px 0" }} />
                ) : (
                  <button key={item.label} onClick={e => { e.stopPropagation(); item.action(); setMenuOpen(false); }} style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
                    background: "none", border: "none", cursor: "pointer", borderRadius: "var(--radius-sm)",
                    fontSize: 13, fontWeight: 500, fontFamily: "Inter, sans-serif",
                    color: item.danger ? "var(--danger)" : "var(--text-secondary)", textAlign: "left", transition: "background 150ms",
                  }} onMouseEnter={e => e.currentTarget.style.background = item.danger ? "rgba(239,68,68,0.1)" : "var(--bg-surface-raised)"}
                    onMouseLeave={e => e.currentTarget.style.background = "none"}>
                    <Icon name={item.icon} size={13} color={item.danger ? "var(--danger)" : "var(--text-tertiary)"} />
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Title */}
      <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.35, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
        {memory.title}
      </h3>

      {/* Snippet */}
      {snippet && (
        <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {snippet}
        </p>
      )}

      {/* Summary badge */}
      {memory.summary && !snippet && (
        <div style={{ display: "flex", gap: 6, padding: "6px 10px", background: "rgba(124,58,237,0.08)", borderRadius: "var(--radius-sm)", border: "1px solid rgba(124,58,237,0.15)" }}>
          <Icon name="sparkling" size={12} color="var(--accent-400)" style={{ flexShrink: 0, marginTop: 2 }} />
          <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>{memory.summary.slice(0, 90)}…</p>
        </div>
      )}

      {/* Tags */}
      {memory.tags?.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }} onClick={e => e.stopPropagation()}>
          {memory.tags.slice(0, 4).map(t => <TagChip key={t} tag={t} />)}
          {memory.tags.length > 4 && <span style={{ fontSize: 12, color: "var(--text-tertiary)", padding: "3px 6px" }}>+{memory.tags.length - 4}</span>}
        </div>
      )}

      {/* Footer */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <Icon name="clock" size={12} color="var(--text-tertiary)" />
          <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{relativeTime(memory.createdAt)}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {memory.attachments?.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Icon name="paperclip" size={12} color="var(--text-tertiary)" />
              <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{memory.attachments.length}</span>
            </div>
          )}
          {memory.isArchived && (
            <span style={{ fontSize: 11, padding: "1px 6px", background: "rgba(161,168,195,0.1)", borderRadius: 4, color: "var(--text-tertiary)" }}>archived</span>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── FILTER BAR ───────────────────────────────────────────────────────────────
const FilterBar = ({ filters, onChange, totalCount }) => {
  const { categories } = useMemories();
  const [typeOpen, setTypeOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const typeRef = useRef(null);
  const sortRef = useRef(null);

  useEffect(() => {
    const h = (e) => {
      if (typeRef.current && !typeRef.current.contains(e.target)) setTypeOpen(false);
      if (sortRef.current && !sortRef.current.contains(e.target)) setSortOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const sorts = [
    { value: "newest", label: "Newest first" },
    { value: "oldest", label: "Oldest first" },
    { value: "az", label: "A → Z" },
    { value: "za", label: "Z → A" },
  ];

  const DropBtn = ({ label, open, icon }) => (
    <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", cursor: "pointer", fontSize: 13, color: "var(--text-secondary)", fontFamily: "Inter, sans-serif", transition: "border-color 150ms", whiteSpace: "nowrap" }}
      onMouseEnter={e => e.currentTarget.style.borderColor = "var(--accent-600)"}
      onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border-default)"}>
      {icon && <Icon name={icon} size={14} />}
      {label}
      <Icon name="chevron-down" size={13} color="var(--text-tertiary)" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 150ms" }} />
    </button>
  );

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      <span style={{ fontSize: 13, color: "var(--text-tertiary)", marginRight: 4 }}>{totalCount} memories</span>

      {/* Search */}
      <div style={{ position: "relative", flex: "1 1 200px", minWidth: 180 }}>
        <Icon name="search" size={15} color="var(--text-tertiary)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
        <input value={filters.search} onChange={e => onChange({ ...filters, search: e.target.value })}
          placeholder="Search memories..."
          style={{ width: "100%", background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", padding: "7px 12px 7px 36px", fontSize: 13, color: "var(--text-primary)", fontFamily: "Inter, sans-serif", outline: "none", transition: "border-color 150ms" }}
          onFocus={e => e.target.style.borderColor = "var(--accent-600)"}
          onBlur={e => e.target.style.borderColor = "var(--border-default)"}
        />
      </div>

      {/* Type */}
      <div ref={typeRef} style={{ position: "relative" }} onClick={() => setTypeOpen(p => !p)}>
        <DropBtn label={filters.type ? TYPE_CONFIG[filters.type]?.label : "All types"} open={typeOpen} icon="filter" />
        {typeOpen && (
          <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, minWidth: 180, background: "rgba(18,19,42,0.96)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-md)", zIndex: 200, overflow: "hidden", padding: 4 }}>
            {[{ value: "", label: "All types" }, ...Object.entries(TYPE_CONFIG).map(([k, v]) => ({ value: k, label: v.label }))].map(o => (
              <button key={o.value} onClick={() => { onChange({ ...filters, type: o.value }); setTypeOpen(false); }}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: filters.type === o.value ? "var(--bg-surface-active)" : "none", border: "none", cursor: "pointer", borderRadius: "var(--radius-sm)", fontSize: 13, fontWeight: 500, fontFamily: "Inter, sans-serif", color: filters.type === o.value ? "var(--accent-400)" : "var(--text-secondary)", textAlign: "left" }}
                onMouseEnter={e => { if (filters.type !== o.value) e.currentTarget.style.background = "var(--bg-surface-raised)"; }}
                onMouseLeave={e => { if (filters.type !== o.value) e.currentTarget.style.background = "none"; }}>
                {o.value && <Icon name={TYPE_CONFIG[o.value]?.icon} size={13} color={TYPE_CONFIG[o.value]?.color} />}
                {o.label}
                {filters.type === o.value && <Icon name="check" size={13} color="var(--accent-400)" style={{ marginLeft: "auto" }} />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Sort */}
      <div ref={sortRef} style={{ position: "relative" }} onClick={() => setSortOpen(p => !p)}>
        <DropBtn label={sorts.find(s => s.value === filters.sort)?.label || "Sort"} open={sortOpen} icon="sort-desc" />
        {sortOpen && (
          <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, minWidth: 160, background: "rgba(18,19,42,0.96)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-md)", zIndex: 200, overflow: "hidden", padding: 4 }}>
            {sorts.map(s => (
              <button key={s.value} onClick={() => { onChange({ ...filters, sort: s.value }); setSortOpen(false); }}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: filters.sort === s.value ? "var(--bg-surface-active)" : "none", border: "none", cursor: "pointer", borderRadius: "var(--radius-sm)", fontSize: 13, fontWeight: 500, fontFamily: "Inter, sans-serif", color: filters.sort === s.value ? "var(--accent-400)" : "var(--text-secondary)", textAlign: "left" }}
                onMouseEnter={e => { if (filters.sort !== s.value) e.currentTarget.style.background = "var(--bg-surface-raised)"; }}
                onMouseLeave={e => { if (filters.sort !== s.value) e.currentTarget.style.background = "none"; }}>
                {s.label}
                {filters.sort === s.value && <Icon name="check" size={13} color="var(--accent-400)" style={{ marginLeft: "auto" }} />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Toggles */}
      {[
        { key: "favorites", icon: "star", label: "Favorites" },
        { key: "pinned", icon: "pin", label: "Pinned" },
        { key: "archived", icon: "archive", label: "Archived" },
      ].map(t => (
        <button key={t.key} onClick={() => onChange({ ...filters, [t.key]: !filters[t.key] })}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", background: filters[t.key] ? "var(--bg-surface-active)" : "var(--bg-surface)", border: `1px solid ${filters[t.key] ? "rgba(124,58,237,0.4)" : "var(--border-default)"}`, borderRadius: "var(--radius-md)", cursor: "pointer", fontSize: 13, fontWeight: 500, color: filters[t.key] ? "var(--accent-400)" : "var(--text-secondary)", fontFamily: "Inter, sans-serif", transition: "all 150ms", whiteSpace: "nowrap" }}>
          <Icon name={t.icon} size={13} color={filters[t.key] ? "var(--accent-400)" : "var(--text-tertiary)"} />
          {t.label}
        </button>
      ))}

      {/* Category */}
      <select value={filters.category} onChange={e => onChange({ ...filters, category: e.target.value })}
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", padding: "7px 12px", fontSize: 13, color: "var(--text-secondary)", fontFamily: "Inter, sans-serif", outline: "none", cursor: "pointer" }}>
        <option value="">All categories</option>
        {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
      </select>

      {/* View toggle */}
      <div style={{ display: "flex", background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
        {[{ v: "grid", icon: "grid" }, { v: "list", icon: "list" }].map(({ v, icon }) => (
          <button key={v} onClick={() => onChange({ ...filters, view: v })}
            style={{ padding: "7px 10px", background: filters.view === v ? "var(--bg-surface-active)" : "none", border: "none", cursor: "pointer", color: filters.view === v ? "var(--accent-400)" : "var(--text-tertiary)", transition: "all 150ms" }}>
            <Icon name={icon} size={14} />
          </button>
        ))}
      </div>
    </div>
  );
};

// ─── STAT CARD ────────────────────────────────────────────────────────────────
const StatCard = ({ icon, iconColor, value, label }) => (
  <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
    <div style={{ width: 40, height: 40, borderRadius: "var(--radius-md)", background: `${iconColor}1F`, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Icon name={icon} size={19} color={iconColor} />
    </div>
    <div>
      <p style={{ fontSize: 30, fontWeight: 700, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums", lineHeight: 1.1 }}>{value}</p>
      <p style={{ fontSize: 12, fontWeight: 500, color: "var(--text-tertiary)", marginTop: 4 }}>{label}</p>
    </div>
  </div>
);

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────
const EmptyState = ({ icon, title, description, action }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "64px 24px", textAlign: "center" }}>
    <div style={{ width: 88, height: 88, borderRadius: "var(--radius-xl)", background: "var(--bg-surface-raised)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
      <Icon name={icon} size={36} color="var(--text-tertiary)" />
    </div>
    <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>{title}</h3>
    <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, maxWidth: 320, marginBottom: action ? 20 : 0 }}>{description}</p>
    {action}
  </div>
);

// ════════════════════════════════════════════════════════════════════════════
// CATEGORIES MODULE
// ════════════════════════════════════════════════════════════════════════════

const ColorSwatchPicker = ({ value, onChange }) => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
    {CATEGORY_PALETTE.map(c => (
      <button key={c} type="button" onClick={() => onChange(c)} style={{
        width: 28, height: 28, borderRadius: "50%", background: c, border: value === c ? "2px solid white" : "2px solid transparent",
        boxShadow: value === c ? "0 0 0 2px " + c : "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {value === c && <Icon name="check" size={13} color="white" />}
      </button>
    ))}
  </div>
);

const IconSwatchPicker = ({ value, onChange, color }) => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
    {CATEGORY_ICON_CHOICES.map(ic => (
      <button key={ic} type="button" onClick={() => onChange(ic)} style={{
        width: 36, height: 36, borderRadius: "var(--radius-md)", background: value === ic ? color : "var(--bg-surface-raised)",
        border: `1px solid ${value === ic ? color : "var(--border-default)"}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 150ms",
      }}>
        <Icon name={ic} size={16} color={value === ic ? "white" : "var(--text-secondary)"} />
      </button>
    ))}
  </div>
);

const CategoryFormModal = ({ category, onClose, onSave }) => {
  const isEdit = !!category?.id;
  const [form, setForm] = useState({ name: "", description: "", icon: "folder", color: CATEGORY_PALETTE[0], ...(category || {}) });
  const canSave = form.name.trim().length > 0;

  return (
    <div className="overlay-backdrop" style={{ position: "fixed", inset: 0, zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div className="modal-enter glass-panel" style={{ width: "100%", maxWidth: 460, borderRadius: "var(--radius-xl)", boxShadow: "var(--shadow-lg)", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid var(--border-subtle)" }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", flex: 1 }}>{isEdit ? "Edit Category" : "New Category"}</h2>
          <button onClick={onClose} className="icon-btn" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)", padding: 6 }}>
            <Icon name="x" size={18} />
          </button>
        </div>
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 56, height: 56, borderRadius: "var(--radius-lg)", background: form.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon name={form.icon} size={26} color="white" />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-tertiary)", marginBottom: 6, display: "block" }}>Name</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Recipes"
                style={{ width: "100%", height: 40, background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", padding: "0 14px", fontSize: 14, color: "var(--text-primary)", fontFamily: "Inter, sans-serif", outline: "none" }}
                onFocus={e => e.target.style.borderColor = "var(--accent-600)"} onBlur={e => e.target.style.borderColor = "var(--border-default)"} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-tertiary)", marginBottom: 6, display: "block" }}>Description</label>
            <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="What goes in this category?"
              style={{ width: "100%", height: 40, background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", padding: "0 14px", fontSize: 14, color: "var(--text-primary)", fontFamily: "Inter, sans-serif", outline: "none" }}
              onFocus={e => e.target.style.borderColor = "var(--accent-600)"} onBlur={e => e.target.style.borderColor = "var(--border-default)"} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-tertiary)", marginBottom: 8, display: "block" }}>Color</label>
            <ColorSwatchPicker value={form.color} onChange={c => setForm({ ...form, color: c })} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-tertiary)", marginBottom: 8, display: "block" }}>Icon</label>
            <IconSwatchPicker value={form.icon} onChange={ic => setForm({ ...form, icon: ic })} color={form.color} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", padding: "16px 24px", borderTop: "1px solid var(--border-subtle)" }}>
          <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
          <Btn disabled={!canSave} onClick={() => onSave(form)}>
            <Icon name="check" size={15} color="white" /> {isEdit ? "Save Changes" : "Create Category"}
          </Btn>
        </div>
      </div>
    </div>
  );
};

const DeleteCategoryModal = ({ category, count, onClose, onConfirm }) => (
  <div className="overlay-backdrop" style={{ position: "fixed", inset: 0, zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
    <div className="modal-enter" style={{ width: "100%", maxWidth: 440, background: "rgba(18,19,42,0.96)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "var(--radius-xl)", boxShadow: "var(--shadow-lg)", padding: 28 }}>
      <div style={{ width: 56, height: 56, borderRadius: "var(--radius-xl)", background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
        <Icon name="alert-triangle" size={24} color="var(--danger)" />
      </div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>Delete "{category.name}"?</h2>
      <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 24 }}>
        {count > 0
          ? `${count} ${count === 1 ? "memory" : "memories"} will be moved to "Other". This category will be removed permanently.`
          : `This category has no memories. It will be removed permanently.`}
      </p>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn variant="danger" onClick={onConfirm}><Icon name="trash-2" size={15} color="white" /> Delete Category</Btn>
      </div>
    </div>
  </div>
);

const CategoryCard = ({ category, count, total, onEdit, onDelete, onOpen }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  useEffect(() => {
    const h = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <div className="category-card card-enter" onClick={onOpen} style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", padding: 20, cursor: "pointer", display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div style={{ width: 44, height: 44, borderRadius: "var(--radius-lg)", background: category.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name={category.icon} size={21} color="white" />
        </div>
        <div ref={menuRef} style={{ position: "relative" }} onClick={e => e.stopPropagation()}>
          <button className="icon-btn" onClick={() => setMenuOpen(p => !p)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)", padding: 6, display: "flex" }}>
            <Icon name="more-horizontal" size={16} />
          </button>
          {menuOpen && (
            <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, minWidth: 160, background: "rgba(18,19,42,0.96)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-md)", zIndex: 100, padding: 4 }}>
              <button onClick={() => { onEdit(); setMenuOpen(false); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "none", border: "none", cursor: "pointer", borderRadius: "var(--radius-sm)", fontSize: 13, color: "var(--text-secondary)", fontFamily: "Inter, sans-serif" }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--bg-surface-raised)"} onMouseLeave={e => e.currentTarget.style.background = "none"}>
                <Icon name="edit-2" size={13} color="var(--text-tertiary)" /> Edit
              </button>
              <button onClick={() => { onDelete(); setMenuOpen(false); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "none", border: "none", cursor: "pointer", borderRadius: "var(--radius-sm)", fontSize: 13, color: "var(--danger)", fontFamily: "Inter, sans-serif" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.1)"} onMouseLeave={e => e.currentTarget.style.background = "none"}>
                <Icon name="trash-2" size={13} color="var(--danger)" /> Delete
              </button>
            </div>
          )}
        </div>
      </div>
      <div>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>{category.name}</h3>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{category.description || "No description"}</p>
      </div>
      <div>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{count} {count === 1 ? "memory" : "memories"}</span>
          <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{pct}%</span>
        </div>
        <div style={{ height: 6, borderRadius: "var(--radius-full)", background: "var(--bg-surface-raised)", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: category.color, borderRadius: "var(--radius-full)", transition: "width 400ms ease-out" }} />
        </div>
      </div>
    </div>
  );
};

const CategoryDetailModal = ({ category, memories, onClose }) => {
  const items = memories.filter(m => m.category === category.name && !m.isDeleted);
  const byType = Object.entries(TYPE_CONFIG).map(([key, cfg]) => ({ key, cfg, count: items.filter(m => m.type === key).length })).filter(t => t.count > 0);
  const maxCount = Math.max(1, ...byType.map(t => t.count));

  return (
    <div className="overlay-backdrop" style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div className="modal-enter" style={{ width: "100%", maxWidth: 560, maxHeight: "85vh", display: "flex", flexDirection: "column", background: "rgba(18,19,42,0.96)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "var(--radius-xl)", boxShadow: "var(--shadow-lg)", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "22px 24px", borderBottom: "1px solid var(--border-subtle)" }}>
          <div style={{ width: 44, height: 44, borderRadius: "var(--radius-lg)", background: category.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon name={category.icon} size={21} color="white" />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>{category.name}</h2>
            <p style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{items.length} {items.length === 1 ? "memory" : "memories"}</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)", padding: 6 }}><Icon name="x" size={18} /></button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>Breakdown by type</p>
          {byType.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--text-tertiary)" }}>No memories in this category yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
              {byType.map(t => (
                <div key={t.key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Icon name={t.cfg.icon} size={14} color={t.cfg.color} />
                  <span style={{ fontSize: 13, color: "var(--text-secondary)", width: 100, flexShrink: 0 }}>{t.cfg.label}</span>
                  <div style={{ flex: 1, height: 8, borderRadius: "var(--radius-full)", background: "var(--bg-surface-raised)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(t.count / maxCount) * 100}%`, background: t.cfg.color, borderRadius: "var(--radius-full)" }} />
                  </div>
                  <span style={{ fontSize: 12, color: "var(--text-tertiary)", width: 20, textAlign: "right" }}>{t.count}</span>
                </div>
              ))}
            </div>
          )}
          <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>Recent in this category</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {items.slice(0, 6).map(m => {
              const cfg = TYPE_CONFIG[m.type];
              return (
                <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "var(--bg-surface-raised)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
                  <TypeBadge type={m.type} size={28} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.title}</p>
                    <p style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{relativeTime(m.createdAt)}</p>
                  </div>
                </div>
              );
            })}
            {items.length === 0 && <p style={{ fontSize: 13, color: "var(--text-tertiary)" }}>Nothing here yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

const CategoriesPage = () => {
  const { memories, categories, createCategory, updateCategory, deleteCategory } = useMemories();
  const { addToast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [deletingCat, setDeletingCat] = useState(null);
  const [openCat, setOpenCat] = useState(null);

  const liveMemories = memories.filter(m => !m.isDeleted);
  const counts = useMemo(() => Object.fromEntries(categories.map(c => [c.name, liveMemories.filter(m => m.category === c.name).length])), [categories, liveMemories]);
  const totalMemories = liveMemories.length;
  const mostActive = categories.reduce((best, c) => (counts[c.name] || 0) > (counts[best?.name] || -1) ? c : best, null);
  const avgPerCategory = categories.length ? Math.round(totalMemories / categories.length) : 0;

  const handleSave = (data) => {
    if (editingCat) {
      updateCategory(editingCat.id, data);
      addToast("Category updated", "success");
    } else {
      createCategory(data);
      addToast("Category created ✨", "success");
    }
    setShowForm(false);
    setEditingCat(null);
  };

  const handleDeleteConfirm = () => {
    deleteCategory(deletingCat.id, "Other");
    addToast(`"${deletingCat.name}" deleted`, "info");
    setDeletingCat(null);
  };

  return (
    <div className="page-fade" style={{ padding: "24px 32px 48px", maxWidth: 1440, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 24 }}>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: "var(--text-primary)" }}>Category Analytics</h2>
          <p style={{ fontSize: 13, color: "var(--text-tertiary)", marginTop: 2 }}>How your memories break down across categories</p>
        </div>
        <Btn onClick={() => { setEditingCat(null); setShowForm(true); }}><Icon name="plus" size={15} color="white" /> New Category</Btn>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 24, marginBottom: 32 }}>
        <StatCard icon="folder" iconColor="#7C3AED" value={categories.length} label="Total Categories" />
        <StatCard icon="layers" iconColor="#3B82F6" value={totalMemories} label="Total Memories" />
        <StatCard icon="bar-chart-2" iconColor="#10B981" value={mostActive?.name || "—"} label="Most Active Category" />
        <StatCard icon="activity" iconColor="#F59E0B" value={avgPerCategory} label="Avg Memories / Category" />
      </div>

      <h2 style={{ fontSize: 20, fontWeight: 600, color: "var(--text-primary)", marginBottom: 16 }}>All Categories</h2>
      {categories.length === 0 ? (
        <EmptyState icon="folder" title="No categories yet" description="Create a category to start organizing your memories." />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 24 }}>
          {categories.map((c, i) => (
            <div key={c.id} style={{ animationDelay: `${Math.min(i, 6) * 30}ms` }} className="card-enter">
              <CategoryCard
                category={c} count={counts[c.name] || 0} total={totalMemories}
                onEdit={() => { setEditingCat(c); setShowForm(true); }}
                onDelete={() => setDeletingCat(c)}
                onOpen={() => setOpenCat(c)}
              />
            </div>
          ))}
        </div>
      )}

      {showForm && <CategoryFormModal category={editingCat} onClose={() => { setShowForm(false); setEditingCat(null); }} onSave={handleSave} />}
      {deletingCat && <DeleteCategoryModal category={deletingCat} count={counts[deletingCat.name] || 0} onClose={() => setDeletingCat(null)} onConfirm={handleDeleteConfirm} />}
      {openCat && <CategoryDetailModal category={openCat} memories={memories} onClose={() => setOpenCat(null)} />}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// SEARCH MODULE
// ════════════════════════════════════════════════════════════════════════════

const SearchResultRow = ({ memory, query, reason, onClick }) => {
  const cfg = TYPE_CONFIG[memory.type] || TYPE_CONFIG.note;
  const snippetSrc = stripHtml(memory.content);
  let snippet = snippetSrc.slice(0, 160);
  if (query) {
    const idx = snippetSrc.toLowerCase().indexOf(query.toLowerCase());
    if (idx > 40) snippet = "…" + snippetSrc.slice(idx - 40, idx + 120);
  }

  return (
    <div className="memory-card card-enter" onClick={onClick} style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", padding: "16px 20px", cursor: "pointer", display: "flex", gap: 14 }}>
      <TypeBadge type={memory.type} size={36} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: cfg.color }}>{cfg.label}</span>
          <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>· {memory.category}</span>
          <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--text-tertiary)" }}>{relativeTime(memory.createdAt)}</span>
        </div>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>{highlightText(memory.title, query)}</h3>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {highlightText(snippet, query)}
        </p>
        {reason && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
            <Icon name="sparkling" size={12} color="var(--accent-400)" />
            <span style={{ fontSize: 12, color: "var(--accent-400)" }}>{reason}</span>
          </div>
        )}
        {memory.tags?.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 8 }} onClick={e => e.stopPropagation()}>
            {memory.tags.slice(0, 4).map(t => <TagChip key={t} tag={t} />)}
          </div>
        )}
      </div>
    </div>
  );
};

const SearchPage = ({ onOpenMemory }) => {
  const { memories, aiSearch, aiLoading } = useMemories();
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [aiMode, setAiMode] = useState(false);
  const [aiResults, setAiResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [recent, setRecent] = useState([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({ type: "", category: "", range: "any", favorites: false, pinned: false });
  const inputRef = useRef(null);

  const liveMemories = memories.filter(m => !m.isDeleted);

  const withinRange = (iso) => {
    if (filters.range === "any") return true;
    const day = (Date.now() - new Date(iso).getTime()) / 86400000;
    if (filters.range === "today") return day < 1;
    if (filters.range === "week") return day < 7;
    if (filters.range === "month") return day < 30;
    return true;
  };

  const applyFilters = (list) => list.filter(m =>
    (!filters.type || m.type === filters.type) &&
    (!filters.category || m.category === filters.category) &&
    (!filters.favorites || m.isFavorite) &&
    (!filters.pinned || m.isPinned) &&
    withinRange(m.createdAt)
  );

  const keywordResults = useMemo(() => {
    if (!submittedQuery) return [];
    const q = submittedQuery.toLowerCase();
    return applyFilters(liveMemories).filter(m =>
      m.title.toLowerCase().includes(q) ||
      stripHtml(m.content).toLowerCase().includes(q) ||
      m.summary?.toLowerCase().includes(q) ||
      m.tags?.some(t => t.toLowerCase().includes(q))
    );
  }, [submittedQuery, liveMemories, filters]);

  const popularTags = useMemo(() => {
    const freq = {};
    liveMemories.forEach(m => m.tags?.forEach(t => { freq[t] = (freq[t] || 0) + 1; }));
    return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [liveMemories]);

  const runSearch = async (q) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setSubmittedQuery(trimmed);
    setRecent(p => [trimmed, ...p.filter(r => r.toLowerCase() !== trimmed.toLowerCase())].slice(0, 8));
    if (aiMode) {
      setSearching(true);
      setAiResults(null);
      const pool = applyFilters(liveMemories);
      const ranked = await aiSearch(trimmed, pool);
      setAiResults(ranked);
      setSearching(false);
    } else {
      setAiResults(null);
    }
  };

  const aiResultMemories = (aiResults || []).map(r => ({ ...r, memory: liveMemories.find(m => m.id === r.id) })).filter(r => r.memory);

  const resultCount = aiMode ? aiResultMemories.length : keywordResults.length;

  const DropSelect = ({ value, onChange, options, placeholder }) => (
    <select value={value} onChange={e => onChange(e.target.value)} style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", padding: "8px 12px", fontSize: 13, color: "var(--text-secondary)", fontFamily: "Inter, sans-serif", outline: "none", cursor: "pointer" }}>
      <option value="">{placeholder}</option>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );

  return (
    <div className="page-fade" style={{ padding: "24px 32px 48px", maxWidth: 900, margin: "0 auto" }}>
      {/* Hero search bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Icon name="search" size={17} color="var(--text-tertiary)" style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)" }} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") runSearch(query); }}
            placeholder={aiMode ? "Ask your memory anything…" : "Search titles, content, tags…"}
            style={{ width: "100%", height: 48, background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-full)", padding: "0 48px 0 44px", fontSize: 15, color: "var(--text-primary)", fontFamily: "Inter, sans-serif", outline: "none", transition: "border-color 150ms, box-shadow 150ms" }}
            onFocus={e => { e.target.style.borderColor = "var(--accent-600)"; e.target.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.2)"; }}
            onBlur={e => { e.target.style.borderColor = "var(--border-default)"; e.target.style.boxShadow = "none"; }}
          />
          {query && (
            <button onClick={() => { setQuery(""); setSubmittedQuery(""); setAiResults(null); inputRef.current?.focus(); }} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)" }}>
              <Icon name="x" size={16} />
            </button>
          )}
        </div>
        <button onClick={() => setAiMode(p => !p)} title="Toggle AI semantic search" style={{
          display: "flex", alignItems: "center", gap: 7, height: 48, padding: "0 16px", borderRadius: "var(--radius-full)",
          background: aiMode ? "var(--bg-surface-active)" : "var(--bg-surface)", border: `1px solid ${aiMode ? "rgba(124,58,237,0.4)" : "var(--border-default)"}`,
          color: aiMode ? "var(--accent-400)" : "var(--text-secondary)", cursor: "pointer", fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", transition: "all 150ms",
        }}>
          <Icon name="sparkling" size={15} color={aiMode ? "var(--accent-400)" : "var(--text-tertiary)"} /> AI Search
        </button>
      </div>

      {/* Filters toggle + panel */}
      <div style={{ marginBottom: 20 }}>
        <button onClick={() => setFiltersOpen(p => !p)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 500, padding: "4px 0" }}>
          <Icon name="sliders-horizontal" size={14} /> Filters
          <Icon name="chevron-down" size={13} style={{ transform: filtersOpen ? "rotate(180deg)" : "none", transition: "transform 150ms" }} />
        </button>
        {filtersOpen && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
            <DropSelect value={filters.type} onChange={v => setFilters({ ...filters, type: v })} placeholder="All types" options={Object.entries(TYPE_CONFIG).map(([k, v]) => ({ value: k, label: v.label }))} />
            <DropSelect value={filters.category} onChange={v => setFilters({ ...filters, category: v })} placeholder="All categories" options={CATEGORIES.map(c => ({ value: c, label: c }))} />
            <div style={{ display: "flex", background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-full)", padding: 3, gap: 2 }}>
              {[{ v: "any", l: "Any time" }, { v: "today", l: "Today" }, { v: "week", l: "Week" }, { v: "month", l: "Month" }].map(o => (
                <button key={o.v} onClick={() => setFilters({ ...filters, range: o.v })} style={{ padding: "5px 12px", borderRadius: "var(--radius-full)", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 500, fontFamily: "Inter, sans-serif", background: filters.range === o.v ? "var(--bg-surface-active)" : "transparent", color: filters.range === o.v ? "var(--accent-400)" : "var(--text-secondary)" }}>{o.l}</button>
              ))}
            </div>
            {[{ key: "favorites", icon: "star", label: "Favorites" }, { key: "pinned", icon: "pin", label: "Pinned" }].map(t => (
              <button key={t.key} onClick={() => setFilters({ ...filters, [t.key]: !filters[t.key] })}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", background: filters[t.key] ? "var(--bg-surface-active)" : "var(--bg-surface)", border: `1px solid ${filters[t.key] ? "rgba(124,58,237,0.4)" : "var(--border-default)"}`, borderRadius: "var(--radius-md)", cursor: "pointer", fontSize: 13, color: filters[t.key] ? "var(--accent-400)" : "var(--text-secondary)", fontFamily: "Inter, sans-serif" }}>
                <Icon name={t.icon} size={13} color={filters[t.key] ? "var(--accent-400)" : "var(--text-tertiary)"} /> {t.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {!submittedQuery ? (
        <div>
          {recent.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em", flex: 1 }}>Recent Searches</p>
                <button onClick={() => setRecent([])} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "var(--text-tertiary)", fontFamily: "Inter, sans-serif" }}>Clear all</button>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {recent.map(r => (
                  <button key={r} className="recent-chip" onClick={() => { setQuery(r); runSearch(r); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-full)", cursor: "pointer", fontSize: 13, color: "var(--text-secondary)", fontFamily: "Inter, sans-serif" }}>
                    <Icon name="clock" size={12} color="var(--text-tertiary)" /> {r}
                    <span onClick={e => { e.stopPropagation(); setRecent(p => p.filter(x => x !== r)); }} style={{ color: "var(--text-tertiary)", display: "flex" }}><Icon name="x" size={11} /></span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginBottom: 28 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Popular Tags</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {popularTags.map(([tag, count]) => (
                <button key={tag} className="recent-chip" onClick={() => { setQuery(tag); runSearch(tag); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", cursor: "pointer", fontSize: 13, color: "var(--text-secondary)", fontFamily: "Inter, sans-serif" }}>
                  <Icon name="hash" size={11} color="var(--text-tertiary)" /> {tag} <span style={{ color: "var(--text-tertiary)" }}>{count}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Browse by Category</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {CATEGORIES.map(c => (
                <button key={c} className="recent-chip" onClick={() => setFilters({ ...filters, category: c })} style={{ padding: "6px 14px", background: filters.category === c ? "var(--bg-surface-active)" : "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-full)", cursor: "pointer", fontSize: 13, color: filters.category === c ? "var(--accent-400)" : "var(--text-secondary)", fontFamily: "Inter, sans-serif" }}>{c}</button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
            <p style={{ fontSize: 13, color: "var(--text-tertiary)", flex: 1 }}>
              {searching ? "Searching…" : `${resultCount} result${resultCount === 1 ? "" : "s"} for "${submittedQuery}"`}
              {aiMode && !searching && <span style={{ color: "var(--accent-400)", marginLeft: 6 }}>· AI ranked</span>}
            </p>
          </div>

          {searching ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "32px 0", justifyContent: "center" }}>
              {[0, 1, 2].map(i => <div key={i} className="ai-dot" style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent-400)", animationDelay: `${i * 0.15}s` }} />)}
              <span style={{ fontSize: 13, color: "var(--text-tertiary)", marginLeft: 8 }}>Thinking with AI…</span>
            </div>
          ) : resultCount === 0 ? (
            <EmptyState icon="search" title="No results found" description={`We couldn't find anything matching "${submittedQuery}". Try a different term or adjust your filters.`} />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {aiMode
                ? aiResultMemories.map(({ memory, reason }) => (
                    <SearchResultRow key={memory.id} memory={memory} query="" reason={reason} onClick={() => onOpenMemory(memory)} />
                  ))
                : keywordResults.map(m => (
                    <SearchResultRow key={m.id} memory={m} query={submittedQuery} onClick={() => onOpenMemory(m)} />
                  ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// ARCHIVE MODULE
// ════════════════════════════════════════════════════════════════════════════

const ArchiveCard = ({ memory, onView, onRestore, onDelete }) => {
  const cfg = TYPE_CONFIG[memory.type] || TYPE_CONFIG.note;
  const snippet = stripHtml(memory.content).slice(0, 110);
  return (
    <div className="memory-card card-enter" onClick={onView} style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", padding: 20, cursor: "pointer", display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <TypeBadge type={memory.type} size={28} />
        <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: cfg.color }}>{cfg.label}</span>
        <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--text-tertiary)" }}>{relativeTime(memory.updatedAt)}</span>
      </div>
      <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.35, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{memory.title}</h3>
      {snippet && <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{snippet}…</p>}
      <div style={{ display: "flex", gap: 8, marginTop: "auto" }} onClick={e => e.stopPropagation()}>
        <Btn variant="secondary" size="sm" onClick={onRestore} style={{ flex: 1 }}><Icon name="rotate-ccw" size={13} /> Restore</Btn>
        <Btn variant="outline" size="sm" onClick={onDelete} style={{ color: "var(--danger)", borderColor: "rgba(239,68,68,0.3)" }}><Icon name="trash-2" size={13} color="var(--danger)" /></Btn>
      </div>
    </div>
  );
};

const ArchivePage = ({ onOpenMemory }) => {
  const { memories, categories, toggleArchive, deleteMemory } = useMemories();
  const { addToast } = useToast();
  const [filters, setFilters] = useState({ search: "", type: "", category: "" });
  const [deletingMemory, setDeletingMemory] = useState(null);

  const archived = memories.filter(m => m.isArchived && !m.isDeleted);
  const filtered = archived.filter(m =>
    (!filters.search || m.title.toLowerCase().includes(filters.search.toLowerCase()) || stripHtml(m.content).toLowerCase().includes(filters.search.toLowerCase())) &&
    (!filters.type || m.type === filters.type) &&
    (!filters.category || m.category === filters.category)
  );

  const groups = ["Today", "This Week", "This Month", "Earlier"];
  const grouped = groups.map(g => ({ label: g, items: filtered.filter(m => timeBucket(m.updatedAt) === g) })).filter(g => g.items.length > 0);

  const handleRestore = (m) => {
    toggleArchive(m.id);
    addToast(`"${m.title}" restored`, "success");
  };

  const handlePermanentDelete = () => {
    deleteMemory(deletingMemory.id, true);
    addToast(`"${deletingMemory.title}" permanently deleted`, "info");
    setDeletingMemory(null);
  };

  return (
    <div className="page-fade" style={{ padding: "24px 32px 48px", maxWidth: 1440, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 20 }}>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: "var(--text-primary)" }}>Archived Memories</h2>
          <p style={{ fontSize: 13, color: "var(--text-tertiary)", marginTop: 2 }}>{archived.length} archived · restore or delete permanently</p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 28 }}>
        <div style={{ position: "relative", flex: "1 1 220px", minWidth: 200 }}>
          <Icon name="search" size={15} color="var(--text-tertiary)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
          <input value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })} placeholder="Search archive…"
            style={{ width: "100%", background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", padding: "7px 12px 7px 36px", fontSize: 13, color: "var(--text-primary)", fontFamily: "Inter, sans-serif", outline: "none" }}
            onFocus={e => e.target.style.borderColor = "var(--accent-600)"} onBlur={e => e.target.style.borderColor = "var(--border-default)"} />
        </div>
        <select value={filters.type} onChange={e => setFilters({ ...filters, type: e.target.value })} style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", padding: "7px 12px", fontSize: 13, color: "var(--text-secondary)", fontFamily: "Inter, sans-serif", outline: "none", cursor: "pointer" }}>
          <option value="">All types</option>
          {Object.entries(TYPE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={filters.category} onChange={e => setFilters({ ...filters, category: e.target.value })} style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", padding: "7px 12px", fontSize: 13, color: "var(--text-secondary)", fontFamily: "Inter, sans-serif", outline: "none", cursor: "pointer" }}>
          <option value="">All categories</option>
          {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
      </div>

      {archived.length === 0 ? (
        <EmptyState icon="archive" title="Archive is empty" description="Memories you archive will show up here, grouped by when they were archived." />
      ) : filtered.length === 0 ? (
        <EmptyState icon="search" title="No matches" description="No archived memories match your current filters." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {grouped.map(group => (
            <div key={group.label}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <Icon name="calendar" size={14} color="var(--text-tertiary)" />
                <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{group.label}</h3>
                <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>({group.items.length})</span>
                <div style={{ flex: 1, height: 1, background: "var(--border-subtle)" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
                {group.items.map(m => (
                  <ArchiveCard key={m.id} memory={m} onView={() => onOpenMemory(m)} onRestore={() => handleRestore(m)} onDelete={() => setDeletingMemory(m)} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {deletingMemory && <DeleteModal memory={deletingMemory} permanent onClose={() => setDeletingMemory(null)} onConfirm={handlePermanentDelete} />}
    </div>
  );
};


const MemoriesPage = ({ initialView = "timeline", onNavigate }) => {
  const { memories, createMemory, updateMemory, deleteMemory, toggleFavorite, togglePin, toggleArchive, restoreMemory } = useMemories();
  const { addToast } = useToast();

  const [filters, setFilters] = useState({ search: "", type: "", sort: "newest", favorites: false, pinned: false, archived: false, category: "", view: "grid" });
  const [selectedMemory, setSelectedMemory] = useState(null);
  const [editingMemory, setEditingMemory] = useState(null);
  const [deletingMemory, setDeletingMemory] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createType, setCreateType] = useState("note");
  const [activeTab, setActiveTab] = useState(initialView); // timeline | archived | trash

  const filteredMemories = useMemo(() => {
    let list = memories;

    if (activeTab === "archived") list = list.filter(m => m.isArchived && !m.isDeleted);
    else if (activeTab === "trash") list = list.filter(m => m.isDeleted);
    else list = list.filter(m => !m.isDeleted && !m.isArchived);

    if (filters.favorites) list = list.filter(m => m.isFavorite);
    if (filters.pinned) list = list.filter(m => m.isPinned);
    if (filters.archived && activeTab === "timeline") list = [...list, ...memories.filter(m => m.isArchived && !m.isDeleted)];
    if (filters.type) list = list.filter(m => m.type === filters.type);
    if (filters.category) list = list.filter(m => m.category === filters.category);
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(m => m.title.toLowerCase().includes(q) || stripHtml(m.content).toLowerCase().includes(q) || m.tags?.some(t => t.includes(q)) || m.summary?.toLowerCase().includes(q));
    }

    const sorted = [...list];
    if (filters.sort === "newest") sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    else if (filters.sort === "oldest") sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    else if (filters.sort === "az") sorted.sort((a, b) => a.title.localeCompare(b.title));
    else if (filters.sort === "za") sorted.sort((a, b) => b.title.localeCompare(a.title));

    return sorted;
  }, [memories, filters, activeTab]);

  const pinnedMemories = useMemo(() => memories.filter(m => m.isPinned && !m.isDeleted && !m.isArchived), [memories]);

  const handleSave = async (data) => {
    if (data.id) {
      updateMemory(data.id, data);
      addToast("Memory updated", "success");
    } else {
      await createMemory({ ...data, type: createType });
      addToast("Memory created ✨", "success");
    }
    setEditingMemory(null);
    setShowCreate(false);
  };

  const handleDelete = (memory, permanent = false) => {
    deleteMemory(memory.id, permanent);
    addToast(permanent ? "Memory permanently deleted" : "Moved to trash", permanent ? "info" : "info");
    setDeletingMemory(null);
    setSelectedMemory(null);
  };

  const handleRestore = (memory) => {
    restoreMemory(memory.id);
    addToast("Memory restored", "success");
  };

  const tabs = [
    { id: "timeline", label: "All memories", icon: "layers" },
    { id: "archived", label: "Archived", icon: "archive" },
    { id: "trash", label: "Trash", icon: "trash-2" },
  ];

  const stats = useMemo(() => ({
    total: memories.filter(m => !m.isDeleted).length,
    favorites: memories.filter(m => m.isFavorite && !m.isDeleted).length,
    pinned: memories.filter(m => m.isPinned && !m.isDeleted).length,
    archived: memories.filter(m => m.isArchived && !m.isDeleted).length,
  }), [memories]);

  return (
    <div className="page-fade" style={{ minHeight: "100vh", background: "var(--bg-canvas)", padding: "32px" }}>
      {/* Page header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em", marginBottom: 6 }}>Memories</h1>
            <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>Your personal knowledge store — every thought, meeting, and moment.</p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {/* Quick type buttons */}
            {Object.entries(TYPE_CONFIG).slice(0, 4).map(([type, cfg]) => (
              <button key={type} onClick={() => { setCreateType(type); setEditingMemory(null); setShowCreate(true); }}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", cursor: "pointer", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", fontFamily: "Inter, sans-serif", transition: "all 150ms" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = cfg.color + "80"; e.currentTarget.style.color = cfg.color; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border-default)"; e.currentTarget.style.color = "var(--text-secondary)"; }}>
                <Icon name={cfg.icon} size={13} color={cfg.color} /> {cfg.label}
              </button>
            ))}
            <Btn onClick={() => { setCreateType("note"); setEditingMemory(null); setShowCreate(true); }}>
              <Icon name="plus" size={16} color="white" /> New memory
            </Btn>
          </div>
        </div>

        {/* Stat row */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {[
            { label: "Total", value: stats.total, icon: "layers", color: "var(--accent-400)" },
            { label: "Favorites", value: stats.favorites, icon: "star", color: "var(--favorite-gold)" },
            { label: "Pinned", value: stats.pinned, icon: "pin", color: "var(--accent-500)" },
            { label: "Archived", value: stats.archived, icon: "archive", color: "var(--text-tertiary)" },
          ].map(s => (
            <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)" }}>
              <Icon name={s.icon} size={14} color={s.color} />
              <span style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>{s.value}</span>
              <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: "1px solid var(--border-subtle)", paddingBottom: 0 }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            display: "flex", alignItems: "center", gap: 7, padding: "10px 16px", background: "none", border: "none",
            cursor: "pointer", fontSize: 14, fontWeight: 500, fontFamily: "Inter, sans-serif",
            color: activeTab === tab.id ? "var(--accent-400)" : "var(--text-secondary)",
            borderBottom: `2px solid ${activeTab === tab.id ? "var(--accent-600)" : "transparent"}`,
            marginBottom: "-1px", transition: "color 150ms", whiteSpace: "nowrap",
          }}>
            <Icon name={tab.icon} size={14} color={activeTab === tab.id ? "var(--accent-400)" : "var(--text-tertiary)"} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Pinned section (timeline only) */}
      {activeTab === "timeline" && pinnedMemories.length > 0 && !filters.search && !filters.type && !filters.pinned && !filters.favorites && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <Icon name="pin" size={16} color="var(--accent-400)" />
            <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>Pinned</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {pinnedMemories.map((m, i) => (
              <MemoryCard key={m.id} memory={m} animDelay={i * 30}
                onClick={() => setSelectedMemory(m)}
                onEdit={() => { setSelectedMemory(null); setEditingMemory(m); }}
                onDelete={() => setDeletingMemory(m)}
                onToggleFav={() => { toggleFavorite(m.id); addToast(m.isFavorite ? "Removed from favorites" : "Added to favorites", "success"); }}
                onTogglePin={() => { togglePin(m.id); addToast(m.isPinned ? "Unpinned" : "Pinned", "info"); }}
                onToggleArchive={() => { toggleArchive(m.id); addToast(m.isArchived ? "Unarchived" : "Archived", "info"); }}
              />
            ))}
          </div>
          <div style={{ height: 1, background: "var(--border-subtle)", margin: "24px 0" }} />
        </div>
      )}

      {/* Filter bar */}
      <div style={{ marginBottom: 20 }}>
        <FilterBar filters={filters} onChange={setFilters} totalCount={filteredMemories.length} />
      </div>

      {/* Tag cloud quick filters */}
      {activeTab === "timeline" && !filters.search && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 20 }}>
          {[...new Set(memories.filter(m => !m.isDeleted).flatMap(m => m.tags || []))].slice(0, 15).map(tag => (
            <TagChip key={tag} tag={tag} active={filters.search === tag}
              onClick={() => setFilters(f => ({ ...f, search: f.search === tag ? "" : tag }))} />
          ))}
        </div>
      )}

      {/* Memory grid/list */}
      {filteredMemories.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 24px", gap: 16 }}>
          <div style={{ width: 80, height: 80, borderRadius: "var(--radius-xl)", background: "var(--bg-surface-raised)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name={activeTab === "trash" ? "trash-2" : activeTab === "archived" ? "archive" : "brain"} size={36} color="var(--text-tertiary)" />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)" }}>
            {activeTab === "trash" ? "Trash is empty" : activeTab === "archived" ? "Nothing archived" : filters.search ? "No results found" : "No memories yet"}
          </h3>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", textAlign: "center", maxWidth: 300 }}>
            {activeTab === "trash" ? "Deleted memories will appear here." : activeTab === "archived" ? "Archived memories will appear here." : filters.search ? `No memories match "${filters.search}"` : "Capture your first memory to get started."}
          </p>
          {activeTab === "timeline" && !filters.search && (
            <Btn onClick={() => setShowCreate(true)}>
              <Icon name="plus" size={16} color="white" /> Create first memory
            </Btn>
          )}
        </div>
      ) : (
        <div style={{
          display: filters.view === "list" ? "flex" : "grid",
          flexDirection: "column",
          gridTemplateColumns: filters.view === "grid" ? "repeat(auto-fill, minmax(300px, 1fr))" : undefined,
          gap: 16,
        }}>
          {filteredMemories.map((m, i) => (
            activeTab === "trash" ? (
              // Trash card variant
              <div key={m.id} className="card-enter" style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", animationDelay: `${i * 30}ms` }}>
                <TypeBadge type={m.type} size={32} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.title}</p>
                  <p style={{ fontSize: 12, color: "var(--text-tertiary)" }}>Deleted {relativeTime(m.deletedAt || m.updatedAt)}</p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <Btn size="sm" variant="secondary" onClick={() => handleRestore(m)}>
                    <Icon name="rotate-ccw" size={13} /> Restore
                  </Btn>
                  <Btn size="sm" variant="danger" onClick={() => setDeletingMemory({ ...m, _permanent: true })}>
                    <Icon name="trash-2" size={13} color="white" /> Delete forever
                  </Btn>
                </div>
              </div>
            ) : (
              <MemoryCard key={m.id} memory={m} animDelay={i * 30}
                style={filters.view === "list" ? { flexDirection: "row", gap: 16, alignItems: "flex-start" } : {}}
                onClick={() => setSelectedMemory(m)}
                onEdit={() => { setSelectedMemory(null); setEditingMemory(m); }}
                onDelete={() => setDeletingMemory(m)}
                onToggleFav={() => { toggleFavorite(m.id); addToast(m.isFavorite ? "Removed from favorites" : "Added to favorites", "success"); }}
                onTogglePin={() => { togglePin(m.id); addToast(m.isPinned ? "Unpinned" : "Pinned", "info"); }}
                onToggleArchive={() => { toggleArchive(m.id); addToast(m.isArchived ? "Unarchived" : "Archived", "info"); }}
              />
            )
          ))}
        </div>
      )}

      {/* Modals */}
      {(showCreate || editingMemory) && (
        <MemoryFormModal
          memory={editingMemory}
          onClose={() => { setShowCreate(false); setEditingMemory(null); }}
          onSave={handleSave}
        />
      )}

      {selectedMemory && !editingMemory && (
        <MemoryDetailModal
          memory={selectedMemory}
          onClose={() => setSelectedMemory(null)}
          onEdit={() => { setEditingMemory(selectedMemory); setSelectedMemory(null); }}
          onDelete={() => { setDeletingMemory(selectedMemory); setSelectedMemory(null); }}
          onToggleFav={() => { toggleFavorite(selectedMemory.id); setSelectedMemory(p => ({ ...p, isFavorite: !p.isFavorite })); addToast(selectedMemory.isFavorite ? "Removed from favorites" : "Added to favorites", "success"); }}
          onTogglePin={() => { togglePin(selectedMemory.id); setSelectedMemory(p => ({ ...p, isPinned: !p.isPinned })); addToast(selectedMemory.isPinned ? "Unpinned" : "Pinned", "info"); }}
          onToggleArchive={() => { toggleArchive(selectedMemory.id); addToast(selectedMemory.isArchived ? "Unarchived" : "Archived", "info"); setSelectedMemory(null); }}
        />
      )}

      {deletingMemory && (
        <DeleteModal
          memory={deletingMemory}
          permanent={deletingMemory._permanent}
          onClose={() => setDeletingMemory(null)}
          onConfirm={() => handleDelete(deletingMemory, deletingMemory._permanent)}
        />
      )}
    </div>
  );
};

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
const Sidebar = ({ currentPage, onNavigate, collapsed, onToggle }) => {
  const { memories } = useMemories();
  const counts = {
    memories: memories.filter(m => !m.isDeleted && !m.isArchived).length,
    archived: memories.filter(m => m.isArchived && !m.isDeleted).length,
    trash: memories.filter(m => m.isDeleted).length,
  };

  const navGroups = [
    { label: "MAIN", items: [
      { id: "memories", icon: "layers", label: "Memories", badge: counts.memories },
      { id: "categories", icon: "folder", label: "Categories", badge: null },
      { id: "search", icon: "search", label: "Search", badge: null },
    ]},
    { label: "ACCOUNT", items: [
      { id: "archived", icon: "archive", label: "Archived", badge: counts.archived || null },
      { id: "trash", icon: "trash-2", label: "Trash", badge: counts.trash || null },
    ]},
  ];

  return (
    <div style={{ width: collapsed ? 72 : 260, background: "var(--bg-shell)", borderRight: "1px solid var(--border-subtle)", height: "100vh", display: "flex", flexDirection: "column", flexShrink: 0, transition: "width 300ms cubic-bezier(0.16,1,0.3,1)", overflow: "hidden" }}>
      {/* Logo */}
      <div style={{ height: 64, display: "flex", alignItems: "center", gap: 10, padding: collapsed ? "0 20px" : "0 20px", borderBottom: "1px solid var(--border-subtle)", flexShrink: 0, overflow: "hidden" }}>
        <div style={{ width: 34, height: 34, borderRadius: "var(--radius-lg)", background: "linear-gradient(135deg, #722CE4, #5B21B6)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon name="brain" size={18} color="white" />
        </div>
        {!collapsed && (
          <div style={{ overflow: "hidden" }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", whiteSpace: "nowrap" }}>MemoryVault</p>
            <p style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-tertiary)", whiteSpace: "nowrap" }}>AI SECOND BRAIN</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <div style={{ flex: 1, padding: "12px 10px", overflowY: "auto", overflowX: "hidden" }}>
        {navGroups.map(group => (
          <div key={group.label} style={{ marginBottom: 16 }}>
            {!collapsed && <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-tertiary)", padding: "0 6px", marginBottom: 4 }}>{group.label}</p>}
            {group.items.map(item => {
              const active = currentPage === item.id;
              return (
                <button key={item.id} className="nav-item" onClick={() => onNavigate(item.id)}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: "var(--radius-md)", border: "none", cursor: "pointer", fontFamily: "Inter, sans-serif", fontSize: 14, fontWeight: 500, background: active ? "var(--bg-surface-active)" : "transparent", color: active ? "var(--accent-400)" : "var(--text-secondary)", textAlign: "left", borderLeft: `3px solid ${active ? "var(--accent-600)" : "transparent"}`, marginBottom: 2, position: "relative" }}
                  title={collapsed ? item.label : undefined}>
                  <Icon name={item.icon} size={17} color={active ? "var(--accent-400)" : "var(--text-secondary)"} />
                  {!collapsed && <span style={{ flex: 1 }}>{item.label}</span>}
                  {!collapsed && item.badge != null && (
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "1px 7px", background: active ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.06)", borderRadius: "var(--radius-full)", color: active ? "var(--accent-400)" : "var(--text-tertiary)" }}>{item.badge}</span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* AI Status */}
      {!collapsed && (
        <div style={{ padding: 12 }}>
          <div style={{ padding: "12px 14px", background: "var(--bg-surface-raised)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--success)", animation: "pulse-dot 2s ease-in-out infinite" }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>AI Active</span>
            </div>
            <p style={{ fontSize: 12, color: "var(--text-tertiary)", lineHeight: 1.5 }}>Processing & organizing your memories in real-time</p>
          </div>
        </div>
      )}

      {/* Collapse */}
      <button onClick={onToggle} style={{ display: "flex", alignItems: "center", gap: 8, padding: "14px 20px", background: "none", border: "none", borderTop: "1px solid var(--border-subtle)", cursor: "pointer", fontSize: 13, color: "var(--text-tertiary)", fontFamily: "Inter, sans-serif", transition: "color 150ms" }}
        onMouseEnter={e => e.currentTarget.style.color = "var(--text-primary)"}
        onMouseLeave={e => e.currentTarget.style.color = "var(--text-tertiary)"}>
        <Icon name="chevron-right" size={15} style={{ transform: collapsed ? "none" : "rotate(180deg)", transition: "transform 300ms" }} />
        {!collapsed && "Collapse"}
      </button>
    </div>
  );
};

// ─── TOP BAR ──────────────────────────────────────────────────────────────────
const TopBar = ({ currentPage, onCapture }) => {
  const PAGE_TITLES = { memories: "Memories", categories: "Categories", search: "Search", archived: "Archived", trash: "Trash" };
  return (
    <div style={{ height: 64, background: "var(--bg-shell)", borderBottom: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", gap: 16, padding: "0 24px", flexShrink: 0, position: "sticky", top: 0, zIndex: 50 }}>
      <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", flex: 1 }}>{PAGE_TITLES[currentPage] || "Memories"}</h1>
      <Btn onClick={onCapture}>
        <Icon name="plus" size={15} color="white" /> Capture
      </Btn>
      <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--accent-600)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "white", cursor: "pointer" }}>MM</div>
    </div>
  );
};

// ─── APP SHELL ────────────────────────────────────────────────────────────────
const AppShell = () => {
  const [currentPage, setCurrentPage] = useState("categories");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showCapture, setShowCapture] = useState(false);
  const [viewingMemory, setViewingMemory] = useState(null);
  const [editingMemory, setEditingMemory] = useState(null);
  const { createMemory, updateMemory, deleteMemory, toggleFavorite, togglePin, toggleArchive } = useMemories();
  const { addToast } = useToast();

  const handleCaptureCreate = async (data) => {
    await createMemory(data);
    addToast("Memory captured ✨", "success");
    setShowCapture(false);
  };

  const handleEditSave = async (data) => {
    updateMemory(editingMemory.id, data);
    addToast("Memory updated", "success");
    setEditingMemory(null);
    setViewingMemory(null);
  };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(p => !p)} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <TopBar currentPage={currentPage} onCapture={() => setShowCapture(true)} />
        <div style={{ flex: 1, overflowY: "auto" }}>
          {currentPage === "categories" && <CategoriesPage />}
          {currentPage === "search" && <SearchPage onOpenMemory={setViewingMemory} />}
          {currentPage === "archived" && <ArchivePage onOpenMemory={setViewingMemory} />}
          {(currentPage === "memories" || currentPage === "trash") && (
            <MemoriesPage
              key={currentPage}
              initialView={currentPage === "trash" ? "trash" : "timeline"}
            />
          )}
        </div>
      </div>
      {showCapture && (
        <MemoryFormModal
          onClose={() => setShowCapture(false)}
          onSave={handleCaptureCreate}
        />
      )}
      {viewingMemory && !editingMemory && (
        <MemoryDetailModal
          memory={viewingMemory}
          onClose={() => setViewingMemory(null)}
          onEdit={() => setEditingMemory(viewingMemory)}
          onDelete={() => { deleteMemory(viewingMemory.id); addToast("Moved to trash", "info"); setViewingMemory(null); }}
          onToggleFav={() => toggleFavorite(viewingMemory.id)}
          onTogglePin={() => togglePin(viewingMemory.id)}
          onToggleArchive={() => { toggleArchive(viewingMemory.id); setViewingMemory(null); }}
        />
      )}
      {editingMemory && (
        <MemoryFormModal memory={editingMemory} onClose={() => setEditingMemory(null)} onSave={handleEditSave} />
      )}
    </div>
  );
};

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <>
      <GlobalStyle />
      <MemoryProvider>
        <ToastProvider>
          <AppShell />
        </ToastProvider>
      </MemoryProvider>
    </>
  );
}
