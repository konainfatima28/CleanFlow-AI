// ─────────────────────────────────────────────────────────────────────────────
// src/pages/Dashboard.tsx — FINAL VERSION with Export tab
// Replace your existing Dashboard.tsx with everything below this line
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import FileUploader   from "../components/FileUploader"
import ProfilePanel   from "../components/ProfilePanel"
import CleaningPanel  from "../components/CleaningPanel"
import AnalyticsPanel from "../components/AnalyticsPanel"
import ExportPanel    from "../components/ExportPanel"
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
  { key: "upload",    label: "Upload",    icon: "↑", alwaysOn: true },
  { key: "profile",   label: "Profile",   icon: "≡", alwaysOn: false },
  { key: "cleaning",  label: "Clean",     icon: "✦", alwaysOn: false },
  { key: "analytics", label: "Analytics", icon: "◈", alwaysOn: false },
  { key: "export",    label: "Export",    icon: "↓", alwaysOn: false, needsCleaned: true },
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
  const [celebrate, setCelebrate] = useState(false)

  const handleUpload = async (file: File) => {
    setLoading(true)
    setUploadError("")
    setCleanedId(null)
    setOperations([])
    setLog([])
    setFilename(file.name)
    try {
      const { data: up }   = await uploadFile(file)
      setSessionId(up.session_id)
      const { data: prof } = await getProfile(up.session_id)
      setProfile(prof)
      setView("profile")
    } catch (e: any) {
      setUploadError(e?.response?.data?.detail ?? "Upload failed. Please try again.")
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

    // Wait a little before navigating
    setTimeout(() => {
      setView("analytics")
    }, 500)

    // Hide the toast later
    setTimeout(() => {
      setCelebrate(false)
    }, 2500)
      }

  const hasSession  = !!sessionId
  const hasCleaned  = !!cleanedId

  return (
    <div className="flex min-h-screen bg-[#0a0b0f]">

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside className="w-52 shrink-0 bg-[#111318] border-r border-white/5
        flex flex-col py-6 px-4 gap-6">

        {/* Logo */}
        <div className="flex items-center gap-2 px-1">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br
            from-indigo-500 to-violet-600 flex items-center justify-center shrink-0">
            <span className="text-[9px] font-bold text-white">CF</span>
          </div>
          <div>
            <p className="text-[11px] text-indigo-400 font-semibold leading-none">
              CleanFlow
            </p>
            <p className="text-[10px] text-gray-600 leading-none mt-0.5">AI</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="space-y-0.5">
          {NAV_ITEMS.map(n => {
            const disabled = (!n.alwaysOn && !hasSession) ||
                             (n.needsCleaned && !hasCleaned)
            const active   = view === n.key

            return (
              <button
                key={n.key}
                disabled={disabled}
                onClick={() => !disabled && setView(n.key)}
                className={`w-full flex items-center gap-2.5 px-3 py-2
                  rounded-lg text-[13px] font-medium transition-colors
                  ${active
                    ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/20"
                    : disabled
                      ? "text-gray-700 cursor-not-allowed"
                      : "text-gray-500 hover:text-gray-200 hover:bg-white/[0.04]"
                  }`}
              >
                <span className="text-[11px] opacity-60 shrink-0">{n.icon}</span>
                {n.label}

                {/* Green dot on Export when cleaned */}
                {n.key === "export" && hasCleaned && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                )}
                {/* Dot on Clean when cleaned */}
                {n.key === "cleaning" && hasCleaned && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                )}
              </button>
            )
          })}
        </nav>

        {/* Progress steps */}
        {hasSession && (
          <div className="space-y-2">
            <p className="text-[9px] uppercase tracking-widest text-gray-700
              font-semibold px-1">
              Progress
            </p>
            {[
              { label: "Uploaded",  done: true },
              { label: "Profiled",  done: !!profile },
              { label: "Cleaned",   done: hasCleaned },
              { label: "Exported",  done: false },
            ].map(step => (
              <div key={step.label}
                className="flex items-center gap-2 px-1">
                <div className={`w-3 h-3 rounded-full border flex items-center
                  justify-center shrink-0 transition-colors
                  ${step.done
                    ? "bg-green-500 border-green-400"
                    : "bg-transparent border-gray-700"}`}>
                  {step.done && (
                    <svg width="7" height="7" viewBox="0 0 12 12" fill="none">
                      <polyline points="2 6 5 9 10 3"
                        stroke="white" strokeWidth="2"
                        strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <span className={`text-[11px] transition-colors
                  ${step.done ? "text-gray-400" : "text-gray-700"}`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Session badge */}
        {sessionId && (
          <div className="mt-auto px-1 space-y-1">
            <p className="text-[9px] uppercase tracking-widest text-gray-700
              font-semibold">
              Session
            </p>
            <p className="text-[10px] font-mono text-gray-600 break-all leading-relaxed">
              {sessionId.slice(0, 18)}…
            </p>
            <p className="text-[10px] font-mono text-gray-700 break-all truncate"
              title={filename}>
              {filename}
            </p>
          </div>
        )}
      </aside>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <>
        <AnimatePresence>

          {celebrate && (

            <motion.div
              initial={{ opacity: 0, x: 120 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 120 }}
              transition={{ duration: 0.3 }}
              className="fixed top-6 right-6 z-50
                        bg-green-500/15
                        border border-green-500/30
                        backdrop-blur-xl
                        rounded-xl
                        px-6 py-4
                        shadow-2xl"
            >

              <h2 className="text-lg font-bold text-green-300">
                  🎉 Cleaning Complete
              </h2>

              <p className="text-sm text-gray-300 mt-2">
                  Your dataset has been cleaned successfully.
              </p>

              <p className="text-xs text-green-400 mt-1">
                  Redirecting to Analytics...
              </p>

            </motion.div>

          )}

        </AnimatePresence>

        <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-8 py-10">
          <AnimatePresence mode="wait">

            {view === "upload" && (
              <motion.div key="upload"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}>
                <FileUploader onUpload={handleUpload} loading={loading} />
                {uploadError && (
                  <p className="mt-4 text-sm text-red-400 text-center">
                    {uploadError}
                  </p>
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
      </>
    </div>
  )
}