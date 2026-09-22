import i18n from '@dhis2/d2-i18n'
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'
import { useMemo, useRef } from 'react'
import { useResizeObserver } from 'usehooks-ts'
import type { ThresholdType } from '../constants'
import type { ThresholdRow } from '../schemas'

interface ThresholdChartProps {
    rows: ThresholdRow[]
    orgUnitName: string
    selectedThresholds: ThresholdType[]
}

export function ThresholdChart({
    rows,
    orgUnitName,
    selectedThresholds,
}: ThresholdChartProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const { height = 0 } = useResizeObserver<HTMLDivElement>({
        // @ts-expect-error ref will always have a nullable value
        ref: containerRef!,
        box: 'border-box',
    })

    const options = useMemo<Highcharts.Options>(() => {
        const categories = rows.map((r) => r.label)
        const actualData = rows.map((r) => r.actual)

        const thresholdSeries: Highcharts.SeriesOptionsType[] =
            selectedThresholds.map((t) => ({
                type: 'line' as const,
                name: t.label,
                data: rows.map((r) => r.thresholds[t.id] ?? null),
                color: t.color,
                lineWidth: 2,
                dashStyle: 'ShortDash' as const,
                zIndex: 3,
                marker: { enabled: false },
                dataLabels: { enabled: false },
            }))

        return {
            chart: {
                type: 'line',
                height: height || undefined,
                style: { fontFamily: 'inherit' },
                animation: false,
            },
            title: { text: undefined },
            subtitle: {
                text: orgUnitName,
                style: { fontSize: '12px', color: '#6b7280' },
                align: 'left' as const,
            },
            xAxis: {
                categories,
                labels: {
                    style: { fontSize: '11px', color: '#666' },
                    rotation: -30,
                },
                crosshair: true,
            },
            yAxis: {
                title: { text: i18n.t('Confirmed Cases') },
                min: 0,
                tickAmount: 5,
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
                crosshairs: true,
                formatter() {
                    const pts = this.points ?? []
                    let s = `<b>${this.x}</b><br/>`
                    for (const pt of pts) {
                        s += `<span style="color:${pt.color}">●</span> ${pt.series.name}: `
                        s +=
                            pt.y !== null && pt.y !== undefined
                                ? Math.round(pt.y).toLocaleString()
                                : '—'
                        s += '<br/>'
                    }
                    return s
                },
                useHTML: true,
            },
            plotOptions: {
                line: {
                    marker: { enabled: false },
                    connectNulls: false,
                },
            },
            series: [
                {
                    type: 'line',
                    name: i18n.t('Actual Cases'),
                    data: actualData,
                    color: '#16a34a',
                    lineWidth: 2.5,
                    zIndex: 4,
                    dataLabels: {
                        enabled: true,
                        formatter() {
                            if (this.y === null || this.y === undefined) {
                                return null
                            }
                            return this.y >= 1000
                                ? `${(this.y / 1000).toFixed(1)}k`
                                : `${Math.round(this.y)}`
                        },
                        style: {
                            fontSize: '10px',
                            fontWeight: '600',
                            color: '#16a34a',
                            textOutline: 'none',
                        },
                    },
                },
                ...thresholdSeries,
            ],
            exporting: { enabled: false },
            credits: { enabled: false },
        }
    }, [rows, orgUnitName, selectedThresholds, height])

    return (
        <div ref={containerRef} className="h-full w-full">
            <HighchartsReact
                highcharts={Highcharts}
                options={options}
                containerProps={{ style: { height: '100%' } }}
            />
        </div>
    )
}
