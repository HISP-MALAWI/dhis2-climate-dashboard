import { CircularLoader } from '@dhis2/ui'
import { flatten, get, head } from 'lodash'
import { useMemo } from 'react'
import { FullScreen, useFullScreenHandle } from 'react-full-screen'
import { VisualizationMenu } from './VisualizationMenu'
import { useFitFontSize } from '@/shared/hooks/useFitFontSize'
import type { AnalyticsData, VisualizationConfig } from '@/shared/schemas'
import {
    getForeground,
    getLegendColorFromValue,
    numberFormatter,
} from '@/shared/utils'

interface SingleValueCardProps {
    visualization: VisualizationConfig
    analytics?: AnalyticsData
    colors?: string[]
    backgroundColor?: string
    loading?: boolean
    showMenu?: boolean
    selectedOrgUnits?: string[]
    selectedPeriods?: string[]
    onOrgUnitChange?: (ids: string[]) => void
    onPeriodChange?: (ids: string[]) => void
}

export function SingleValueCard({
    visualization,
    analytics,
    colors = ['#125687'],
    backgroundColor,
    loading = false,
    showMenu = true,
    selectedOrgUnits,
    selectedPeriods,
    onOrgUnitChange,
    onPeriodChange,
}: SingleValueCardProps) {
    const { rows = [], headers = [], metaData } = analytics ?? {}
    const handle = useFullScreenHandle()

    const valueHeaderIndex = headers.findIndex(({ name }) => name === 'value')
    const dataHeaderIndex = headers.findIndex(({ name }) => name === 'dx')
    const value = parseFloat(get(head(rows), [valueHeaderIndex]) ?? '')
    const dataItemId = get(head(rows), [dataHeaderIndex])
    const dataItem = dataItemId ? metaData?.items[dataItemId] : null
    const isPercentage = dataItem?.indicatorType?.factor === 100

    const periodLabel = useMemo(() => {
        if (visualization.subtitle) {
            return visualization.subtitle
        }
        if (!metaData) {
            return ''
        }
        const labels = visualization.filters.flatMap((filter) => {
            const dimensions = metaData.dimensions[filter.dimension] ?? []
            return flatten(
                dimensions
                    .map((dim) => metaData.items[dim]?.name)
                    .filter(Boolean)
            )
        })
        return labels.join(' & ')
    }, [visualization, metaData])

    const displayValue = isNaN(value)
        ? '—'
        : isPercentage
            ? `${numberFormatter(value)}%`
            : numberFormatter(value)

    const { containerRef, textRef, fontSize } = useFitFontSize(
        loading ? '' : displayValue,
        { maxSize: 48, minSize: 18 }
    )

    const legendStyle = visualization.legend?.style
    const legendColor = useMemo(
        () =>
            getLegendColorFromValue({
                value,
                legendSet: visualization.legend?.set,
            }),
        [value, visualization.legend?.set]
    )
    const bgColor =
        backgroundColor ??
        (legendStyle === 'FILL' && legendColor ? legendColor : undefined)
    const fgColor = bgColor ? getForeground(bgColor) : undefined
    const valueColor =
        legendStyle === 'TEXT' && legendColor
            ? legendColor
            : (fgColor ?? colors[0] ?? '#125687')

    return (
        <FullScreen handle={handle} className="h-full">
            <div
                className="flex h-full flex-col justify-between rounded border border-gray-200 p-4 shadow-sm"
                style={{ backgroundColor: bgColor ?? '#ffffff' }}
            >
                <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 flex-col gap-1">
                        <span
                            className="text-sm font-bold leading-tight line-clamp-3"
                            style={{ color: fgColor ?? '#111827' }}
                            title={visualization.displayName}
                        >
                            {visualization.displayName}
                        </span>
                        {periodLabel && (
                            <span
                                className="line-clamp-1 text-xs"
                                style={{ color: fgColor ?? '#6b7280' }}
                                title={periodLabel}
                            >
                                {periodLabel}
                            </span>
                        )}
                    </div>
                    {showMenu && (
                        <VisualizationMenu
                            onFullscreen={() => handle.enter()}
                            selectedOrgUnits={selectedOrgUnits}
                            selectedPeriods={selectedPeriods}
                            onOrgUnitChange={onOrgUnitChange}
                            onPeriodChange={onPeriodChange}
                        />
                    )}
                </div>

                <div
                    ref={containerRef}
                    className="flex min-h-0 min-w-0 flex-1 items-center justify-center overflow-hidden"
                >
                    {loading ? (
                        <CircularLoader />
                    ) : (
                        <span
                            ref={textRef}
                            className="whitespace-nowrap font-bold tabular-nums leading-tight"
                            style={{ color: valueColor, fontSize }}
                            title={displayValue}
                        >
                            {displayValue}
                        </span>
                    )}
                </div>
            </div>
        </FullScreen>
    )
}
