import i18n from '@dhis2/d2-i18n'
import { useEffect } from 'react'
import { Range } from 'react-range'

// ---------------------------------------------------------------------------
// Period helpers
// ---------------------------------------------------------------------------

const MONTH_ABBR = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const

function parsePeriod(period: string): [number, number] {
    const hasDash = period.includes('-')
    return [
        parseInt(period.slice(0, 4), 10),
        parseInt(hasDash ? period.slice(5, 7) : period.slice(4, 6), 10),
    ]
}

function formatPeriod(period: string): string {
    const [year, mon] = parsePeriod(period)
    return `${MONTH_ABBR[(mon - 1) % 12]} ${year}`
}

function formatPeriodLong(period: string): string {
    const MONTHS_LONG = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December',
    ]
    const [year, mon] = parsePeriod(period)
    return `${MONTHS_LONG[(mon - 1) % 12]} ${year}`
}

function addMonths(period: string, n: number): string {
    const [year, mon] = parsePeriod(period)
    const d = new Date(year, mon - 1 + n, 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function shouldIgnoreHotkey(e: KeyboardEvent): boolean {
    if (e.defaultPrevented || e.repeat || e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) {
        return true
    }
    const t = e.target as HTMLElement | null
    return (
        t instanceof HTMLInputElement ||
        t instanceof HTMLTextAreaElement ||
        t instanceof HTMLSelectElement ||
        !!t?.isContentEditable
    )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface SplitPeriodSliderProps {
    splitPeriods: string[]
    selectedSplitPeriod: string | null
    onChange: (period: string) => void
    splitPeriodLength?: number
}

export function SplitPeriodSlider({
    splitPeriods,
    selectedSplitPeriod,
    onChange,
    splitPeriodLength = 3,
}: SplitPeriodSliderProps) {
    const maxIdx = splitPeriods.length - 1

    const selectedIdx = Math.max(
        0,
        splitPeriods.indexOf(selectedSplitPeriod ?? '')
    )

    const startPeriod = splitPeriods[selectedIdx] ?? splitPeriods[0]!
    const endPeriod = addMonths(startPeriod, splitPeriodLength - 1)
    const rangeLabel = `${formatPeriodLong(startPeriod)} - ${formatPeriodLong(endPeriod)}`

    // Window end index for track highlight
    const windowEndIdx = Math.min(maxIdx, selectedIdx + splitPeriodLength - 1)

    // Axis labels: first, middle, last (deduplicated)
    const midIdx = Math.floor(maxIdx / 2)
    const axisLabels = [0, midIdx, maxIdx]
        .filter((i, pos, arr) => arr.indexOf(i) === pos)
        .map((i) => ({ idx: i, label: formatPeriod(splitPeriods[i]!) }))

    // Keyboard navigation: j/ArrowLeft = back, k/ArrowRight = forward
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (shouldIgnoreHotkey(e)) { return }
            const key = e.key.toLowerCase()
            if (key === 'j' || key === 'arrowleft') {
                const next = Math.max(0, selectedIdx - 1)
                if (next !== selectedIdx && splitPeriods[next]) { onChange(splitPeriods[next]!) }
            } else if (key === 'k' || key === 'arrowright') {
                const next = Math.min(maxIdx, selectedIdx + 1)
                if (next !== selectedIdx && splitPeriods[next]) { onChange(splitPeriods[next]!) }
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [selectedIdx, maxIdx, splitPeriods, onChange])

    if (splitPeriods.length === 0) { return null }

    // 3-segment gradient: grey → blue window → grey
    const pct = maxIdx > 0 ? (selectedIdx / maxIdx) * 100 : 0
    const winEndPct = maxIdx > 0 ? Math.min(100, (windowEndIdx / maxIdx) * 100) : 0
    const trackGradient = `linear-gradient(to right, #b0bec5 ${pct}%, #4a90d9 ${pct}%, #4a90d9 ${winEndPct}%, #b0bec5 ${winEndPct}%)`

    return (
        <div className="flex items-center gap-6 py-3">
            {/* Label */}
            <span className="shrink-0 text-sm font-medium text-gray-600">
                {i18n.t('Split period')}
            </span>

            {/* Slider column */}
            <div className="min-w-0 flex-1">
                {/* Range label */}
                <div className="mb-2 text-center text-sm font-semibold text-gray-800">
                    {rangeLabel}
                </div>

                {/* Tick marks */}
                <div className="relative mb-1 flex items-end" style={{ paddingLeft: 1, paddingRight: 1 }}>
                    {splitPeriods.map((_, i) => {
                        const isSelected = i === selectedIdx
                        const inWindow = i > selectedIdx && i <= windowEndIdx
                        return (
                            <div
                                key={i}
                                style={{ flex: i < maxIdx ? '1 0 0' : '0 0 1px' }}
                                className="flex justify-start"
                            >
                                <div
                                    className={
                                        isSelected
                                            ? 'h-3 w-px bg-blue-600'
                                            : inWindow
                                                ? 'h-2 w-px bg-blue-400'
                                                : 'h-2 w-px bg-gray-300'
                                    }
                                />
                            </div>
                        )
                    })}
                </div>

                {/* react-range */}
                <Range
                    step={1}
                    min={0}
                    max={maxIdx}
                    values={[selectedIdx]}
                    onChange={(values) => {
                        const p = splitPeriods[values[0]!]
                        if (p) { onChange(p) }
                    }}
                    renderTrack={({ props, children }) => (
                        <div
                            {...props}
                            style={{
                                ...props.style,
                                height: '4px',
                                width: '100%',
                                borderRadius: '2px',
                                background: trackGradient,
                            }}
                        >
                            {children}
                        </div>
                    )}
                    renderThumb={({ props }) => {
                        const { key, ...restProps } = props
                        return (
                            <div
                                key={key}
                                {...restProps}
                                style={{
                                    ...restProps.style,
                                    width: 0,
                                    height: 0,
                                    borderLeft: '9px solid transparent',
                                    borderRight: '9px solid transparent',
                                    borderTop: '13px solid #1565c0',
                                    outline: 'none',
                                    cursor: 'pointer',
                                    marginTop: '2px',
                                    filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))',
                                }}
                            />
                        )
                    }}
                />

                {/* Axis labels */}
                <div className="relative mt-1.5 h-4">
                    {axisLabels.map(({ idx, label }) => {
                        const leftPct = maxIdx > 0 ? (idx / maxIdx) * 100 : 0
                        const transform =
                            idx === 0
                                ? 'translateX(0%)'
                                : idx === maxIdx
                                    ? 'translateX(-100%)'
                                    : 'translateX(-50%)'
                        return (
                            <span
                                key={idx}
                                className="absolute text-[11px] text-gray-400"
                                style={{ left: `${leftPct}%`, transform }}
                            >
                                {label}
                            </span>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
