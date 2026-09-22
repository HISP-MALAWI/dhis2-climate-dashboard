import { useDataQuery } from '@dhis2/app-runtime'
import { PeriodTypeCategory, PeriodUtility } from '@hisptz/dhis2-utils'
import { snakeCase } from 'lodash'
import { DateTime, Interval } from 'luxon'
import { useEffect, useMemo, useState } from 'react'
import {
    AnalyticsData,
    VisualizationConfig,
    YearOverYearVisualizationConfig,
} from '@/shared/schemas'
import {
    getVisualizationDimensions,
    getVisualizationFilters,
} from '@/shared/utils'

const analyticsQuery = {
    analytics: {
        resource: 'analytics',
        params: (variables: Record<string, unknown>) => {
            const { filters, dimensions, relativePeriodDate } = variables as {
                filters: Record<string, string[]>
                dimensions: Record<string, string[]>
                relativePeriodDate: string
            }
            return {
                displayProperty: 'NAME',
                filter: Object.keys(filters).map(
                    (key) => `${key}:${filters[key]?.join(';')}`
                ),
                dimension: Object.keys(dimensions).map(
                    (key) => `${key}:${dimensions[key]?.join(';')}`
                ),
                includeMetadataDetails: 'true',
                relativePeriodDate,
            }
        },
    },
}

export function useAnalytics({
    visualizationConfig,
    params,
}: {
    visualizationConfig: VisualizationConfig | null
    params: Map<string, string>
}) {
    const [selectedOrgUnits, setSelectedOrgUnits] = useState<string[]>([])
    const [selectedPeriods, setSelectedPeriods] = useState<string[]>([])

    const { refetch, loading, data } = useDataQuery<{
        analytics: AnalyticsData
    }>(analyticsQuery, {
        lazy: true,
    })

    useEffect(() => {
        if (!visualizationConfig) {
            return
        }
        refetch({
            filters: getVisualizationFilters(visualizationConfig, {
                searchParams: params,
                selectedOrgUnits,
                selectedPeriods,
            }),
            dimensions: getVisualizationDimensions(visualizationConfig, {
                searchParams: params,
                selectedOrgUnits,
                selectedPeriods,
            }),
        })
    }, [
        refetch,
        params,
        selectedOrgUnits,
        selectedPeriods,
        visualizationConfig,
    ])

    return {
        loading,
        analytics: data?.analytics,
        refetch,
        setSelectedPeriods,
        setSelectedOrgUnits,
        selectedPeriods,
        selectedOrgUnits,
    }
}

function normalizeYear(year: string) {
    const periodCategory = PeriodUtility.getPeriodCategoryFromPeriodId(year)
    if (periodCategory === PeriodTypeCategory.FIXED) {
        return [year]
    }
    const period = PeriodUtility.getPeriodById(year)
    const interval = Interval.fromDateTimes(
        period.start,
        DateTime.now().minus({ year: 1 })
    )
    const years = interval.splitBy({ year: 1 })
    if (years.length > 1) {
        return years.map((year) => year.start!.year.toString())
    }

    return [period.start.year.toString()]
}

function normalizeYears(years: string[]) {
    return years.flatMap((year) => normalizeYear(year))
}

export function useYearOverYearAnalytics({
    visualizationConfig,
    params,
}: {
    visualizationConfig: YearOverYearVisualizationConfig | null
    params: Map<string, string>
}) {
    const [data, setData] = useState<Map<string, AnalyticsData>>()
    const [selectedOrgUnits, setSelectedOrgUnits] = useState<string[]>([])
    const [selectedPeriods, setSelectedPeriods] = useState<string[]>(
        params?.get('pe')?.split(',') ?? []
    )

    const { refetch, loading } = useDataQuery<{
        analytics: AnalyticsData
    }>(analyticsQuery, { lazy: true })

    const selectedRelativePeriods = useMemo(
        () =>
            Object.entries(visualizationConfig?.relativePeriods || {})
                .filter(([, value]) => value === true)
                .map(([key]) => snakeCase(key).toUpperCase()),
        [visualizationConfig]
    )

    const years = useMemo(() => {
        const selectedYears = selectedPeriods.filter(
            (periodId: string) =>
                PeriodUtility.getPeriodById(periodId).type.rank === 8 ||
                periodId.includes('YEAR')
        )
        return selectedYears.length > 0
            ? selectedYears
            : (visualizationConfig?.yearlySeries ?? [])
    }, [selectedPeriods, visualizationConfig])

    const yearsToFetch = useMemo(() => normalizeYears(years), [years])

    const orgUnits = useMemo(() => {
        const orgUnitFilter = (visualizationConfig?.filters || []).find(
            (filter) => filter.dimension === 'ou'
        )
        return orgUnitFilter ? orgUnitFilter.items.map((item) => item.id) : []
    }, [visualizationConfig])

    const dx = useMemo(() => {
        const dataFilter = (visualizationConfig?.filters || []).find(
            (filter) => filter.dimension === 'dx'
        )
        return dataFilter ? dataFilter.items.map((item) => item.id) : []
    }, [visualizationConfig])

    useEffect(() => {
        if (!visualizationConfig) {
            return
        }
        async function fetchYearlyAnalytics() {
            const yearData = new Map<string, AnalyticsData>()
            for (const yearId of yearsToFetch.slice().reverse()) {
                const date = new Date()
                const period = PeriodUtility.getPeriodById(yearId)
                const year = period.start.year

                const periodDate = new Date(date.setFullYear(year))
                const periodDateString = `${periodDate.getFullYear()}-${periodDate.getMonth() + 1}-${periodDate.getDate() + 1}`

                const response = (await refetch({
                    filters: {
                        ou:
                            selectedOrgUnits.length > 0
                                ? selectedOrgUnits
                                : orgUnits,
                        dx,
                    },
                    relativePeriodDate: periodDateString,
                    dimensions: {
                        pe:
                            selectedPeriods.length > 0
                                ? selectedPeriods
                                : selectedRelativePeriods,
                    },
                })) as unknown as { analytics: AnalyticsData }

                yearData.set(yearId, response.analytics)
            }
            setData(yearData)
        }

        fetchYearlyAnalytics()
    }, [selectedOrgUnits, selectedPeriods, visualizationConfig, yearsToFetch, orgUnits, dx, selectedRelativePeriods, refetch])

    return {
        analytics: data,
        loading,
        setSelectedPeriods,
        setSelectedOrgUnits,
        selectedPeriods,
        selectedOrgUnits,
    }
}
