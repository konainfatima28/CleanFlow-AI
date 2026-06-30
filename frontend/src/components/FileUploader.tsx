// ────────────────────────────────────────────────────────────────────────────
// src/components/FileUploader.tsx
// Data Pilot Drop-zone — CHUNKED MATRIX STREAMING CONNECTOR
// ────────────────────────────────────────────────────────────────────────────

import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import type { FileRejection } from "react-dropzone"
import { motion, AnimatePresence } from "framer-motion"

// ─── Inline SVG Icons ────────────────────────────────────────────────────────
const UploadCloud = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 16 12 12 8 16" />
    <line x1="12" y1="12" x2="12" y2="21" />
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
  </svg>
)

const FileText = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
)

const CheckCircle = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
)

const AlertCircle = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="#f87171" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
)

const Sparkles = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
  </svg>
)

// ─── Types ────────────────────────────────────────────────────────────────────
interface Props {
  onUpload: (file: File) => Promise<void>
  loading: boolean
}

type DropState = "idle" | "hover" | "uploading" | "success" | "error"

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ─── Sample Datasets ──────────────────────────────────────────────────────────
const SAMPLES = [
  { label: "E-commerce Orders",       rows: "12,400 rows",  cols: "18 features" },
  { label: "Customer Churn Matrix",   rows: "3,200 rows",   cols: "24 features" },
  { label: "Financial Transactions",  rows: "105,000 rows", cols: "14 features" },
]

const PARTICLES = Array.from({ length: 8 }, (_, i) => ({
  id: i,
  angle: (i / 8) * 360,
  distance: 55 + Math.random() * 25,
}))

export default function FileUploader({ onUpload, loading }: Props) {
  const [dropState, setDropState] = useState<DropState>("idle")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [errorMsg, setErrorMsg] = useState<string>("")
  const [progress, setProgress] = useState(0)

  const startFakeProgress = () => {
    setProgress(0)
    const id = setInterval(() => {
      setProgress(p => {
        if (p >= 92) { clearInterval(id); return p }
        return p + Math.random() * 8
      })
    }, 220)
    return id
  }

  const onDrop = useCallback(
    async (accepted: File[], rejected: FileRejection[]) => {
      setErrorMsg("")

      if (rejected.length > 0) {
        setDropState("error")
        setErrorMsg("Invalid file format. Please upload a valid structural CSV or XLSX data frame source.")
        return
      }

      const file = accepted[0]
      setSelectedFile(file)
      setDropState("uploading")

      const tid = startFakeProgress()
      try {
        await onUpload(file)
        clearInterval(tid)
        setProgress(100)
        setDropState("success")
      } catch (err: any) {
        clearInterval(tid)
        setDropState("error")
        
        // Custom error handling for long-running pipeline timeouts
        if (err?.code === "ECONNABORTED" || err?.message?.includes("timeout")) {
          setErrorMsg("The profiling engine timed out while processing this heavy matrix. Retrying with decoupled streaming indices is recommended.")
        } else {
          setErrorMsg(err?.response?.data?.detail ?? "Ingestion endpoint rejected file structure. Verify column row encodings.")
        }
      }
    },
    [onUpload]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 
      "text/csv": [".csv"], 
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"] 
    },
    // The explicit maxSize limitation has been removed to allow the backend's Parquet-backed chunking to handle files seamlessly.
    multiple: false,
    disabled: loading || dropState === "uploading",
  })

  const reset = () => {
    setDropState("idle")
    setSelectedFile(null)
    setErrorMsg("")
    setProgress(0)
  }

  const isHovering = isDragActive || dropState === "hover"

  const borderColor =
    dropState === "success" ? "rgba(99,102,241,0.6)"
    : dropState === "error"   ? "rgba(248,113,113,0.6)"
    : isHovering              ? "rgba(99,102,241,0.8)"
    : "rgba(255,255,255,0.06)"

  const glowColor =
    dropState === "success" ? "0 0 40px rgba(99,102,241,0.12)"
    : dropState === "error"   ? "0 0 40px rgba(248,113,113,0.12)"
    : isHovering              ? "0 0 60px rgba(99,102,241,0.18)"
    : "none"

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 min-w-0">

      {/* Header View */}
      <div className="space-y-1">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
          Ingest Feature Matrix
        </h2>
        <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
          Structured CSV or XLSX datasets · Uncapped size threshold · Cleaned files are stored in isolated runtime memory layers
        </p>
      </div>

      {/* Drop Zone Box */}
      <motion.div
        {...(getRootProps() as any)}
        onMouseEnter={() => dropState === "idle" && setDropState("hover")}
        onMouseLeave={() => dropState === "hover" && setDropState("idle")}
        animate={{ borderColor, boxShadow: glowColor }}
        transition={{ duration: 0.25 }}
        style={{ border: "1.5px dashed", borderColor, boxShadow: glowColor }}
        className="relative rounded-2xl bg-[#13151f] cursor-pointer overflow-hidden select-none w-full min-w-0"
      >
        <input {...getInputProps()} />

        {/* Dynamic Grid Overlay */}
        <AnimatePresence>
          {isHovering && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)",
                backgroundSize: "28px 28px",
              }}
            />
          )}
        </AnimatePresence>

        {/* ── IDLE / HOVER States ── */}
        <AnimatePresence mode="wait">
          {(dropState === "idle" || dropState === "hover") && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              className="flex flex-col items-center justify-center gap-4 py-12 sm:py-16 px-4 sm:px-8 text-center"
            >
              <motion.div
                animate={isHovering ? { y: -4, scale: 1.05 } : { y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="text-indigo-400"
              >
                <UploadCloud />
              </motion.div>

              <div className="space-y-1">
                <p className="text-sm sm:text-[15px] font-medium text-white px-2">
                  {isHovering ? "Release to initialize profiling" : "Drag and drop dataset source here"}
                </p>
                <p className="text-xs sm:text-sm text-gray-500">
                  or{" "}
                  <span className="text-indigo-400 font-semibold underline underline-offset-2 cursor-pointer">
                    browse target path directories
                  </span>
                </p>
              </div>

              <div className="flex gap-2 mt-1">
                {["CSV", "XLSX"].map(fmt => (
                  <span
                    key={fmt}
                    className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-mono font-medium bg-[#1e2130] text-gray-400 border border-white/5"
                  >
                    .{fmt.toLowerCase()}
                  </span>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── UPLOADING State ── */}
          {dropState === "uploading" && (
            <motion.div
              key="uploading"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center gap-5 py-12 sm:py-16 px-4 sm:px-8 text-center"
            >
              <div className="relative w-12 h-12">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  className="absolute inset-0 rounded-full border-2 border-indigo-500 border-t-transparent"
                />
                <div className="absolute inset-2 rounded-full bg-indigo-500/10" />
              </div>

              <div className="space-y-1 w-full max-w-xs sm:max-w-md mx-auto">
                <p className="text-xs sm:text-sm font-medium text-white truncate px-4">
                  Streaming {selectedFile?.name} to Console
                </p>
                <p className="text-[11px] sm:text-xs text-gray-500">{formatBytes(selectedFile?.size ?? 0)}</p>
              </div>

              <div className="w-48 sm:w-64 h-1 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                  style={{ width: `${progress}%` }}
                  transition={{ duration: 0.15 }}
                />
              </div>
              <p className="text-[10px] sm:text-[11px] text-gray-500 font-mono">{Math.round(progress)}%</p>
            </motion.div>
          )}

          {/* ── SUCCESS State ── */}
          {dropState === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center gap-4 py-12 sm:py-16 px-4 sm:px-8 text-center"
            >
              <div className="relative w-12 h-12 flex items-center justify-center">
                {PARTICLES.map(p => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, x: 0, y: 0 }}
                    animate={{
                      opacity: [0, 1, 0],
                      x: Math.cos((p.angle * Math.PI) / 180) * p.distance,
                      y: Math.sin((p.angle * Math.PI) / 180) * p.distance,
                    }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                    className="absolute w-1.5 h-1.5 rounded-full bg-indigo-400"
                  />
                ))}
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 18 }}
                >
                  <CheckCircle />
                </motion.div>
              </div>

              <div className="space-y-1 w-full max-w-xs sm:max-w-md mx-auto">
                <p className="text-xs sm:text-sm font-medium text-white">Ingestion Matrix Locked</p>
                <p className="text-[11px] sm:text-xs text-gray-500 truncate px-4">
                  {selectedFile?.name} · {formatBytes(selectedFile?.size ?? 0)}
                </p>
              </div>

              <button
                onClick={e => { e.stopPropagation(); reset() }}
                className="text-xs text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition-colors focus:outline-none"
              >
                Ingest Alternative Data Frame
              </button>
            </motion.div>
          )}

          {/* ── ERROR State ── */}
          {dropState === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center gap-4 py-12 sm:py-16 px-4 sm:px-8 text-center"
            >
              <motion.div animate={{ x: [0, -6, 6, -4, 4, 0] }} transition={{ duration: 0.45 }}>
                <AlertCircle />
              </motion.div>
              <div className="space-y-1">
                <p className="text-xs sm:text-sm font-medium text-red-400">Ingestion Refused</p>
                <p className="text-[11px] sm:text-xs text-gray-500 max-w-xs px-2 leading-relaxed">{errorMsg}</p>
              </div>
              <button
                onClick={e => { e.stopPropagation(); reset() }}
                className="text-xs text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition-colors focus:outline-none"
              >
                Re-initialize Stream
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Sample Section Divider ── */}
      <div className="flex items-center gap-3 py-1">
        <div className="flex-1 h-px bg-white/5" />
        <span className="text-[10px] sm:text-[11px] text-gray-600 uppercase tracking-widest whitespace-nowrap font-semibold">or instantiate template frame</span>
        <div className="flex-1 h-px bg-white/5" />
      </div>

      {/* ── Sample Datasets ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {SAMPLES.map((s, i) => (
          <motion.button
            key={s.label}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            className="group relative flex flex-col items-start gap-2 p-4 rounded-xl bg-[#13151f] border border-white/5 hover:border-indigo-500/30 transition-colors text-left w-full min-w-0 focus:outline-none"
          >
            <div className="absolute inset-0 rounded-xl bg-indigo-500/0 group-hover:bg-indigo-500/[0.02] transition-colors pointer-events-none" />

            <div className="flex items-center justify-between w-full gap-2 text-gray-500">
              <div className="flex items-center gap-1.5 shrink-0">
                <FileText />
                <span className="text-[10px] text-indigo-400 font-mono font-bold">
                  PILOT-{String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <span className="flex items-center gap-1 text-[10px] text-indigo-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <Sparkles />
                Load
              </span>
            </div>

            <p className="text-[13px] font-semibold text-white leading-snug truncate w-full mt-1" title={s.label}>
              {s.label}
            </p>

            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 mt-2 w-full">
              <span className="text-[10px] text-gray-500 font-medium whitespace-nowrap">{s.rows}</span>
              <span className="text-[10px] text-gray-600 font-bold leading-none">·</span>
              <span className="text-[10px] text-gray-500 font-medium whitespace-nowrap">{s.cols}</span>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Privacy Guarantee Note */}
      <p className="text-center text-[10px] sm:text-[11px] text-gray-600 leading-relaxed px-4">
        Data arrays are bound to transient sandbox parameters and cleared completely upon session termination.{" "}
        <span className="text-gray-500 font-medium underline underline-offset-2 cursor-pointer hover:text-gray-400 transition-colors">
          Security Protocols
        </span>
      </p>
    </div>
  )
}
