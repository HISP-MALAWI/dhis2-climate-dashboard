import { useMemo, useRef, useState } from 'react'
import { formatWeekPeriod } from '../periods'

const COLORS = {
    prediction: '#155b96',
    predictionPoint: '#0d4f88',
    interval: '#b8dbef',
    intervalStroke: '#7eb9dc',
    endemic: '#c62828',
    alarm: '#a71319',
    grid: '#d8dee5',
    axis: '#68737d',
    text: '#263238',
}

function finite(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value)
}

function niceScale(values: number[], tickCount = 4) {
    const valid = values.filter(finite)
    if (!valid.length) {return { min: 0, max: 1, ticks: [0, 0.25, 0.5, 0.75, 1] }}

    const rawMin = Math.min(0, ...valid)
    const rawMax = Math.max(...valid)
    if (rawMax === rawMin) {
        const max = rawMax === 0 ? 1 : rawMax * 1.2
        return { min: 0, max, ticks: [0, max / 4, max / 2, (max * 3) / 4, max] }
    }

    const roughStep = (rawMax - rawMin) / tickCount
    const magnitude = 10 ** Math.floor(Math.log10(roughStep))
    const residual = roughStep / magnitude
    const niceFactor = residual <= 1 ? 1 : residual <= 2 ? 2 : residual <= 5 ? 5 : 10
    const step = niceFactor * magnitude
    const min = Math.floor(rawMin / step) * step
    const max = Math.ceil(rawMax / step) * step
    const ticks: number[] = []

    for (let value = min; value <= max + step / 100; value += step) {
        ticks.push(Number(value.toPrecision(12)))
    }

    return { min, max, ticks }
}

function linePath({
    points,
    key,
    x,
    y,
}: {
    points: Array<Record<string, unknown> | EwarsChartPoint>
    key: string
    x: (index: number) => number
    y: (value: number) => number
}) {
    let path = ''
    let drawing = false

    points.forEach((point, index) => {
        const record = point as Record<string, unknown>
        const value = record[key]
        if (!finite(value)) {
            drawing = false
            return
        }
        path += `${drawing ? ' L' : ' M'} ${x(index)} ${y(value)}`
        drawing = true
    })

    return path.trim()
}

function intervalSegments(
    points: Array<Record<string, unknown> | EwarsChartPoint>,
    lowerKey: string,
    upperKey: string
) {
    const segments: Array<Array<{ index: number; lower: number; upper: number }>> = []
    let current: Array<{ index: number; lower: number; upper: number }> = []

    points.forEach((point, index) => {
        const record = point as Record<string, unknown>
        const lowerValue = record[lowerKey]
        const upperValue = record[upperKey]

        if (finite(lowerValue) && finite(upperValue)) {
            current.push({
                index,
                lower: Number(lowerValue),
                upper: Number(upperValue),
            })
        } else if (current.length) {
            segments.push(current)
            current = []
        }
    })

    if (current.length) {segments.push(current)}
    return segments
}

function intervalPath(
    segment: Array<{ index: number; lower: number; upper: number }>,
    x: (index: number) => number,
    y: (value: number) => number
) {
    if (!segment.length) {return ''}
    const upper = segment.map((point) => `${x(point.index)} ${y(point.upper)}`)
    const lower = [...segment]
        .reverse()
        .map((point) => `${x(point.index)} ${y(point.lower)}`)

    return `M ${upper.join(' L ')} L ${lower.join(' L ')} Z`
}

function formatValue(value: unknown) {
    if (!finite(value)) {return '—'}
    return new Intl.NumberFormat(undefined, {
        maximumFractionDigits: Math.abs(value) < 10 ? 2 : 1,
    }).format(value)
}

function TooltipRow({
    color,
    label,
    value,
    dashed = false,
}: {
    color: string
    label: string
    value: string
    dashed?: boolean
}) {
    return (
        <div className="chart-tooltip-row">
            <span
                className="chart-tooltip-swatch"
                style={{
                    background: dashed ? 'transparent' : color,
                    borderColor: color,
                    borderStyle: dashed ? 'dashed' : 'solid',
                }}
            />
            <span>{label}</span>
            <strong>{value}</strong>
        </div>
    )
}

export interface EwarsChartPoint {
    period: string
    predictedRate: number | null
    predictedRateLower: number | null
    predictedRateUpper: number | null
    endemicChannel: number | null
    outbreakProbability: number | null
    alarmSignal: number | null
    outbreakPeriod: number | null
    predictedCases?: number | null
    predictedCasesLower?: number | null
    predictedCasesUpper?: number | null
}

export default function EwarsChart({
    points,
    metric,
}: {
    points: EwarsChartPoint[]
    metric: 'rate' | 'cases'
}) {
    const [hoverIndex, setHoverIndex] = useState<number | null>(null)
    const svgRef = useRef<SVGSVGElement | null>(null)

    const isRate = metric === 'rate'
    const predictionKey = isRate ? 'predictedRate' : 'predictedCases'
    const lowerKey = isRate ? 'predictedRateLower' : 'predictedCasesLower'
    const upperKey = isRate ? 'predictedRateUpper' : 'predictedCasesUpper'

    const width = 1200
    const height = 370
    const margin = { top: 16, right: 22, bottom: 58, left: 68 }
    const plotWidth = width - margin.left - margin.right
    const plotHeight = height - margin.top - margin.bottom

    const scale = useMemo(() => {
        const values: number[] = []
        points.forEach((point) => {
            values.push(
                Number(point[predictionKey] ?? 0),
                Number(point[lowerKey] ?? 0),
                Number(point[upperKey] ?? 0)
            )
            if (isRate) {values.push(Number(point.endemicChannel ?? 0))}
        })
        return niceScale(values)
    }, [points, predictionKey, lowerKey, upperKey, isRate])

    const x = (index: number) =>
        points.length <= 1
            ? margin.left + plotWidth / 2
            : margin.left + (index / (points.length - 1)) * plotWidth
    const y = (value: number) =>
        margin.top + ((scale.max - value) / (scale.max - scale.min || 1)) * plotHeight

    const xTickIndices = useMemo(() => {
        if (!points.length) {return []}
        const step = Math.max(1, Math.ceil(points.length / 10))
        const values: number[] = []
        for (let index = 0; index < points.length; index += step) {values.push(index)}
        if (values[values.length - 1] !== points.length - 1) {values.push(points.length - 1)}
        return values
    }, [points])

    const segments = useMemo(
        () => intervalSegments(points, lowerKey, upperKey),
        [points, lowerKey, upperKey]
    )

    const onPointerMove = (event: React.MouseEvent<SVGSVGElement>) => {
        if (!svgRef.current || !points.length) {return}
        const rect = svgRef.current.getBoundingClientRect()
        const svgX = ((event.clientX - rect.left) / rect.width) * width
        const ratio = Math.max(0, Math.min(1, (svgX - margin.left) / plotWidth))
        setHoverIndex(Math.round(ratio * Math.max(0, points.length - 1)))
    }

    const hovered = hoverIndex === null ? null : points[hoverIndex]
    const hoverX = hoverIndex === null ? 0 : x(hoverIndex)
    const tooltipOnRight = hoverX < width * 0.7

    const renderStyle = `
      .chart-shell { position: relative; width: 100%; }
      .ewars-chart { display: block; width: 100%; height: auto; background: #f8fafc; }
      .axis-label { font-size: 11px; fill: #68737d; font-family: inherit; }
      .axis-title { font-size: 12px; fill: #374151; font-weight: 600; font-family: inherit; }
      .x-axis-label { font-size: 10px; }
      .chart-tooltip { position: absolute; transform: translate(-50%, -100%); margin-top: -10px; min-width: 190px; background: rgba(255,255,255,0.96); border: 1px solid #dfe7ee; box-shadow: 0 8px 20px rgba(15, 23, 42, 0.12); border-radius: 8px; padding: 10px 12px; color: #1f2937; pointer-events: none; }
      .tooltip-right { left: 50%; }
      .tooltip-left { left: 50%; }
      .chart-tooltip-title { font-size: 12px; font-weight: 700; margin-bottom: 8px; }
      .chart-tooltip-row { display: flex; align-items: center; gap: 8px; font-size: 12px; margin-bottom: 4px; }
      .chart-tooltip-swatch { display: inline-block; width: 10px; height: 10px; border-radius: 50%; border: 1px solid; }
      .chart-tooltip-detail { margin-top: 6px; font-size: 12px; }
    .chart-legend { display: flex; flex-direction: row; flex-wrap: nowrap; justify-content: center; gap: 14px; align-items: center; margin-top: 5px; color: #475569; font-size: 12px; white-space: nowrap; }
      .legend-item { display: inline-flex; align-items: center; gap: 8px; }
      .legend-line { display: inline-block; width: 20px; height: 2px; background: #155b96; border-radius: 2px; }
      .legend-band { display: inline-block; width: 20px; height: 10px; background: rgba(184, 219, 239, 0.8); border: 1px solid #7eb9dc; border-radius: 2px; }
      .legend-alarm { display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: #a71319; border: 2px solid #fff; box-shadow: 0 0 0 1px #a71319; }
      .endemic-line { background: #c62828; }
    `

    return (
        <div className="chart-shell">
            <style>{renderStyle}</style>
            <svg
                ref={svgRef}
                className="ewars-chart"
                viewBox={`0 0 ${width} ${height}`}
                role="img"
                aria-label={`EWARS ${isRate ? 'incidence rate per 100,000' : 'predicted cases'} by ISO week`}
                onMouseMove={onPointerMove}
                onMouseLeave={() => setHoverIndex(null)}
            >
                <title>
                    EWARS {isRate ? 'incidence rate per 100,000' : 'predicted cases'} by ISO week
                </title>

                {scale.ticks.map((tick) => (
                    <g key={tick}>
                        <line
                            x1={margin.left}
                            x2={width - margin.right}
                            y1={y(tick)}
                            y2={y(tick)}
                            stroke={COLORS.grid}
                            strokeDasharray="3 4"
                        />
                        <text
                            x={margin.left - 10}
                            y={y(tick) + 4}
                            textAnchor="end"
                            className="axis-label"
                        >
                            {formatValue(tick)}
                        </text>
                    </g>
                ))}

                {points.map((point, index) =>
                    Number(point.outbreakPeriod) > 0 ? (
                        <rect
                            key={`outbreak-${point.period}`}
                            x={x(index) - Math.max(3, plotWidth / Math.max(1, points.length - 1) / 2)}
                            y={margin.top}
                            width={Math.max(6, plotWidth / Math.max(1, points.length - 1))}
                            height={plotHeight}
                            fill="rgba(198, 40, 40, 0.045)"
                        />
                    ) : null
                )}

                {segments.map((segment, index) => (
                    <path
                        key={`interval-${index}`}
                        d={intervalPath(segment, x, y)}
                        fill={COLORS.interval}
                        fillOpacity="0.52"
                        stroke="none"
                    />
                ))}

                <path
                    d={linePath({ points, key: upperKey, x, y })}
                    fill="none"
                    stroke={COLORS.intervalStroke}
                    strokeWidth="1.2"
                    strokeOpacity="0.85"
                />
                <path
                    d={linePath({ points, key: lowerKey, x, y })}
                    fill="none"
                    stroke={COLORS.intervalStroke}
                    strokeWidth="1.2"
                    strokeOpacity="0.85"
                />

                {isRate && (
                    <path
                        d={linePath({ points, key: 'endemicChannel', x, y })}
                        fill="none"
                        stroke={COLORS.endemic}
                        strokeWidth="2.1"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                    />
                )}

                <path
                    d={linePath({ points, key: predictionKey, x, y })}
                    fill="none"
                    stroke={COLORS.prediction}
                    strokeWidth="3"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                />

                {points.map((point, index) =>
                    Number(point.alarmSignal) > 0 && finite(point[predictionKey]) ? (
                        <g key={`alarm-${point.period}`}>
                            <circle
                                cx={x(index)}
                                cy={y(Number(point[predictionKey]))}
                                r="5"
                                fill="#fff"
                                stroke={COLORS.alarm}
                                strokeWidth="2.5"
                            />
                            <circle
                                cx={x(index)}
                                cy={y(Number(point[predictionKey]))}
                                r="2"
                                fill={COLORS.alarm}
                            />
                        </g>
                    ) : null
                )}

                <line
                    x1={margin.left}
                    x2={margin.left}
                    y1={margin.top}
                    y2={margin.top + plotHeight}
                    stroke={COLORS.axis}
                />
                <line
                    x1={margin.left}
                    x2={width - margin.right}
                    y1={margin.top + plotHeight}
                    y2={margin.top + plotHeight}
                    stroke={COLORS.axis}
                />

                {xTickIndices.map((index) => (
                    <g key={points[index].period}>
                        <line
                            x1={x(index)}
                            x2={x(index)}
                            y1={margin.top + plotHeight}
                            y2={margin.top + plotHeight + 5}
                            stroke={COLORS.axis}
                        />
                        <text
                            x={x(index)}
                            y={margin.top + plotHeight + 22}
                            textAnchor="middle"
                            className="axis-label x-axis-label"
                        >
                            {formatWeekPeriod(points[index].period)}
                        </text>
                    </g>
                ))}

                <text
                    x={16}
                    y={margin.top + plotHeight / 2}
                    transform={`rotate(-90 16 ${margin.top + plotHeight / 2})`}
                    textAnchor="middle"
                    className="axis-title"
                >
                    {isRate ? 'Rate per 100,000' : 'Cases'}
                </text>

                {hovered && (
                    <g pointerEvents="none">
                        <line
                            x1={hoverX}
                            x2={hoverX}
                            y1={margin.top}
                            y2={margin.top + plotHeight}
                            stroke="#6b7680"
                            strokeDasharray="4 4"
                            strokeOpacity="0.75"
                        />
                        {finite(hovered[predictionKey]) && (
                            <circle
                                cx={hoverX}
                                cy={y(Number(hovered[predictionKey]))}
                                r="4.5"
                                fill="#fff"
                                stroke={COLORS.predictionPoint}
                                strokeWidth="2.5"
                            />
                        )}
                    </g>
                )}

                <rect
                    x={margin.left}
                    y={margin.top}
                    width={plotWidth}
                    height={plotHeight}
                    fill="transparent"
                />
            </svg>

            {hovered && (
                <div
                    className={`chart-tooltip ${tooltipOnRight ? 'tooltip-right' : 'tooltip-left'}`}
                    style={{ left: `${(hoverX / width) * 100}%` }}
                    role="status"
                >
                    <div className="chart-tooltip-title">{formatWeekPeriod(hovered.period)}</div>
                    <TooltipRow
                        color={COLORS.prediction}
                        label={isRate ? 'Predicted rate' : 'Predicted cases'}
                        value={formatValue(hovered[predictionKey])}
                    />
                    <TooltipRow
                        color={COLORS.intervalStroke}
                        label="Lower 95% CI"
                        value={formatValue(hovered[lowerKey])}
                    />
                    <TooltipRow
                        color={COLORS.intervalStroke}
                        label="Upper 95% CI"
                        value={formatValue(hovered[upperKey])}
                    />
                    {isRate && (
                        <TooltipRow
                            color={COLORS.endemic}
                            label="Endemic channel"
                            value={formatValue(hovered.endemicChannel)}
                        />
                    )}
                    <div className="chart-tooltip-detail">
                        Outbreak probability:{' '}
                        <strong>
                            {finite(hovered.outbreakProbability)
                                ? `${formatValue(hovered.outbreakProbability * 100)}%`
                                : '—'}
                        </strong>
                    </div>
                    <div className="chart-tooltip-detail">
                        Alarm: <strong>{Number(hovered.alarmSignal) > 0 ? 'Yes' : 'No'}</strong>
                    </div>
                </div>
            )}

            <div className="chart-legend" aria-label="Chart legend">
                <span className="legend-item">
                    <i className="legend-line prediction-line" /> Predicted
                </span>
                <span className="legend-item">
                    <i className="legend-band" /> 95% credible interval
                </span>
                {isRate && (
                    <span className="legend-item">
                        <i className="legend-line endemic-line" /> Endemic channel
                    </span>
                )}
                <span className="legend-item">
                    <i className="legend-alarm" /> Alarm week
                </span>
            </div>
        </div>
    )
}
