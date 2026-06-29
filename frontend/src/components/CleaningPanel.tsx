// src/components/CleaningPanel.tsx
// Renders AI cleaning suggestions, lets users apply individually or all-at-once,
// shows a live action log and a before/after diff summary.
// Requires: framer-motion, axios (via ../services/api)

import { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { getSuggestions, applyClean } from "../services/api"

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

// ─── Inline icons ─────────────────────────────────────────────────────────────
const Icon = {
  High: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
    </svg>
  ),
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

// ─── Helpers ──────────────────────────────────────────────────────────────────
const IMPACT_CONFIG = {
  high:   { label: "High",   cls: "bg-red-500/10 text-red-400 border-red-500/20",    dot: "bg-red-400" },
  medium: { label: "Medium", cls: "bg-amber-500/10 text-amber-400 border-amber-500/20", dot: "bg-amber-400" },
  low:    { label: "Low",    cls: "bg-blue-500/10 text-blue-400 border-blue-500/20",  dot: "bg-blue-400" },
}

function formatNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

function formatKB(kb: number) {
  return kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb.toFixed(1)} KB`
}

// ─── Suggestion Card ──────────────────────────────────────────────────────────
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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className={`relative rounded-xl border transition-colors overflow-hidden
        ${applied
          ? "bg-green-500/[0.04] border-green-500/20"
          : "bg-[#13151f] border-white/5 hover:border-white/10"}`}
    >
      {/* Applied overlay */}
      <AnimatePresence>
        {applied && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 pointer-events-none"
            style={{ background: "linear-gradient(90deg, rgba(74,222,128,0.03) 0%, transparent 100%)" }}
          />
        )}
      </AnimatePresence>

      {/* Card header */}
      <div className="flex items-start gap-3 p-4">
        {/* Impact badge */}
        <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px]
          font-semibold border shrink-0 mt-0.5 ${cfg.cls}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
          {cfg.label}
        </span>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className={`text-[13px] font-semibold leading-snug
            ${applied ? "text-green-400 line-through decoration-green-500/40" : "text-white"}`}>
            {suggestion.title}
          </p>
          <p className="text-[12px] text-gray-500 mt-0.5 leading-relaxed">
            {suggestion.problem}
          </p>
        </div>

        {/* Affected rows pill */}
        <span className="shrink-0 text-[11px] text-gray-600 tabular-nums whitespace-nowrap mt-0.5">
          {formatNum(suggestion.affected_rows)} rows
        </span>
      </div>

      {/* Expand section */}
      <div className="px-4 pb-3 space-y-3">
        <button
          onClick={() => setExpanded(e => !e)}
          className="flex items-center gap-1 text-[11px] text-gray-600
            hover:text-gray-400 transition-colors"
        >
          <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <Icon.ChevronDown />
          </motion.span>
          {expanded ? "Hide details" : "Why this matters"}
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden space-y-3"
            >
              {/* Reason */}
              <p className="text-[12px] text-gray-400 leading-relaxed pl-3
                border-l border-indigo-500/30">
                {suggestion.reason}
              </p>

              {/* Preview samples */}
              {suggestion.preview.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-widest text-gray-600 font-semibold">
                    Sample values affected
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {suggestion.preview.map((v, i) => (
                      <span key={i}
                        className="px-2 py-0.5 rounded font-mono text-[11px]
                          bg-white/[0.04] text-gray-400 border border-white/5">
                        {v}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Score impact */}
              <div className="flex items-center gap-2 text-[11px] text-gray-500">
                <Icon.Sparkles />
                Fixing this will improve your quality score
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action row */}
        <div className="flex items-center justify-between pt-1">
          {/* Progress bar */}
          <div className="flex-1 mr-4">
            <div className="h-0.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500/60 to-violet-500/60"
                style={{ width: `${Math.min(suggestion.affected_pct, 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-gray-600 mt-0.5">
              {suggestion.affected_pct}% of rows affected
            </p>
          </div>

          {/* Apply button */}
          {applied ? (
            <span className="flex items-center gap-1.5 text-[12px] text-green-400 font-medium">
              <Icon.Check /> Applied
            </span>
          ) : (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => onApply(suggestion)}
              disabled={applying}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px]
                font-medium bg-indigo-600 hover:bg-indigo-500 text-white
                disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {applying ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                    className="w-3 h-3 border border-white/30 border-t-white rounded-full"
                  />
                  Applying…
                </>
              ) : (
                <>
                  <Icon.Zap />
                  Apply fix
                </>
              )}
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ─── Diff Summary ─────────────────────────────────────────────────────────────
function DiffSummary({ diff }: { diff: Diff }) {
  const stats = [
    { label: "Rows removed",    value: diff.rows_removed,    good: diff.rows_removed > 0 },
    { label: "Missing fixed",   value: diff.missing_fixed,   good: diff.missing_fixed > 0 },
    { label: "Columns removed", value: diff.columns_removed, good: diff.columns_removed > 0 },
    {
      label: "Memory saved",
      value: formatKB(Math.max(0, diff.original_memory_kb - diff.cleaned_memory_kb)),
      good: diff.original_memory_kb > diff.cleaned_memory_kb,
      isStr: true,
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-green-500/20 bg-green-500/[0.04] p-5 space-y-4"
    >
      <div className="flex items-center gap-2">
        <span className="text-green-400"><Icon.Sparkles /></span>
        <p className="text-[13px] font-semibold text-white">Cleaning complete</p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {stats.map(s => (
          <div key={s.label} className="space-y-0.5">
            <p className={`text-xl font-bold tabular-nums
              ${s.good ? "text-green-400" : "text-gray-500"}`}>
              {s.isStr ? s.value : formatNum(s.value as number)}
            </p>
            <p className="text-[11px] text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Before / after row counts */}
      <div className="flex items-center gap-3 pt-1 border-t border-white/5">
        <div className="flex-1 p-3 rounded-lg bg-white/[0.02] border border-white/5">
          <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-1">Before</p>
          <p className="text-sm font-mono text-gray-300">
            {formatNum(diff.original_rows)} rows · {diff.original_columns} cols
          </p>
          <p className="text-[11px] text-gray-600 mt-0.5">
            {formatNum(diff.original_missing)} missing · {formatKB(diff.original_memory_kb)}
          </p>
        </div>
        <div className="text-gray-600 text-lg">→</div>
        <div className="flex-1 p-3 rounded-lg bg-green-500/[0.06] border border-green-500/15">
          <p className="text-[10px] text-green-600 uppercase tracking-widest mb-1">After</p>
          <p className="text-sm font-mono text-green-300">
            {formatNum(diff.cleaned_rows)} rows · {diff.cleaned_columns} cols
          </p>
          <p className="text-[11px] text-green-600/70 mt-0.5">
            {formatNum(diff.cleaned_missing)} missing · {formatKB(diff.cleaned_memory_kb)}
          </p>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Action Log ───────────────────────────────────────────────────────────────
function ActionLog({ entries }: { entries: LogEntry[] }) {
  if (entries.length === 0) return null
  return (
    <div className="rounded-xl border border-white/5 bg-[#0d0f18] overflow-hidden">
      <div className="px-4 py-2.5 border-b border-white/5 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-600">
          Action log
        </p>
      </div>
      <div className="divide-y divide-white/[0.03] max-h-48 overflow-y-auto">
        {entries.map((e, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-start gap-3 px-4 py-2.5"
          >
            <span className={`mt-0.5 shrink-0 ${
              e.status === "ok" ? "text-green-400" :
              e.status === "error" ? "text-red-400" : "text-gray-600"
            }`}>
              {e.status === "ok" ? <Icon.Check /> : <Icon.AlertTriangle />}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-mono text-gray-400">{e.operation}</p>
              <p className="text-[11px] text-gray-600 mt-0.5 leading-relaxed">{e.detail}</p>
            </div>
            <span className="text-[10px] tabular-nums text-gray-700 shrink-0 mt-0.5">
              {e.rows_affected} rows
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CleaningPanel({ sessionId, onCleanComplete }: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Track which suggestion IDs have been applied
  const [applied, setApplied] = useState<Set<string>>(new Set())
  const [applying, setApplying] = useState<string | null>(null)

  // Bulk apply state
  const [bulkApplying, setBulkApplying] = useState(false)

  // Filter
  const [filter, setFilter] = useState<"all" | "high" | "medium" | "low">("all")

  // Log + diff (shown after any apply)
  const [log, setLog] = useState<LogEntry[]>([])
  const [diff, setDiff] = useState<Diff | null>(null)
  const [cleanedSessionId, setCleanedSessionId] = useState<string>("")

  // Load suggestions on mount
  useEffect(() => {
    setLoading(true)
    getSuggestions(sessionId)
      .then(({ data }) => setSuggestions(data.suggestions))
      .catch(() => setError("Could not load suggestions. Please try again."))
      .finally(() => setLoading(false))
  }, [sessionId])

  const runOperations = useCallback(
    async (ops: Operation[], ids: string[]) => {
      const { data } = await applyClean(sessionId, ops)
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
      setError("Failed to apply fix. Please try again.")
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

      // Automatically optimize memory after every cleaning
      if (!ops.some(op => op.type === "optimize_memory")) {
        ops.push({
          type: "optimize_memory",
        })

        ids.push("auto_memory_optimization")
      }

      const data = await runOperations(ops, ids)
      onCleanComplete(
          data.cleaned_session_id,
          data.diff,
          ops,
          [...log, ...data.log]
      )
    } catch {
      setError("Bulk apply failed. Please try again.")
    } finally {
      setBulkApplying(false)
    }
  }

  const resetApplied = () => {
    setApplied(new Set())
    setLog([])
    setDiff(null)
  }

  const visible = filter === "all"
    ? suggestions
    : suggestions.filter(s => s.impact === filter)

  const pendingCount = suggestions.filter(s => !applied.has(s.id)).length

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
            className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full"
          />
          <p className="text-sm text-gray-500">Analysing your dataset…</p>
        </div>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-[#13151f] border border-white/5 animate-pulse" />
        ))}
      </div>
    )
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="rounded-xl bg-red-500/[0.06] border border-red-500/20 p-5 text-center space-y-2">
        <p className="text-sm text-red-400">{error}</p>
        <button
          onClick={() => { setError(""); setLoading(true) }}
          className="text-xs text-indigo-400 underline"
        >Retry</button>
      </div>
    )
  }

  return (
    <div className="space-y-5 w-full">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-semibold text-white">
            Cleaning suggestions
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {suggestions.length} issues found · {applied.size} applied · {pendingCount} pending
          </p>
        </div>

        <div className="flex items-center gap-2">
          {applied.size > 0 && (
            <button
              onClick={resetApplied}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px]
                text-gray-500 hover:text-gray-300 border border-white/5
                hover:border-white/10 transition-colors"
            >
              <Icon.RotateCCW /> Reset
            </button>
          )}
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={handleApplyAll}
            disabled={pendingCount === 0 || bulkApplying}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px]
              font-medium bg-indigo-600 hover:bg-indigo-500 text-white
              disabled:opacity-40 disabled:cursor-not-allowed transition-colors
              shadow-lg shadow-indigo-500/20"
          >
            {bulkApplying ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                  className="w-3.5 h-3.5 border border-white/30 border-t-white rounded-full"
                />
                Cleaning dataset…
              </>
            ) : (
              <>
                <Icon.Zap />
                Apply all ({pendingCount})
              </>
            )}
          </motion.button>
        </div>
      </div>

      {/* ── Diff summary ── */}
      {diff && <DiffSummary diff={diff} />}

      {/* ── Filter tabs ── */}
      <div className="flex gap-1">
        {(["all", "high", "medium", "low"] as const).map(f => {
          const count = f === "all"
            ? suggestions.length
            : suggestions.filter(s => s.impact === f).length
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`relative px-3 py-1.5 rounded-lg text-[12px] font-medium
                transition-colors capitalize
                ${filter === f
                  ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                  : "text-gray-500 hover:text-gray-300 border border-transparent"}`}
            >
              {f} {count > 0 && <span className="ml-1 text-[10px] opacity-60">({count})</span>}
            </button>
          )
        })}
      </div>

      {/* ── Suggestion cards ── */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {visible.map((s, i) => (
            <SuggestionCard
              key={s.id}
              suggestion={s}
              applied={applied.has(s.id)}
              applying={applying === s.id}
              onApply={handleApplySingle}
              index={i}
            />
          ))}
        </AnimatePresence>

        {visible.length === 0 && (
          <div className="py-16 text-center space-y-2">
            <p className="text-2xl">✨</p>
            <p className="text-sm text-gray-500">
              {filter === "all"
                ? "No issues found — your dataset looks clean!"
                : `No ${filter}-impact issues.`}
            </p>
          </div>
        )}
      </div>

      {/* ── Action log ── */}
      <ActionLog entries={log} />

      {/* ── Export CTA (shown after any apply) ── */}
      {cleanedSessionId && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-indigo-500/20 bg-indigo-500/[0.05] p-4
            flex items-center justify-between gap-4"
        >
          <div>
            <p className="text-[13px] font-semibold text-white">Ready to export</p>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Your cleaned dataset is ready to download.
            </p>
          </div>
          <div className="flex gap-2">
            {["csv", "xlsx", "json"].map(fmt => (
              <a
                key={fmt}
                href={`http://localhost:8000/api/export/${cleanedSessionId}?format=${fmt}`}
                className="px-3 py-1.5 rounded-lg text-[12px] font-medium uppercase
                  bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5
                  hover:border-white/10 transition-colors font-mono"
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