// src/components/ExportPanel.tsx
// Download panel shown after cleaning is complete.
// Handles CSV, XLSX, JSON, Pandas script, and Markdown report.

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import axios from "axios"

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8000/api",
})

// ─── Types ────────────────────────────────────────────────────────────────────
interface Props {
  sessionId: string          // original session
  cleanedSessionId: string   // cleaned session
  originalFilename?: string
  operations?: object[]
  log?: object[]
}

type FormatKey = "csv" | "xlsx" | "json" | "script" | "report"
type DlState   = "idle" | "loading" | "done" | "error"

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icon = {
  Download: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  ),
  Check: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  Spinner: () => (
    <motion.svg
      width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2"
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </motion.svg>
  ),
  Alert: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
  File:   () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
    </svg>
  ),
  Code:   () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8">
      <polyline points="16 18 22 12 16 6"/>
      <polyline points="8 6 2 12 8 18"/>
    </svg>
  ),
  Report: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
}

// ─── Format config ────────────────────────────────────────────────────────────
const FORMATS: {
  key: FormatKey
  label: string
  ext: string
  desc: string
  accent: string
  icon: React.ReactNode
}[] = [
  {
    key: "csv",
    label: "CSV",
    ext: ".csv",
    desc: "Universal format — works in Excel, Python, R, and everywhere else.",
    accent: "indigo",
    icon: <Icon.File />,
  },
  {
    key: "xlsx",
    label: "Excel",
    ext: ".xlsx",
    desc: "Auto-formatted spreadsheet with column widths set.",
    accent: "green",
    icon: <Icon.File />,
  },
  {
    key: "json",
    label: "JSON",
    ext: ".json",
    desc: "Records array — ready for APIs, Node.js, and NoSQL databases.",
    accent: "amber",
    icon: <Icon.File />,
  },
  {
    key: "script",
    label: "Pandas script",
    ext: ".py",
    desc: "Auto-generated Python that reproduces every cleaning operation.",
    accent: "violet",
    icon: <Icon.Code />,
  },
  {
    key: "report",
    label: "Cleaning report",
    ext: ".md",
    desc: "Markdown report with before/after stats and full operation log.",
    accent: "sky",
    icon: <Icon.Report />,
  },
]

const ACCENT_CLASSES: Record<string, string> = {
  indigo: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/20",
  green:  "bg-green-500/10  text-green-400  border-green-500/20  hover:bg-green-500/20",
  amber:  "bg-amber-500/10  text-amber-400  border-amber-500/20  hover:bg-amber-500/20",
  violet: "bg-violet-500/10 text-violet-400 border-violet-500/20 hover:bg-violet-500/20",
  sky:    "bg-sky-500/10    text-sky-400    border-sky-500/20    hover:bg-sky-500/20",
}

// ─── Trigger a browser file download from a blob ──────────────────────────────
function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.target = "_self";
  a.rel = "noopener";

  document.body.appendChild(a);

  // Real browser click
  a.click();

  document.body.removeChild(a);

  // Give Chrome time before revoking
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 3000);
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ExportPanel({
  sessionId,
  cleanedSessionId,
  originalFilename = "dataset.csv",
  operations = [],
  log = [],
}: Props) {
  const [states, setStates] = useState<Record<FormatKey, DlState>>({
    csv: "idle", xlsx: "idle", json: "idle", script: "idle", report: "idle",
  })

  function setState(key: FormatKey, s: DlState) {
    setStates(prev => ({ ...prev, [key]: s }))
  }

  async function handleDownload(key: FormatKey) {
    if (states[key] === "loading") return
    setState(key, "loading")

    try {
      let blob: Blob
      let filename: string

      if (key === "csv" || key === "xlsx" || key === "json") {
        const { data } = await api.get(
          `/export/${cleanedSessionId}?format=${key}`,
          { responseType: "blob" }
        )

        console.log(data)
        console.log(data.size)
        console.log(data.type)

        blob     = data
        filename = `cleanflow_${key}_${cleanedSessionId.slice(0, 8)}.${key}`
      }

      else if (key === "script") {
        const { data } = await api.post(
          `/export/script/${cleanedSessionId}`,
          { original_filename: originalFilename, operations },
          { responseType: "blob" }
        )
        blob     = data
        filename = `cleanflow_script_${cleanedSessionId.slice(0, 8)}.py`
      }

      else {
        // report
        const { data } = await api.post(
          `/export/report/${cleanedSessionId}`,
          {
            original_session_id: sessionId,
            original_filename:   originalFilename,
            log,
            operations,
          },
          { responseType: "blob" }
        )
        blob     = data
        filename = `cleanflow_report_${cleanedSessionId.slice(0, 8)}.md`
      }

      console.log("Downloading:", filename);

      triggerDownload(blob, filename);

      console.log("Download function finished");
      
      setState(key, "done")
      setTimeout(() => setState(key, "idle"), 3000)

    } catch {
      setState(key, "error")
      setTimeout(() => setState(key, "idle"), 3000)
    }
  }

  // ── Button state rendering ─────────────────────────────────────────────────
  function ButtonContent({ s }: { s: DlState }) {
    if (s === "loading") return <><Icon.Spinner /> Preparing…</>
    if (s === "done")    return <><Icon.Check />   Downloaded</>
    if (s === "error")   return <><Icon.Alert />   Failed</>
    return <><Icon.Download /> Download</>
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5 w-full"
    >
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">
          Export Results
        </h2>

        <p className="text-gray-400 mt-2">
          Your dataset has been cleaned successfully.
          Download the cleaned dataset, reproducible Pandas script,
          and detailed cleaning report.
        </p>
      </div>

      {/* Session info pill */}
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full
        border border-green-500/20 bg-green-500/[0.06]">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
        <span className="text-[12px] text-green-400 font-medium">
          Cleaned session ready
        </span>
        <span className="text-[11px] text-green-600 font-mono">
          {cleanedSessionId.slice(0, 12)}…
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-5">

        <div className="rounded-xl bg-[#13151f] border border-white/5 p-4">
          <p className="text-xs text-gray-500">Dataset</p>
          <h3 className="text-white font-semibold truncate mt-1">
            {originalFilename}
          </h3>
        </div>

        <div className="rounded-xl bg-[#13151f] border border-white/5 p-4">
          <p className="text-xs text-gray-500">Export Formats</p>
          <h3 className="text-green-400 font-bold mt-1">
            {FORMATS.length}
          </h3>
        </div>

        <div className="rounded-xl bg-[#13151f] border border-white/5 p-4">
          <p className="text-xs text-gray-500">Status</p>
          <h3 className="text-green-400 font-bold mt-1">
            Ready
          </h3>
        </div>

      </div>

      {/* Format cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {FORMATS.map((fmt, i) => {
          const s = states[fmt.key]
          const accentCls = ACCENT_CLASSES[fmt.accent]

          return (
            <motion.div
              key={fmt.key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex flex-col gap-3 p-4 rounded-xl border border-white/5
                bg-[#13151f] hover:border-white/10 transition-colors"
            >
              {/* Icon + label row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center
                    border ${accentCls} transition-colors`}>
                    {fmt.icon}
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-white">{fmt.label}</p>
                    <p className="text-[10px] font-mono text-gray-600">{fmt.ext}</p>
                  </div>
                </div>

                {/* State badge */}
                <AnimatePresence mode="wait">
                  {s === "done" && (
                    <motion.span
                      key="done"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-[10px] text-green-400 font-medium"
                    >
                      ✓ Done
                    </motion.span>
                  )}
                  {s === "error" && (
                    <motion.span
                      key="error"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-[10px] text-red-400"
                    >
                      Failed
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>

              {/* Description */}
              <p className="text-[12px] text-gray-500 leading-relaxed flex-1">
                {fmt.desc}
              </p>

              {/* Download button */}
              <motion.button
                whileHover={
                  s === "loading"
                    ? {}
                    : {
                        scale: 1.02,
                        y: -2,
                      }
                }
                whileTap={{ scale: 0.97 }}
                onClick={() => handleDownload(fmt.key)}
                disabled={s === "loading"}
                className={`w-full flex items-center justify-center gap-2
                  py-2 rounded-lg text-[12px] font-medium border
                  transition-colors disabled:opacity-60 disabled:cursor-not-allowed
                  ${s === "done"
                    ? "bg-green-500/10 text-green-400 border-green-500/20"
                    : s === "error"
                      ? "bg-red-500/10 text-red-400 border-red-500/20"
                      : `${accentCls}`
                  }`}
              >
                <ButtonContent s={s} />
              </motion.button>
            </motion.div>
          )
        })}
      </div>

      <div
        className="rounded-xl
                  bg-gradient-to-r
                  from-indigo-600/15
                  to-violet-600/15
                  border border-indigo-500/20
                  p-5">

        <h2 className="text-lg font-semibold text-white">
          🎉 Cleaning Completed Successfully
        </h2>

        <p className="text-gray-400 mt-2">
          Your dataset is ready to download.
          Export it as CSV, Excel, JSON, a reproducible Pandas script,
          or a detailed cleaning report.
        </p>

      </div>

      {/* Privacy note */}
      <div className="rounded-xl border border-white/5 bg-[#0d0f14] p-4
        flex items-start gap-3">
        <span className="text-amber-400/70 mt-0.5 shrink-0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        </span>
        <p className="text-[12px] text-gray-600 leading-relaxed">
          Your data is processed entirely in memory and never written to disk.
          Sessions are cleared automatically. Download your files before
          closing this tab.
        </p>
      </div>
    </motion.div>
  )
}