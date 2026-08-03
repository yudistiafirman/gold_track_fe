import { useState } from 'react'
import { formatCompactCurrency, formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'

export interface ExpenseDonutSlice {
  id: string
  label: string
  value: number
}

/** Fixed categorical order, validated for adjacent CVD/contrast separation — never reassign per-render. */
const SERIES_COLORS = [
  '#2a78d6', // blue
  '#eb6834', // orange
  '#1baf7a', // aqua
  '#eda100', // yellow
  '#e87ba4', // magenta
  '#008300', // green
]
const OTHER_COLOR = '#98A2B3'
const MAX_SLICES = SERIES_COLORS.length

const SIZE = 176
const STROKE = 26
const RADIUS = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const GAP_PX = 3

interface Segment {
  id: string
  label: string
  value: number
  color: string
  fraction: number
  start: number
  rawLength: number
}

interface ExpenseDonutChartProps {
  data: ExpenseDonutSlice[]
  total?: number
}

export function ExpenseDonutChart({ data, total: totalOverride }: ExpenseDonutChartProps) {
  const [activeId, setActiveId] = useState<string | null>(null)

  const sorted = [...data].filter((slice) => slice.value > 0).sort((a, b) => b.value - a.value)
  const total = totalOverride ?? sorted.reduce((sum, slice) => sum + slice.value, 0)

  if (total <= 0 || sorted.length === 0) {
    return (
      <div className="flex h-44 items-center justify-center text-caption text-gray-500">
        Tidak ada data pengeluaran.
      </div>
    )
  }

  const top = sorted.slice(0, MAX_SLICES).map((slice, index) => ({ ...slice, color: SERIES_COLORS[index] }))
  const rest = sorted.slice(MAX_SLICES)
  const visible = rest.length > 0
    ? [
        ...top,
        {
          id: '__other__',
          label: 'Lainnya',
          value: rest.reduce((sum, slice) => sum + slice.value, 0),
          color: OTHER_COLOR,
        },
      ]
    : top

  let cumulative = 0
  const segments: Segment[] = visible.map((slice) => {
    const fraction = slice.value / total
    const rawLength = fraction * CIRCUMFERENCE
    const start = cumulative
    cumulative += rawLength
    return { ...slice, fraction, start, rawLength }
  })

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
      <div className="relative shrink-0">
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="-rotate-90"
          role="group"
          aria-label="Rincian pengeluaran per kategori"
        >
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="var(--color-gray-100)"
            strokeWidth={STROKE}
          />
          {segments.map((segment) => {
            const hasGap = segment.rawLength > GAP_PX * 3
            const gap = hasGap ? GAP_PX : 0
            const arcLength = Math.max(segment.rawLength - gap, 0.5)
            const offset = segment.start + gap / 2
            const isActive = activeId === segment.id
            const isDimmed = activeId !== null && !isActive

            return (
              <circle
                key={segment.id}
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                fill="none"
                stroke={segment.color}
                strokeWidth={isActive ? STROKE + 4 : STROKE}
                strokeDasharray={`${arcLength} ${CIRCUMFERENCE - arcLength}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
                tabIndex={0}
                role="img"
                aria-label={`${segment.label}: ${formatCurrency(segment.value)} (${(segment.fraction * 100).toFixed(1)}%)`}
                className={cn('transition-[stroke-width,opacity] duration-150 outline-none', isDimmed && 'opacity-40')}
                onPointerEnter={() => setActiveId(segment.id)}
                onPointerLeave={() => setActiveId((current) => (current === segment.id ? null : current))}
                onFocus={() => setActiveId(segment.id)}
                onBlur={() => setActiveId((current) => (current === segment.id ? null : current))}
              />
            )
          })}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-caption text-gray-500">Total</span>
          <span className="text-h3 tabular-nums text-gray-900">{formatCompactCurrency(total)}</span>
        </div>
      </div>

      <ul className="flex w-full min-w-0 flex-col gap-1">
        {segments.map((segment) => (
          <li
            key={segment.id}
            className={cn(
              'flex items-center justify-between gap-3 rounded-md px-2 py-1.5 transition-colors',
              activeId === segment.id && 'bg-accent',
            )}
            onPointerEnter={() => setActiveId(segment.id)}
            onPointerLeave={() => setActiveId((current) => (current === segment.id ? null : current))}
          >
            <div className="flex min-w-0 items-center gap-2">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: segment.color }}
                aria-hidden
              />
              <span className="truncate text-caption text-gray-700">{segment.label}</span>
            </div>
            <div className="flex shrink-0 items-baseline gap-2">
              <span className="text-table-num text-gray-900">{formatCurrency(segment.value)}</span>
              <span className="w-10 text-right text-caption text-gray-500">
                {(segment.fraction * 100).toFixed(1)}%
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
