'use client';
import React, { useEffect, useState } from "react";
import { Moon, Sun, Download, RefreshCcw, Eye, EyeOff, Check, Copy, LogIn, LogOut, Save } from "lucide-react";
import * as XLSX from "xlsx";

const PROVIDERS = ["ChatGPT", "Gemini", "Stability AI"];

function clsx(...xs) { return xs.filter(Boolean).join(" "); }

export default function Page() {
  // Theme
  const [theme, setTheme] = useState(() => typeof window !== 'undefined' ? (localStorage.getItem("pep:theme") || "light") : "light");
  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem("pep:theme", theme);
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark"); else root.classList.remove("dark");
  }, [theme]);

  // Auth
  const [email, setEmail] = useState(typeof window !== 'undefined' ? (localStorage.getItem("pep:email") || "") : "");
  const [loginOpen, setLoginOpen] = useState(false);
  const isAuthed = Boolean(email);
  useEffect(() => { if (email && typeof window !== 'undefined') localStorage.setItem("pep:email", email); }, [email]);

  // API keys
  const [provider, setProvider] = useState(PROVIDERS[0]);
  const [apiKeyVisible, setApiKeyVisible] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [savePulse, setSavePulse] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem(`pep:key:${provider}`) || "";
    setApiKeyInput(stored);
  }, [provider]);
  function handleSaveKey() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`pep:key:${provider}`, apiKeyInput.trim());
    }
    toastPush({ type: "success", title: "API key saved", desc: `${provider} key stored locally.` });
    setSavePulse(true);
    setTimeout(() => setSavePulse(false), 800);
  }

  // Settings
  const [subject, setSubject] = useState("Characters and Scenes — ‘smiling pumpkins’");
  const [totalCount, setTotalCount] = useState(5);
  const [colorCount, setColorCount] = useState(3);
  const [styles, setStyles] = useState({
    minimalist: true,
    silhouette: false,
    flatColor: true,
    blackWhite: false,
    noGradient: true,
    withoutTypography: true,
  });
  function toggleStyle(k) { setStyles(s => ({ ...s, [k]: !s[k] })); }

  // Prompts
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Generate via API only
  async function generateNow() {
    if (!isAuthed) { toastPush({ type: "error", title: "Login required", desc: "Please login with a Gmail address first." }); return; }
    const key = localStorage.getItem(`pep:key:${provider}`) || "";
    if (!key) { toastPush({ type: "error", title: "API key missing", desc: `Please save a valid ${provider} API key first.` }); return; }

    setPrompts([]);
    setLoading(true);
    toastPush({ type: "neutral", title: "Generating…", desc: `Asking ${provider} to create ${totalCount} prompt(s)…` });
    try {
      const results = [];
      for (let i = 0; i < totalCount; i++) {
        const userPrompt = `Generate one highly detailed, creative, stock-ready icon/design prompt for the topic: ${subject}. 
Rules: ${Object.entries(styles).filter(([,v])=>v).map(([k])=>k).join(", ")}. 
Color count limit: ${colorCount}. 
The prompt should be tracing-friendly, vector-ready, unique, and describe composition, shapes, and elements clearly. No meta lines like numbering or char counts.`.trim();

        let output = "";
        if (provider === "ChatGPT") {
          const res = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
            body: JSON.stringify({ model: "gpt-4o-mini", messages: [{ role: "user", content: userPrompt }] }),
          });
          const data = await res.json();
          output = data?.choices?.[0]?.message?.content?.trim() || "";
        } else if (provider === "Gemini") {
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${key}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: userPrompt }] }] }),
          });
          const data = await res.json();
          output = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
        } else if (provider === "Stability AI") {
          const res = await fetch("https://api.stability.ai/v2beta/stable-image/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
            body: JSON.stringify({ prompt: userPrompt }),
          });
          const data = await res.json();
          output = data?.prompt || "";
        }
        results.push(output || "No response");
      }
      setPrompts(results);
      toastPush({ type: "success", title: "Prompts ready", desc: `${results.length} via ${provider}` });
    } catch (err) {
      console.error(err);
      toastPush({ type: "error", title: "API call failed", desc: "See console for details." });
    } finally {
      setLoading(false);
    }
  }

  function handleCopy(text) {
    navigator.clipboard.writeText(text);
    toastPush({ type: "success", title: "Copied", desc: "Prompt copied to clipboard." });
  }

  function downloadXLSX() {
    if (!prompts.length) { toastPush({ type: "error", title: "No prompts", desc: "Generate prompts before downloading." }); return; }
    const rows = prompts.map((p, i) => ({ ID: i + 1, Provider: provider, Subject: subject, Prompt: p }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Prompts");
    const file = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const url = URL.createObjectURL(new Blob([file], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
    const a = document.createElement("a");
    a.href = url; a.download = `prompt-engineer-pro_${Date.now()}.xlsx`; a.click();
    URL.revokeObjectURL(url);
  }

  function resetAll() {
    setSubject("Characters and Scenes — ‘smiling pumpkins’");
    setTotalCount(5);
    setColorCount(3);
    setStyles({ minimalist: true, silhouette: false, flatColor: true, blackWhite: false, noGradient: true, withoutTypography: true });
    setPrompts([]);
    toastPush({ type: "neutral", title: "Reset complete", desc: "Inputs cleared (API keys kept)." });
  }

  // Toasts
  const [toasts, setToasts] = useState([]);
  function toastPush(t) {
    const id = Math.random().toString(36).slice(2);
    setToasts(xs => [...xs, { id, ...t }]);
    setTimeout(() => setToasts(xs => xs.filter(x => x.id !== id)), 3000);
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      {/* Topbar */}
      <header className="sticky top-0 z-50 border-b border-zinc-200/70 dark:border-zinc-800/70 bg-white/80 dark:bg-zinc-900/80 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-3">
          <div className="flex items-center gap-2 text-xl font-semibold tracking-tight">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-bold">PE</span>
            <span>Prompt Engineer Pro</span>
          </div>

          <div className="ml-auto flex items-center gap-3">
            {/* Theme toggle */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              {theme === "dark" ? <Sun className="h-4 w-4"/> : <Moon className="h-4 w-4"/>}
              <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
            </button>

            {/* Gmail login */}
            {!isAuthed ? (
              <button
                onClick={() => setLoginOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white px-3 py-2 text-sm transition-colors"
              >
                <LogIn className="h-4 w-4"/> Gmail Login
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800">{email}</span>
                <button
                  onClick={() => { setEmail(""); setPrompts([]); toastPush({ type: "neutral", title: "Logged out", desc: "Session cleared." }); }}
                  className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <LogOut className="h-4 w-4"/> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Auth gate overlay */}
      {!isAuthed && (
        <div className="fixed inset-0 z-40 pointer-events-none flex items-start justify-center mt-24">
          <div className="pointer-events-auto rounded-2xl border border-yellow-300 bg-yellow-50 text-yellow-900 px-4 py-3 shadow-xl">
            Login required: click <span className="font-semibold">Gmail Login</span> in the top bar to unlock the dashboard.
          </div>
        </div>
      )}

      {/* Content */}
      <main className={clsx("mx-auto max-w-7xl px-4 py-6 grid gap-6", !isAuthed && "opacity-50 saturate-50 pointer-events-none select-none") }>
        {/* API Keys */}
        <section className="grid gap-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
          <h2 className="text-lg font-semibold">API Key Manager</h2>
          <div className="grid md:grid-cols-3 gap-3">
            <div className="grid gap-1.5">
              <label className="text-sm font-medium">Select AI Provider</label>
              <select
                className="rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
              >
                {PROVIDERS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-1.5 md:col-span-2">
              <label className="text-sm font-medium">API Key</label>
              <div className="flex items-center gap-2">
                <input
                  type={apiKeyVisible ? "text" : "password"}
                  className="flex-1 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm"
                  placeholder="Enter API key"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                />
                <button
                  onClick={() => setApiKeyVisible(v => !v)}
                  className="inline-flex items-center justify-center rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  {apiKeyVisible ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                </button>
                <button
                  onClick={handleSaveKey}
                  className={clsx(
                    "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-white transition-colors",
                    savePulse ? "bg-emerald-600" : "bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800"
                  )}
                >
                  <Save className="h-4 w-4"/> Save
                </button>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Keys are stored locally in your browser.</p>
            </div>
          </div>
        </section>

        {/* Prompt Settings */}
        <section className="grid gap-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
          <h2 className="text-lg font-semibold">Prompt Settings</h2>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <label className="text-sm font-medium">Topic</label>
              <input
                type="text"
                className="rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm"
                placeholder="Characters and Scenes — e.g., ‘smiling pumpkins’"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <label className="text-sm font-medium">Prompt Count</label>
              <input type="number" min={1} className="rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm" value={totalCount} onChange={(e)=>setTotalCount(Number(e.target.value))}/>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <label className="text-sm font-medium">Number of Colors</label>
              <input type="number" min={1} className="rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm" value={colorCount} onChange={(e)=>setColorCount(Number(e.target.value))}/>
            </div>
          </div>

          {/* Styles */}
          <div className="grid sm:grid-cols-3 gap-2 pt-2">
            {Object.entries(styles).map(([k,v]) => (
              <label key={k} className="flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 px-3 py-2 text-sm cursor-pointer select-none hover:bg-zinc-50 dark:hover:bg-zinc-800/60">
                <input type="checkbox" checked={v} onChange={() => toggleStyle(k)} className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-700"/>
                <span>{k}</span>
              </label>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button onClick={generateNow} disabled={loading} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white px-4 py-2 text-sm transition-colors disabled:opacity-70"><Check className="h-4 w-4"/>{loading ? "Generating…" : "Generate Prompts"}</button>
            <button onClick={downloadXLSX} className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"><Download className="h-4 w-4"/> Download Excel</button>
            <button onClick={resetAll} className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"><RefreshCcw className="h-4 w-4"/> Reset</button>
          </div>
        </section>

        {/* Preview */}
        <section className="grid gap-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Prompt Preview</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Live preview of generated prompts</p>
          </div>
          {prompts.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">No prompts yet. Configure settings and click <span className="font-medium">Generate Prompts</span>.</p>
          ) : (
            <div className="grid gap-3">
              {prompts.map((p, idx) => (
                <article key={idx} className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-semibold">Prompt #{idx + 1}</div>
                    <button onClick={() => handleCopy(p)} className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 dark:border-zinc-700 px-2 py-1 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800"><Copy className="h-3 w-3"/> Copy</button>
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{p}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-10 border-t border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto max-w-7xl px-4 py-6 flex flex-col sm:flex-row items-center gap-3 sm:gap-6">
          <div className="sm:mr-auto text-sm">
            <span className="font-medium">Contact:</span>{" "}
            <a className="underline hover:no-underline" href="https://www.facebook.com/anil.chandrabarman.3" target="_blank" rel="noreferrer">Facebook</a>{" • "}
            <a className="underline hover:no-underline" href="tel:01770735110">WhatsApp 01770735110</a>
          </div>
          <div className="sm:ml-auto text-sm">Developed By <span className="font-medium">Anil Chandra Barman</span></div>
        </div>
      </footer>

      {/* Login modal */}
      {loginOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-5">
            <h3 className="text-lg font-semibold mb-2">Gmail Login</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-3">Enter your Gmail address to unlock the dashboard.</p>
            <input
              type="email"
              placeholder="name@gmail.com"
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm"
              onKeyDown={(e) => { if (e.key === 'Enter') loginNow(); }}
              id="pep-login-email"
            />
            <div className="mt-4 flex items-center justify-end gap-2">
              <button onClick={() => setLoginOpen(false)} className="rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800">Cancel</button>
              <button onClick={loginNow} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white px-3 py-2 text-sm transition-colors"><LogIn className="h-4 w-4"/> Login</button>
            </div>
          </div>
        </div>
      )}

      {/* Toasts */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map(t => (
          <div key={t.id} className={clsx("rounded-xl px-4 py-2 shadow-lg border text-sm",
            t.type === 'success' && "bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-900/30 dark:border-emerald-700 dark:text-emerald-100",
            t.type === 'error' && "bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-900/30 dark:border-rose-700 dark:text-rose-100",
            t.type === 'neutral' && "bg-zinc-50 border-zinc-200 text-zinc-900 dark:bg-zinc-800/60 dark:border-zinc-700 dark:text-zinc-100",
          )}>
            <div className="font-medium">{t.title}</div>
            {t.desc && <div className="text-xs opacity-80">{t.desc}</div>}
          </div>
        ))}
      </div>
    </div>
  );

  function loginNow() {
    const input = document.getElementById("pep-login-email");
    const val = (input?.value || "").trim();
    const ok = /@gmail\.com$/i.test(val);
    if (!ok) { toastPush({ type: "error", title: "Invalid email", desc: "Please enter a valid Gmail address (…@gmail.com)." }); return; }
    setEmail(val);
    setLoginOpen(false);
    toastPush({ type: "success", title: "Welcome", desc: "Dashboard unlocked." });
  }
}
