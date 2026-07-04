import { useState, useEffect, useContext, createContext, useCallback, useRef } from "react";

// ─── DESIGN TOKENS ──────────────────────────────────────────────────────────
const tokens = {
  bgCanvas: "#0B0C15",
  bgShell: "#0E1020",
  bgSurface: "#12132A",
  bgSurfaceRaised: "#181A33",
  bgSurfaceActive: "#1C1740",
  borderSubtle: "#21233F",
  borderDefault: "#2A2D4D",
  borderFocus: "#7C3AED",
  textPrimary: "#F8FAFC",
  textSecondary: "#A1A8C3",
  textTertiary: "#6B7290",
  textDisabled: "#454966",
  accent400: "#9F75F0",
  accent500: "#8B5CF6",
  accent600: "#7C3AED",
  accent700: "#6320D6",
  success: "#22C55E",
  danger: "#EF4444",
  warning: "#F59E0B",
};

// ─── GLOBAL STYLES ───────────────────────────────────────────────────────────
const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg-canvas: #0B0C15;
      --bg-shell: #0E1020;
      --bg-surface: #12132A;
      --bg-surface-raised: #181A33;
      --bg-surface-active: #1C1740;
      --border-subtle: #21233F;
      --border-default: #2A2D4D;
      --border-focus: #7C3AED;
      --text-primary: #F8FAFC;
      --text-secondary: #A1A8C3;
      --text-tertiary: #6B7290;
      --accent-400: #9F75F0;
      --accent-500: #8B5CF6;
      --accent-600: #7C3AED;
      --accent-700: #6320D6;
      --success: #22C55E;
      --danger: #EF4444;
      --warning: #F59E0B;
      --radius-sm: 6px;
      --radius-md: 10px;
      --radius-lg: 14px;
      --radius-xl: 20px;
      --radius-full: 9999px;
      --shadow-xs: 0 1px 2px rgba(0,0,0,0.4);
      --shadow-sm: 0 2px 8px rgba(0,0,0,0.35);
      --shadow-md: 0 8px 24px rgba(0,0,0,0.45);
      --shadow-lg: 0 16px 48px rgba(0,0,0,0.55);
      --shadow-glow-accent: 0 0 32px rgba(124,58,237,0.35);
    }

    html, body, #root { height: 100%; }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: var(--bg-canvas);
      color: var(--text-primary);
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    ::selection { background: rgba(124,58,237,0.3); }

    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: var(--bg-canvas); }
    ::-webkit-scrollbar-thumb { background: var(--border-default); border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: var(--text-tertiary); }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes scaleIn {
      from { opacity: 0; transform: scale(0.96) translateY(8px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }
    @keyframes shimmer {
      0% { background-position: -400px 0; }
      100% { background-position: 400px 0; }
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    @keyframes pulse-glow {
      0%, 100% { box-shadow: 0 0 0 0 rgba(124,58,237,0.4); }
      50% { box-shadow: 0 0 0 8px rgba(124,58,237,0); }
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(16px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes slideDown {
      from { opacity: 1; transform: translateY(0); }
      to { opacity: 0; transform: translateY(8px); }
    }
    @keyframes float {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      33% { transform: translateY(-12px) rotate(1deg); }
      66% { transform: translateY(-6px) rotate(-1deg); }
    }
    @keyframes orb-drift {
      0%, 100% { transform: translate(0, 0) scale(1); }
      33% { transform: translate(30px, -20px) scale(1.05); }
      66% { transform: translate(-20px, 15px) scale(0.97); }
    }
    @keyframes checkmark {
      from { stroke-dashoffset: 50; }
      to { stroke-dashoffset: 0; }
    }
    @keyframes bounce-dot {
      0%, 80%, 100% { transform: scale(0.7); opacity: 0.5; }
      40% { transform: scale(1); opacity: 1; }
    }
    @keyframes progress-bar {
      from { width: 0%; }
      to { width: 100%; }
    }

    .auth-card { animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) both; }
    .page-fade { animation: fadeIn 0.2s ease-out both; }

    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
    }
  `}</style>
);

// ─── AUTH CONTEXT ─────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [emailVerified, setEmailVerified] = useState(false);
  const sessionTimerRef = useRef(null);

  // Simulate checking existing session on mount
  useEffect(() => {
    const savedSession = sessionStorage.getItem("mv_session");
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        if (parsed.expiresAt > Date.now()) {
          setSession(parsed);
          setUser(parsed.user);
          setEmailVerified(parsed.user.emailVerified ?? false);
          startSessionTimer(parsed.expiresAt - Date.now());
        } else {
          sessionStorage.removeItem("mv_session");
        }
      } catch {}
    }
    setTimeout(() => setLoading(false), 600); // Simulate auth check
  }, []);

  const startSessionTimer = useCallback((ms) => {
    if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);
    sessionTimerRef.current = setTimeout(() => {
      logout();
    }, ms);
  }, []);

  const login = useCallback(async (email, password, remember = false) => {
    await delay(1200);
    // Simulate auth — reject known bad creds
    if (password === "wrong") throw new Error("Invalid email or password. Please try again.");
    const userData = {
      id: "usr_" + Math.random().toString(36).slice(2, 9),
      email,
      name: email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
      initials: email.slice(0, 2).toUpperCase(),
      emailVerified: email.includes("verified"),
      createdAt: new Date().toISOString(),
    };
    const ttl = remember ? 7 * 24 * 60 * 60 * 1000 : 8 * 60 * 60 * 1000;
    const sess = { user: userData, token: "tok_" + Math.random().toString(36).slice(2), expiresAt: Date.now() + ttl };
    sessionStorage.setItem("mv_session", JSON.stringify(sess));
    setSession(sess);
    setUser(userData);
    setEmailVerified(userData.emailVerified);
    startSessionTimer(ttl);
    return userData;
  }, [startSessionTimer]);

  const register = useCallback(async (name, email, password) => {
    await delay(1400);
    if (email === "taken@example.com") throw new Error("An account with this email already exists.");
    const userData = {
      id: "usr_" + Math.random().toString(36).slice(2, 9),
      email,
      name,
      initials: name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2),
      emailVerified: false,
      createdAt: new Date().toISOString(),
    };
    return userData;
  }, []);

  const sendPasswordReset = useCallback(async (email) => {
    await delay(1000);
    if (!email.includes("@")) throw new Error("Please enter a valid email address.");
    return true;
  }, []);

  const resetPassword = useCallback(async (token, newPassword) => {
    await delay(1200);
    if (token === "invalid") throw new Error("This reset link has expired. Please request a new one.");
    return true;
  }, []);

  const verifyEmail = useCallback(async (code) => {
    await delay(1000);
    if (code !== "123456" && code.length !== 6) throw new Error("Invalid verification code. Please try again.");
    setEmailVerified(true);
    if (user) {
      const updated = { ...user, emailVerified: true };
      setUser(updated);
      const sess = JSON.parse(sessionStorage.getItem("mv_session") || "{}");
      if (sess.user) {
        sess.user = updated;
        sessionStorage.setItem("mv_session", JSON.stringify(sess));
      }
    }
    return true;
  }, [user]);

  const logout = useCallback(() => {
    if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);
    sessionStorage.removeItem("mv_session");
    setUser(null);
    setSession(null);
    setEmailVerified(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading, emailVerified, login, register, sendPasswordReset, resetPassword, verifyEmail, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// ─── UTILITIES ────────────────────────────────────────────────────────────────
const delay = (ms) => new Promise(r => setTimeout(r, ms));

const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const validatePassword = (pw) => ({
  length: pw.length >= 8,
  upper: /[A-Z]/.test(pw),
  lower: /[a-z]/.test(pw),
  number: /\d/.test(pw),
  special: /[!@#$%^&*(),.?":{}|<>]/.test(pw),
});

const passwordStrength = (pw) => {
  const v = validatePassword(pw);
  const score = Object.values(v).filter(Boolean).length;
  if (score <= 2) return { label: "Weak", color: "#EF4444", width: "25%" };
  if (score === 3) return { label: "Fair", color: "#F59E0B", width: "50%" };
  if (score === 4) return { label: "Good", color: "#9F75F0", width: "75%" };
  return { label: "Strong", color: "#22C55E", width: "100%" };
};

// ─── ICONS ───────────────────────────────────────────────────────────────────
const Icon = ({ name, size = 18, color = "currentColor", style = {} }) => {
  const icons = {
    eye: <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
    "eye-off": <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></>,
    mail: <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></>,
    lock: <><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></>,
    user: <><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    brain: <><path d="M9.5 2A2.5 2.5 0 0112 4.5v15a2.5 2.5 0 01-4.96-.46 2.5 2.5 0 01-1.07-4.8 3 3 0 01.35-5.58A2.5 2.5 0 019.5 2z"/><path d="M14.5 2A2.5 2.5 0 0012 4.5v15a2.5 2.5 0 004.96-.46 2.5 2.5 0 001.07-4.8 3 3 0 00-.35-5.58A2.5 2.5 0 0014.5 2z"/></>,
    check: <polyline points="20 6 9 17 4 12"/>,
    "check-circle": <><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>,
    "alert-circle": <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>,
    "arrow-right": <><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>,
    "arrow-left": <><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></>,
    x: <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    "refresh-cw": <><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></>,
    shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></>,
    sparkles: <><path d="M12 3L9.5 9.5 3 12l6.5 2.5L12 21l2.5-6.5L21 12l-6.5-2.5L12 3z"/><path d="M5 3l-.5 1.5L3 5l1.5.5L5 7l.5-1.5L7 5l-1.5-.5L5 3z"/><path d="M19 13l-.5 1.5L17 15l1.5.5L19 17l.5-1.5L21 15l-1.5-.5L19 13z"/></>,
    "log-out": <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
    clock: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
    key: <><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      {icons[name]}
    </svg>
  );
};

// ─── LOGO ─────────────────────────────────────────────────────────────────────
const Logo = ({ size = 32 }) => (
  <div style={{ width: size, height: size, borderRadius: "var(--radius-xl)", background: "linear-gradient(135deg, #722CE4 0%, #5B21B6 100%)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "var(--shadow-glow-accent)" }}>
    <Icon name="brain" size={size * 0.55} color="white" />
  </div>
);

// ─── SPINNER ──────────────────────────────────────────────────────────────────
const Spinner = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ animation: "spin 0.8s linear infinite", flexShrink: 0 }}>
    <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.2)" strokeWidth="3"/>
    <path d="M12 2a10 10 0 0110 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
  </svg>
);

// ─── BUTTON ───────────────────────────────────────────────────────────────────
const Button = ({ children, variant = "primary", size = "md", loading = false, disabled = false, onClick, type = "button", fullWidth = false, style = {} }) => {
  const sizes = {
    sm: { height: 32, padding: "0 12px", fontSize: 13 },
    md: { height: 40, padding: "0 16px", fontSize: 14 },
    lg: { height: 48, padding: "0 20px", fontSize: 15 },
  };
  const s = sizes[size];
  const [hover, setHover] = useState(false);
  const [active, setActive] = useState(false);

  const variants = {
    primary: {
      background: hover ? "linear-gradient(135deg, #8B3CF7 0%, #6D28D9 100%)" : "linear-gradient(135deg, #722CE4 0%, #5B21B6 100%)",
      color: "white",
      border: "none",
      boxShadow: hover ? "var(--shadow-glow-accent)" : "var(--shadow-xs)",
    },
    secondary: {
      background: hover ? "var(--bg-surface-raised)" : "var(--bg-surface)",
      color: "var(--text-primary)",
      border: "1px solid var(--border-default)",
    },
    ghost: {
      background: hover ? "var(--bg-surface)" : "transparent",
      color: "var(--text-secondary)",
      border: "none",
    },
    danger: {
      background: hover ? "#DC2626" : "#EF4444",
      color: "white",
      border: "none",
    },
  };

  const v = variants[variant];

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setActive(false); }}
      onMouseDown={() => setActive(true)}
      onMouseUp={() => setActive(false)}
      style={{
        height: s.height,
        padding: s.padding,
        fontSize: s.fontSize,
        fontWeight: 600,
        fontFamily: "Inter, sans-serif",
        borderRadius: "var(--radius-md)",
        cursor: (disabled || loading) ? "not-allowed" : "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        width: fullWidth ? "100%" : "auto",
        transition: "all 150ms ease-out",
        transform: active ? "scale(0.98)" : "scale(1)",
        opacity: (disabled && !loading) ? 0.4 : 1,
        outline: "none",
        userSelect: "none",
        ...v,
        ...style,
      }}
    >
      {loading ? <><Spinner size={16} /><span>Please wait…</span></> : children}
    </button>
  );
};

// ─── INPUT ────────────────────────────────────────────────────────────────────
const Input = ({ label, type = "text", value, onChange, placeholder, error, hint, icon, trailingAction, autoComplete, disabled = false, required = false }) => {
  const [focused, setFocused] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const inputType = type === "password" ? (showPass ? "text" : "password") : type;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {label && (
        <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 4 }}>
          {label} {required && <span style={{ color: "var(--accent-500)" }}>*</span>}
        </label>
      )}
      <div style={{ position: "relative" }}>
        {icon && (
          <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: focused ? "var(--accent-400)" : "var(--text-tertiary)", transition: "color 150ms", pointerEvents: "none", zIndex: 1 }}>
            <Icon name={icon} size={16} color="currentColor" />
          </div>
        )}
        <input
          type={inputType}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          required={required}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: "100%",
            height: 44,
            paddingLeft: icon ? 40 : 14,
            paddingRight: (type === "password" || trailingAction) ? 44 : 14,
            background: "var(--bg-surface)",
            border: `1px solid ${error ? "var(--danger)" : focused ? "var(--border-focus)" : "var(--border-default)"}`,
            borderRadius: "var(--radius-md)",
            color: "var(--text-primary)",
            fontSize: 14,
            fontFamily: "Inter, sans-serif",
            outline: "none",
            transition: "all 150ms ease-out",
            boxShadow: focused ? (error ? "0 0 0 3px rgba(239,68,68,0.15)" : "0 0 0 3px rgba(124,58,237,0.2)") : "none",
            opacity: disabled ? 0.5 : 1,
            cursor: disabled ? "not-allowed" : "text",
          }}
        />
        {type === "password" && (
          <button
            type="button"
            onClick={() => setShowPass(!showPass)}
            style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)", padding: 2, display: "flex", alignItems: "center" }}
          >
            <Icon name={showPass ? "eye-off" : "eye"} size={16} color="currentColor" />
          </button>
        )}
      </div>
      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--danger)", animation: "fadeIn 0.15s ease-out" }}>
          <Icon name="alert-circle" size={12} color="var(--danger)" />
          {error}
        </div>
      )}
      {hint && !error && <p style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{hint}</p>}
    </div>
  );
};

// ─── PASSWORD STRENGTH ────────────────────────────────────────────────────────
const PasswordStrengthBar = ({ password }) => {
  if (!password) return null;
  const strength = passwordStrength(password);
  const checks = validatePassword(password);
  return (
    <div style={{ marginTop: 4 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <div style={{ flex: 1, height: 4, background: "var(--border-default)", borderRadius: 2, overflow: "hidden" }}>
          <div style={{ height: "100%", width: strength.width, background: strength.color, borderRadius: 2, transition: "all 300ms ease-out" }} />
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, color: strength.color, minWidth: 40 }}>{strength.label}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
        {[
          { key: "length", label: "8+ characters" },
          { key: "upper", label: "Uppercase letter" },
          { key: "lower", label: "Lowercase letter" },
          { key: "number", label: "Number" },
        ].map(({ key, label }) => (
          <div key={key} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: checks[key] ? "var(--success)" : "var(--text-tertiary)", transition: "color 150ms" }}>
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: checks[key] ? "var(--success)" : "var(--border-default)", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 150ms", flexShrink: 0 }}>
              {checks[key] && <Icon name="check" size={8} color="white" />}
            </div>
            {label}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── TOAST ────────────────────────────────────────────────────────────────────
const ToastContext = createContext(null);

const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((message, type = "info", duration = 4000) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, message, type, exiting: false }]);
    if (type !== "error") {
      setTimeout(() => dismissToast(id), duration);
    }
  }, []);
  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 200);
  }, []);

  const toastIcons = { success: "check-circle", error: "alert-circle", info: "sparkles" };
  const toastColors = { success: "var(--success)", error: "var(--danger)", info: "var(--accent-400)" };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
        {toasts.map(toast => (
          <div key={toast.id} style={{
            display: "flex", alignItems: "center", gap: 12, minWidth: 320, maxWidth: 420,
            padding: "14px 16px", borderRadius: "var(--radius-md)",
            background: "var(--bg-surface-raised)", border: "1px solid var(--border-default)",
            boxShadow: "var(--shadow-md)",
            borderLeft: `3px solid ${toastColors[toast.type]}`,
            animation: toast.exiting ? "slideDown 0.2s ease-in both" : "slideUp 0.2s ease-out both",
          }}>
            <Icon name={toastIcons[toast.type]} size={18} color={toastColors[toast.type]} />
            <p style={{ flex: 1, fontSize: 13, color: "var(--text-primary)", lineHeight: "1.4" }}>{toast.message}</p>
            <button onClick={() => dismissToast(toast.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)", padding: 2, display: "flex" }}>
              <Icon name="x" size={14} color="currentColor" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const useToast = () => useContext(ToastContext);

// ─── AUTH LAYOUT ──────────────────────────────────────────────────────────────
const AuthLayout = ({ children }) => (
  <div style={{
    minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
    background: "var(--bg-canvas)", position: "relative", overflow: "hidden", padding: "24px 16px",
  }}>
    {/* Ambient background orbs */}
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      <div style={{
        position: "absolute", width: 600, height: 600, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)",
        top: "-150px", right: "-100px",
        animation: "orb-drift 12s ease-in-out infinite",
      }} />
      <div style={{
        position: "absolute", width: 400, height: 400, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(91,33,182,0.08) 0%, transparent 70%)",
        bottom: "-100px", left: "-80px",
        animation: "orb-drift 16s ease-in-out infinite reverse",
      }} />
      <div style={{
        position: "absolute", width: 200, height: 200, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(159,117,240,0.06) 0%, transparent 70%)",
        top: "40%", left: "10%",
        animation: "orb-drift 20s ease-in-out infinite 4s",
      }} />
      {/* Grid pattern */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "linear-gradient(var(--border-subtle) 1px, transparent 1px), linear-gradient(90deg, var(--border-subtle) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
        opacity: 0.3,
        maskImage: "radial-gradient(ellipse at center, black 20%, transparent 80%)",
        WebkitMaskImage: "radial-gradient(ellipse at center, black 20%, transparent 80%)",
      }} />
    </div>

    <div style={{ width: "100%", maxWidth: 440, position: "relative", zIndex: 1 }}>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 40 }}>
        <Logo size={40} />
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>MemoryVault</div>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-tertiary)" }}>AI Second Brain</div>
        </div>
      </div>

      {children}

      <p style={{ textAlign: "center", fontSize: 12, color: "var(--text-tertiary)", marginTop: 32 }}>
        © 2026 MemoryVault AI · <span style={{ color: "var(--accent-400)", cursor: "pointer" }}>Privacy</span> · <span style={{ color: "var(--accent-400)", cursor: "pointer" }}>Terms</span>
      </p>
    </div>
  </div>
);

// ─── AUTH CARD ────────────────────────────────────────────────────────────────
const AuthCard = ({ children, style = {} }) => (
  <div className="auth-card" style={{
    background: "rgba(18, 19, 42, 0.72)",
    backdropFilter: "blur(20px) saturate(140%)",
    WebkitBackdropFilter: "blur(20px) saturate(140%)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "var(--radius-xl)",
    padding: 32,
    boxShadow: "var(--shadow-lg)",
    ...style,
  }}>
    {children}
  </div>
);

// ─── DIVIDER ──────────────────────────────────────────────────────────────────
const Divider = ({ label }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
    <div style={{ flex: 1, height: 1, background: "var(--border-subtle)" }} />
    {label && <span style={{ fontSize: 12, color: "var(--text-tertiary)", whiteSpace: "nowrap" }}>{label}</span>}
    <div style={{ flex: 1, height: 1, background: "var(--border-subtle)" }} />
  </div>
);

// ─── LINK ─────────────────────────────────────────────────────────────────────
const Link = ({ children, onClick }) => (
  <span onClick={onClick} style={{ color: "var(--accent-400)", cursor: "pointer", fontWeight: 500, transition: "color 150ms", fontSize: "inherit" }}
    onMouseEnter={e => e.target.style.color = "var(--accent-500)"}
    onMouseLeave={e => e.target.style.color = "var(--accent-400)"}>
    {children}
  </span>
);

// ─── CHECKBOX ─────────────────────────────────────────────────────────────────
const Checkbox = ({ checked, onChange, label }) => (
  <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", userSelect: "none" }}>
    <div
      onClick={() => onChange(!checked)}
      style={{
        width: 18, height: 18, borderRadius: "var(--radius-sm)",
        background: checked ? "var(--accent-600)" : "var(--bg-surface)",
        border: `1px solid ${checked ? "var(--accent-600)" : "var(--border-default)"}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 150ms", cursor: "pointer", flexShrink: 0,
      }}
    >
      {checked && <Icon name="check" size={11} color="white" />}
    </div>
    <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{label}</span>
  </label>
);

// ─── OTP INPUT ────────────────────────────────────────────────────────────────
const OTPInput = ({ value, onChange, length = 6 }) => {
  const inputs = useRef([]);
  const vals = value.split("").concat(Array(length).fill("")).slice(0, length);

  const handleKey = (i, e) => {
    if (e.key === "Backspace" && !vals[i] && i > 0) inputs.current[i - 1]?.focus();
    if (e.key === "ArrowLeft" && i > 0) inputs.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < length - 1) inputs.current[i + 1]?.focus();
  };

  const handleChange = (i, v) => {
    const digit = v.replace(/\D/g, "").slice(-1);
    const newVals = [...vals];
    newVals[i] = digit;
    onChange(newVals.join(""));
    if (digit && i < length - 1) inputs.current[i + 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    onChange(pasted.padEnd(length, "").slice(0, length));
    const focusIdx = Math.min(pasted.length, length - 1);
    inputs.current[focusIdx]?.focus();
  };

  return (
    <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
      {vals.map((digit, i) => (
        <input
          key={i}
          ref={el => inputs.current[i] = el}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKey(i, e)}
          onPaste={handlePaste}
          style={{
            width: 52, height: 58, textAlign: "center",
            fontSize: 22, fontWeight: 700, letterSpacing: "0.05em",
            background: digit ? "var(--bg-surface-active)" : "var(--bg-surface)",
            border: `1px solid ${digit ? "var(--accent-600)" : "var(--border-default)"}`,
            borderRadius: "var(--radius-md)",
            color: "var(--text-primary)",
            outline: "none",
            transition: "all 150ms",
            caretColor: "var(--accent-600)",
            fontFamily: "Inter, sans-serif",
          }}
          onFocus={e => e.target.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.25)"}
          onBlur={e => e.target.style.boxShadow = "none"}
        />
      ))}
    </div>
  );
};

// ─── SESSION TIMER BANNER ─────────────────────────────────────────────────────
const SessionBanner = ({ onLogout }) => {
  const { session } = useAuth();
  const [timeLeft, setTimeLeft] = useState(null);
  const [warn, setWarn] = useState(false);

  useEffect(() => {
    if (!session) return;
    const tick = () => {
      const remaining = session.expiresAt - Date.now();
      setTimeLeft(remaining);
      setWarn(remaining < 5 * 60 * 1000 && remaining > 0);
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [session]);

  if (!warn || !timeLeft) return null;

  const mins = Math.floor(timeLeft / 60000);
  return (
    <div style={{
      position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", zIndex: 1000,
      background: "var(--bg-surface-raised)", border: "1px solid var(--warning)",
      borderRadius: "var(--radius-md)", padding: "10px 16px",
      display: "flex", alignItems: "center", gap: 10,
      boxShadow: "var(--shadow-md)", animation: "slideUp 0.2s ease-out",
    }}>
      <Icon name="clock" size={16} color="var(--warning)" />
      <span style={{ fontSize: 13, color: "var(--text-primary)" }}>
        Session expires in <strong>{mins} min</strong>
      </span>
      <Button variant="ghost" size="sm" onClick={onLogout}>Sign out</Button>
    </div>
  );
};

// ─── PROTECTED ROUTE ──────────────────────────────────────────────────────────
const ProtectedRoute = ({ children, navigate }) => {
  const { user, loading, emailVerified } = useAuth();

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-canvas)" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <Logo size={48} />
        <Spinner size={24} />
        <p style={{ fontSize: 14, color: "var(--text-tertiary)" }}>Loading MemoryVault…</p>
      </div>
    </div>
  );

  if (!user) {
    navigate("login");
    return null;
  }

  if (!emailVerified) {
    navigate("verify-email");
    return null;
  }

  return children;
};

// ═══════════════════════════════════════════════════════════════════════════════
// AUTH PAGES
// ═══════════════════════════════════════════════════════════════════════════════

// ─── LOGIN PAGE ───────────────────────────────────────────────────────────────
const LoginPage = ({ navigate }) => {
  const { login } = useAuth();
  const { addToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!email) e.email = "Email is required.";
    else if (!validateEmail(email)) e.email = "Enter a valid email address.";
    if (!password) e.password = "Password is required.";
    return e;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      const user = await login(email, password, remember);
      addToast(`Welcome back, ${user.name.split(" ")[0]}! 👋`, "success");
      navigate(user.emailVerified ? "dashboard" : "verify-email");
    } catch (err) {
      setErrors({ form: err.message });
      addToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <AuthCard>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6, letterSpacing: "-0.02em" }}>
            Welcome back
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
            Sign in to your second brain
          </p>
        </div>

        {errors.form && (
          <div style={{
            display: "flex", alignItems: "center", gap: 10, padding: "12px 14px",
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: "var(--radius-md)", marginBottom: 20, animation: "fadeIn 0.15s ease-out",
          }}>
            <Icon name="alert-circle" size={16} color="var(--danger)" />
            <p style={{ fontSize: 13, color: "var(--danger)" }}>{errors.form}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Input
            label="Email" type="email" value={email} onChange={v => { setEmail(v); setErrors(prev => ({ ...prev, email: null, form: null })); }}
            placeholder="you@example.com" icon="mail" error={errors.email}
            autoComplete="email" required
          />
          <Input
            label="Password" type="password" value={password} onChange={v => { setPassword(v); setErrors(prev => ({ ...prev, password: null, form: null })); }}
            placeholder="Your password" icon="lock" error={errors.password}
            autoComplete="current-password" required
          />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Checkbox checked={remember} onChange={setRemember} label="Keep me signed in" />
            <Link onClick={() => navigate("forgot-password")}>Forgot password?</Link>
          </div>
          <Button type="submit" fullWidth size="lg" loading={loading} style={{ marginTop: 4 }}>
            <Icon name="arrow-right" size={16} color="white" />
            Sign in
          </Button>
        </form>

        <Divider label="New to MemoryVault?" />

        <Button variant="secondary" fullWidth onClick={() => navigate("register")}>
          Create a free account
        </Button>
      </AuthCard>

      {/* Features hint */}
      <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 24 }}>
        {["AI-organized memories", "Natural language search", "Always private"].map(feat => (
          <div key={feat} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-tertiary)" }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--accent-600)" }} />
            {feat}
          </div>
        ))}
      </div>
    </AuthLayout>
  );
};

// ─── REGISTER PAGE ────────────────────────────────────────────────────────────
const RegisterPage = ({ navigate }) => {
  const { register } = useAuth();
  const { addToast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = "Full name is required.";
    else if (name.trim().length < 2) e.name = "Name must be at least 2 characters.";
    if (!email) e.email = "Email is required.";
    else if (!validateEmail(email)) e.email = "Enter a valid email address.";
    if (!password) e.password = "Password is required.";
    else {
      const v = validatePassword(password);
      if (!v.length || !v.lower || !v.upper || !v.number) e.password = "Password doesn't meet the requirements below.";
    }
    if (!confirm) e.confirm = "Please confirm your password.";
    else if (password !== confirm) e.confirm = "Passwords don't match.";
    if (!agree) e.agree = "You must accept the terms to continue.";
    return e;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      await register(name.trim(), email, password);
      addToast("Account created! Please verify your email.", "success");
      navigate("verify-email");
    } catch (err) {
      setErrors({ form: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <AuthCard>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6, letterSpacing: "-0.02em" }}>
            Build your second brain
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
            Free forever · No credit card required
          </p>
        </div>

        {errors.form && (
          <div style={{
            display: "flex", alignItems: "center", gap: 10, padding: "12px 14px",
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: "var(--radius-md)", marginBottom: 20, animation: "fadeIn 0.15s ease-out",
          }}>
            <Icon name="alert-circle" size={16} color="var(--danger)" />
            <p style={{ fontSize: 13, color: "var(--danger)" }}>{errors.form}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Input
            label="Full name" value={name} onChange={v => { setName(v); setErrors(prev => ({ ...prev, name: null })); }}
            placeholder="Jane Smith" icon="user" error={errors.name} autoComplete="name" required
          />
          <Input
            label="Email" type="email" value={email} onChange={v => { setEmail(v); setErrors(prev => ({ ...prev, email: null, form: null })); }}
            placeholder="you@example.com" icon="mail" error={errors.email} autoComplete="email" required
          />
          <div>
            <Input
              label="Password" type="password" value={password}
              onChange={v => { setPassword(v); setErrors(prev => ({ ...prev, password: null })); }}
              placeholder="Create a strong password" icon="lock" error={errors.password} autoComplete="new-password" required
            />
            <PasswordStrengthBar password={password} />
          </div>
          <Input
            label="Confirm password" type="password" value={confirm}
            onChange={v => { setConfirm(v); setErrors(prev => ({ ...prev, confirm: null })); }}
            placeholder="Repeat your password" icon="lock" error={errors.confirm} autoComplete="new-password" required
          />
          <div>
            <Checkbox
              checked={agree}
              onChange={v => { setAgree(v); setErrors(prev => ({ ...prev, agree: null })); }}
              label={<>I agree to the <Link onClick={() => {}}>Terms of Service</Link> and <Link onClick={() => {}}>Privacy Policy</Link></>}
            />
            {errors.agree && <p style={{ fontSize: 12, color: "var(--danger)", marginTop: 6, marginLeft: 28 }}>{errors.agree}</p>}
          </div>
          <Button type="submit" fullWidth size="lg" loading={loading} style={{ marginTop: 4 }}>
            <Icon name="sparkles" size={16} color="white" />
            Create account
          </Button>
        </form>

        <p style={{ textAlign: "center", fontSize: 13, color: "var(--text-secondary)", marginTop: 20 }}>
          Already have an account? <Link onClick={() => navigate("login")}>Sign in</Link>
        </p>
      </AuthCard>
    </AuthLayout>
  );
};

// ─── FORGOT PASSWORD PAGE ─────────────────────────────────────────────────────
const ForgotPasswordPage = ({ navigate }) => {
  const { sendPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!email) { setError("Email is required."); return; }
    if (!validateEmail(email)) { setError("Enter a valid email address."); return; }
    setError("");
    setLoading(true);
    try {
      await sendPasswordReset(email);
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <AuthCard>
        {!sent ? (
          <>
            <button onClick={() => navigate("login")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)", display: "flex", alignItems: "center", gap: 6, fontSize: 13, marginBottom: 24, padding: 0, transition: "color 150ms" }}
              onMouseEnter={e => e.currentTarget.style.color = "var(--text-primary)"}
              onMouseLeave={e => e.currentTarget.style.color = "var(--text-tertiary)"}>
              <Icon name="arrow-left" size={15} color="currentColor" /> Back to sign in
            </button>
            <div style={{ marginBottom: 28 }}>
              <div style={{ width: 52, height: 52, borderRadius: "var(--radius-xl)", background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.25)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <Icon name="key" size={24} color="var(--accent-500)" />
              </div>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6, letterSpacing: "-0.02em" }}>
                Forgot your password?
              </h1>
              <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
                Enter your email and we'll send a reset link right away.
              </p>
            </div>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <Input
                label="Email address" type="email" value={email}
                onChange={v => { setEmail(v); setError(""); }}
                placeholder="you@example.com" icon="mail" error={error}
                autoComplete="email" required
              />
              <Button type="submit" fullWidth size="lg" loading={loading}>
                <Icon name="mail" size={16} color="white" />
                Send reset link
              </Button>
            </form>
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "8px 0" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.25)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" style={{ strokeDasharray: 50, strokeDashoffset: 50, animation: "checkmark 0.4s ease-out 0.1s forwards" }} />
              </svg>
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", marginBottom: 10 }}>Check your inbox</h2>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 24 }}>
              We sent a password reset link to<br />
              <strong style={{ color: "var(--text-primary)" }}>{email}</strong>
            </p>
            <p style={{ fontSize: 12, color: "var(--text-tertiary)", marginBottom: 20 }}>
              Didn't receive it? Check your spam folder, or{" "}
              <Link onClick={() => { setSent(false); }}>try a different email</Link>.
            </p>
            <Button variant="ghost" fullWidth onClick={() => navigate("login")}>
              Back to sign in
            </Button>
          </div>
        )}
      </AuthCard>
    </AuthLayout>
  );
};

// ─── RESET PASSWORD PAGE ──────────────────────────────────────────────────────
const ResetPasswordPage = ({ navigate, token = "valid-token" }) => {
  const { resetPassword } = useAuth();
  const { addToast } = useToast();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!password) e.password = "Password is required.";
    else {
      const v = validatePassword(password);
      if (!v.length || !v.lower || !v.upper || !v.number) e.password = "Password doesn't meet all requirements.";
    }
    if (!confirm) e.confirm = "Please confirm your password.";
    else if (password !== confirm) e.confirm = "Passwords don't match.";
    return e;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      await resetPassword(token, password);
      setDone(true);
      addToast("Password updated successfully!", "success");
    } catch (err) {
      setErrors({ form: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <AuthCard>
        {!done ? (
          <>
            <div style={{ marginBottom: 28 }}>
              <div style={{ width: 52, height: 52, borderRadius: "var(--radius-xl)", background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.25)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <Icon name="shield" size={24} color="var(--accent-500)" />
              </div>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6, letterSpacing: "-0.02em" }}>
                Set a new password
              </h1>
              <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
                Make it strong — your memories are worth protecting.
              </p>
            </div>

            {errors.form && (
              <div style={{
                display: "flex", gap: 10, padding: "12px 14px",
                background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: "var(--radius-md)", marginBottom: 20,
              }}>
                <Icon name="alert-circle" size={16} color="var(--danger)" />
                <p style={{ fontSize: 13, color: "var(--danger)" }}>{errors.form}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <Input
                  label="New password" type="password" value={password}
                  onChange={v => { setPassword(v); setErrors(prev => ({ ...prev, password: null })); }}
                  placeholder="At least 8 characters" icon="lock" error={errors.password}
                  autoComplete="new-password" required
                />
                <PasswordStrengthBar password={password} />
              </div>
              <Input
                label="Confirm password" type="password" value={confirm}
                onChange={v => { setConfirm(v); setErrors(prev => ({ ...prev, confirm: null })); }}
                placeholder="Repeat your new password" icon="lock" error={errors.confirm}
                autoComplete="new-password" required
              />
              <Button type="submit" fullWidth size="lg" loading={loading} style={{ marginTop: 4 }}>
                <Icon name="shield" size={16} color="white" />
                Reset password
              </Button>
            </form>
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "8px 0" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.25)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" style={{ strokeDasharray: 50, strokeDashoffset: 50, animation: "checkmark 0.4s ease-out 0.1s forwards" }} />
              </svg>
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", marginBottom: 10 }}>Password updated!</h2>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 24 }}>
              Your password has been reset successfully.<br />Sign in with your new password.
            </p>
            <Button fullWidth size="lg" onClick={() => navigate("login")}>
              <Icon name="arrow-right" size={16} color="white" />
              Sign in now
            </Button>
          </div>
        )}
      </AuthCard>
    </AuthLayout>
  );
};

// ─── EMAIL VERIFICATION PAGE ──────────────────────────────────────────────────
const EmailVerificationPage = ({ navigate }) => {
  const { verifyEmail, user, logout } = useAuth();
  const { addToast } = useToast();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown > 0) {
      const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendCooldown]);

  const handleVerify = async () => {
    if (code.length !== 6) { setError("Enter the 6-digit code from your email."); return; }
    setError("");
    setLoading(true);
    try {
      await verifyEmail(code);
      addToast("Email verified! Welcome to MemoryVault ✨", "success");
      navigate("dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    await delay(1000);
    setResendLoading(false);
    setResendCooldown(60);
    addToast("Verification code resent!", "info");
  };

  return (
    <AuthLayout>
      <AuthCard>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ width: 64, height: 64, borderRadius: "var(--radius-xl)", background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", animation: "float 4s ease-in-out infinite" }}>
            <Icon name="mail" size={28} color="var(--accent-400)" />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8, letterSpacing: "-0.02em" }}>
            Check your email
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>
            We sent a 6-digit code to<br />
            <strong style={{ color: "var(--text-primary)" }}>{user?.email ?? "your email"}</strong>
          </p>
        </div>

        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 12, color: "var(--text-tertiary)", textAlign: "center", marginBottom: 16 }}>
            Enter the code below — it expires in 10 minutes
          </p>
          <OTPInput value={code} onChange={v => { setCode(v); setError(""); }} length={6} />
          {error && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 12, fontSize: 13, color: "var(--danger)", animation: "fadeIn 0.15s ease-out" }}>
              <Icon name="alert-circle" size={13} color="var(--danger)" />
              {error}
            </div>
          )}
          {/* Demo hint */}
          <p style={{ textAlign: "center", fontSize: 11, color: "var(--text-tertiary)", marginTop: 10 }}>
            Demo: enter <strong style={{ color: "var(--accent-400)", fontFamily: "monospace" }}>123456</strong> to verify
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Button fullWidth size="lg" onClick={handleVerify} loading={loading} disabled={code.length !== 6}>
            <Icon name="check-circle" size={16} color="white" />
            Verify email
          </Button>

          <div style={{ display: "flex", justifyContent: "center", gap: 4, fontSize: 13, color: "var(--text-secondary)" }}>
            Didn't get it?
            {resendCooldown > 0 ? (
              <span style={{ color: "var(--text-tertiary)" }}>Resend in {resendCooldown}s</span>
            ) : (
              <Link onClick={handleResend}>{resendLoading ? "Sending…" : "Resend code"}</Link>
            )}
          </div>
        </div>

        <Divider />
        <button
          onClick={() => { logout(); navigate("login"); }}
          style={{ width: "100%", background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: 0, transition: "color 150ms" }}
          onMouseEnter={e => e.currentTarget.style.color = "var(--text-secondary)"}
          onMouseLeave={e => e.currentTarget.style.color = "var(--text-tertiary)"}
        >
          <Icon name="log-out" size={14} color="currentColor" />
          Sign out and use a different account
        </button>
      </AuthCard>
    </AuthLayout>
  );
};

// ─── DASHBOARD PLACEHOLDER ────────────────────────────────────────────────────
const DashboardPlaceholder = ({ navigate }) => {
  const { user, logout } = useAuth();
  const { addToast } = useToast();

  const handleLogout = () => {
    logout();
    addToast("Signed out successfully.", "info");
    navigate("login");
  };

  return (
    <>
      <SessionBanner onLogout={handleLogout} />
      <div style={{
        minHeight: "100vh", background: "var(--bg-canvas)", display: "flex",
        alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 24,
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
            <Logo size={56} />
          </div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: "var(--radius-full)", marginBottom: 16 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--success)", animation: "pulse-glow 2s ease-in-out infinite" }} />
            <span style={{ fontSize: 12, color: "var(--success)", fontWeight: 500 }}>Authenticated</span>
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8, letterSpacing: "-0.03em" }}>
            Good to see you, <span style={{ background: "linear-gradient(90deg, #C4B5FD, #7C3AED)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{user?.name?.split(" ")[0]}</span> 👋
          </h1>
          <p style={{ fontSize: 15, color: "var(--text-secondary)" }}>
            Auth module complete — dashboard pages coming next.
          </p>
        </div>

        {/* Session info */}
        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", padding: "20px 28px", minWidth: 340 }}>
          <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-tertiary)", marginBottom: 14 }}>Session details</p>
          {[
            ["User ID", user?.id],
            ["Email", user?.email],
            ["Verified", user?.emailVerified ? "✓ Yes" : "✗ No"],
            ["Member since", new Date(user?.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })],
          ].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "6px 0", borderBottom: "1px solid var(--border-subtle)" }}>
              <span style={{ color: "var(--text-tertiary)" }}>{k}</span>
              <span style={{ color: "var(--text-primary)", fontFamily: k === "User ID" ? "monospace" : "inherit", fontSize: k === "User ID" ? 12 : 13 }}>{v}</span>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <Button variant="secondary" onClick={handleLogout}>
            <Icon name="log-out" size={15} color="currentColor" />
            Sign out
          </Button>
          <Button onClick={() => navigate("verify-email")}>
            <Icon name="mail" size={15} color="white" />
            Email Verification
          </Button>
        </div>

        {/* Auth flow navigation */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", maxWidth: 440 }}>
          {[
            { label: "Login", page: "login" },
            { label: "Register", page: "register" },
            { label: "Forgot PW", page: "forgot-password" },
            { label: "Reset PW", page: "reset-password" },
            { label: "Verify Email", page: "verify-email" },
          ].map(({ label, page }) => (
            <button key={page} onClick={() => navigate(page)} style={{
              background: "var(--bg-surface)", border: "1px solid var(--border-default)",
              borderRadius: "var(--radius-md)", padding: "6px 14px", cursor: "pointer",
              color: "var(--text-secondary)", fontSize: 12, fontFamily: "Inter, sans-serif",
              transition: "all 150ms",
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent-600)"; e.currentTarget.style.color = "var(--accent-400)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border-default)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// ROOT ROUTER
// ═══════════════════════════════════════════════════════════════════════════════
const Router = () => {
  const [page, setPage] = useState("login");
  const navigate = (p) => setPage(p);

  const pages = {
    login: <LoginPage navigate={navigate} />,
    register: <RegisterPage navigate={navigate} />,
    "forgot-password": <ForgotPasswordPage navigate={navigate} />,
    "reset-password": <ResetPasswordPage navigate={navigate} />,
    "verify-email": <EmailVerificationPage navigate={navigate} />,
    dashboard: (
      <ProtectedRoute navigate={navigate}>
        <DashboardPlaceholder navigate={navigate} />
      </ProtectedRoute>
    ),
  };

  return (
    <div key={page} className="page-fade">
      {pages[page] ?? pages.login}
    </div>
  );
};

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <>
      <GlobalStyle />
      <AuthProvider>
        <ToastProvider>
          <Router />
        </ToastProvider>
      </AuthProvider>
    </>
  );
}
