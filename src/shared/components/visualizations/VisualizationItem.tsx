import { useMemo } from 'react'
import { ChartSelector } from './ChartSelector'
import { DisplayItemContainer } from './DisplayItemContainer'
import { SingleValueCard } from './SingleValueCard'
import {
    useAnalytics,
    useYearOverYearAnalytics,
} from '@/shared/hooks/useAnalytics'
import { useFilters } from '@/shared/hooks/useFilters'
import { useVisualization } from '@/shared/hooks/useVisualization'
import { useVisualizationRefs } from '@/shared/hooks/useVisualizationRefs'
import {
    VisualizationChartType,
    YearOverYearVisualizationConfig,
} from '@/shared/schemas'
import { buildPivotModel, buildTableMatrix } from '@/shared/utils'

const DEFAULT_COLORS = ['#125687', '#e53935', '#43a047', '#8e24aa', '#f9a825']

const YOY_TYPES = new Set([
    VisualizationChartType.YEAR_OVER_YEAR_LINE,
    VisualizationChartType.YEAR_OVER_YEAR_COLUMN,
])

interface VisualizationItemProps {
    id: string
    defaultPeriodIds?: string[]
    forcedPeriodIds?: string[]
    colors?: string[]
    className?: string
}

export function VisualizationItem({
    id,
    defaultPeriodIds = [],
    forcedPeriodIds = [],
    colors = DEFAULT_COLORS,
    className,
}: VisualizationItemProps) {
    const {
        visualization,
        loading: vizLoading,
        error,
    } = useVisualization({ visualizationId: id })
    const { paramsMap } = useFilters()
    const defaultPeriodKey = defaultPeriodIds.join(',')
    const forcedPeriodKey = forcedPeriodIds.join(',')
    const effectiveParamsMap = useMemo(() => {
        const m = new Map(paramsMap)
        if (forcedPeriodKey) {
            m.set('pe', forcedPeriodKey)
        } else if (!m.has('pe') && defaultPeriodKey) {
            m.set('pe', defaultPeriodKey)
        }
        return m
    }, [paramsMap, defaultPeriodKey, forcedPeriodKey])
    const { chartRef, tableRef } = useVisualizationRefs()

    const isYoY =
        visualization?.type !== undefined && YOY_TYPES.has(visualization.type)

    const {
        analytics,
        loading: analyticsLoading,
        setSelectedOrgUnits,
        setSelectedPeriods,
        selectedOrgUnits,
        selectedPeriods,
    } = useAnalytics({
        visualizationConfig: isYoY ? null : (visualization ?? null),
        params: effectiveParamsMap,
    })

    const {
        analytics: yoyAnalytics,
        loading: yoyLoading,
        setSelectedOrgUnits: yoySetOrgUnits,
        setSelectedPeriods: yoySetPeriods,
        selectedOrgUnits: yoyOrgUnits,
        selectedPeriods: yoyPeriods,
    } = useYearOverYearAnalytics({
        visualizationConfig: isYoY
            ? (visualization as YearOverYearVisualizationConfig)
            : null,
        params: effectiveParamsMap,
    })

    const activeSetOrgUnits = isYoY ? yoySetOrgUnits : setSelectedOrgUnits
    const activeSetPeriods = isYoY ? yoySetPeriods : setSelectedPeriods
    const activeOrgUnitsRaw = isYoY ? yoyOrgUnits : selectedOrgUnits
    const activePeriodsRaw = isYoY ? yoyPeriods : selectedPeriods
    const activeOrgUnits =
        activeOrgUnitsRaw.length > 0
            ? activeOrgUnitsRaw
            : (effectiveParamsMap.get('ou')?.split(',') ?? [])
    const activePeriods =
        activePeriodsRaw.length > 0
            ? activePeriodsRaw
            : (effectiveParamsMap.get('pe')?.split(',') ?? [])

    const isTable = visualization?.type === VisualizationChartType.TABLE
    const tableMatrix = useMemo(
        () =>
            isTable && visualization && analytics
                ? buildTableMatrix(buildPivotModel({ analytics, visualization }))
                : undefined,
        [isTable, visualization, analytics]
    )

    const loading = vizLoading || (isYoY ? yoyLoading : analyticsLoading)
    const isSingleValue =
        visualization?.type === VisualizationChartType.SINGLE_VALUE

    if (isSingleValue) {
        return (
            <div className={className}>
                <SingleValueCard
                    visualization={visualization!}
                    analytics={analytics}
                    loading={loading}
                    colors={colors}
                    selectedOrgUnits={activeOrgUnits}
                    selectedPeriods={activePeriods}
                    onOrgUnitChange={activeSetOrgUnits}
                    onPeriodChange={activeSetPeriods}
                />
            </div>
        )
    }

    const hasData = isYoY ? !!yoyAnalytics : !!analytics

    return (
        <div className={className}>
            <DisplayItemContainer
                title={visualization?.displayName}
                loading={loading}
                error={error}
                chartRef={isTable ? undefined : chartRef}
                tableMatrix={tableMatrix}
                selectedOrgUnits={activeOrgUnits}
                selectedPeriods={activePeriods}
                onOrgUnitChange={activeSetOrgUnits}
                onPeriodChange={activeSetPeriods}
            >
                {visualization && hasData && (
                    <ChartSelector
                        analytics={analytics}
                        yoyAnalytics={yoyAnalytics}
                        visualization={visualization}
                        setRef={chartRef}
                        tableRef={tableRef}
                        fullScreen={false}
                        colors={colors}
                    />
                )}
            </DisplayItemContainer>
        </div>
    )
}
