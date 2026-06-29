// src/components/ProfilePanel.tsx
// Data profiling dashboard: quality score ring, KPI cards, column breakdown table.
// Requires: framer-motion, recharts, @tanstack/react-table

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts"
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table"

import type { SortingState } from "@tanstack/react-table"

// ─── Types ────────────────────────────────────────────────────────────────────
interface ColumnDetail {
  name: string
  dtype: string
  missing: number
  missing_pct: number
  unique: number
  completeness: number
  min?: number
  max?: number
  mean?: number
  median?: number
  std?: number
  mode?: number
  top_values?: Record<string, number>
}

interface ProfileData {
  rows: number
  columns: number
  missing_values: number
  missing_pct: number
  duplicates: number
  memory_kb: number
  quality_score: number
  columns_detail: ColumnDetail[]
}

interface Props {
  profile: ProfileData
  sessionId: string
  onStartCleaning?: () => void
}

// ─── Inline SVG icons ─────────────────────────────────────────────────────────
const Icon = {
  Rows: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/>
      <line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  ),
  Columns: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="7" height="18" rx="1"/><rect x="14" y="3" width="7" height="18" rx="1"/>
    </svg>
  ),
  Missing: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
  Duplicate: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  ),
  Memory: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
      <line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/>
    </svg>
  ),
  ChevronUp: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="18 15 12 9 6 15"/>
    </svg>
  ),
  ChevronDown: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  ),
  Search: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  Wand: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M15 4V2m0 14v-2M8 9H2m14 0h-2M13.8 6.2l1.4-1.4M6.2 13.8l1.4-1.4m8.4 1.4-1.4-1.4M6.2 6.2 4.8 4.8"/>
      <path d="m3 21 9-9"/>
    </svg>
  ),
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

function formatKB(kb: number): string {
  if (kb >= 1024) return `${(kb / 1024).toFixed(1)} MB`
  return `${kb.toFixed(1)} KB`
}

function scoreColor(score: number) {
  if (score >= 80) return { ring: "#4ade80", text: "text-green-400", label: "Good" }
  if (score >= 55) return { ring: "#facc15", text: "text-yellow-400", label: "Fair" }
  return { ring: "#f87171", text: "text-red-400", label: "Poor" }
}

function dtypeBadge(dtype: string) {
  const map: Record<string, { label: string; cls: string }> = {
    int64:   { label: "int",    cls: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
    float64: { label: "float",  cls: "bg-violet-500/10 text-violet-400 border-violet-500/20" },
    object:  { label: "string", cls: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
    bool:    { label: "bool",   cls: "bg-pink-500/10 text-pink-400 border-pink-500/20" },
  }
  const m = map[dtype] ?? { label: dtype, cls: "bg-gray-500/10 text-gray-400 border-gray-500/20" }
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-medium border ${m.cls}`}>
      {m.label}
    </span>
  )
}

// ─── Quality Score Ring ───────────────────────────────────────────────────────
function ScoreRing({ score }: { score: number }) {
  const { ring, text, label } = scoreColor(score)
  const r = 40
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ

  return (
    <div className="flex flex-col items-center justify-center gap-1">
      <div className="relative w-24 h-24">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          {/* Track */}
          <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="7" />
          {/* Progress */}
          <motion.circle
            cx="50" cy="50" r={r}
            fill="none"
            stroke={ring}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: circ - dash }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
            style={{ filter: `drop-shadow(0 0 6px ${ring}88)` }}
          />
        </svg>
        {/* Centre label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className={`text-2xl font-bold tabular-nums ${text}`}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          >
            {score}
          </motion.span>
        </div>
      </div>
      <div className="text-center">
        <p className={`text-xs font-semibold ${text}`}>{label}</p>
        <p className="text-[10px] text-gray-600 mt-0.5">quality score</p>
      </div>
    </div>
  )
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({
  icon, label, value, sub, accent = false, delay = 0,
}: {
  icon: React.ReactNode; label: string; value: string; sub?: string; accent?: boolean; delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className={`relative flex flex-col gap-3 p-4 rounded-xl border
        ${accent
          ? "bg-indigo-500/[0.07] border-indigo-500/20"
          : "bg-[#13151f] border-white/5"}`}
    >
      <div className={`w-7 h-7 flex items-center justify-center rounded-lg
        ${accent ? "bg-indigo-500/20 text-indigo-400" : "bg-white/5 text-gray-400"}`}>
        {icon}
      </div>
      <div>
        <p className="text-xl font-bold tabular-nums text-white">{value}</p>
        <p className="text-[11px] text-gray-500 mt-0.5">{label}</p>
        {sub && <p className="text-[10px] text-gray-600 mt-0.5">{sub}</p>}
      </div>
    </motion.div>
  )
}

// ─── Completeness Bar ─────────────────────────────────────────────────────────
function CompletenessBar({ pct }: { pct: number }) {
  const color = pct >= 90 ? "#4ade80" : pct >= 70 ? "#facc15" : "#f87171"
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color, width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
      <span className="text-[10px] tabular-nums text-gray-500 w-8 text-right">{pct}%</span>
    </div>
  )
}

// ─── Missing Values Mini Bar Chart ───────────────────────────────────────────
function MissingChart({ columns }: { columns: ColumnDetail[] }) {
  const data = columns
    .filter(c => c.missing > 0)
    .sort((a, b) => b.missing_pct - a.missing_pct)
    .slice(0, 10)
    .map(c => ({ name: c.name.length > 12 ? c.name.slice(0, 11) + "…" : c.name, pct: c.missing_pct }))

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 gap-2">
        <span className="text-3xl">✓</span>
        <p className="text-xs text-gray-500">No missing values</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} layout="vertical" margin={{ left: 0, right: 16, top: 4, bottom: 4 }}>
        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: "#6b7280" }}
          tickFormatter={v => `${v}%`} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#9ca3af" }}
          width={72} axisLine={false} tickLine={false} />
        <Tooltip
          cursor={{ fill: "rgba(255,255,255,0.03)" }}
          contentStyle={{ background: "#1a1d27", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 11 }}
          formatter={(value) => [`${value}%`, "Missing"]}
        />
        <Bar dataKey="pct" radius={[0, 4, 4, 0]} maxBarSize={14}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.pct > 30 ? "#f87171" : entry.pct > 10 ? "#facc15" : "#818cf8"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// ─── Column Table ─────────────────────────────────────────────────────────────
const colHelper = createColumnHelper<ColumnDetail>()

function ColumnTable({ columns }: { columns: ColumnDetail[] }) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState("")
  const [expanded, setExpanded] = useState<string | null>(null)

  const defs = useMemo(() => [
    colHelper.accessor("name", {
      header: "Column",
      cell: info => (
        <span className="font-mono text-[12px] text-white font-medium">{info.getValue()}</span>
      ),
    }),
    colHelper.accessor("dtype", {
      header: "Type",
      cell: info => dtypeBadge(info.getValue()),
    }),
    colHelper.accessor("unique", {
      header: "Unique",
      cell: info => (
        <span className="tabular-nums text-[12px] text-gray-400">{formatNum(info.getValue())}</span>
      ),
    }),
    colHelper.accessor("missing_pct", {
      header: "Missing",
      cell: info => {
        const pct = info.getValue()
        const color = pct === 0 ? "text-green-400" : pct > 20 ? "text-red-400" : "text-yellow-400"
        return (
          <span className={`tabular-nums text-[12px] font-medium ${color}`}>
            {pct === 0 ? "—" : `${pct}%`}
          </span>
        )
      },
    }),
    colHelper.accessor("completeness", {
      header: "Completeness",
      cell: info => <CompletenessBar pct={info.getValue()} />,
      size: 160,
    }),
  ], [])

  const table = useReactTable({
    data: columns,
    columns: defs,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600">
          <Icon.Search />
        </span>
        <input
          value={globalFilter}
          onChange={e => setGlobalFilter(e.target.value)}
          placeholder="Search columns…"
          className="w-full bg-[#13151f] border border-white/5 rounded-lg
            pl-8 pr-3 py-2 text-[13px] text-gray-300 placeholder-gray-600
            focus:outline-none focus:border-indigo-500/40 transition-colors"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-white/5 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id} className="border-b border-white/5 bg-[#13151f]">
                {hg.headers.map(h => (
                  <th
                    key={h.id}
                    onClick={h.column.getToggleSortingHandler()}
                    className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-widest
                      text-gray-600 cursor-pointer select-none whitespace-nowrap"
                    style={{ width: h.column.columnDef.size }}
                  >
                    <span className="flex items-center gap-1.5">
                      {flexRender(h.column.columnDef.header, h.getContext())}
                      {h.column.getIsSorted() === "asc" && <Icon.ChevronUp />}
                      {h.column.getIsSorted() === "desc" && <Icon.ChevronDown />}
                    </span>
                  </th>
                ))}
                <th className="px-4 py-2.5 w-8" />
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row, i) => {
              const col = row.original
              const isOpen = expanded === col.name
              return (
                <>
                  <motion.tr
                    key={row.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.025 }}
                    onClick={() => setExpanded(isOpen ? null : col.name)}
                    className="border-b border-white/[0.04] hover:bg-white/[0.02]
                      cursor-pointer transition-colors"
                  >
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="px-4 py-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                    {/* Expand chevron */}
                    <td className="px-4 py-3">
                      <motion.span
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        className="block text-gray-600"
                      >
                        <Icon.ChevronDown />
                      </motion.span>
                    </td>
                  </motion.tr>

                  {/* Expanded detail row */}
                  <AnimatePresence>
                    {isOpen && (
                      <tr key={`${row.id}-detail`}>
                        <td colSpan={6} className="px-4 pb-4 bg-[#0f1117]">
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="pt-3 grid grid-cols-2 gap-6">
                              {/* Stats */}
                              <div className="space-y-2">
                                <p className="text-[10px] uppercase tracking-widest text-gray-600 font-semibold">
                                  Statistics
                                </p>
                                <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                                  {[
                                    ["Min",    col.min],
                                    ["Max",    col.max],
                                    ["Mean",   col.mean],
                                    ["Median", col.median],
                                    ["Std dev",col.std],
                                    ["Mode",   col.mode],
                                  ].filter(([, v]) => v !== undefined && v !== null).map(([label, val]) => (
                                    <div key={label as string} className="flex justify-between">
                                      <span className="text-[11px] text-gray-600">{label}</span>
                                      <span className="text-[11px] tabular-nums text-gray-300 font-mono">
                                        {typeof val === "number" ? val.toLocaleString() : val as string}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Top values */}
                              {col.top_values && (
                                <div className="space-y-2">
                                  <p className="text-[10px] uppercase tracking-widest text-gray-600 font-semibold">
                                    Top values
                                  </p>
                                  <div className="space-y-1.5">
                                    {Object.entries(col.top_values).slice(0, 5).map(([k, v]) => {
                                      const total = Object.values(col.top_values!).reduce((a, b) => a + b, 0)
                                      const pct = Math.round((v / total) * 100)
                                      return (
                                        <div key={k} className="flex items-center gap-2">
                                          <span className="text-[11px] text-gray-400 w-24 truncate font-mono">{k}</span>
                                          <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                                            <div
                                              className="h-full bg-indigo-500/60 rounded-full"
                                              style={{ width: `${pct}%` }}
                                            />
                                          </div>
                                          <span className="text-[10px] text-gray-600 tabular-nums w-8 text-right">{pct}%</span>
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* Numeric only — no top values */}
                              {!col.top_values && col.mean !== undefined && (
                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                  Numeric column — expand stats on the left for distribution details.
                                </div>
                              )}
                            </div>
                          </motion.div>
                        </td>
                      </tr>
                    )}
                  </AnimatePresence>
                </>
              )
            })}
          </tbody>
        </table>

        {table.getRowModel().rows.length === 0 && (
          <div className="py-10 text-center text-sm text-gray-600">
            No columns match "{globalFilter}"
          </div>
        )}
      </div>

      <p className="text-[11px] text-gray-600 text-right">
        {table.getRowModel().rows.length} of {columns.length} columns · click a row for details
      </p>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ProfilePanel({ profile, sessionId, onStartCleaning }: Props) {
  const [activeTab, setActiveTab] = useState<"overview" | "columns" | "missing">("overview")
  const { ring } = scoreColor(profile.quality_score)

  const tabs = [
    { key: "overview",  label: "Overview" },
    { key: "columns",   label: `Columns (${profile.columns})` },
    { key: "missing",   label: "Missing values" },
  ] as const

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 w-full"
    >

      {/* ── Header row ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold text-white">Dataset profile</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Session <span className="font-mono text-gray-600 text-[11px]">{sessionId.slice(0, 8)}…</span>
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          onClick={onStartCleaning}
          className="flex items-center gap-2 px-4 py-2 rounded-lg
            bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium
            transition-colors shadow-lg shadow-indigo-500/20"
        >
          <Icon.Wand />
          Start cleaning
        </motion.button>
      </div>

      {/* ── Score + KPIs ── */}
      <div className="grid grid-cols-6 gap-4">
        {/* Score ring spans 1 col */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="col-span-1 flex items-center justify-center p-4 rounded-xl
            bg-[#13151f] border border-white/5"
          style={{ boxShadow: `0 0 30px ${ring}18` }}
        >
          <ScoreRing score={profile.quality_score} />
        </motion.div>

        {/* KPI cards span 5 cols */}
        <div className="col-span-5 grid grid-cols-5 gap-3">
          <KpiCard icon={<Icon.Rows />}      label="Total rows"      value={formatNum(profile.rows)}         delay={0.05} />
          <KpiCard icon={<Icon.Columns />}   label="Columns"         value={String(profile.columns)}         delay={0.10} />
          <KpiCard icon={<Icon.Missing />}   label="Missing values"  value={formatNum(profile.missing_values)}
            sub={`${profile.missing_pct}% of cells`}                                                         delay={0.15} />
          <KpiCard icon={<Icon.Duplicate />} label="Duplicates"      value={formatNum(profile.duplicates)}
            sub="exact row matches"                                                                           delay={0.20} />
          <KpiCard icon={<Icon.Memory />}    label="Memory usage"    value={formatKB(profile.memory_kb)}    delay={0.25} />
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 border-b border-white/5">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`relative px-4 py-2.5 text-[13px] font-medium transition-colors
              ${activeTab === t.key ? "text-white" : "text-gray-500 hover:text-gray-300"}`}
          >
            {t.label}
            {activeTab === t.key && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-px bg-indigo-500"
              />
            )}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      <AnimatePresence mode="wait">
        {activeTab === "overview" && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Quality score explainer */}
            <div className="rounded-xl bg-[#13151f] border border-white/5 p-5 space-y-4">
              <p className="text-[13px] font-semibold text-white">Score breakdown</p>
              {[
                {
                  label: "Missing data",
                  pct: Math.max(0, 40 - (profile.missing_pct / 100 * 40)),
                  max: 40,
                  desc: `${profile.missing_pct}% of cells are empty`,
                },
                {
                  label: "Duplicate rows",
                  pct: Math.max(0, 30 - (profile.duplicates / profile.rows * 30)),
                  max: 30,
                  desc: `${profile.duplicates} duplicate rows detected`,
                },
                {
                  label: "Type consistency",
                  pct: 30,
                  max: 30,
                  desc: "All columns have consistent types",
                },
              ].map(item => (
                <div key={item.label} className="space-y-1.5">
                  <div className="flex justify-between text-[12px]">
                    <span className="text-gray-400">{item.label}</span>
                    <span className="text-gray-500 tabular-nums">
                      {Math.round(item.pct)} / {item.max} pts
                    </span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${(item.pct / item.max) * 100}%` }}
                      transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                    />
                  </div>
                  <p className="text-[11px] text-gray-600">{item.desc}</p>
                </div>
              ))}
            </div>

            {/* Column type distribution */}
            <div className="rounded-xl bg-[#13151f] border border-white/5 p-5">
              <p className="text-[13px] font-semibold text-white mb-4">Column types</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(
                  profile.columns_detail.reduce((acc, c) => {
                    acc[c.dtype] = (acc[c.dtype] ?? 0) + 1
                    return acc
                  }, {} as Record<string, number>)
                ).map(([dtype, count]) => (
                  <div
                    key={dtype}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg
                      bg-white/[0.03] border border-white/5"
                  >
                    {dtypeBadge(dtype)}
                    <span className="text-[12px] text-gray-400 tabular-nums">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "columns" && (
          <motion.div
            key="columns"
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          >
            <ColumnTable columns={profile.columns_detail} />
          </motion.div>
        )}

        {activeTab === "missing" && (
          <motion.div
            key="missing"
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="rounded-xl bg-[#13151f] border border-white/5 p-5">
              <p className="text-[13px] font-semibold text-white mb-1">
                Missing values by column
              </p>
              <p className="text-[11px] text-gray-600 mb-5">
                Top 10 columns with the most missing data — colour coded by severity
              </p>
              <MissingChart columns={profile.columns_detail} />
            </div>

            {/* Per-column completeness list */}
            <div className="rounded-xl bg-[#13151f] border border-white/5 p-5 space-y-3">
              <p className="text-[13px] font-semibold text-white mb-4">All columns</p>
              {[...profile.columns_detail]
                .sort((a, b) => a.completeness - b.completeness)
                .map((col, i) => (
                  <motion.div
                    key={col.name}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center gap-3"
                  >
                    <span className="font-mono text-[11px] text-gray-400 w-36 truncate">{col.name}</span>
                    <CompletenessBar pct={col.completeness} />
                    <span className="text-[11px] text-gray-600 tabular-nums w-16 text-right shrink-0">
                      {col.missing === 0 ? "complete" : `${col.missing} missing`}
                    </span>
                  </motion.div>
                ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}