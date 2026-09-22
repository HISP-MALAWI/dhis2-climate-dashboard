import { useDataQuery } from '@dhis2/app-runtime'
import { useEffect, useMemo } from 'react'
import { ACTUAL_CASES_INDICATOR_ID } from '../constants'
import type { ThresholdType } from '../constants'
import type { ThresholdRow } from '../schemas'
import {
    formatPeriod,
    getMonthPeriod,
    parseAnalyticsRows,
} from '@/modules/chap-forecast-alerts/utils/periods'

function getLast24MonthPeriods(): string[] {
    const currentYear = new Date().getFullYear()
    const lastYear = currentYear - 1
    return [
        ...Array.from({ length: 12 }, (_, i) => getMonthPeriod(new Date(lastYear, i, 1))),
        ...Array.from({ length: 12 }, (_, i) => getMonthPeriod(new Date(currentYear, i, 1))),
    ]
}

type AnalyticsQueryData = {
    result: {
        headers: { name: string }[]
        rows: string[][]
    }
}

const actualCasesQuery = {
    result: {
        resource: 'analytics',
        params: (vars: Record<string, unknown>) => ({
            dimension: [
                `dx:${ACTUAL_CASES_INDICATOR_ID}`,
                `pe:${(vars.periods as string[]).join(';')}`,
            ],
            filter: `ou:${vars.orgUnitId}`,
            skipMeta: true,
        }),
    },
}

const thresholdsQuery = {
    result: {
        resource: 'analytics',
        params: (vars: Record<string, unknown>) => ({
            dimension: [
                `dx:${(vars.indicatorIds as string[]).join(';')}`,
                `pe:${(vars.periods as string[]).join(';')}`,
            ],
            filter: `ou:${vars.orgUnitId}`,
            skipMeta: true,
        }),
    },
}

export function useThresholdData(
    orgUnitId: string | null,
    selectedThresholds: ThresholdType[]
) {
    const periods = useMemo(() => getLast24MonthPeriods(), [])

    const {
        data: actualData,
        loading: actualLoading,
        refetch: refetchActual,
    } = useDataQuery<AnalyticsQueryData>(actualCasesQuery, { lazy: true })

    const activeIndicatorIds = selectedThresholds
        .map((t) => t.indicatorId)
        .filter(Boolean)

    const {
        data: threshData,
        loading: threshLoading,
        refetch: refetchThresh,
    } = useDataQuery<AnalyticsQueryData>(thresholdsQuery, { lazy: true })

    useEffect(() => {
        if (!orgUnitId) {return}
        refetchActual({ orgUnitId, periods })
    }, [orgUnitId, periods, refetchActual])

    useEffect(() => {
        if (!orgUnitId || activeIndicatorIds.length === 0) {return}
        refetchThresh({ orgUnitId, periods, indicatorIds: activeIndicatorIds })
    }, [orgUnitId, periods, activeIndicatorIds.join(','), refetchThresh])

    const rows = useMemo<ThresholdRow[]>(() => {
        const actualMap = actualData?.result
            ? parseAnalyticsRows(
                  actualData.result.headers,
                  actualData.result.rows
              )
            : new Map<string, Map<string, number>>()

        const threshMap = threshData?.result
            ? parseAnalyticsRows(
                  threshData.result.headers,
                  threshData.result.rows
              )
            : new Map<string, Map<string, number>>()

        return periods.map((period): ThresholdRow => {
            const actualByDx = actualMap.get(period)
            const threshByDx = threshMap.get(period)

            const thresholds: Record<string, number | null> = {}
            for (const t of selectedThresholds) {
                thresholds[t.id] = threshByDx?.get(t.indicatorId) ?? null
            }

            return {
                period,
                label: formatPeriod(period),
                actual: actualByDx?.get(ACTUAL_CASES_INDICATOR_ID) ?? null,
                thresholds,
            }
        })
    }, [actualData, threshData, periods, selectedThresholds])

    return {
        rows,
        loading: actualLoading || (activeIndicatorIds.length > 0 && threshLoading),
        periods,
    }
}
