import { useConfig } from '@dhis2/app-runtime'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { z } from 'zod'
import { CHAP_ROUTE_PREFIX, EVALUATION_QUANTILES } from '../constants'
import type {
    ActualCase,
    EvaluationEntry,
    EvaluationPeriodRow,
    OrgUnitEvalData,
} from '../schemas'
import { ActualCasesResponseSchema, EvaluationEntrySchema } from '../schemas'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MONTH_LABELS = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
]

/** "2024-03" or "202403" → "March 2024" */
function formatIsoMonth(period: string): string {
    const hasDash = period.includes('-')
    const year = period.slice(0, 4)
    const mon = hasDash ? period.slice(5, 7) : period.slice(4, 6)
    const monthIdx = parseInt(mon, 10) - 1
    return `${MONTH_LABELS[monthIdx] ?? mon} ${year}`
}

/** "2024-03" → comparable integer 202403 */
function periodToInt(period: string): number {
    return parseInt(period.replace('-', ''), 10)
}

function deriveSplitPeriods(predictionPeriods: string[]): string[] {
    const sorted = [...new Set(predictionPeriods)].sort(
        (a, b) => periodToInt(a) - periodToInt(b)
    )
    const windows: string[] = []
    let i = 0
    while (i < sorted.length) {
        windows.push(sorted[i]!)
        i += 3
    }
    return windows
}

interface BuildRowsArgs {
    orgUnitId: string
    actualCases: ActualCase[]
    evalEntries: EvaluationEntry[]
    activeSplitPeriod: string | null
}

export function buildRows({
    orgUnitId,
    actualCases,
    evalEntries,
    activeSplitPeriod,
}: BuildRowsArgs): EvaluationPeriodRow[] {
    // Actual cases keyed by period
    const actualByPeriod = new Map<string, number>()
    for (const pt of actualCases) {
        if (pt.ou === orgUnitId && pt.value !== null) {
            actualByPeriod.set(pt.pe, pt.value)
        }
    }

    // Evaluation entries for this org unit
    const ouEntries = evalEntries.filter((e) => e.orgUnit === orgUnitId)

    let predictionPeriodSet = new Set<string>()
    if (activeSplitPeriod === null) {
        predictionPeriodSet = new Set(ouEntries.map((e) => e.period))
    } else {
        const hasSplitPeriodField = ouEntries.some(
            (e) => e.splitPeriod !== undefined
        )
        if (hasSplitPeriodField) {
            predictionPeriodSet = new Set(
                ouEntries
                    .filter((e) => e.splitPeriod === activeSplitPeriod)
                    .map((e) => e.period)
            )
        } else {
            // Derive: 3 months from activeSplitPeriod
            const [startYear, startMon] = activeSplitPeriod
                .split('-')
                .map(Number)
            const startDate = new Date(startYear!, (startMon ?? 1) - 1, 1)
            for (let m = 0; m < 3; m++) {
                const d = new Date(
                    startDate.getFullYear(),
                    startDate.getMonth() + m,
                    1
                )
                const period = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
                predictionPeriodSet.add(period)
            }
        }
    }

    // Quantile values per prediction period
    const quantileByPeriod = new Map<string, Map<number, number>>()
    for (const entry of ouEntries) {
        if (!predictionPeriodSet.has(entry.period)) {
            continue
        }
        if (!quantileByPeriod.has(entry.period)) {
            quantileByPeriod.set(entry.period, new Map())
        }
        quantileByPeriod.get(entry.period)!.set(entry.quantile, entry.value)
    }

    // Union all periods, sorted
    const allPeriods = [
        ...new Set([...actualByPeriod.keys(), ...predictionPeriodSet]),
    ].sort((a, b) => periodToInt(a) - periodToInt(b))

    return allPeriods.map((period): EvaluationPeriodRow => {
        const isPrediction = predictionPeriodSet.has(period)
        const qs = quantileByPeriod.get(period)
        return {
            period,
            label: formatIsoMonth(period),
            actual: actualByPeriod.get(period) ?? null,
            q10: qs?.get(0.1) ?? null,
            q25: qs?.get(0.25) ?? null,
            q50: qs?.get(0.5) ?? null,
            q75: qs?.get(0.75) ?? null,
            q90: qs?.get(0.9) ?? null,
            isPrediction,
        }
    })
}

// ---------------------------------------------------------------------------
// Fetch hooks
// ---------------------------------------------------------------------------

async function chapFetch<T>(url: string, schema: z.ZodType<T>): Promise<T> {
    const res = await fetch(url, { credentials: 'include' })
    if (!res.ok) {
        throw new Error(`CHAP API error ${res.status}: ${url}`)
    }
    const json: unknown = await res.json()
    return schema.parse(json)
}

function buildEvalUrl(
    baseUrl: string,
    backtestId: number,
    orgUnitIds: string[]
): string {
    const params = new URLSearchParams()
    for (const q of EVALUATION_QUANTILES) {
        params.append('quantiles', String(q))
    }
    params.set('backtestId', String(backtestId))
    for (const id of orgUnitIds) {
        params.append('orgUnits', id)
    }
    return `${baseUrl}/api/${CHAP_ROUTE_PREFIX}/analytics/evaluation-entry?${params.toString()}`
}

function buildActualUrl(
    baseUrl: string,
    backtestId: number,
    orgUnitIds: string[]
): string {
    const params = new URLSearchParams()
    params.set('isDatasetId', 'false')
    for (const id of orgUnitIds) {
        params.append('orgUnits', id)
    }
    return `${baseUrl}/api/${CHAP_ROUTE_PREFIX}/analytics/actualCases/${backtestId}?${params.toString()}`
}

interface UseEvaluationDataParams {
    backtestId: number | null
    orgUnits: Array<{ id: string; displayName: string }>
}

export function useEvaluationData({
    backtestId,
    orgUnits,
}: UseEvaluationDataParams) {
    const { baseUrl } = useConfig()
    const orgUnitIds = orgUnits.map((ou) => ou.id)
    const enabled = backtestId !== null && orgUnitIds.length > 0

    const { data: actualCases, isLoading: actualLoading } = useQuery({
        queryKey: ['chap', 'actualCases', backtestId, orgUnitIds],
        enabled,
        placeholderData: keepPreviousData,
        queryFn: () =>
            chapFetch(
                buildActualUrl(baseUrl, backtestId!, orgUnitIds),
                ActualCasesResponseSchema
            ).then((res) => res.data),
    })

    const { data: evalEntries, isLoading: evalLoading } = useQuery({
        queryKey: ['chap', 'evaluation-entry', backtestId, orgUnitIds],
        enabled,
        placeholderData: keepPreviousData,
        queryFn: () =>
            chapFetch(
                buildEvalUrl(baseUrl, backtestId!, orgUnitIds),
                z.array(EvaluationEntrySchema)
            ),
    })

    /**
     * Per-org-unit data objects, keyed by org unit ID.
     * Split periods are derived from what the API returned.
     */
    const orgUnitDataMap = useMemo((): Map<string, OrgUnitEvalData> => {
        const map = new Map<string, OrgUnitEvalData>()
        if (!actualCases && !evalEntries) {
            return map
        }

        const ee = evalEntries ?? []

        for (const ou of orgUnits) {
            const ouEntries = ee.filter((e) => e.orgUnit === ou.id)

            // Derive split periods
            let splitPeriods: string[]
            const hasSplitField = ouEntries.some(
                (e) => e.splitPeriod !== undefined
            )
            if (hasSplitField) {
                splitPeriods = [
                    ...new Set(
                        ouEntries.map((e) => e.splitPeriod).filter(Boolean)
                    ),
                ].sort((a, b) => periodToInt(a) - periodToInt(b))
            } else {
                const predPeriods = ouEntries.map((e) => e.period)
                splitPeriods = deriveSplitPeriods(predPeriods)
            }

            map.set(ou.id, {
                orgUnitId: ou.id,
                orgUnitName: ou.displayName,
                // rows will be built per chart based on selected split period
                rows: [],
                splitPeriods,
            })
        }
        return map
    }, [actualCases, evalEntries, orgUnits])

    return {
        actualCases: actualCases ?? [],
        evalEntries: evalEntries ?? [],
        orgUnitDataMap,
        loading: actualLoading || evalLoading,
        buildRows,
    }
}
