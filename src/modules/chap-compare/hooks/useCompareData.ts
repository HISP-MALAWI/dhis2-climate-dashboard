import { useConfig } from '@dhis2/app-runtime'
import { keepPreviousData, useQueries } from '@tanstack/react-query'
import { useMemo } from 'react'
import { z } from 'zod'
import { CHAP_ROUTE_PREFIX, EVALUATION_QUANTILES } from '../constants'
import type { ActualCase, EvaluationEntry } from '../schemas'
import { ActualCasesResponseSchema, EvaluationEntrySchema } from '../schemas'

async function chapFetch<T>(url: string, schema: z.ZodType<T>): Promise<T> {
    const res = await fetch(url, { credentials: 'include' })
    if (!res.ok) {
        throw new Error(`CHAP API error ${res.status}: ${url}`)
    }
    const json: unknown = await res.json()
    return schema.parse(json)
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

export interface CompareBacktestRawData {
    backtestId: number
    actualCases: ActualCase[]
    evalEntries: EvaluationEntry[]
}

interface UseCompareDataParams {
    backtestIds: number[]
    orgUnitIds: string[]
}


export function useCompareData({
    backtestIds,
    orgUnitIds,
}: UseCompareDataParams): {
    perBacktest: CompareBacktestRawData[]
    chapOrgUnitIds: Set<string>
    loading: boolean
} {
    const { baseUrl } = useConfig()
    const enabled = backtestIds.length > 0 && orgUnitIds.length > 0

    const actualResults = useQueries({
        queries: backtestIds.map((id) => ({
            queryKey: ['chap-compare', 'actualCases', id, orgUnitIds],
            enabled,
            placeholderData: keepPreviousData,
            queryFn: (): Promise<ActualCase[]> =>
                chapFetch(
                    buildActualUrl(baseUrl, id, orgUnitIds),
                    ActualCasesResponseSchema
                ).then((res) => res.data),
        })),
    })

    const evalResults = useQueries({
        queries: backtestIds.map((id) => ({
            queryKey: ['chap-compare', 'evaluation-entry', id, orgUnitIds],
            enabled,
            placeholderData: keepPreviousData,
            queryFn: (): Promise<EvaluationEntry[]> =>
                chapFetch(
                    buildEvalUrl(baseUrl, id, orgUnitIds),
                    z.array(EvaluationEntrySchema)
                ),
        })),
    })

    const perBacktest = backtestIds.map(
        (id, i): CompareBacktestRawData => ({
            backtestId: id,
            actualCases: actualResults[i]?.data ?? [],
            evalEntries: evalResults[i]?.data ?? [],
        })
    )

    const chapOrgUnitIds = useMemo(() => {
        const set = new Set<string>()
        for (const result of actualResults) {
            for (const c of result.data ?? []) {
                set.add(c.ou)
            }
        }
        return set
    }, [actualResults])

    return {
        perBacktest,
        chapOrgUnitIds,
        loading:
            actualResults.some((q) => q.isLoading) ||
            evalResults.some((q) => q.isLoading),
    }
}
