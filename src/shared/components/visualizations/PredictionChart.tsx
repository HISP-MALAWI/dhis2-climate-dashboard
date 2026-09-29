import i18n from '@dhis2/d2-i18n'
import { FlyoutMenu, MenuItem, Tab, TabBar } from '@dhis2/ui'
import { IconChevronDown16, IconChevronUp16 } from '@dhis2/ui-icons'
import Highcharts from 'highcharts'
import 'highcharts/highcharts-more'
import HighchartsReact from 'highcharts-react-official'
import { forwardRef, useEffect, useMemo, useRef, useState } from 'react'
import { useResizeObserver } from 'usehooks-ts'
import { FORECAST_CHART_TABS } from '@/modules/chap-forecast-alerts/constants'
import type { ForecastChartTab } from '@/modules/chap-forecast-alerts/constants'
import type { ForecastRow } from '@/modules/chap-forecast-alerts/schemas'
import {
    formatForecastValue,
    getForecastTableRows,
    type ForecastRowEmphasis,
} from '@/modules/chap-forecast-alerts/utils/forecastTable'
import { formatPeriod } from '@/modules/chap-forecast-alerts/utils/periods'
import type { ChartRef } from '@/shared/schemas'

const ROW_CLASSES: Record<ForecastRowEmphasis, { row: string; label: string }> =
    {
        none: { row: 'hover:bg-gray-50', label: 'text-gray-700' },
        median: {
            row: 'bg-blue-50 hover:bg-blue-100',
            label: 'font-medium text-blue-700',
        },
        alert: {
            row: 'bg-red-50 hover:bg-red-100',
            label: 'font-medium text-red-700',
        },
    }

interface PredictionChartProps {
    rows: ForecastRow[]
    orgUnitName?: string
    chartTabs?: ForecastChartTab[]
    /** Reports which view is on screen, so the card can offer the right download. */
    onTableViewChange?: (isTable: boolean) => void
}

const TABLE_VIEW = 'table'

function buildForecastLabel(rows: ForecastRow[]): string {
    const pred = rows.filter((r) => r.isPrediction)
    if (pred.length === 0) {
        return ''
    }
    const first = formatPeriod(pred[0].period)
    const last = formatPeriod(pred[pred.length - 1].period)
    const [firstMon, firstYear] = first.split(' ')
    const [lastMon, lastYear] = last.split(' ')
    return firstYear === lastYear
        ? `${firstMon}–${lastMon} ${firstYear}`
        : `${first}–${last}`
}

export const PredictionChart = forwardRef<
    HighchartsReact.RefObject,
    PredictionChartProps
>(function PredictionChart(
    { rows, orgUnitName, chartTabs = FORECAST_CHART_TABS, onTableViewChange },
    ref
) {
    const containerRef = useRef<HTMLDivElement>(null)
    const { height = 0 } = useResizeObserver<HTMLDivElement>({
        // @ts-expect-error ref will always have a nullable value
        ref: containerRef!,
        box: 'border-box',
    })

    const visibleTabs = useMemo(() => {
        const configured = chartTabs.filter((tab) =>
            tab.referenceLines.every((l) => l.indicatorId !== '')
        )
        if (configured.length > 0) {
            return configured
        }
        const [first] = chartTabs
        return first
            ? [
                  {
                      ...first,
                      referenceLines: first.referenceLines.filter(
                          (l) => l.indicatorId !== ''
                      ),
                  },
              ]
            : []
    }, [chartTabs])

    const [view, setView] = useState<string>(visibleTabs[0]?.id ?? TABLE_VIEW)
    const [menuOpen, setMenuOpen] = useState(false)

    const activeTab =
        visibleTabs.find((tab) => tab.id === view) ?? visibleTabs[0] ?? null
    const activeReferenceLines = activeTab?.referenceLines ?? []
    const hasMultipleTabs = visibleTabs.length > 1

    const options = useMemo<Highcharts.Options>(() => {
        const categories = rows.map((r) => r.label)
        const forecastLabel = buildForecastLabel(rows)
        const subtitleParts = [
            orgUnitName,
            forecastLabel ? `CHAP Forecast: ${forecastLabel}` : '',
        ].filter(Boolean)

        const actualData: (number | null)[] = rows.map((r) =>
            !r.isPrediction ? r.actual : null
        )

        const lastHistoricalIdx = rows.reduce(
            (last, r, i) => (!r.isPrediction ? i : last),
            -1
        )
        const medianData: (number | null)[] = rows.map((r, i) => {
            if (r.isPrediction) {
                return r.quantileMedian
            }
            if (i === lastHistoricalIdx) {
                return r.actual
            }
            return null
        })

        const band80: ([number, number] | null)[] = rows.map((r) =>
            r.isPrediction && r.quantileLow !== null && r.quantileHigh !== null
                ? [r.quantileLow, r.quantileHigh]
                : null
        )

        const band50: ([number, number] | null)[] = rows.map((r) =>
            r.isPrediction &&
            r.quantileMidLow !== null &&
            r.quantileMidHigh !== null
                ? [r.quantileMidLow, r.quantileMidHigh]
                : null
        )

        return {
            chart: {
                type: 'line',
                height: height || undefined,
                style: { fontFamily: 'inherit' },
                animation: false,
            },
            title: { text: undefined },
            subtitle:
                subtitleParts.length > 0
                    ? {
                          text: subtitleParts.join(' | '),
                          style: { fontSize: '12px', color: '#6b7280' },
                          align: 'left',
                      }
                    : undefined,
            xAxis: {
                categories,
                labels: {
                    useHTML: true,
                    formatter() {
                        const isPred = rows[this.pos]?.isPrediction
                        return `<span style="font-size:11px;color:${isPred ? '#1e3a8a' : '#666666'};font-weight:${isPred ? '600' : 'normal'}">${this.value}</span>`
                    },
                },
            },
            yAxis: {
                title: { text: 'Confirmed Cases' },
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
                        const row = rows[pt.index ?? -1]
                        if (
                            pt.series.name === 'Median Forecast' &&
                            !row?.isPrediction
                        ) {
                            continue
                        }
                        const ptRange = pt as Highcharts.Point & {
                            low?: number
                            high?: number
                        }
                        s += `<span style="color:${pt.color}">\u25CF</span> ${pt.series.name}: `
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
                    name: 'Actual Cases',
                    data: actualData,
                    color: '#16a34a',
                    lineWidth: 2,
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
                {
                    type: 'line',
                    name: 'Median Forecast',
                    data: medianData,
                    color: '#1e3a8a',
                    lineWidth: 2,
                    dashStyle: 'ShortDash',
                    zIndex: 5,
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
                            color: '#1e3a8a',
                            textOutline: 'none',
                        },
                    },
                },
                {
                    type: 'arearange',
                    name: '80% interval (Q10–Q90)',
                    data: band80,
                    color: '#93c5fd',
                    fillOpacity: 0.3,
                    zIndex: 2,
                },
                {
                    type: 'arearange',
                    name: '50% interval (Q25–Q75)',
                    data: band50,
                    color: '#3b82f6',
                    fillOpacity: 0.45,
                    zIndex: 3,
                },
                ...activeReferenceLines.map(
                    (line): Highcharts.SeriesLineOptions => ({
                        type: 'line',
                        name: line.label,
                        data: rows.map(
                            (r) => r.referenceValues[line.id] ?? null
                        ),
                        color: line.color,
                        lineWidth: 2,
                        dashStyle: line.dashStyle,
                        zIndex: 6,
                        marker: { enabled: false },
                        dataLabels: { enabled: false },
                    })
                ),
            ],
            exporting: { enabled: false },
            credits: { enabled: false },
        }
    }, [rows, orgUnitName, height, activeReferenceLines])

    const predictionRows = rows.filter((r) => r.isPrediction)

    const tableRows = useMemo(
        () => getForecastTableRows(visibleTabs),
        [visibleTabs]
    )

    const isTableView = view === TABLE_VIEW
    useEffect(() => {
        onTableViewChange?.(isTableView)
    }, [isTableView, onTableViewChange])

    return (
        <div className="flex h-full flex-col">
            <div className="relative shrink-0 border-b border-gray-200">
                <TabBar>
                    <div>
                        <Tab
                            selected={view !== TABLE_VIEW}
                            onClick={() => {
                                if (hasMultipleTabs) {
                                    setMenuOpen((open) => !open)
                                }
                                setView(activeTab?.id ?? TABLE_VIEW)
                            }}
                        >
                            <span className="inline-flex items-center gap-1">
                                {activeTab
                                    ? i18n.t(activeTab.label)
                                    : i18n.t('Chart')}
                                {hasMultipleTabs &&
                                    (menuOpen ? (
                                        <IconChevronUp16 />
                                    ) : (
                                        <IconChevronDown16 />
                                    ))}
                            </span>
                        </Tab>
                    </div>
                    <Tab
                        selected={view === TABLE_VIEW}
                        onClick={() => {
                            setMenuOpen(false)
                            setView(TABLE_VIEW)
                        }}
                    >
                        {i18n.t('Table')}
                    </Tab>
                </TabBar>

                {menuOpen && hasMultipleTabs && (
                    <>
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setMenuOpen(false)}
                        />
                        <div className="absolute left-0 top-full z-50 min-w-56">
                            <FlyoutMenu closeMenu={() => setMenuOpen(false)}>
                                {visibleTabs.map((tab) => (
                                    <MenuItem
                                        key={tab.id}
                                        label={i18n.t(tab.label)}
                                        active={tab.id === activeTab?.id}
                                        onClick={() => {
                                            setView(tab.id)
                                            setMenuOpen(false)
                                        }}
                                    />
                                ))}
                            </FlyoutMenu>
                        </div>
                    </>
                )}
            </div>

            {view !== TABLE_VIEW && activeTab ? (
                <div ref={containerRef} className="min-h-0 flex-1">
                    <HighchartsReact
                        highcharts={Highcharts}
                        options={options}
                        ref={ref as ChartRef}
                        containerProps={{ style: { height: '100%' } }}
                    />
                </div>
            ) : (
                <div className="overflow-auto pt-3">
                    <table className="w-full border-collapse text-sm">
                        <thead>
                            <tr className="border-b border-gray-200 bg-gray-50">
                                <th className="px-4 py-3 text-left font-medium text-gray-600">
                                    {i18n.t('Quantiles')}
                                </th>
                                {predictionRows.map((r) => (
                                    <th
                                        key={r.period}
                                        className="px-4 py-3 text-center font-semibold text-blue-900"
                                    >
                                        {r.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {tableRows.map(({ label, emphasis, get }) => (
                                <tr
                                    key={label}
                                    className={`border-b border-gray-100 ${ROW_CLASSES[emphasis].row}`}
                                >
                                    <td
                                        className={`px-4 py-3 ${ROW_CLASSES[emphasis].label}`}
                                    >
                                        {label}
                                    </td>
                                    {predictionRows.map((r) => (
                                        <td
                                            key={r.period}
                                            className="px-4 py-3 text-center tabular-nums text-gray-800"
                                        >
                                            {formatForecastValue(get(r))}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
})
