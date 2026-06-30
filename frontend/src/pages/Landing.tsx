// ────────────────────────────────────────────────────────────────────────────
// src/pages/Landing.tsx
// Data Pilot Landing Page — EXPERT MINIMALIST PRODUCTION VERSION
// ────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence, useInView } from "framer-motion"
import datapilotLogo from "../assets/cleanflow.png"

interface DataRow {
  id: number
  name: string
  email: string
  age: string
  country: string
  revenue: string
  status: "dirty" | "clean"
}

const DIRTY_ROWS: DataRow[] = [
  { id: 1, name: "  alice johnson ",  email: "alice@",        age: "NaN",  country: "US",            revenue: "$1,200",  status: "dirty" },
  { id: 2, name: "BOB SMITH",         email: "bob@gmail.com",   age: "29",   country: "United States", revenue: "1200.00", status: "dirty" },
  { id: 3, name: "Carol White",       email: "",                age: "31",   country: "u.s.a",         revenue: "950",      status: "dirty" },
  { id: 4, name: "dave brown",        email: "dave@yahoo",      age: "999",  country: "USA",           revenue: "$950.5",  status: "dirty" },
  { id: 5, name: "Carol White",       email: "",                age: "31",   country: "u.s.a",         revenue: "950",      status: "dirty" },
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
    return <span className="text-gray-500 text-[11px] font-mono">{value}</span>
  }
  return <span className="text-gray-400 text-[11px] font-mono">{value}</span>
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

  const rows = phase === "dirty" 
    ? DIRTY_ROWS 
    : phase === "transitioning"
      ? DIRTY_ROWS.map((r, i) => i < cleanedCount ? { ...CLEAN_ROWS[i], status: "clean" as const } : r).filter((_, i) => !(i >= 4 && cleanedCount >= 4))
      : CLEAN_ROWS

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-[#1e2130] bg-[#0d0f14] shadow-2xl shadow-black/60">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1e2130] bg-[#111318]">
        <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]/70 shrink-0" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]/70 shrink-0" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e]/70 shrink-0" />
        <span className="ml-2 text-[11px] text-gray-500 font-mono truncate">
          customers.csv — {rows.length} rows · 5 cols
        </span>
        <div className="ml-auto flex items-center gap-2 shrink-0">
          <AnimatePresence mode="wait">
            {phase === "transitioning" && (
              <motion.span
                key="cleaning-badge"
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
                Processing…
              </motion.span>
            )}
            {phase === "clean" && (
              <motion.span key="clean-badge" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="text-[11px] text-green-400">
                ✓ Optimized
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="w-full overflow-x-auto min-w-0">
        <div className="min-w-[540px] w-full">
          <div className="grid grid-cols-5 px-4 py-2 border-b border-[#1e2130]">
            {COLS.map(c => (
              <span key={c} className="text-[10px] uppercase tracking-widest text-gray-600 font-semibold">
                {c}
              </span>
            ))}
          </div>

          <div className="divide-y divide-[#1e2130]/60 h-[195px] relative bg-transparent">
            <AnimatePresence mode="popLayout" initial={false}>
              {rows.map((row, idx) => (
                <motion.div
                  key={`row-${row.id}-status-${row.status}-${idx}`}
                  layout="position"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  className={`grid grid-cols-5 px-4 py-2.5 relative items-center h-[38px] ${
                    row.status === "clean" && phase === "transitioning" ? "bg-green-500/[0.03]" : ""
                  }`}
                >
                  {[row.name, row.email, row.age, row.country, row.revenue].map((v, i) => (
                    <div key={i} className="pr-2 truncate">
                      <CellValue value={v} dirty={row.status === "dirty"} />
                    </div>
                  ))}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 px-4 py-3 border-t border-[#1e2130] bg-[#0d0f14]">
        <AnimatePresence mode="wait">
          {phase === "dirty" ? (
            <motion.div key="d" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex gap-3 text-[10px]">
              <span className="text-red-400/70">3 missing cells</span>
              <span className="text-amber-400/70">1 structural outlier</span>
            </motion.div>
          ) : (
            <motion.div key="c" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex gap-3 text-[10px] text-green-400/70">
              <span>0 data errors detected</span>
              <span>Dimensions aligned</span>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="ml-auto flex items-center gap-1">
          <span className="text-[10px] text-gray-600">Model Readiness</span>
          <AnimatePresence mode="wait">
            {phase === "dirty" 
              ? <motion.span key="l" className="text-[10px] font-bold text-red-400">42%</motion.span>
              : <motion.span key="h" className="text-[10px] font-bold text-green-400">98%</motion.span>
            }
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

function delay(ms: number) { return new Promise(r => setTimeout(r, ms)) }

function useReveal() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-60px" })
  return { ref, inView }
}

const Icon = {
  Upload: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  Zap: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  Shield: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Download: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  Chart: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>,
  Check: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
  ChevronDown: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>,
  Arrow: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
}

function FeatureCard({ icon, title, desc, delay = 0 }: { icon: React.ReactNode; title: string; desc: string; delay?: number }) {
  const { ref, inView } = useReveal()
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.4, delay }} className="p-5 rounded-2xl border border-[#1e2130] bg-[#111318] hover:border-indigo-500/25 transition-colors">
      <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4">{icon}</div>
      <p className="text-[14px] font-semibold text-gray-200 mb-1.5">{title}</p>
      <p className="text-[13px] text-gray-500 leading-relaxed">{desc}</p>
    </motion.div>
  )
}

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#0a0b0f] text-gray-200 overflow-x-hidden" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-[#1e2130]/80 bg-[#0a0b0f]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={datapilotLogo} alt="Data Pilot Logo" className="w-6 h-6 object-contain shrink-0" />
            <span className="text-[14px] font-bold tracking-tight text-white">Data Pilot</span>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/dashboard")}
            className="px-4 py-1.5 rounded-lg text-[13px] font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
          >
            Launch Console
          </motion.button>
        </div>
      </nav>

      {/* Hero Content Section */}
      <section className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-16 lg:pb-24 grid lg:grid-cols-2 gap-12 items-center">
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-indigo-600/5 blur-3xl pointer-events-none" />
        
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/5">
            <span className="text-[11px] text-indigo-300 font-medium tracking-wide uppercase">Automated Data Preparation</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
            Transform messy data into{' '}
            <span className="text-indigo-400 font-extrabold">
              production readiness.
            </span>
          </h1>

          <p className="text-[14px] sm:text-[16px] text-gray-400 leading-relaxed max-w-md mx-auto lg:mx-0">
            Ingest large matrices, parse structured quality summaries, and execute data transformation steps instantaneously without writing code.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/dashboard")}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-[14px] font-semibold bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
            >
              Analyze Your Dataset
              <Icon.Arrow />
            </motion.button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="relative w-full min-w-0">
          <HeroGrid />
        </motion.div>
      </section>

      {/* Core Feature Matrix */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <FeatureCard icon={<Icon.Upload />} title="Streaming File Ingestion" desc="Processes large CSV and Excel matrix frames up to 100K+ lines seamlessly." />
        <FeatureCard icon={<Icon.Zap />} title="Automated Quality Profiling" desc="Computes missing distribution maps and structural anomaly flags dynamically." />
        <FeatureCard icon={<Icon.Chart />} title="Deterministic Fix Dispatch" desc="Review anomalies and apply targeted correction recipes with a single action." />
        <FeatureCard icon={<Icon.Shield />} title="In-Memory Isolation" desc="Strict privacy design ensures datasets are cleaned inside sandbox sessions." />
        <FeatureCard icon={<Icon.Download />} title="Pandas Script Export" desc="Generates clean, reproducible Python data transformation tracking blocks." />
        <FeatureCard icon={<Icon.Chart />} title="Visual Feature Matrix" desc="Inspect correlation arrays and value trends before and after processing." />
      </section>
    </div>
  )
}
