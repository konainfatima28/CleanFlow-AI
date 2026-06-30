// ────────────────────────────────────────────────────────────────────────────
// src/pages/Dashboard.tsx — DATA PILOT RESPONSIVE PRODUCTION VERSION
// ────────────────────────────────────────────────────────────────────────────

import { useState } from "react"
import { Menu, X, Info } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import FileUploader   from "../components/FileUploader"
import ProfilePanel   from "../components/ProfilePanel"
import CleaningPanel  from "../components/CleaningPanel"
import AnalyticsPanel from "../components/AnalyticsPanel"
import ExportPanel    from "../components/ExportPanel"
import datapilotLogo  from "../assets/cleanflow.png" 
import { uploadFile, getProfile } from "../services/api"

type View = "upload" | "profile" | "cleaning" | "analytics" | "export"

interface Diff {
  original_rows: number;    cleaned_rows: number;    rows_removed: number
  original_columns: number; cleaned_columns: number; columns_removed: number
  original_missing: number; cleaned_missing: number; missing_fixed: number
  original_memory_kb: number; cleaned_memory_kb: number
}

const NAV_ITEMS: {
  key: View
  label: string
  icon: string
  alwaysOn: boolean
  needsCleaned?: boolean
}[] = [
  { key: "upload",    label: "Upload Matrix", icon: "↑", alwaysOn: true },
  { key: "profile",   label: "Data Profile",  icon: "≡", alwaysOn: false },
  { key: "cleaning",  label: "Pilot Clean",   icon: "✦", alwaysOn: false },
  { key: "analytics", label: "Analytics",     icon: "◈", alwaysOn: false },
  { key: "export",    label: "Export Core",   icon: "↓", alwaysOn: false, needsCleaned: true },
]

export default function Dashboard() {
  const [view, setView]               = useState<View>("upload")
  const [sessionId, setSessionId]     = useState<string | null>(null)
  const [cleanedId, setCleanedId]     = useState<string | null>(null)
  const [profile, setProfile]         = useState<any>(null)
  const [loading, setLoading]         = useState(false)
  const [uploadError, setUploadError] = useState("")
  const [filename, setFilename]       = useState("dataset.csv")
  const [operations, setOperations]   = useState<object[]>([])
  const [log, setLog]                 = useState<object[]>([])
  const [celebrate, setCelebrate]     = useState(false)
  const [mobileMenu, setMobileMenu]   = useState(false)
  const [isLargeDataset, setIsLargeDataset] = useState(false)

  const handleUpload = async (file: File) => {
    setLoading(true)
    setUploadError("")
    setCleanedId(null)
    setOperations([])
    setLog([])
    setFilename(file.name)
    
    if (file.size > 40 * 1024 * 1024) {
      setIsLargeDataset(true)
    } else {
      setIsLargeDataset(false)
    }

    try {
      const { data: up }   = await uploadFile(file)
      setSessionId(up.session_id)
      const { data: prof } = await getProfile(up.session_id)
      setProfile(prof)
      setView("profile")
    } catch (e: any) {
      setUploadError(e?.response?.data?.detail ?? "Upload connection failed. Check your network or size parameters.")
    } finally {
      setLoading(false)
    }
  }

  const handleCleanComplete = (
    cid: string,
    _diff: Diff,
    appliedOps: object[],
    appliedLog: object[],
  ) => {
    setCleanedId(cid)
    setOperations(appliedOps)
    setLog(appliedLog)
    setCelebrate(true)
  }

  const hasSession  = !!sessionId
  const hasCleaned  = !!cleanedId

  return (
    <div className="min-h-screen bg-[#0a0b0f] flex flex-col lg:flex-row text-gray-100">
      
      {/* ── Mobile Top Header ────────────────────────────────────────────────── */}
      <div className="lg:hidden sticky top-0 z-50 bg-[#111318] border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={datapilotLogo} alt="Data Pilot Logo" className="w-6 h-6 object-contain shrink-0" />
          <span className="text-white font-bold text-sm tracking-wide">Data Pilot</span>
        </div>

        <button 
          onClick={() => setMobileMenu(!mobileMenu)}
          className="text-gray-400 hover:text-white transition-colors focus:outline-none"
        >
          {mobileMenu ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* ── Mobile Dropdown Menu ────────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileMenu && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-[#111318] border-b border-white/5 overflow-hidden sticky top-[49px] z-40"
          >
            <div className="px-2 py-3 space-y-1">
              {NAV_ITEMS.map((item) => {
                const disabled = (!item.alwaysOn && !hasSession) || (item.needsCleaned && !hasCleaned)
                const active   = view === item.key

                return (
                  <button
                    key={item.key}
                    disabled={disabled}
                    onClick={() => {
                      setView(item.key)
                      setMobileMenu(false)
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors text-left
                      ${active 
                        ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/20" 
                        : disabled 
                          ? "text-gray-700 cursor-not-allowed opacity-40" 
                          : "text-gray-400 hover:text-gray-200 hover:bg-white/[0.02]"
                      }`}
                  >
                    <span className="text-[12px] opacity-60 shrink-0">{item.icon}</span>
                    <span className="flex-1">{item.label}</span>
                    
                    {item.key === "export" && hasCleaned && (
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    )}
                    {item.key === "cleaning" && hasCleaned && (
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    )}
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Desktop Sidebar ─────────────────────────────────────────────────── */}
      <aside className="hidden lg:flex w-64 shrink-0 bg-[#111318] border-r border-white/5 flex-col py-6 px-4 gap-6 sticky top-0 h-screen overflow-y-auto">
        {/* Brand Logo Header */}
        <div className="flex items-center gap-2 px-1">
          <img src={datapilotLogo} alt="Data Pilot Logo" className="w-6 h-6 object-contain shrink-0" />
          <div>
            <p className="text-[13px] text-indigo-400 font-bold tracking-tight leading-none">Data Pilot</p>
            <p className="text-[9px] text-gray-600 tracking-widest uppercase leading-none mt-1">Enterprise ML</p>
          </div>
        </div>

        {/* Sidebar Nav */}
        <nav className="space-y-0.5">
          {NAV_ITEMS.map(n => {
            const disabled = (!n.alwaysOn && !hasSession) || (n.needsCleaned && !hasCleaned)
            const active   = view === n.key

            return (
              <button
                key={n.key}
                disabled={disabled}
                onClick={() => !disabled && setView(n.key)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors
                  ${active
                    ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/20"
                    : disabled
                      ? "text-gray-700 cursor-not-allowed opacity-40"
                      : "text-gray-500 hover:text-gray-200 hover:bg-white/[0.04]"
                  }`}
              >
                <span className="text-[11px] opacity-60 shrink-0">{n.icon}</span>
                {n.label}

                {n.key === "export" && hasCleaned && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                )}
                {n.key === "cleaning" && hasCleaned && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                )}
              </button>
            )
          })}
        </nav>

        {/* Dynamic Context Optimization Banner for Large Matrices */}
        {isLargeDataset && hasSession && (
          <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 backdrop-blur-md space-y-1.5">
            <div className="flex items-center gap-1.5 text-amber-400 text-[11px] font-semibold">
              <Info size={12} />
              <span>Optimized Engine Mode</span>
            </div>
            <p className="text-[10px] text-gray-500 leading-relaxed">
              Large file pipeline activated. Parquet-backed disk chunking is running to bypass browser RAM bottlenecks.
            </p>
          </div>
        )}

        {/* Progress Steps */}
        {hasSession && (
          <div className="space-y-2">
            <p className="text-[9px] uppercase tracking-widest text-gray-700 font-semibold px-1">
              Pipeline State
            </p>
            {[
              { label: "Matrix Ingested", done: true },
              { label: "Data Profiling",  done: !!profile },
              { label: "Cleansing Steps", done: hasCleaned },
              { label: "Export Ready",    done: hasCleaned },
            ].map(step => (
              <div key={step.label} className="flex items-center gap-2 px-1">
                <div className={`w-3 h-3 rounded-full border flex items-center justify-center shrink-0 transition-colors
                  ${step.done ? "bg-green-500 border-green-400" : "bg-transparent border-gray-700"}`}>
                  {step.done && (
                    <svg width="7" height="7" viewBox="0 0 12 12" fill="none">
                      <polyline points="2 6 5 9 10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <span className={`text-[11px] transition-colors ${step.done ? "text-gray-400" : "text-gray-700"}`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Session Info Badge */}
        {sessionId && (
          <div className="mt-auto px-1 space-y-1">
            <p className="text-[9px] uppercase tracking-widest text-gray-700 font-semibold">
              Pilot Session ID
            </p>
            <p className="text-[10px] font-mono text-gray-600 break-all leading-relaxed">
              {sessionId.slice(0, 18)}…
            </p>
            <p className="text-[10px] font-mono text-gray-400 break-all truncate" title={filename}>
              {filename}
            </p>
          </div>
        )}
      </aside>

      {/* ── Main Content Area ───────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col h-auto lg:h-screen overflow-y-auto">
        
        {/* Success Toast Notification */}
        <AnimatePresence>
          {celebrate && (
            <motion.div
              initial={{ opacity: 0, y: -20, x: "50%" }}
              animate={{ opacity: 1, y: 0, x: "0%" }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-4 right-4 left-4 sm:left-auto sm:w-96 z-50 bg-[#111318] border border-green-500/30 backdrop-blur-xl rounded-xl px-6 py-4 shadow-2xl flex flex-col gap-3"
            >
              <div className="flex items-start justify-between w-full">
                <div>
                  <h2 className="text-base font-bold text-green-300">🎉 Cleansing Complete</h2>
                  <p className="text-xs text-gray-400 mt-0.5">The pipeline has run cleanly and optimized the target dimensions.</p>
                </div>
                <button 
                  onClick={() => setCelebrate(false)}
                  className="text-gray-500 hover:text-gray-300 text-xs font-mono p-1"
                >
                  ✕
                </button>
              </div>
              
              <button
                onClick={() => {
                  setView("analytics")
                  setCelebrate(false)
                }}
                className="w-full text-center py-2 px-3 rounded-lg text-xs font-semibold bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 transition-all shadow-md"
              >
                View Interactive Analytics →
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <main className="flex-1 w-full">
          <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <AnimatePresence mode="wait">
              {view === "upload" && (
                <motion.div key="upload"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25 }}>
                  <FileUploader onUpload={handleUpload} loading={loading} />
                  {uploadError && (
                    <p className="mt-4 text-sm text-red-400 text-center">{uploadError}</p>
                  )}
                </motion.div>
              )}

              {view === "profile" && profile && sessionId && (
                <motion.div key="profile"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25 }}>
                  <ProfilePanel
                    profile={profile}
                    sessionId={sessionId}
                    onStartCleaning={() => setView("cleaning")}
                  />
                </motion.div>
              )}

              {view === "cleaning" && sessionId && (
                <motion.div key="cleaning"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25 }}>
                  <CleaningPanel
                    sessionId={sessionId}
                    onCleanComplete={handleCleanComplete}
                  />
                </motion.div>
              )}

              {view === "analytics" && sessionId && (
                <motion.div key="analytics"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25 }}>
                  <AnalyticsPanel
                    sessionId={sessionId}
                    cleanedSessionId={cleanedId ?? undefined}
                  />
                </motion.div>
              )}

              {view === "export" && sessionId && cleanedId && (
                <motion.div key="export"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25 }}>
                  <ExportPanel
                    sessionId={sessionId}
                    cleanedSessionId={cleanedId}
                    originalFilename={filename}
                    operations={operations}
                    log={log}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  )
}
