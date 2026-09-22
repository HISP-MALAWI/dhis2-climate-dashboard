import i18n from '@dhis2/d2-i18n'
import Highcharts from 'highcharts'
import 'highcharts/highcharts-more'
import HighchartsReact from 'highcharts-react-official'
import { forwardRef, useMemo, useRef } from 'react'
import { useResizeObserver } from 'usehooks-ts'
import type { EvaluationPeriodRow } from '../schemas'

interface BuildOptionsArgs {
    rows: EvaluationPeriodRow[]
    evaluationName: string
    containerHeight: number
}

function buildOptions({
    rows,
    evaluationName,
    containerHeight,
}: BuildOptionsArgs): Highcharts.Options {
    const categories = rows.map((r) => r.label)

    const actualData: (number | null)[] = rows.map((r) => r.actual)

    // Median: only for prediction periods, connect to last actual at boundary
    const lastHistoricalIdx = rows.reduce(
        (last, r, i) => (!r.isPrediction ? i : last),
        -1
    )
    const medianData: (number | null)[] = rows.map((r, i) => {
        if (r.isPrediction) {
            return r.q50
        }
        if (i === lastHistoricalIdx) {
            return r.actual
        }
        return null
    })

    const band80: ([number, number] | null)[] = rows.map((r) =>
        r.isPrediction && r.q10 !== null && r.q90 !== null
            ? [r.q10, r.q90]
            : null
    )

    const band50: ([number, number] | null)[] = rows.map((r) =>
        r.isPrediction && r.q25 !== null && r.q75 !== null
            ? [r.q25, r.q75]
            : null
    )

    return {
        chart: {
            type: 'line',
            height: containerHeight || undefined,
            style: { fontFamily: 'inherit' },
            animation: false,
        },
        title: { text: undefined },
        subtitle: {
            text: `${i18n.t('Evaluation')}: ${evaluationName}`,
            style: { fontSize: '12px', color: '#6b7280' },
            align: 'left',
        },
        credits: { enabled: false },
        exporting: { enabled: false },
        xAxis: {
            categories,
            labels: {
                rotation: -45,
                style: { fontSize: '11px', color: '#666666' },
            },
        },
        yAxis: {
            title: { text: undefined },
            min: 0,
            labels: {
                formatter() {
                    const v = this.value as number
                    return v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}`
                },
            },
        },
        legend: {
            enabled: true,
            align: 'center',
            verticalAlign: 'bottom',
            symbolWidth: 30,
        },
        tooltip: {
            shared: true,
            formatter() {
                const pts = this.points ?? []
                let s = `<b>${String(this.x)}</b><br/>`
                for (const pt of pts) {
                    const ptRange = pt as Highcharts.Point & {
                        low?: number
                        high?: number
                    }
                    s += `<span style="color:${String(pt.color)}">●</span> ${pt.series.name}: `
                    if (
                        ptRange.low !== undefined &&
                        ptRange.high !== undefined
                    ) {
                        s += `${Math.round(ptRange.low).toLocaleString()} – ${Math.round(ptRange.high).toLocaleString()}`
                    } else {
                        s +=
                            pt.y !== null && pt.y !== undefined
                                ? Math.round(pt.y).toLocaleString()
                                : '—'
                    }
                    s += '<br/>'
                }
                return s
            },
            useHTML: true,
        },
        plotOptions: {
            arearange: {
                lineWidth: 0,
                marker: { enabled: false },
                states: { hover: { lineWidthPlus: 0 } },
                connectNulls: false,
            },
            line: {
                marker: { enabled: false },
                connectNulls: false,
            },
        },
        series: [
            {
                type: 'line',
                name: i18n.t('Real Cases'),
                data: actualData,
                color: '#f97316',
                lineWidth: 2,
                zIndex: 4,
            },
            {
                type: 'arearange',
                name: i18n.t('80% prediction interval'),
                data: band80,
                color: '#bfdbfe',
                fillOpacity: 0.5,
                zIndex: 1,
            },
            {
                type: 'arearange',
                name: i18n.t('50% prediction interval'),
                data: band50,
                color: '#93c5fd',
                fillOpacity: 0.6,
                zIndex: 2,
            },
            {
                type: 'line',
                name: i18n.t('Median prediction'),
                data: medianData,
                color: '#1d4ed8',
                lineWidth: 2,
                zIndex: 3,
            },
        ] as Highcharts.SeriesOptionsType[],
    }
}

interface CompareEvaluationChartProps {
    evaluationName: string
    rows: EvaluationPeriodRow[]
}

export const CompareEvaluationChart = forwardRef<
    HighchartsReact.RefObject,
    CompareEvaluationChartProps
>(({ evaluationName, rows }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const chartRef = useRef<HighchartsReact.RefObject | null>(null)
    const { height = 320 } = useResizeObserver<HTMLDivElement>({
        // @ts-expect-error ref will always have a nullable value
        ref: containerRef!,
        box: 'border-box',
    })

    const options = useMemo(
        () => buildOptions({ rows, evaluationName, containerHeight: height }),
        [rows, evaluationName, height]
    )

    if (ref && typeof ref === 'object') {
        ref.current = chartRef.current
    }

    return (
        <div ref={containerRef} className="h-72">
            {rows.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-gray-400">
                    {i18n.t('No data available for this org unit')}
                </div>
            ) : (
                <HighchartsReact
                    ref={chartRef}
                    highcharts={Highcharts}
                    options={options}
                    containerProps={{
                        style: { height: '100%', width: '100%' },
                    }}
                />
            )}
        </div>
    )
})

CompareEvaluationChart.displayName = 'CompareEvaluationChart'
