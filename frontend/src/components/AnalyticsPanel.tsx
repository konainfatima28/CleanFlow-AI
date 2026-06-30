// ────────────────────────────────────────────────────────────────────────────
// src/components/AnalyticsPanel.tsx
// Data Pilot Analytics Dashboard — OPTIMIZED VISUAL MATRIX EXTRACTOR
// ────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import api from "../services/api" // Unified client provider tracking global timeout parameters

// ─── Types ────────────────────────────────────────────────────────────────────
interface DistColumn {
  column: string
  type: "histogram" | "bar"
  data: { label: string; count: number }[]
  stats: Record<string, any>
}

interface MissingData {
  cells: { row: number; col: number }[]
  rows: number
  cols: number
  col_names: string[]
  per_col: { column: string; missing: number; pct: number }[]
}

interface CorrData {
  columns: string[]
  cells: { x: number; y: number; value: number }[]
}

interface OutlierRow {
  column: string
  outliers: number
  pct: number
  lower: number
  upper: number
}

interface Analytics {
  distributions: DistColumn[]
  missing: MissingData
  correlation: CorrData
  outliers: OutlierRow[]
}

interface CompareMetric {
  label: string
  before: number
  after: number
  improvement: number
}

interface CompareData {
  before_score: number
  after_score: number
  score_change: number

  summary: {
    missing_fixed: number
    duplicates_removed: number
    memory_saved_kb: number
    rows_removed: number
    quality_gain: number
  }

  metrics: CompareMetric[]
}

interface Props {
  sessionId: string
  cleanedSessionId?: string
}

// ─── Theme Constants ─────────────────────────────────────────────────────────
const INDIGO   = "#6366f1"
const VIOLET   = "#8b5cf6"
const AMBER    = "#f59e0b"
const RED      = "#ef4444"
const CARD_BG  = "#13151f"
const BORDER   = "rgba(255,255,255,0.05)"

// ─── Formatting Helpers ──────────────────────────────────────────────────────
function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

function formatKB(kb: number): string {
  if (kb >= 1024) return `${(kb / 1024).toFixed(1)} MB`
  return `${kb.toFixed(1)} KB`
}

function corrColor(v: number): string {
  if (v >= 0.7)  return "#22c55e"
  if (v >= 0.3)  return "#86efac"
  if (v >= -0.3) return "#334155"
  if (v >= -0.7) return "#fca5a5"
  return "#ef4444"
}

const TT_STYLE = {
  background: "#1a1d27",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 8,
  fontSize: 11,
  color: "#94a3b8",
}

function Skeleton({ h = 160 }: { h?: number }) {
  return (
    <div
      className="rounded-xl bg-[#13151f] border border-white/5 animate-pulse"
      style={{ height: h }}
    />
  )
}

function Section({ title, sub, children }: {
  title: string; sub?: string; children: React.ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }} className="space-y-3"
    >
      <div>
        <p className="text-[14px] font-bold text-white tracking-tight">{title}</p>
        {sub && <p className="text-[12px] text-gray-500 mt-0.5">{sub}</p>}
      </div>
      {children}
    </motion.div>
  )
}

// ─── 1. Distribution Charts ───────────────────────────────────────────────────
function DistributionCharts({ data }: { data: DistColumn[] }) {
  const [page, setPage] = useState(0)
  const PER_PAGE = 4
  const total = Math.ceil(data.length / PER_PAGE)
  const visible = data.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE)

  return (
    <Section title="Feature Vector Distributions" sub="Continuous numerical histograms and text frequency distribution summaries">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {visible.map((col, i) => (
          <motion.div
            key={col.column} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            className="rounded-xl border p-4 space-y-2 min-w-0" style={{ background: CARD_BG, borderColor: BORDER }}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-[12px] font-mono font-bold text-white truncate" title={col.column}>
                {col.column}
              </p>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-mono font-bold tracking-wide uppercase shrink-0 ${
                col.type === "histogram"
                  ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                  : "bg-amber-500/10 text-amber-400 border-amber-500/20"
              }`}>
                {col.type === "histogram" ? "continuous" : "categorical"}
              </span>
            </div>

            <div className="w-full h-[110px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={col.data} margin={{ top: 4, right: 0, left: -28, bottom: 0 }}>
                  <XAxis dataKey="label" tick={{ fontSize: 9, fill: "#475569" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 9, fill: "#475569" }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={TT_STYLE} cursor={{ fill: "rgba(255,255,255,0.02)" }} formatter={(value) => [value as number, "Count"]} />
                  <Bar dataKey="count" radius={[3, 3, 0, 0]} maxBarSize={32}>
                    {col.data.map((_, idx) => (
                      <Cell
                        key={idx} fill={col.type === "histogram" ? INDIGO : VIOLET}
                        fillOpacity={0.7 + (idx / col.data.length) * 0.3}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {col.type === "histogram" ? (
              <div className="flex gap-x-3 gap-y-1 flex-wrap pt-1 border-t border-white/[0.01]">
                {["mean", "median", "std"].map(k => (
                  col.stats[k] !== undefined && (
                    <span key={k} className="text-[10px] text-gray-500 capitalize">
                      {k === "std" ? "Std Dev (σ)" : k}:{" "}
                      <span className="text-gray-300 font-semibold font-mono">{col.stats[k]}</span>
                    </span>
                  )
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-gray-500 pt-1 border-t border-white/[0.01] truncate">
                Cardinals: <span className="text-gray-300 font-semibold font-mono">{col.stats.unique} unique</span> · top skew:{" "}
                <span className="text-indigo-400 font-semibold font-mono">"{col.stats.top}"</span>
              </p>
            )}
          </motion.div>
        ))}
      </div>

      {total > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
            className="px-3 py-1 text-[11px] font-bold rounded-lg border border-white/5 text-gray-500 hover:text-gray-300 disabled:opacity-30 transition-colors"
          >
            ← Previous
          </button>
          <span className="text-[11px] text-gray-600 font-mono font-bold tabular-nums">
            {page + 1} / {total}
          </span>
          <button
            onClick={() => setPage(p => Math.min(total - 1, p + 1))} disabled={page === total - 1}
            className="px-3 py-1 text-[11px] font-bold rounded-lg border border-white/5 text-gray-500 hover:text-gray-300 disabled:opacity-30 transition-colors"
          >
            Next →
          </button>
        </div>
      )}
    </Section>
  )
}

// ─── 2. Missing Values Heatmap ────────────────────────────────────────────────
function MissingHeatmap({ data }: { data: MissingData }) {
  if (!data.per_col || data.per_col.length === 0) {
    return (
      <Section title="Sparsity Map" sub="Null cell structural placement indicators">
        <div className="rounded-xl border p-10 text-center" style={{ background: CARD_BG, borderColor: BORDER }}>
          <p className="text-2xl mb-2 text-indigo-400">✓</p>
          <p className="text-sm text-gray-500 font-medium">No missing sparse indices verified inside this array frame.</p>
        </div>
      </Section>
    )
  }

  const missingSet = new Set(data.cells?.map(c => `${c.row}-${c.col}`) || [])
  const CELL_SIZE = Math.max(6, Math.min(14, Math.floor(360 / (data.cols || 1))))
  
  // Guard condition: Prevent browser freeze if the matrix layout contains massive dimensions
  const isTooLargeToRenderGrid = data.rows > 250 || data.cols > 80;

  return (
    <Section title="Sparsity Tracking Matrix" sub={`${data.cells?.length || 0} missing data points across structural vector parameters`}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Heatmap grid allocation frame */}
        <div className="rounded-xl border p-4 space-y-3 min-w-0" style={{ background: CARD_BG, borderColor: BORDER }}>
          <p className="text-[11px] text-gray-600 uppercase tracking-widest font-bold">Transient Sparsity Matrix Overview</p>

          <div className="w-full overflow-x-auto pb-2 paths-scroll-touch">
            <div className="min-w-max">
              {isTooLargeToRenderGrid ? (
                <div className="py-12 px-4 text-center max-w-sm mx-auto">
                  <p className="text-[12px] text-gray-500 leading-relaxed italic">
                    Dataset dimensions are too dense for direct grid map projection. See the feature allocation frequency report on the right side for density specs.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex gap-px overflow-x-auto pb-1">
                    {data.col_names?.map((name, i) => (
                      <div key={i} style={{ width: CELL_SIZE, minWidth: CELL_SIZE }} className="text-[7px] text-gray-600 font-mono truncate text-center" title={name}>
                        {name.slice(0, 2)}
                      </div>
                    ))}
                  </div>

                  <div className="space-y-px">
                    {Array.from({ length: data.rows || 0 }).map((_, r) => (
                      <div key={r} className="flex gap-px">
                        {Array.from({ length: data.cols || 0 }).map((_, c) => {
                          const isMissing = missingSet.has(`${r}-${c}`)
                          return (
                            <div
                              key={c}
                              style={{
                                width: CELL_SIZE, height: CELL_SIZE, minWidth: CELL_SIZE,
                                backgroundColor: isMissing ? "rgba(239,68,68,0.75)" : "rgba(99,102,241,0.12)",
                                borderRadius: 1,
                              }}
                              title={isMissing ? `Sparsity Failure: row ${r}, feature ${data.col_names[c]}` : `Present cell index`}
                            />
                          )
                        })}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1 border-t border-white/[0.02]">
            <span className="flex items-center gap-1.5 text-[10px] text-gray-500 font-medium">
              <span className="w-2.5 h-2.5 rounded-sm bg-red-500/80" /> Null Index
            </span>
            <span className="flex items-center gap-1.5 text-[10px] text-gray-500 font-medium">
              <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500/20" /> Allocated
            </span>
          </div>
        </div>

        {/* Bar chart panel column summary */}
        <div className="rounded-xl border p-4 space-y-3 min-w-0" style={{ background: CARD_BG, borderColor: BORDER }}>
          <p className="text-[11px] text-gray-600 uppercase tracking-widest font-bold">Sparsity Index by Variable</p>
          <div className="w-full h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.per_col?.slice(0, 12) || []} layout="vertical" margin={{ left: -10, right: 20, top: 0, bottom: 0 }}>
                <XAxis type="number" tick={{ fontSize: 10, fill: "#475569" }} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} domain={[0, 100]} />
                <YAxis type="category" dataKey="column" tick={{ fontSize: 10, fill: "#94a3b8" }} width={80} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={TT_STYLE} cursor={{ fill: "rgba(255,255,255,0.02)" }} formatter={(value) => [`${value}%`, "Sparsity"]} />
                <Bar dataKey="pct" radius={[0, 4, 4, 0]} maxBarSize={12}>
                  {data.per_col?.slice(0, 12).map((entry, i) => (
                    <Cell key={i} fill={entry.pct > 30 ? RED : entry.pct > 10 ? AMBER : INDIGO} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </Section>
  )
}

// ─── 3. Correlation Matrix ────────────────────────────────────────────────────
function CorrelationMatrix({ data }: { data: CorrData }) {
  if (!data || !data.columns || data.columns.length < 2) {
    return (
      <Section title="Feature Cross Correlation Matrix" sub="Pearson r linear tracking indicators across numerical coordinates">
        <div className="rounded-xl border p-8 text-center" style={{ background: CARD_BG, borderColor: BORDER }}>
          <p className="text-sm text-gray-500">
            A minimum of 2 continuous numerical variables are required to generate cross-correlation covariance arrays.
          </p>
        </div>
      </Section>
    )
  }

  const n = data.columns.length
  const CELL = Math.max(28, Math.min(52, Math.floor(480 / n)))

  return (
    <Section title="Feature Cross Correlation Array Map" sub="Pearson product-moment correlation tracking coefficients — green indicates covariance tracking, red implies separation">
      <div className="rounded-xl border p-4 sm:p-5 overflow-x-auto overflow-y-hidden paths-scroll-touch" style={{ background: CARD_BG, borderColor: BORDER }}>
        <div className="min-w-max">
          <div className="flex" style={{ marginLeft: 80 }}>
            {data.columns.map((col, i) => (
              <div key={i} style={{ width: CELL, minWidth: CELL }} className="text-[9px] font-mono text-gray-600 text-center truncate px-0.5" title={col}>
                {col.slice(0, 6)}
              </div>
            ))}
          </div>

          {data.columns.map((rowCol, r) => (
            <div key={r} className="flex items-center">
              <div style={{ width: 80, minWidth: 80 }} className="text-[10px] font-mono text-gray-500 truncate pr-2 text-right" title={rowCol}>
                {rowCol.slice(0, 10)}
              </div>

              {data.columns.map((_, c) => {
                const cell = data.cells?.find(x => x.x === c && x.y === r)
                const val  = cell?.value ?? 0
                const bg   = corrColor(val)
                const isDiag = r === c

                return (
                  <motion.div
                    key={c} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: (r * n + c) * 0.003 }}
                    style={{
                      width: CELL, height: CELL, minWidth: CELL,
                      backgroundColor: isDiag ? "rgba(99,102,241,0.25)" : bg,
                      opacity: isDiag ? 1 : 0.5 + Math.abs(val) * 0.5,
                    }}
                    className="flex items-center justify-center m-px rounded-sm cursor-default transition-opacity hover:opacity-100"
                    title={`${rowCol} × ${data.columns[c]}: ${val.toFixed(3)}`}
                  >
                    <span className="text-[8px] font-mono font-bold text-white/80 select-none">
                      {isDiag ? "1.0" : val.toFixed(1)}
                    </span>
                  </motion.div>
                )
              })}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 mt-4 justify-end border-t border-white/[0.01] pt-2">
          <span className="text-[10px] font-mono text-gray-600">Inverse Vector (-1.0)</span>
          <div className="flex gap-px">
            {[-1, -0.5, 0, 0.5, 1].map(v => (
              <div key={v} style={{ width: 20, height: 6, backgroundColor: corrColor(v) }} className="rounded-sm opacity-80" />
            ))}
          </div>
          <span className="text-[10px] font-mono text-gray-600">Covariant (+1.0)</span>
        </div>
      </div>
    </Section>
  )
}

// ─── 4. Outlier Summary ───────────────────────────────────────────────────────
function OutlierSummary({ data }: { data: OutlierRow[] }) {
  if (!data || data.length === 0) {
    return (
      <Section title="Statistical Distribution Outliers" sub="Interquartile Range outlier thresholds calculated for numerical columns">
        <div className="rounded-xl border p-8 text-center" style={{ background: CARD_BG, borderColor: BORDER }}>
          <p className="text-2xl mb-2 text-indigo-400">✓</p>
          <p className="text-sm text-gray-500 font-medium">No variance outliers discovered beyond regular standard distribution spreads.</p>
        </div>
      </Section>
    )
  }

  return (
    <Section title="Statistical Outlier project summary" sub="Numerical elements recorded beyond 1.5× IQR calculation models — isolated for visualization tracking without automatic data deletion">
      <div className="rounded-xl border overflow-x-auto w-full" style={{ background: CARD_BG, borderColor: BORDER }}>
        <table className="w-full text-left min-w-[500px]">
          <thead>
            <tr className="border-b" style={{ borderColor: BORDER }}>
              {["Target Feature", "Outlier Frequency", "Frame Ratio %", "Safe Variance Range Boundary"].map(h => (
                <th key={h} className="px-4 py-2.5 text-[10px] uppercase tracking-widest text-gray-600 font-bold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: BORDER }}>
            {data.map((row, i) => (
              <motion.tr
                key={row.column} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                className="hover:bg-white/[0.02] transition-colors"
              >
                <td className="px-4 py-3 font-mono text-[12px] text-white font-medium truncate max-w-[140px]">
                  {row.column}
                </td>
                <td className="px-4 py-3">
                  <span className="text-[12px] font-mono font-bold text-amber-400 tabular-nums">
                    {row.outliers} points
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-16 sm:w-20 h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-amber-500/60" style={{ width: `${Math.min(row.pct, 100)}%` }} />
                    </div>
                    <span className="text-[11px] font-mono text-gray-500 tabular-nums">{row.pct}%</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-[11px] font-mono text-gray-500 whitespace-nowrap">
                  [{row.lower?.toFixed(2)} → {row.upper?.toFixed(2)}]
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  )
}

// ─── 5. Before / After Comparison ────────────────────────────────────────────
function BeforeAfter({ data }: { data: CompareData }) {
  const scoreColor = data.score_change >= 0 ? "text-indigo-400" : "text-red-400"

  return (
    <Section title="Lineage Transformation Matrix Optimization Comparison" sub="Global model compliance improvement overview metrics tracking updates">
      <div className="space-y-6">
        <div className="rounded-xl border p-4 sm:p-6" style={{ background: CARD_BG, borderColor: BORDER }}>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Model Readiness Score Delta</p>
          <div className="flex flex-wrap items-end gap-x-6 gap-y-4 mt-3">
            <div>
              <p className="text-[11px] font-semibold text-gray-600 uppercase">Input Frame Profile</p>
              <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-red-400/80">{data.before_score}%</h2>
            </div>
            <div className={`${scoreColor} pb-1`}>
              <p className="text-xl sm:text-2xl font-black font-mono">+{data.score_change}%</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-600 uppercase">Sanitized Output Profile</p>
              <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-indigo-400">{data.after_score}%</h2>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            { title: "Sparsity Fixed", value: data.summary.missing_fixed },
            { title: "Duplicates Removed", value: data.summary.duplicates_removed },
            { title: "Memory Size Saved", value: formatKB(data.summary.memory_saved_kb), isStr: true },
            { title: "Pruned Row Rows", value: data.summary.rows_removed },
          ].map(card => (
            <div key={card.title} className="rounded-xl border border-white/5 p-4 sm:p-5 min-w-0" style={{ background: CARD_BG }}>
              <p className="text-gray-500 text-[10px] sm:text-xs font-bold uppercase tracking-wider truncate">{card.title}</p>
              <h3 className="text-2xl sm:text-3xl font-bold text-white mt-1.5 tabular-nums font-mono">
                {card.isStr ? card.value : formatNum(card.value as number)}
              </h3>
            </div>
          ))}
        </div>

        <div className="rounded-xl border overflow-x-auto w-full" style={{ background: CARD_BG, borderColor: BORDER }}>
          <table className="w-full min-w-[480px]">
            <thead>
              <tr className="border-b" style={{ borderColor: BORDER }}>
                <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-600">Metric Track Parameter</th>
                <th className="text-center text-[10px] font-bold uppercase tracking-widest text-gray-600 px-2">Before Matrix</th>
                <th className="text-center text-[10px] font-bold uppercase tracking-widest text-gray-600 px-2">After Matrix</th>
                <th className="text-center text-[10px] font-bold uppercase tracking-widest text-gray-600 px-2">Net Optimization</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: BORDER }}>
              {data.metrics?.map(metric => (
                <tr key={metric.label} className="hover:bg-white/[0.01] transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-gray-300 truncate max-w-[160px]">{metric.label}</td>
                  <td className="text-center text-sm font-mono text-gray-500 tabular-nums px-2">{metric.before}</td>
                  <td className="text-center text-sm font-mono text-indigo-400 font-bold tabular-nums px-2">{metric.after}</td>
                  <td className="text-center text-sm font-mono tabular-nums px-2">
                    <span className={metric.improvement >= 0 ? "text-indigo-400 font-semibold" : "text-red-400"}>
                      {metric.improvement >= 0 ? "+" : ""}
                      {metric.improvement}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Section>
  )
}

// ─── Tabs Configuration ───────────────────────────────────────────────────────
type TabKey = "distributions" | "missing" | "correlation" | "outliers" | "comparison"

interface TabItem {
  key: TabKey
  label: string
  needsCleaned?: boolean
}

const TABS: TabItem[] = [
  { key: "distributions", label: "Feature Distributions" },
  { key: "missing",       label: "Sparsity Analysis" },
  { key: "correlation",   label: "Cross Correlation" },
  { key: "outliers",      label: "Anomalous Outliers" },
  { key: "comparison",    label: "Lineage Comparison Overview", needsCleaned: true },
]

export default function AnalyticsPanel({ sessionId, cleanedSessionId }: Props) {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [comparison, setComparison] = useState<CompareData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [tab, setTab] = useState<TabKey>("distributions")

  useEffect(() => {
    setLoading(true)
    api.get(`/analytics/${sessionId}`)
      .then(({ data }) => setAnalytics(data))
      .catch(() => setError("Failed to pull active analytic parameter blocks from server."))
      .finally(() => setLoading(false))
  }, [sessionId])

  useEffect(() => {
    if (!cleanedSessionId) return
    api.get(`/analytics/compare/${sessionId}/${cleanedSessionId}`)
      .then(({ data }) => setComparison(data))
      .catch(() => {})
  }, [sessionId, cleanedSessionId])

  if (loading) {
    return (
      <div className="space-y-4 w-full">
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full"
          />
          <p className="text-sm text-gray-500 font-medium">Extracting predictive metrics and distributions...</p>
        </div>
        {[200, 180, 160].map((h, i) => <Skeleton key={i} h={h} />)}
      </div>
    )
  }

  if (error || !analytics) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6 text-center w-full">
        <p className="text-sm text-red-400 font-medium">{error || "No analytical components generated for this file session token."}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 w-full min-w-0">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Visual Analytics Console</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Statistical distribution insights mapping mathematical properties
        </p>
      </div>

      <div className="flex gap-1 border-b border-white/5 overflow-x-auto scrollbar-none">
        {TABS.filter(t => !t.needsCleaned || cleanedSessionId).map(t => (
          <button
            key={t.key} onClick={() => setTab(t.key)}
            className={`relative px-4 py-2.5 text-[13px] font-semibold whitespace-nowrap transition-colors shrink-0 ${
              tab === t.key ? "text-indigo-400" : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {t.label}
            {tab === t.key && (
              <motion.div layoutId="analytics-tab" className="absolute bottom-0 left-0 right-0 h-px bg-indigo-500" />
            )}
          </button>
        ))}
      </div>

      <div className="w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }} className="w-full min-w-0"
          >
            {tab === "distributions" && <DistributionCharts data={analytics.distributions} />}
            {tab === "missing" && <MissingHeatmap data={analytics.missing} />}
            {tab === "correlation" && <CorrelationMatrix data={analytics.correlation} />}
            {tab === "outliers" && <OutlierSummary data={analytics.outliers} />}
            {tab === "comparison" && comparison && <BeforeAfter data={comparison} />}
            {tab === "comparison" && !comparison && (
              <div className="rounded-xl border border-white/5 p-10 text-center" style={{ background: CARD_BG }}>
                <p className="text-sm text-gray-500 font-medium">
                  Execute operations within the Pilot Clean environment to activate comparative analytical models.
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
