// src/components/AnalyticsPanel.tsx
// Visual analytics: distributions, missing heatmap, correlation matrix,
// outlier summary, and before/after quality comparison.
// Requires: recharts, framer-motion

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
import axios from "axios"

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8000/api" })

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

// ─── Palette constants ────────────────────────────────────────────────────────
const INDIGO   = "#6366f1"
const VIOLET   = "#8b5cf6"
const GREEN    = "#22c55e"
const AMBER    = "#f59e0b"
const RED      = "#ef4444"
const MUTED    = "#334155"
const CARD_BG  = "#13151f"
const BORDER   = "rgba(255,255,255,0.05)"

const CORR_COLORS = [RED, "#f97316", AMBER, "#84cc16", GREEN]

function corrColor(v: number): string {
  // -1 → red,  0 → neutral,  +1 → green
  if (v >= 0.7)  return "#22c55e"
  if (v >= 0.3)  return "#86efac"
  if (v >= -0.3) return "#334155"
  if (v >= -0.7) return "#fca5a5"
  return "#ef4444"
}

// ─── Shared tooltip style ─────────────────────────────────────────────────────
const TT_STYLE = {
  background: "#1a1d27",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 8,
  fontSize: 11,
  color: "#94a3b8",
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────
function Skeleton({ h = 160 }: { h?: number }) {
  return (
    <div
      className="rounded-xl bg-[#13151f] border border-white/5 animate-pulse"
      style={{ height: h }}
    />
  )
}

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({ title, sub, children }: {
  title: string; sub?: string; children: React.ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-3"
    >
      <div>
        <p className="text-[14px] font-semibold text-white">{title}</p>
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
    <Section
      title="Column distributions"
      sub="Histogram for numeric columns, frequency bars for text"
    >
      <div className="grid grid-cols-2 gap-4">
        {visible.map((col, i) => (
          <motion.div
            key={col.column}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="rounded-xl border p-4 space-y-2"
            style={{ background: CARD_BG, borderColor: BORDER }}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-[12px] font-mono font-medium text-white truncate">
                {col.column}
              </p>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-mono shrink-0
                ${col.type === "histogram"
                  ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                  : "bg-amber-500/10 text-amber-400 border-amber-500/20"}`}>
                {col.type === "histogram" ? "numeric" : "text"}
              </span>
            </div>

            <ResponsiveContainer width="100%" height={110}>
              <BarChart data={col.data} margin={{ top: 4, right: 0, left: -28, bottom: 0 }}>
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 9, fill: "#475569" }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 9, fill: "#475569" }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={TT_STYLE}
                  cursor={{ fill: "rgba(255,255,255,0.03)" }}
                  formatter={(value) => [value as number, "Count"]}
                />
                <Bar dataKey="count" radius={[3, 3, 0, 0]} maxBarSize={32}>
                  {col.data.map((_, idx) => (
                    <Cell
                      key={idx}
                      fill={col.type === "histogram" ? INDIGO : VIOLET}
                      fillOpacity={0.7 + (idx / col.data.length) * 0.3}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Inline stats */}
            {col.type === "histogram" ? (
              <div className="flex gap-3 flex-wrap">
                {["mean", "median", "std"].map(k => (
                  col.stats[k] !== undefined && (
                    <span key={k} className="text-[10px] text-gray-600">
                      {k}{" "}
                      <span className="text-gray-400 font-mono">{col.stats[k]}</span>
                    </span>
                  )
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-gray-600">
                {col.stats.unique} unique · top:{" "}
                <span className="text-gray-400 font-mono">"{col.stats.top}"</span>
              </p>
            )}
          </motion.div>
        ))}
      </div>

      {/* Pagination */}
      {total > 1 && (
        <div className="flex items-center justify-center gap-2 pt-1">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-3 py-1 text-[12px] rounded-lg border border-white/5
              text-gray-500 hover:text-gray-300 disabled:opacity-30 transition-colors"
          >
            ← Prev
          </button>
          <span className="text-[11px] text-gray-600 tabular-nums">
            {page + 1} / {total}
          </span>
          <button
            onClick={() => setPage(p => Math.min(total - 1, p + 1))}
            disabled={page === total - 1}
            className="px-3 py-1 text-[12px] rounded-lg border border-white/5
              text-gray-500 hover:text-gray-300 disabled:opacity-30 transition-colors"
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
  if (data.per_col.length === 0) {
    return (
      <Section title="Missing values" sub="Distribution across your dataset">
        <div className="rounded-xl border p-10 text-center"
          style={{ background: CARD_BG, borderColor: BORDER }}>
          <p className="text-2xl mb-2">✓</p>
          <p className="text-sm text-gray-500">No missing values detected</p>
        </div>
      </Section>
    )
  }

  // Build a cell grid: rows × cols, mark missing cells
  const missingSet = new Set(data.cells.map(c => `${c.row}-${c.col}`))
  const CELL_SIZE = Math.max(6, Math.min(14, Math.floor(360 / data.cols)))

  return (
    <Section
      title="Missing values"
      sub={`${data.cells.length} missing cells across a ${data.rows}×${data.cols} sample`}
    >
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Grid heatmap */}
        <div className="rounded-xl border p-4 space-y-3"
          style={{ background: CARD_BG, borderColor: BORDER }}>
          <p className="text-[11px] text-gray-600 uppercase tracking-widest font-semibold">
            Cell map (sample)
          </p>

          {/* Column labels */}
          <div className="flex gap-px overflow-x-auto pb-1">
            {data.col_names.map((name, i) => (
              <div
                key={i}
                style={{ width: CELL_SIZE, minWidth: CELL_SIZE }}
                className="text-[7px] text-gray-700 truncate text-center"
                title={name}
              >
                {name.slice(0, 2)}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="space-y-px overflow-x-auto">
            {Array.from({ length: data.rows }).map((_, r) => (
              <div key={r} className="flex gap-px">
                {Array.from({ length: data.cols }).map((_, c) => {
                  const isMissing = missingSet.has(`${r}-${c}`)
                  return (
                    <div
                      key={c}
                      style={{
                        width: CELL_SIZE,
                        height: CELL_SIZE,
                        minWidth: CELL_SIZE,
                        backgroundColor: isMissing
                          ? "rgba(239,68,68,0.7)"
                          : "rgba(99,102,241,0.15)",
                        borderRadius: 1,
                      }}
                      title={isMissing ? `Missing: row ${r}, col ${data.col_names[c]}` : ""}
                    />
                  )
                })}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 pt-1">
            <span className="flex items-center gap-1.5 text-[10px] text-gray-600">
              <span className="w-3 h-3 rounded-sm bg-red-500/70" /> Missing
            </span>
            <span className="flex items-center gap-1.5 text-[10px] text-gray-600">
              <span className="w-3 h-3 rounded-sm bg-indigo-500/20" /> Present
            </span>
          </div>
        </div>

        {/* Bar chart */}
        <div className="rounded-xl border p-4 space-y-3"
          style={{ background: CARD_BG, borderColor: BORDER }}>
          <p className="text-[11px] text-gray-600 uppercase tracking-widest font-semibold">
            By column
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={data.per_col.slice(0, 12)}
              layout="vertical"
              margin={{ left: 0, right: 20, top: 0, bottom: 0 }}
            >
              <XAxis
                type="number"
                tick={{ fontSize: 10, fill: "#475569" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={v => `${v}%`}
                domain={[0, 100]}
              />
              <YAxis
                type="category"
                dataKey="column"
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                width={80}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={TT_STYLE}
                cursor={{ fill: "rgba(255,255,255,0.03)" }}
                formatter={(value) => [`${value}%`, "Missing"]}
              />
              <Bar dataKey="pct" radius={[0, 4, 4, 0]} maxBarSize={12}>
                {data.per_col.slice(0, 12).map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.pct > 30 ? RED : entry.pct > 10 ? AMBER : INDIGO}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Section>
  )
}

// ─── 3. Correlation Matrix ────────────────────────────────────────────────────
function CorrelationMatrix({ data }: { data: CorrData }) {
  if (data.columns.length < 2) {
    return (
      <Section title="Correlation matrix" sub="Pearson correlation between numeric columns">
        <div className="rounded-xl border p-8 text-center"
          style={{ background: CARD_BG, borderColor: BORDER }}>
          <p className="text-sm text-gray-500">
            Need at least 2 numeric columns to compute correlations.
          </p>
        </div>
      </Section>
    )
  }

  const n = data.columns.length
  const CELL = Math.max(28, Math.min(52, Math.floor(480 / n)))

  return (
    <Section
      title="Correlation matrix"
      sub="Pearson r between numeric columns — green = positive, red = negative"
    >
      <div className="rounded-xl border p-5 overflow-auto"
        style={{ background: CARD_BG, borderColor: BORDER }}>
        {/* Column headers */}
        <div className="flex" style={{ marginLeft: 80 }}>
          {data.columns.map((col, i) => (
            <div
              key={i}
              style={{ width: CELL, minWidth: CELL }}
              className="text-[9px] text-gray-600 text-center truncate px-0.5"
              title={col}
            >
              {col.slice(0, 6)}
            </div>
          ))}
        </div>

        {/* Rows */}
        {data.columns.map((rowCol, r) => (
          <div key={r} className="flex items-center">
            {/* Row label */}
            <div
              style={{ width: 80, minWidth: 80 }}
              className="text-[10px] text-gray-500 truncate pr-2 text-right"
              title={rowCol}
            >
              {rowCol.slice(0, 10)}
            </div>

            {/* Cells */}
            {data.columns.map((_, c) => {
              const cell = data.cells.find(x => x.x === c && x.y === r)
              const val  = cell?.value ?? 0
              const bg   = corrColor(val)
              const isDiag = r === c

              return (
                <motion.div
                  key={c}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: (r * n + c) * 0.008 }}
                  style={{
                    width: CELL,
                    height: CELL,
                    minWidth: CELL,
                    backgroundColor: isDiag ? "rgba(99,102,241,0.3)" : bg,
                    opacity: isDiag ? 1 : 0.5 + Math.abs(val) * 0.5,
                  }}
                  className="flex items-center justify-center m-px rounded-sm
                    cursor-default transition-opacity hover:opacity-100"
                  title={`${rowCol} × ${data.columns[c]}: ${val.toFixed(2)}`}
                >
                  <span className="text-[8px] font-mono text-white/70 select-none">
                    {isDiag ? "1" : val.toFixed(1)}
                  </span>
                </motion.div>
              )
            })}
          </div>
        ))}

        {/* Legend */}
        <div className="flex items-center gap-2 mt-4 justify-end">
          <span className="text-[10px] text-gray-600">−1</span>
          <div className="flex gap-px">
            {[-1, -0.5, 0, 0.5, 1].map(v => (
              <div
                key={v}
                style={{ width: 20, height: 8, backgroundColor: corrColor(v) }}
                className="rounded-sm opacity-80"
              />
            ))}
          </div>
          <span className="text-[10px] text-gray-600">+1</span>
        </div>
      </div>
    </Section>
  )
}

// ─── 4. Outlier Summary ───────────────────────────────────────────────────────
function OutlierSummary({ data }: { data: OutlierRow[] }) {
  if (data.length === 0) {
    return (
      <Section title="Outliers" sub="IQR-based detection across numeric columns">
        <div className="rounded-xl border p-8 text-center"
          style={{ background: CARD_BG, borderColor: BORDER }}>
          <p className="text-2xl mb-2">✓</p>
          <p className="text-sm text-gray-500">No outliers detected</p>
        </div>
      </Section>
    )
  }

  return (
    <Section
      title="Outliers"
      sub="Columns with values outside 1.5× IQR — flagged, not auto-deleted"
    >
      <div className="rounded-xl border overflow-hidden"
        style={{ background: CARD_BG, borderColor: BORDER }}>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b" style={{ borderColor: BORDER }}>
              {["Column", "Outliers", "% of rows", "Safe range"].map(h => (
                <th key={h}
                  className="px-4 py-2.5 text-[10px] uppercase tracking-widest
                    text-gray-600 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: BORDER }}>
            {data.map((row, i) => (
              <motion.tr
                key={row.column}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.04 }}
                className="hover:bg-white/[0.02] transition-colors"
              >
                <td className="px-4 py-3 font-mono text-[12px] text-white">
                  {row.column}
                </td>
                <td className="px-4 py-3">
                  <span className="text-[12px] font-semibold text-amber-400 tabular-nums">
                    {row.outliers}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-amber-500/70"
                        style={{ width: `${Math.min(row.pct, 100)}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-gray-500 tabular-nums">{row.pct}%</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-[11px] font-mono text-gray-500">
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

  const scoreColor =
    data.score_change >= 0
      ? "text-green-400"
      : "text-red-400"

  return (
    <Section
      title="Before vs After"
      sub="Overall improvement after cleaning"
    >

      <div className="space-y-6">

        {/* Score Card */}

        <div
          className="rounded-xl border p-6"
          style={{ background: CARD_BG, borderColor: BORDER }}
        >

          <div className="flex items-center justify-between">

            <div>

              <p className="text-gray-500 text-sm">
                Quality Score
              </p>

              <div className="flex items-end gap-6 mt-4">

                <div>

                  <p className="text-xs text-gray-500">
                    Before
                  </p>

                  <h2 className="text-5xl font-bold text-red-400">
                    {data.before_score}
                  </h2>

                </div>

                <div className={scoreColor}>
                  <p className="text-2xl font-bold">
                    +{data.score_change}
                  </p>
                </div>

                <div>

                  <p className="text-xs text-gray-500">
                    After
                  </p>

                  <h2 className="text-5xl font-bold text-green-400">
                    {data.after_score}
                  </h2>

                </div>

              </div>

            </div>

          </div>

        </div>

        {/* KPI Cards */}

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">

          {[
            {
              title: "Missing Fixed",
              value: data.summary.missing_fixed,
            },
            {
              title: "Duplicates Removed",
              value: data.summary.duplicates_removed,
            },
            {
              title: "Memory Saved (KB)",
              value: data.summary.memory_saved_kb,
            },
            {
              title: "Rows Removed",
              value: data.summary.rows_removed,
            },
          ].map(card => (

            <div
              key={card.title}
              className="rounded-xl border p-5"
              style={{
                background: CARD_BG,
                borderColor: BORDER,
              }}
            >

              <p className="text-gray-500 text-xs uppercase">
                {card.title}
              </p>

              <h3 className="text-3xl font-bold text-white mt-2">
                {card.value}
              </h3>

            </div>

          ))}

        </div>

        {/* Comparison Table */}

        <div
          className="rounded-xl border overflow-hidden"
          style={{
            background: CARD_BG,
            borderColor: BORDER,
          }}
        >

          <table className="w-full">

            <thead>

              <tr className="border-b border-white/5">

                <th className="text-left px-4 py-3 text-xs uppercase text-gray-500">
                  Metric
                </th>

                <th className="text-center text-xs uppercase text-gray-500">
                  Before
                </th>

                <th className="text-center text-xs uppercase text-gray-500">
                  After
                </th>

                <th className="text-center text-xs uppercase text-gray-500">
                  Improvement
                </th>

              </tr>

            </thead>

            <tbody>

              {data.metrics.map(metric => (

                <tr
                  key={metric.label}
                  className="border-b border-white/5"
                >

                  <td className="px-4 py-3">
                    {metric.label}
                  </td>

                  <td className="text-center">
                    {metric.before}
                  </td>

                  <td className="text-center text-green-400 font-semibold">
                    {metric.after}
                  </td>

                  <td className="text-center">

                    <span
                      className={
                        metric.improvement >= 0
                          ? "text-green-400"
                          : "text-red-400"
                      }
                    >

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

// ─── Tabs ─────────────────────────────────────────────────────────────────────
type TabKey =
  | "distributions"
  | "missing"
  | "correlation"
  | "outliers"
  | "comparison";

interface TabItem {
  key: TabKey;
  label: string;
  needsCleaned?: boolean;
}

const TABS: TabItem[] = [
  { key: "distributions", label: "Distributions" },
  { key: "missing", label: "Missing" },
  { key: "correlation", label: "Correlation" },
  { key: "outliers", label: "Outliers" },
  {
    key: "comparison",
    label: "Before/After",
    needsCleaned: true,
  },
];

// type TabKey = typeof TABS[number]["key"]

// ─── Main Component ───────────────────────────────────────────────────────────
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
      .catch(() => setError("Could not load analytics."))
      .finally(() => setLoading(false))
  }, [sessionId])

  useEffect(() => {
    if (!cleanedSessionId) return
    api.get(`/analytics/compare/${sessionId}/${cleanedSessionId}`)
      .then(({ data }) => setComparison(data))
      .catch(() => {})
  }, [cleanedSessionId])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
            className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full"
          />
          <p className="text-sm text-gray-500">Generating analytics…</p>
        </div>
        {[200, 180, 160].map((h, i) => <Skeleton key={i} h={h} />)}
      </div>
    )
  }

  if (error || !analytics) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6 text-center">
        <p className="text-sm text-red-400">{error || "No data available."}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 w-full">

      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-white">Visual analytics</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Charts and insights for your dataset
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-white/5 overflow-x-auto">
        {TABS.filter(t => !t.needsCleaned || cleanedSessionId).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`relative px-4 py-2.5 text-[13px] font-medium whitespace-nowrap
              transition-colors shrink-0
              ${tab === t.key ? "text-white" : "text-gray-500 hover:text-gray-300"}`}
          >
            {t.label}
            {tab === t.key && (
              <motion.div
                layoutId="analytics-tab"
                className="absolute bottom-0 left-0 right-0 h-px bg-indigo-500"
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {tab === "distributions" && (
            <DistributionCharts data={analytics.distributions} />
          )}
          {tab === "missing" && (
            <MissingHeatmap data={analytics.missing} />
          )}
          {tab === "correlation" && (
            <CorrelationMatrix data={analytics.correlation} />
          )}
          {tab === "outliers" && (
            <OutlierSummary data={analytics.outliers} />
          )}
          {tab === "comparison" && comparison && (
            <BeforeAfter data={comparison} />
          )}
          {tab === "comparison" && !comparison && (
            <div className="rounded-xl border border-white/5 p-10 text-center"
              style={{ background: CARD_BG }}>
              <p className="text-sm text-gray-500">
                Apply cleaning operations first to see a before/after comparison.
              </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}