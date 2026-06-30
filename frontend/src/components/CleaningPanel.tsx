// ────────────────────────────────────────────────────────────────────────────
// src/components/CleaningPanel.tsx
// Data Pilot Cleaning Panel — TRANSIENT TRANSFORMATION CONTROL CONSOLE
// ────────────────────────────────────────────────────────────────────────────

// To this:
import { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { getSuggestions } from "../services/api" // Removed unused applyClean
import api from "../services/api" // Added missing 'api' client instance wrapper

// ─── Types ────────────────────────────────────────────────────────────────────
interface Operation {
  type: string
  column?: string
  columns?: string[]
  strategy?: string
  value?: unknown
  mode?: string
  method?: string
  lower?: number
  upper?: number
  target_type?: string
  duplicates?: string[]
  mapping?: Record<string, string>
}

interface Suggestion {
  id: string
  title: string
  problem: string
  reason: string
  impact: "high" | "medium" | "low"
  affected_rows: number
  affected_pct: number
  preview: string[]
  operation: Operation
}

interface LogEntry {
  operation: string
  column?: string | string[]
  rows_affected: number
  detail: string
  status: "ok" | "error" | "skipped"
}

interface Diff {
  original_rows: number
  cleaned_rows: number
  rows_removed: number
  original_columns: number
  cleaned_columns: number
  columns_removed: number
  original_missing: number
  cleaned_missing: number
  missing_fixed: number
  original_memory_kb: number
  cleaned_memory_kb: number
}

interface Props {
  sessionId: string
  onCleanComplete: (
    cleanedSessionId: string,
    diff: Diff,
    operations: object[],
    log: object[],
  ) => void
}

// ─── SVG Vectors ─────────────────────────────────────────────────────────────
const Icon = {
  Check: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  Zap: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  ChevronDown: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  ),
  AlertTriangle: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  Sparkles: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z"/>
      <path d="M19 3l.75 2.25L22 6l-2.25.75L19 9l-.75-2.25L16 6l2.25-.75z"/>
    </svg>
  ),
  RotateCCW: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="1 4 1 10 7 10"/>
      <path d="M3.51 15a9 9 0 1 0 .49-4.95"/>
    </svg>
  ),
}

const IMPACT_CONFIG = {
  high:   { label: "Critical Variance", cls: "bg-red-500/10 text-red-400 border-red-500/20",    dot: "bg-red-400" },
  medium: { label: "Moderate Skew",    cls: "bg-amber-500/10 text-amber-400 border-amber-500/20", dot: "bg-amber-400" },
  low:    { label: "Minor Anomaly",    cls: "bg-blue-500/10 text-blue-400 border-blue-500/20",    dot: "bg-blue-400" },
}

function formatNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

function formatKB(kb: number) {
  return kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb.toFixed(1)} KB`
}

function SuggestionCard({
  suggestion,
  applied,
  applying,
  onApply,
  index,
}: {
  suggestion: Suggestion
  applied: boolean
  applying: boolean
  onApply: (s: Suggestion) => void
  index: number
}) {
  const [expanded, setExpanded] = useState(false)
  const cfg = IMPACT_CONFIG[suggestion.impact]

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.25 }}
      className={`relative rounded-xl border transition-colors overflow-hidden ${
        applied ? "bg-green-500/[0.03] border-green-500/20" : "bg-[#13151f] border-white/5 hover:border-white/10"
      }`}
    >
      <AnimatePresence>
        {applied && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="absolute inset-0 pointer-events-none"
            style={{ background: "linear-gradient(90deg, rgba(99,102,241,0.02) 0%, transparent 100%)" }}
          />
        )}
      </AnimatePresence>

      <div className="p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <span className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border shrink-0 mt-0.5 ${cfg.cls}`}>
            <span className={`w-1 h-1 rounded-full ${cfg.dot}`} />
            {cfg.label}
          </span>

          <div className="min-w-0 flex-1">
            <p className={`text-[13px] font-bold leading-snug ${
              applied ? "text-green-400 line-through decoration-green-500/30" : "text-white"
            }`}>
              {suggestion.title}
            </p>
            <p className="text-[12px] text-gray-500 mt-1 leading-relaxed">
              {suggestion.problem}
            </p>
          </div>
        </div>

        <span className="shrink-0 text-[11px] font-mono text-gray-500 tabular-nums whitespace-nowrap pl-11 sm:pl-0 mt-0.5">
          {formatNum(suggestion.affected_rows)} vector steps
        </span>
      </div>

      <div className="px-4 pb-3 space-y-3">
        <button
          onClick={() => setExpanded(e => !e)}
          className="flex items-center gap-1 text-[11px] font-semibold text-gray-600 hover:text-gray-400 transition-colors focus:outline-none"
        >
          <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.15 }}>
            <Icon.ChevronDown />
          </motion.span>
          {expanded ? "Collapse Metrics" : "View Pipeline Justification"}
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden space-y-3"
            >
              <p className="text-[12px] text-gray-400 leading-relaxed pl-3 border-l-2 border-indigo-500/30">
                {suggestion.reason}
              </p>

              {suggestion.preview && suggestion.preview.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-widest text-gray-600 font-bold">
                    Anomalous Target Signatures
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {suggestion.preview.map((v, i) => (
                      <span key={i} className="px-2 py-0.5 rounded font-mono text-[11px] bg-white/[0.03] text-gray-400 border border-white/5 max-w-full truncate">
                        {v}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 text-[11px] text-indigo-400/80 font-medium">
                <Icon.Sparkles />
                Executing recipe optimizes the feature distribution alignment map.
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="flex-1 w-full">
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                style={{ width: `${Math.min(suggestion.affected_pct, 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-gray-600 font-mono mt-1">
              {suggestion.affected_pct}% of dimensions impacted
            </p>
          </div>

          <div className="shrink-0 flex justify-end w-full sm:w-auto">
            {applied ? (
              <span className="flex items-center gap-1.5 text-[12px] text-green-400 font-bold py-1.5">
                <Icon.Check /> Recipe Implemented
              </span>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={() => onApply(suggestion)} disabled={applying}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none"
              >
                {applying ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                      className="w-3 h-3 border border-white/20 border-t-white rounded-full"
                    />
                    Committing Parquet Cache...
                  </>
                ) : (
                  <>
                    <Icon.Zap />
                    Deploy Fix
                  </>
                )}
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function DiffSummary({ diff }: { diff: Diff }) {
  const stats = [
    { label: "Rows Extracted",   value: diff.rows_removed,     good: diff.rows_removed > 0 },
    { label: "Sparsity Resolved", value: diff.missing_fixed,    good: diff.missing_fixed > 0 },
    { label: "Features Pruned",   value: diff.columns_removed,  good: diff.columns_removed > 0 },
    {
      label: "RAM Footprint Saved",
      value: formatKB(Math.max(0, diff.original_memory_kb - diff.cleaned_memory_kb)),
      good: diff.original_memory_kb > diff.cleaned_memory_kb,
      isStr: true,
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-indigo-500/10 bg-indigo-500/[0.02] p-4 sm:p-5 space-y-4"
    >
      <div className="flex items-center gap-2">
        <span className="text-indigo-400"><Icon.Sparkles /></span>
        <p className="text-[13px] font-bold uppercase tracking-wider text-white">Pipeline Execution Result Delta</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(s => (
          <div key={s.label} className="space-y-0.5">
            <p className={`text-lg sm:text-xl font-bold tabular-nums ${s.good ? "text-indigo-400" : "text-gray-500"}`}>
              {s.isStr ? s.value : formatNum(s.value as number)}
            </p>
            <p className="text-[11px] text-gray-500 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-3 pt-2 border-t border-white/5">
        <div className="flex-1 p-3 rounded-lg bg-white/[0.01] border border-white/5 w-full">
          <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mb-1">Original Frame Vector</p>
          <p className="text-xs sm:text-sm font-mono text-gray-400">
            {formatNum(diff.original_rows)} lines · {diff.original_columns} labels
          </p>
          <p className="text-[11px] text-gray-600 mt-0.5">
            {formatNum(diff.original_missing)} null cells · {formatKB(diff.original_memory_kb)}
          </p>
        </div>
        <div className="text-gray-600 text-sm text-center hidden md:block">→</div>
        <div className="flex-1 p-3 rounded-lg bg-indigo-500/[0.04] border border-indigo-500/10 w-full">
          <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mb-1">Optimized Output Lineage</p>
          <p className="text-xs sm:text-sm font-mono text-gray-300">
            {formatNum(diff.cleaned_rows)} lines · {diff.cleaned_columns} labels
          </p>
          <p className="text-[11px] text-indigo-500/50 mt-0.5">
            {formatNum(diff.cleaned_missing)} null cells · {formatKB(diff.cleaned_memory_kb)}
          </p>
        </div>
      </div>
    </motion.div>
  )
}

function ActionLog({ entries }: { entries: LogEntry[] }) {
  if (entries.length === 0) return null
  return (
    <div className="rounded-xl border border-white/5 bg-[#0d0f14] overflow-hidden w-full">
      <div className="px-4 py-2.5 border-b border-white/5 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-600">
          Deterministic Audit Trail
        </p>
      </div>
      <div className="divide-y divide-white/[0.02] max-h-48 overflow-y-auto pr-1 paths-scroll-touch">
        {entries.map((e, i) => (
          <motion.div
            key={i} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
            className="flex items-start justify-between gap-3 px-4 py-2.5"
          >
            <div className="flex items-start gap-3 min-w-0">
              <span className={`mt-0.5 shrink-0 ${
                e.status === "ok" ? "text-indigo-400" : e.status === "error" ? "text-red-400" : "text-gray-600"
              }`}>
                {e.status === "ok" ? <Icon.Check /> : <Icon.AlertTriangle />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-mono text-gray-400 truncate">{e.operation}</p>
                <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{e.detail}</p>
              </div>
            </div>
            <span className="text-[10px] font-mono text-gray-700 shrink-0 mt-0.5">
              {e.rows_affected} vectors
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default function CleaningPanel({ sessionId, onCleanComplete }: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [applied, setApplied] = useState<Set<string>>(new Set())
  const [applying, setApplying] = useState<string | null>(null)
  const [bulkApplying, setBulkApplying] = useState(false)
  const [filter, setFilter] = useState<"all" | "high" | "medium" | "low">("all")
  const [log, setLog] = useState<LogEntry[]>([])
  const [diff, setDiff] = useState<Diff | null>(null)
  const [cleanedSessionId, setCleanedSessionId] = useState<string>("")

  useEffect(() => {
    setLoading(true)
    getSuggestions(sessionId)
      .then(({ data }) => setSuggestions(data.suggestions || []))
      .catch(() => setError("Profiling suggestion engine failed to initialize options tree."))
      .finally(() => setLoading(false))
  }, [sessionId])

  const runOperations = useCallback(
    async (ops: Operation[], ids: string[]) => {
      // Synchronized endpoint configuration connecting directly to Data Pilot clean routes
      const response = await api.post(`/clean/${sessionId}`, { operations: ops }, { timeout: 0 })
      const data = response.data
      setLog(prev => [...prev, ...data.log])
      setDiff(data.diff)
      setCleanedSessionId(data.cleaned_session_id)
      setApplied(prev => {
        const next = new Set(prev)
        ids.forEach(id => next.add(id))
        return next
      })
      return data
    },
    [sessionId]
  )

  const handleApplySingle = async (suggestion: Suggestion) => {
    if (applied.has(suggestion.id) || applying) return
    setApplying(suggestion.id)
    try {
      const data = await runOperations([suggestion.operation], [suggestion.id])
      onCleanComplete(
        data.cleaned_session_id,
        data.diff,
        [suggestion.operation],
        [...log, ...data.log]
      )
    } catch {
      setError("Failed to stream core operation transformation across targets.")
    } finally {
      setApplying(null)
    }
  }

  const handleApplyAll = async () => {
    const pending = suggestions.filter(s => !applied.has(s.id))
    if (!pending.length || bulkApplying) return
    setBulkApplying(true)
    try {
      const ops = pending.map(s => s.operation)
      const ids = pending.map(s => s.id)

      const data = await runOperations(ops, ids)
      onCleanComplete(
        data.cleaned_session_id,
        data.diff,
        ops,
        [...log, ...data.log]
      )
    } catch {
      setError("Bulk lineage execution transformation chain halted.")
    } finally {
      setBulkApplying(false)
    }
  }

  const resetApplied = () => {
    setApplied(new Set())
    setLog([])
    setDiff(null)
  }

  const visible = filter === "all" ? suggestions : suggestions.filter(s => s.impact === filter)
  const pendingCount = suggestions.filter(s => !applied.has(s.id)).length

  if (loading) {
    return (
      <div className="space-y-3 w-full">
        <div className="flex items-center gap-2 mb-4">
          <motion.div
            animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full"
          />
          <p className="text-sm text-gray-500">Data Pilot parsing transformation profiles...</p>
        </div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-[#13151f] border border-white/5 animate-pulse" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-500/[0.05] border border-red-500/20 p-5 text-center space-y-2 w-full">
        <p className="text-sm text-red-400">{error}</p>
        <button
          onClick={() => { setError(""); setLoading(true) }}
          className="text-xs text-indigo-400 underline font-semibold focus:outline-none"
        >
          Re-initialize Console Connection
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5 w-full min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Pilot Cleaning Console</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Detected {suggestions.length} dimension issues · {applied.size} fixed · {pendingCount} outstanding
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {applied.size > 0 && (
            <button
              onClick={resetApplied}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-semibold text-gray-500 hover:text-gray-300 border border-white/5 hover:border-white/10 transition-colors focus:outline-none"
            >
              <Icon.RotateCCW /> Rollback
            </button>
          )}
          <motion.button
            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
            onClick={handleApplyAll} disabled={pendingCount === 0 || bulkApplying}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-[13px] font-bold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-lg shadow-indigo-500/10 focus:outline-none"
          >
            {bulkApplying ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                  className="w-3.5 h-3.5 border border-white/30 border-t-white rounded-full"
                />
                Streaming Transformation Chain...
              </>
            ) : (
              <>
                <Icon.Zap />
                <span className="whitespace-nowrap">Bulk Execute All ({pendingCount})</span>
              </>
            )}
          </motion.button>
        </div>
      </div>

      {diff && <DiffSummary diff={diff} />}

      <div className="flex gap-1 border-b border-white/5 pb-2 overflow-x-auto w-full">
        {(["all", "high", "medium", "low"] as const).map(f => {
          const count = f === "all" ? suggestions.length : suggestions.filter(s => s.impact === f).length
          return (
            <button
              key={f} onClick={() => setFilter(f)}
              className={`relative px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors uppercase tracking-wider shrink-0 ${
                filter === f
                  ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                  : "text-gray-500 hover:text-gray-300 border border-transparent"
              }`}
            >
              {f === "all" ? "All Vectors" : f} {count > 0 && <span className="ml-0.5 text-[10px] font-mono opacity-50">({count})</span>}
            </button>
          )
        })}
      </div>

      <div className="space-y-3 w-full">
        <AnimatePresence mode="popLayout">
          {visible.map((s, i) => (
            <SuggestionCard
              key={s.id} suggestion={s} applied={applied.has(s.id)}
              applying={applying === s.id} onApply={handleApplySingle} index={i}
            />
          ))}
        </AnimatePresence>

        {visible.length === 0 && (
          <div className="py-16 text-center space-y-2 w-full">
            <p className="text-xl">✨</p>
            <p className="text-sm text-gray-500">
              {filter === "all" ? "Lineage pristine. No outstanding structural matrix skewing elements verified." : `No outstanding ${filter} variance flags.`}
            </p>
          </div>
        )}
      </div>

      <ActionLog entries={log} />

      {cleanedSessionId && (
        <motion.div
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-indigo-500/20 bg-indigo-500/[0.04] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 w-full"
        >
          <div>
            <p className="text-[13px] font-bold text-white uppercase tracking-wider">Lineage Block Ready</p>
            <p className="text-[12px] text-gray-400 mt-0.5">
              Target data arrays match optimized criteria parameters.
            </p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            {["csv", "xlsx", "json"].map(fmt => (
              <a
                key={fmt} href={`http://localhost:8000/api/export/${cleanedSessionId}?format=${fmt}`}
                className="flex-1 md:flex-none text-center px-3 py-2 rounded-lg text-[11px] font-bold uppercase bg-white/5 hover:bg-white/10 text-gray-400 border border-white/5 hover:border-white/10 transition-colors font-mono"
              >
                .{fmt}
              </a>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}
