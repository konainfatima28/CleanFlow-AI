// ────────────────────────────────────────────────────────────────────────────
// src/pages/Landing.tsx
// CleanFlow AI landing page — HUMANIZED & SEO OPTIMIZED PRODUCTION VERSION
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence, useInView } from "framer-motion"
import cleanflowLogo from "../assets/cleanflow.png"

// ─── Types ────────────────────────────────────────────────────────────────────
interface DataRow {
  id: number
  name: string
  email: string
  age: string
  country: string
  revenue: string
  status: "dirty" | "clean"
}

// ─── Animated hero data grid ──────────────────────────────────────────────────
const DIRTY_ROWS: DataRow[] = [
  { id: 1, name: "  alice johnson ",  email: "alice@",        age: "NaN",  country: "US",            revenue: "$1,200",  status: "dirty" },
  { id: 2, name: "BOB SMITH",         email: "bob@gmail.com",   age: "29",   country: "United States", revenue: "1200.00", status: "dirty" },
  { id: 3, name: "Carol White",       email: "",                age: "31",   country: "u.s.a",         revenue: "950",     status: "dirty" },
  { id: 4, name: "dave brown",        email: "dave@yahoo",      age: "999",  country: "USA",           revenue: "$950.5",  status: "dirty" },
  { id: 5, name: "Carol White",       email: "",                age: "31",   country: "u.s.a",         revenue: "950",     status: "dirty" },
]

const CLEAN_ROWS: DataRow[] = [
  { id: 1, name: "Alice Johnson",     email: "alice@email.com", age: "28",   country: "United States", revenue: "1200.00", status: "clean" },
  { id: 2, name: "Bob Smith",         email: "bob@gmail.com",   age: "29",   country: "United States", revenue: "1200.00", status: "clean" },
  { id: 3, name: "Carol White",       email: "carol@email.com", age: "31",   country: "United States", revenue: "950.00",  status: "clean" },
  { id: 4, name: "Dave Brown",        email: "dave@yahoo.com",  age: "45",   country: "United States", revenue: "950.50",  status: "clean" },
]

const COLS = ["Name", "Email", "Age", "Country", "Revenue"]

function CellValue({ value, dirty }: { value: string; dirty: boolean }) {
  const isEmpty = value === "" || value === "NaN"
  const isOutlier = value === "999" || value === "  alice johnson "

  if (dirty) {
    if (isEmpty) return (
      <span className="inline-flex items-center gap-1 text-red-400/80 text-[11px] font-mono">
        <span className="w-1.5 h-1.5 rounded-full bg-red-400/60" />
        null
      </span>
    )
    if (isOutlier) return (
      <span className="text-amber-400/90 text-[11px] font-mono bg-amber-400/10 px-1.5 py-0.5 rounded">
        {value}
      </span>
    )
    return <span className="text-[#64748b] text-[11px] font-mono">{value}</span>
  }

  return <span className="text-[#94a3b8] text-[11px] font-mono">{value}</span>
}

function HeroGrid() {
  const [phase, setPhase] = useState<"dirty" | "transitioning" | "clean">("dirty")
  const [cleanedCount, setCleanedCount] = useState(0)

  useEffect(() => {
    const cycle = async () => {
      setPhase("dirty")
      setCleanedCount(0)
      await delay(2200)
      setPhase("transitioning")
      for (let i = 1; i <= 4; i++) {
        await delay(320)
        setCleanedCount(i)
      }
      await delay(2000)
      setPhase("clean")
      await delay(1800)
    }
    const id = setInterval(cycle, 8500)
    cycle()
    return () => clearInterval(id)
  }, [])

  const rows = phase === "dirty" ? DIRTY_ROWS
    : phase === "transitioning"
      ? DIRTY_ROWS.map((r, i) => i < cleanedCount ? { ...CLEAN_ROWS[i], status: "clean" as const } : r).filter((_, i) => !(i >= 4 && cleanedCount >= 4))
      : CLEAN_ROWS

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-[#1e2130] bg-[#0d0f14] shadow-2xl shadow-black/60">
      
      {/* Toolbar chrome */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1e2130] bg-[#111318]">
        <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]/70 shrink-0" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]/70 shrink-0" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e]/70 shrink-0" />
        <span className="ml-2 sm:ml-3 text-[10px] sm:text-[11px] text-[#334155] font-mono truncate">
          customers.csv — 5 rows · 5 cols
        </span>
        <div className="ml-auto flex items-center gap-2 shrink-0">
          <AnimatePresence>
            {phase === "transitioning" && (
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-[11px] text-indigo-400 flex items-center gap-1.5"
              >
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                  className="inline-block w-2.5 h-2.5 border border-indigo-400 border-t-transparent rounded-full"
                />
                Cleaning…
              </motion.span>
            )}
            {phase === "clean" && (
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-[11px] text-green-400"
              >
                ✓ Clean
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Swipe Wrapper for Mobile Responsiveness */}
      <div className="w-full overflow-x-auto min-w-0 paths-scroll-touch">
        <div className="min-w-[540px] w-full">
          {/* Column headers */}
          <div className="grid grid-cols-5 px-4 py-2 border-b border-[#1e2130]">
            {COLS.map(c => (
              <span key={c} className="text-[10px] uppercase tracking-widest text-[#334155] font-semibold">
                {c}
              </span>
            ))}
          </div>

          {/* Rows */}
          <div className="divide-y divide-[#1e2130]/60 min-h-[180px]">
            <AnimatePresence mode="popLayout">
              {rows.map(row => (
                <motion.div
                  key={`${row.id}-${row.status}`}
                  layout
                  initial={{ opacity: 0, backgroundColor: "rgba(99,102,241,0.08)" }}
                  animate={{ opacity: 1, backgroundColor: "rgba(0,0,0,0)" }}
                  exit={{ opacity: 0, height: 0, overflow: "hidden" }}
                  transition={{ duration: 0.35 }}
                  className={`grid grid-cols-5 px-4 py-2.5 relative ${
                    row.status === "clean" && phase === "transitioning" ? "bg-green-500/[0.04]" : ""
                  }`}
                >
                  {[row.name, row.email, row.age, row.country, row.revenue].map((v, i) => (
                    <div key={i} className="pr-2 truncate">
                      <CellValue value={v} dirty={row.status === "dirty"} />
                    </div>
                  ))}
                  {row.status === "clean" && phase === "transitioning" && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400 text-[10px] font-medium"
                    >
                      ✓
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Stats footer */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 px-4 py-3 border-t border-[#1e2130] bg-[#0d0f14]">
        <AnimatePresence mode="wait">
          {phase === "dirty" && (
            <motion.div key="dirty-stats" exit={{ opacity: 0 }} className="flex flex-wrap gap-x-3 gap-y-1">
              <span className="text-[10px] text-red-400/70">3 missing values</span>
              <span className="text-[10px] text-amber-400/70">1 outlier</span>
              <span className="text-[10px] text-orange-400/70">1 duplicate</span>
            </motion.div>
          )}
          {phase !== "dirty" && (
            <motion.div key="clean-stats" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-wrap gap-x-3 gap-y-1">
              <span className="text-[10px] text-green-400/70">0 missing values</span>
              <span className="text-[10px] text-green-400/70">0 outliers</span>
              <span className="text-[10px] text-green-400/70">duplicates removed</span>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="sm:ml-auto flex items-center gap-1.5 mt-1 sm:mt-0">
          <span className="text-[10px] text-[#334155]">Quality score</span>
          <AnimatePresence mode="wait">
            {phase === "dirty"
              ? <motion.span key="low" exit={{ opacity: 0 }} className="text-[10px] font-bold text-red-400">42</motion.span>
              : <motion.span key="high" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px] font-bold text-green-400">96</motion.span>
            }
          </AnimatePresence>
          <span className="text-[10px] text-[#334155]">/ 100</span>
        </div>
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function delay(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}

function useReveal() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-60px" })
  return { ref, inView }
}

// ─── Inline icons ─────────────────────────────────────────────────────────────
const Icon = {
  Upload: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  ),
  Zap: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  Shield: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  Download: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  ),
  Chart: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  ),
  Check: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  ChevronDown: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  ),
  Arrow: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
}

// ─── Feature card ─────────────────────────────────────────────────────────────
function FeatureCard({
  icon, title, desc, delay = 0,
}: { icon: React.ReactNode; title: string; desc: string; delay?: number }) {
  const { ref, inView } = useReveal()
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, delay }}
      className="group p-5 rounded-2xl border border-[#1e2130] bg-[#111318] hover:border-indigo-500/25 hover:bg-[#14161e] transition-colors"
    >
      <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4 group-hover:bg-indigo-500/15 transition-colors">
        {icon}
      </div>
      <p className="text-[14px] font-semibold text-[#f1f5f9] mb-1.5">{title}</p>
      <p className="text-[13px] text-[#64748b] leading-relaxed">{desc}</p>
    </motion.div>
  )
}

// ─── FAQ item ─────────────────────────────────────────────────────────────────
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-[#1e2130] last:border-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between py-4 text-left gap-4"
      >
        <span className="text-[14px] font-medium text-[#cbd5e1]">{q}</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0 text-[#475569]"
        >
          <Icon.ChevronDown />
        </motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <p className="pb-4 text-[13px] text-[#64748b] leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Stat pill ────────────────────────────────────────────────────────────────
function StatPill({ value, label }: { value: string; label: string }) {
  const { ref, inView } = useReveal()
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.94 }}
      animate={inView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center gap-1"
    >
      <span className="text-2xl sm:text-4xl font-bold text-white tabular-nums">{value}</span>
      <span className="text-[10px] sm:text-[12px] text-[#64748b]">{label}</span>
    </motion.div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Landing() {
  const navigate = useNavigate()

  const features = [
    { icon: <Icon.Upload />, title: "Drop any file", desc: "Upload CSV or XLSX sheets up to 50 MB. Drag and drop or browse to let CleanFlow map your cells instantly." },
    { icon: <Icon.Zap />, title: "Instant profiling", desc: "Get an interactive data quality score dashboard tracking missing records, duplicate items, and outliers." },
    { icon: <Icon.Chart />, title: "One-click fixes", desc: "Review structural anomalies with ranked cleaning recommendations. Optimize files with a single click." },
    { icon: <Icon.Shield />, title: "Privacy first", desc: "Your datasets stay local. Everything is evaluated temporary inside in-memory pipelines and drops on exit." },
    { icon: <Icon.Download />, title: "Export anywhere", desc: "Download normalized data seamlessly as CSV, Excel, or JSON arrays alongside reproducible Python script logs." },
    { icon: <Icon.Chart />, title: "Visual analytics", desc: "Explore distribution shifts, value maps, matrix comparisons, and clean dataset profiles visually." },
  ]

  const faqs = [
    { q: "What file formats does CleanFlow AI support?", a: "CleanFlow fully handles CSV data files and Excel (XLSX) spreadsheets up to 50 MB. Support for structural JSON and Parquet datasets is arriving soon." },
    { q: "Is my data stored anywhere?", a: "Never. CleanFlow runs as a secure, local-first in-memory utility. Your spreadsheets never touch a hard disk or permanent database and disappear completely the moment you close the tab." },
    { q: "How does the quality score calculation work?", a: "The composite score balances structural completeness (40 points), column type consistency (30 points), and duplicate row extraction filters (30 points) to chart raw data health." },
    { q: "Can I track my historical cleaning steps?", a: "Yes. Every transformation rule you apply is tracked inside an interactive operation audit log panel, allowing you to review steps or build an equivalent script." },
    { q: "Do I need to know Python or Pandas data analysis?", a: "Not at all. The interface is built for anyone to use visually with simple point-and-click operations. If you are a developer, you can export a ready-to-run Pandas script anytime." },
  ]

  const navigateToDashboardView = (legalView: string) => {
    navigate(`/dashboard`, { state: { targetLegalView: legalView } })
  }

  return (
    <div className="min-h-screen bg-[#0a0b0f] text-[#f1f5f9] overflow-x-hidden" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 border-b border-[#1e2130]/80 bg-[#0a0b0f]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={cleanflowLogo} alt="CleanFlow AI Logo" className="w-6 h-6 object-contain shrink-0" />
            <span className="text-[14px] font-semibold text-white">CleanFlow AI</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#features" className="text-[13px] text-[#64748b] hover:text-white transition-colors hidden sm:block">Features</a>
            <a href="#faq" className="text-[13px] text-[#64748b] hover:text-white transition-colors hidden sm:block">FAQ</a>
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/dashboard")}
              className="px-3 py-1.5 sm:px-4 rounded-lg text-[12px] sm:text-[13px] font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
            >
              Open app
            </motion.button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-16 lg:pb-24 grid lg:grid-cols-2 gap-10 lg:grid-flow-row items-center">
        <div className="absolute top-0 left-1/4 w-72 sm:w-96 h-72 sm:h-96 rounded-full bg-indigo-600/8 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-48 sm:w-64 h-48 sm:h-64 rounded-full bg-violet-600/6 blur-3xl pointer-events-none" />

        {/* Left — copy */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-4 sm:space-y-6 relative text-center lg:text-left order-2 lg:order-1"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-500/25 bg-indigo-500/8">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            <span className="text-[11px] text-indigo-300 font-medium tracking-wide">AI-powered data cleaning</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-[1.1] tracking-tight">
            Datasets Made Simple: {" "}<span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">Upload. Clean. Analyze.</span>
          </h1>

          <p className="text-[14px] sm:text-[16px] text-[#94a3b8] leading-relaxed max-w-md mx-auto lg:mx-0">
            Fix your broken spreadsheets without wrestling with code layouts. CleanFlow AI identifies empty blocks, duplicate lines, anomalous format boundaries, and outliers instantly.
          </p>

          {/* CTA row */}
          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/dashboard")}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-[14px] font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-lg shadow-indigo-500/25"
            >
              Upload your dataset
              <Icon.Arrow />
            </motion.button>
            <span className="text-[12px] text-[#475569]">Free · no account needed</span>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap justify-center lg:justify-start gap-x-4 gap-y-2 pt-2">
            {["CSV & XLSX support", "100K+ row datasets", "Privacy first"].map(b => (
              <span key={b} className="flex items-center gap-1.5 text-[12px] text-[#475569]">
                <span className="text-green-400"><Icon.Check /></span>
                {b}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Right — live grid demo */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="relative order-1 lg:order-2 w-full min-w-0"
        >
          <HeroGrid />
          <div className="absolute -bottom-8 left-4 right-4 h-8 bg-gradient-to-b from-[#0a0b0f]/0 to-[#0a0b0f] pointer-events-none" />
        </motion.div>
      </section>

      {/* ── Stats strip ── */}
      <section className="border-y border-[#1e2130] bg-[#0d0f14] py-8 sm:py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 grid grid-cols-3 gap-4 sm:gap-8 text-center">
          <StatPill value="13+" label="cleaning operations" />
          <StatPill value="50 MB" label="max file size" />
          <StatPill value="100K+" label="rows supported" />
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 space-y-10 sm:space-y-12">
        <div className="text-center space-y-3">
          <p className="text-[11px] uppercase tracking-widest text-indigo-400 font-semibold">What CleanFlow does</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Fix structural dataset errors effortlessly</h2>
          <p className="text-[14px] sm:text-[15px] text-[#64748b] max-w-xl mx-auto">
            From mixed columns and duplicate entries to missing emails—CleanFlow highlights errors automatically and guides you through optimization routines smoothly.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <FeatureCard key={f.title} {...f} delay={i * 0.04} />
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="border-y border-[#1e2130] bg-[#0d0f14] py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-10 sm:space-y-12">
          <div className="text-center space-y-3">
            <p className="text-[11px] uppercase tracking-widest text-indigo-400 font-semibold">How it works</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Three steps to clean data</h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 sm:gap-6">
            {[
              { step: "1", title: "Upload Sheet", desc: "Drop your CSV or Excel file right in. CleanFlow processes the fields instantly with zero lag." },
              { step: "2", title: "Review Suggestions", desc: "Check your quality map score, duplicate rows, missing entries, and outlier balances instantly." },
              { step: "3", title: "Export Clean Data", desc: "Apply individual recommendations or fix everything at once. Export clean results back out." },
            ].map(({ step, title, desc }, i) => {
              const { ref, inView } = useReveal()
              return (
                <motion.div
                  key={step} ref={ref}
                  initial={{ opacity: 0, y: 12 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: i * 0.08 }}
                  className="relative p-5 rounded-2xl border border-[#1e2130] bg-[#111318]"
                >
                  <span className="text-4xl sm:text-5xl font-black text-[#1e2130] absolute top-4 right-5 select-none tabular-nums leading-none">
                    {step}
                  </span>
                  <p className="text-[15px] font-semibold text-white mb-2">{title}</p>
                  <p className="text-[13px] text-[#64748b] leading-relaxed">{desc}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── RICH CONTENT ADSENSE VALUE BLOCK (Provides Humanized, Keyword-Rich Explanations) ─── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16 grid grid-cols-1 md:grid-cols-2 gap-12 border-t border-[#1e2130]/60">
        <div className="space-y-4">
          <h3 className="text-xs font-bold tracking-widest uppercase text-indigo-400">
            How CleanFlow Handles Outliers & Metrics
          </h3>
          <p className="text-[13px] text-[#64748b] leading-relaxed">
            CleanFlow evaluates data quality across three specific areas: completeness mapping, type validation, and row duplication. For continuous numeric parameters, it utilizes an intuitive Interquartile Range evaluation ($IQR = Q_3 - Q_1$) to automatically detect outliers. Any point falling outside the standard boundaries of $[Q_1 - 1.5 \times IQR, Q_3 + 1.5 \times IQR]$ gets flagged instantly, giving you a clear window into dataset anomalies before they cause issues down the road.
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-bold tracking-widest uppercase text-teal-400">
            A Safe, In-Memory Solution Built For Users
          </h3>
          <p className="text-[13px] text-[#64748b] leading-relaxed">
            Most online spreadsheet converters require you to risk your privacy by saving documents onto persistent databases. CleanFlow was designed to fix that problem using a fully secure standalone, stateless execution model. All tabular matrices and rows process temporarily within browser session memory contexts. Your proprietary cells, missing entry text profiles, and numeric distributions clear instantly upon tab exit, providing top-tier data security.
          </p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="max-w-2xl mx-auto px-4 sm:px-6 py-16 sm:py-24 space-y-8 sm:space-y-10">
        <div className="text-center space-y-3">
          <p className="text-[11px] uppercase tracking-widest text-indigo-400 font-semibold">FAQ</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Common questions</h2>
        </div>
        <div className="rounded-2xl border border-[#1e2130] bg-[#111318] px-4 sm:px-6">
          {faqs.map(f => <FaqItem key={f.q} {...f} />)}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/8 to-violet-500/5 p-8 sm:p-12 text-center overflow-hidden"
        >
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-48 sm:w-64 h-48 sm:h-64 rounded-full bg-indigo-600/10 blur-3xl" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 relative">Ready to clean your data?</h2>
          <p className="text-[14px] sm:text-[15px] text-[#64748b] mb-6 sm:mb-8 relative">
            Drop in a file and get a full quality report in under 10 seconds.
          </p>
          <motion.button
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/dashboard")}
            className="relative w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-[15px] font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-xl shadow-indigo-500/30"
          >
            Upload a dataset
            <Icon.Arrow />
          </motion.button>
        </motion.div>
      </section>

      {/* ── Fully Compliant Footer Anchor Row ── */}
      <footer className="border-t border-[#1e2130] py-8 bg-[#0d0f14]/40 text-center sm:text-left">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={cleanflowLogo} alt="CleanFlow AI Logo" className="w-5 h-5 object-contain shrink-0" />
            <span className="text-[13px] text-[#475569]">CleanFlow AI</span>
          </div>
          <p className="text-[11px] sm:text-[12px] text-[#334155] max-w-xs sm:max-w-none">
            Built with React · FastAPI · Pandas · Free, secure data cleaning for everyone
          </p>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-[11px] sm:text-[12px] text-[#475569] font-medium">
            <button onClick={() => navigateToDashboardView("about")} className="hover:text-indigo-400 transition-colors focus:outline-none">About Us</button>
            <span>·</span>
            <button onClick={() => navigateToDashboardView("privacy")} className="hover:text-indigo-400 transition-colors focus:outline-none">Privacy Policy</button>
            <span>·</span>
            <button onClick={() => navigateToDashboardView("terms")} className="hover:text-indigo-400 transition-colors focus:outline-none">Terms of Service</button>
            <span>·</span>
            <button onClick={() => navigateToDashboardView("contact")} className="hover:text-indigo-400 transition-colors focus:outline-none">Contact Us</button>
          </div>
        </div>
      </footer>
    </div>
  )
}
