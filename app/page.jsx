'use client';
import React, { useEffect, useMemo, useState } from "react";
import { Moon, Sun, Download, RefreshCcw, Eye, EyeOff, Check, Copy, LogIn, LogOut, Save } from "lucide-react";
import * as XLSX from "xlsx";

// ---------- Helpers ----------
const PROVIDERS = [
  "Gemini",
  "ChatGPT",
  "Bing AI",
  "Leonardo",
  "DALL·E (OpenAI)",
  "Gemini Banana",
  "Stability AI",
];

const HIDDEN_TEXT_1 = `Within the site (invisible): "For this topic, write (N) prompts to produce (N) distinct and unique icon designs — one prompt per design (1:1)."`;
const HIDDEN_TEXT_2 = `Within the site (invisible): "Detailed prompts with more than (N) characters."`;
const HIDDEN_TEXT_3 = `Within the site (invisible): "Enhance design value by adding suitable elements so the design looks more attractive. Ensure stock-site readiness (Adobe Stock, Shutterstock, etc.) and avoid resemblance to existing content with careful prompt crafting."`;
const ALWAYS_INCLUDE_FLAGS = [
  "Tracing-friendly",
  "Unique",
  "White background",
  "Vector concept",
  "Easily customizable",
  "High resolution suitable for print-on-demand",
  "Card-compatible",
  "Template-ready",
  "Mug-ready",
  "T-shirt-ready",
  "Sticker-ready",
  "CNC cutting friendly",
];

// Bundle presets for artboard and grid
const BUNDLE_PRESETS = {
  4: { ratio: "1:1", size: [3440, 3440], grid: [2, 2] },
  6: { ratio: "3:2", size: [5120, 3440], grid: [3, 2] },
  9: { ratio: "1:1", size: [5120, 5120], grid: [3, 3] },
  12: { ratio: "3:2", size: [6800, 4533], grid: [3, 4] },
};

const seedPhrases = {
  angles: [
    "front view",
    "isometric angle",
    "45° tilt",
    "top-down perspective",
    "side profile",
    "three-quarter view",
    "close-up composition",
    "wide framing",
    "centered composition",
    "rule-of-thirds layout",
  ],
  elements: [
    "small stars",
    "clean sparkles",
    "subtle confetti",
    "simple leaves",
    "tiny snow dots",
    "minimal geometric frames",
    "thin motion lines",
    "simple ribbons",
    "small shadow base (flat)",
    "rounded sticker outline",
  ],
  actions: [
    "static emblem",
    "playful tilt",
    "stacked arrangement",
    "pairing with tiny props",
    "pattern tile variant",
    "badge-like variant",
    "outline-then-fill variant",
    "duo composition",
    "grid-friendly motif",
    "monoline contour emphasis",
  ],
};

function clsx(...xs) { return xs.filter(Boolean).join(" "); }

// ---------- Main Component ----------
export default function Page() {
  // THEME
  const [theme, setTheme] = useState(() => typeof window !== 'undefined' ? (localStorage.getItem("pep:theme") || "light") : "light");
  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem("pep:theme", theme);
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark"); else root.classList.remove("dark");
  }, [theme]);

  // AUTH
  const [email, setEmail] = useState(typeof window !== 'undefined' ? (localStorage.getItem("pep:email") || "") : "");
  const [loginOpen, setLoginOpen] = useState(false);
  const isAuthed = Boolean(email);
  useEffect(() => { if (email && typeof window !== 'undefined') localStorage.setItem("pep:email", email); }, [email]);

  // API KEYS (per provider)
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

  // SUBJECT / CONTROLS
  const [subject, setSubject] = useState("Characters and Scenes — ‘smiling pumpkins’");
  const [totalCount, setTotalCount] = useState(10);
  const [promptLength, setPromptLength] = useState(500);
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

  // Bundle Image Create
  const [bundleEnabled, setBundleEnabled] = useState(false);
  const [bundleCount, setBundleCount] = useState(4);
  const bundleSpec = useMemo(() => BUNDLE_PRESETS[bundleCount] || BUNDLE_PRESETS[4], [bundleCount]);

  // PROMPTS
  const [prompts, setPrompts] = useState([]);

  function buildOnePrompt(i) {
    const angle = seedPhrases.angles[i % seedPhrases.angles.length];
    const elem = seedPhrases.elements[(i * 3) % seedPhrases.elements.length];
    const act = seedPhrases.actions[(i * 7) % seedPhrases.actions.length];

    const styleBits = [];
    if (styles.minimalist) styleBits.push("minimalist");
    if (styles.silhouette) styleBits.push("silhouette");
    if (styles.flatColor) styleBits.push("flat color");
    if (styles.blackWhite) styleBits.push("black and white");
    if (styles.noGradient) styleBits.push("no gradients or effects");
    if (styles.withoutTypography) styleBits.push("without typography");

    const lines = [
      `Create exactly 1 stock-ready icon design about: ${subject}. `,
      `Variant angle/action/elements: ${angle}; ${act}; add ${elem}.`,
      `Style: ${styleBits.length ? styleBits.join(", ") : "clean"}.`,
      `Background: white. Composition must be clear and tracing-friendly.`,
      `Format: pure vector shapes, flat fills, crisp edges; scalable and easily customizable.`,
      `Licensing safety: avoid resemblance to popular assets; keep composition uniquely yours.`,
      `Usage targets: ${ALWAYS_INCLUDE_FLAGS.join(", ")}.`,
      colorCount ? `Color rule: use at most ${colorCount} flat colors.` : null,
      styles.blackWhite ? `If black and white is selected, keep fills pure black on white with clean negative space.` : null,
      styles.silhouette ? `If silhouette is selected, emphasize clear outer contours and balanced negative space.` : null,
      styles.flatColor ? `If flat color is selected, use solid fills only; no shadows, no gradients, no glow.` : null,
      `Deliver icons suitable for grids and consistent line/shape language.`,
      // `Minimum description length target: ~${promptLength}+ characters.`,
    ].filter(Boolean);

    if (bundleEnabled) {
      const [w, h] = bundleSpec.size;
      const [gr, gc] = bundleSpec.grid;
      lines.push(
        `Bundle image creation mode: ENABLED. Create a single artboard sized ${w} × ${h} px (${bundleSpec.ratio}).`,
        `Arrange ${bundleCount} icons in a ${gr} × ${gc} grid with even padding and equal gutters; align precisely to avoid overlaps.`,
        `Keep each icon self-contained with consistent margins so the whole bundle exports cleanly. Respect all selected styles and constraints above.`,
      );
    }

    const expanders = [
      "Keep edges stroke-aligned or shape-merged to avoid hairline artifacts when scaling.",
      "Prefer symmetric spacing; align motifs to pixel grid for crisp export.",
      "Elements should remain legible at small sizes (128–256 px).",
      "Reserve clean negative space around the subject for sticker or badge outlines.",
      "Avoid clip-art clichés; vary silhouette, framing, and micro-details across designs.",
    ];

    let body = lines.join(" ");
    let j = 0;
    while (body.length < promptLength) {
      body += " " + expanders[j % expanders.length];
      j++;
    }
    return body.trim();
  }

  function generateNow() {
    if (!isAuthed) { toastPush({ type: "error", title: "Login required", desc: "Please login with a Gmail address first." }); return; }
    const out = Array.from({ length: Number(totalCount) }, (_, i) => buildOnePrompt(i));
    setPrompts(out);
    toastPush({ type: "neutral", title: "Preview updated", desc: `${out.length} prompts generated.` });
  }

  function handleCopy(text) {
    navigator.clipboard.writeText(text);
    toastPush({ type: "success", title: "Copied", desc: "Prompt copied to clipboard." });
  }

  function downloadXLSX() {
    if (!prompts.length) { toastPush({ type: "error", title: "No prompts", desc: "Generate prompts before downloading." }); return; }
    const rows = prompts.map((p, idx) => ({
      ID: idx + 1,
      Subject: subject,
      Provider: provider,
      "Total in Set (1:1)": totalCount,
      "Prompt Length Target": promptLength,
      Styles: Object.entries(styles).filter(([,v]) => v).map(([k]) => k).join(", "),
      "Color Count": colorCount,
      "Bundle Enabled": bundleEnabled ? "Yes" : "No",
      ...(bundleEnabled ? {
        "Bundle Count": bundleCount,
        "Artboard": `${bundleSpec.size[0]}x${bundleSpec.size[1]} (${bundleSpec.ratio})`,
        "Grid": `${bundleSpec.grid[0]}x${bundleSpec.grid[1]}`,
      } : {}),
      Prompt: p,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Prompts");
    const file = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const url = URL.createObjectURL(new Blob([file], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `prompt-engineer-pro_${Date.now()}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function resetAll() {
    setSubject("Characters and Scenes — ‘smiling pumpkins’");
    setTotalCount(10);
    setPromptLength(500);
    setColorCount(3);
    setStyles({ minimalist: true, silhouette: false, flatColor: true, blackWhite: false, noGradient: true, withoutTypography: true });
    setBundleEnabled(false);
    setBundleCount(4);
    setPrompts([]);
    toastPush({ type: "neutral", title: "Reset complete", desc: "Inputs cleared. API keys & login kept." });
  }

  // ---------- Tiny Toast System ----------
  const [toasts, setToasts] = useState([]);
  function toastPush(t) {
    const id = Math.random().toString(36).slice(2);
    setToasts((xs) => [...xs, { id, ...t }]);
    setTimeout(() => setToasts((xs) => xs.filter((x) => x.id !== id)), 3000);
  }

  // ---------- UI ----------
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
              aria-label="Toggle theme"
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

            {/* Developed By box */}
            <div className="ml-2 px-3 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs leading-tight">
              <div className="font-medium">Developed By</div>
              <div>Anil Chandra Barman</div>
            </div>
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
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">API Key Manager</h2>
          </div>
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
                  title={apiKeyVisible ? "Hide" : "View"}
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
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Keys are stored locally in your browser. A notification confirms saving.</p>
            </div>
          </div>
        </section>

        {/* Subject & counts */}
        <section className="grid gap-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
          <h2 className="text-lg font-semibold">Prompt Settings</h2>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <label className="text-sm font-medium">Characters & Scenes (topic)</label>
              <input
                type="text"
                className="rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm"
                placeholder="Characters and Scenes — e.g., ‘smiling pumpkins’"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <label className="text-sm font-medium">Designs / Prompts (1:1)</label>
              <input type="number" min={1} className="rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm" value={totalCount} onChange={(e)=>setTotalCount(Number(e.target.value))}/>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-3">
            <div className="grid gap-1.5">
              <label className="text-sm font-medium">Minimum Characters per Prompt</label>
              <input type="number" min={100} className="rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm" value={promptLength} onChange={(e)=>setPromptLength(Number(e.target.value))}/>
            </div>
            <div className="grid gap-1.5">
              <label className="text-sm font-medium">Number of Colors</label>
              <input type="number" min={1} className="rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm" value={colorCount} onChange={(e)=>setColorCount(Number(e.target.value))}/>
            </div>
          </div>

          {/* Style checkboxes 1–6 */}
          <div className="grid sm:grid-cols-3 gap-2 pt-2">
            <CheckboxRow label="Minimalist" checked={styles.minimalist} onChange={() => toggleStyle("minimalist")} />
            <CheckboxRow label="Silhouette" checked={styles.silhouette} onChange={() => toggleStyle("silhouette")} />
            <CheckboxRow label="Flat Color" checked={styles.flatColor} onChange={() => toggleStyle("flatColor")} />
            <CheckboxRow label="Black and White" checked={styles.blackWhite} onChange={() => toggleStyle("blackWhite")} />
            <CheckboxRow label="No gradients or effects" checked={styles.noGradient} onChange={() => toggleStyle("noGradient")} />
            <CheckboxRow label="Without typography" checked={styles.withoutTypography} onChange={() => toggleStyle("withoutTypography")} />
          </div>

          {/* Bundle Image Create section */}
          <div className="mt-4 grid gap-2 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 p-3">
            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex items-center gap-2 text-sm select-none cursor-pointer">
                <input type="checkbox" className="h-4 w-4" checked={bundleEnabled} onChange={(e)=>setBundleEnabled(e.target.checked)} />
                <span className="font-medium">Bundle Image Create</span>
              </label>

              <div className="flex items-center gap-2">
                <span className="text-sm">Bundle Count</span>
                <select
                  disabled={!bundleEnabled}
                  className={clsx("rounded-xl border bg-transparent px-3 py-2 text-sm", bundleEnabled ? "border-zinc-300 dark:border-zinc-700" : "border-zinc-200 dark:border-zinc-800 opacity-60")}
                  value={bundleCount}
                  onChange={(e)=>setBundleCount(Number(e.target.value))}
                >
                  {[4,6,9,12].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>

              {bundleEnabled && (
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-2 py-1">Artboard: {bundleSpec.size[0]}×{bundleSpec.size[1]} px ({bundleSpec.ratio})</span>
                  <span className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-2 py-1">Grid: {bundleSpec.grid[0]}×{bundleSpec.grid[1]}</span>
                  <span className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-2 py-1">Auto-arrange: rows × columns</span>
                </div>
              )}
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">When enabled, prompts include bundle-ready instructions. Layout follows 2×2 (4), 3×2 (6), 3×3 (9), 3×4 (12) with the specified artboard sizes.</p>
          </div>

          {/* Hidden instructional text blocks */}
          <div className="sr-only" aria-hidden>
            <p>{HIDDEN_TEXT_1}</p>
            <p>{HIDDEN_TEXT_2}</p>
            <p>{HIDDEN_TEXT_3}</p>
            <ul>
              {ALWAYS_INCLUDE_FLAGS.map(x => <li key={x}>{x}</li>)}
            </ul>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button onClick={generateNow} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white px-4 py-2 text-sm transition-colors"><Check className="h-4 w-4"/> Generate Prompts</button>
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

function CheckboxRow({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 px-3 py-2 text-sm cursor-pointer select-none hover:bg-zinc-50 dark:hover:bg-zinc-800/60">
      <input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-700"/>
      <span>{label}</span>
    </label>
  );
}
