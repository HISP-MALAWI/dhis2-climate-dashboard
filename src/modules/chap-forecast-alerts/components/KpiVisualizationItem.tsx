import { CircularLoader } from '@dhis2/ui'
import { useEffect, useMemo } from 'react'
import { SingleValueCard } from '@/shared/components/visualizations/SingleValueCard'
import { useAnalytics } from '@/shared/hooks/useAnalytics'
import { useVisualization } from '@/shared/hooks/useVisualization'

interface KpiVisualizationItemProps {
    id: string
    orgUnitId: string | null
    defaultPeriodIds?: string[]
    className?: string
    backgroundColor: string
}

export function KpiVisualizationItem({
    id,
    orgUnitId,
    defaultPeriodIds,
    className,
    backgroundColor,
}: KpiVisualizationItemProps) {
    const { visualization, loading: vizLoading } = useVisualization({
        visualizationId: id,
    })

    const defaultPeriodKey = (defaultPeriodIds ?? []).join(',')
    const params = useMemo(() => {
        const m = new Map<string, string>()
        if (orgUnitId) {
            m.set('ou', orgUnitId)
        }
        if (defaultPeriodKey) {
            m.set('pe', defaultPeriodKey)
        }
        return m
    }, [orgUnitId, defaultPeriodKey])

    const { analytics, loading: analyticsLoading } = useAnalytics({
        visualizationConfig: visualization ?? null,
        params,
    })

    useEffect(() => {
        console.log("KPI vis")
        console.log(analytics)
    },  [visualization, analytics])
    const loading = vizLoading || analyticsLoading

    if (vizLoading) {
        return (
            <div
                className={`flex items-center justify-center rounded border border-gray-200 bg-white shadow-sm ${className ?? ''}`}
                style={{ backgroundColor }}
            >
                <CircularLoader small />
            </div>
        )
    }

    if (!visualization) {
        return null
    }

    return (
        <div className={className}>
            <SingleValueCard
                visualization={visualization}
                analytics={analytics}
                backgroundColor={backgroundColor}
                loading={loading}
                showMenu={false}
            />
        </div>
    )
}
