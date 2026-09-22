import { useConfig } from '@dhis2/app-runtime'
import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { CHAP_ROUTE_PREFIX } from '../constants'
import { ActualCaseSchema } from '../schemas'

const EMPTY_SET = new Set<string>()

async function chapFetch<T>(url: string, schema: z.ZodType<T>): Promise<T> {
    const res = await fetch(url, { credentials: 'include' })
    if (!res.ok) {
        throw new Error(`CHAP API error ${res.status}: ${url}`)
    }
    const json: unknown = await res.json()
    return schema.parse(json)
}

/**
 * Returns the set of org unit IDs that have data in CHAP for a given backtest.
 * Uses the actualCases endpoint (lighter than evaluation-entry) — just extracts
 * unique `ou` values from the flat data array.
 */
export function useBacktestOrgUnits(backtestId: number | null): {
    orgUnitIds: Set<string>
    loading: boolean
} {
    const { baseUrl } = useConfig()

    const { data, isLoading } = useQuery({
        queryKey: ['chap', 'backtest-org-units', backtestId],
        enabled: backtestId !== null,
        staleTime: 5 * 60 * 1000,
        queryFn: () => {
            const params = new URLSearchParams({ isDatasetId: 'false' })
            return chapFetch(
                `${baseUrl}/api/${CHAP_ROUTE_PREFIX}/analytics/actualCases/${backtestId!}?${params.toString()}`,
                z.object({ data: z.array(ActualCaseSchema) })
            )
        },
        select: (res) => new Set(res.data.map((c) => c.ou)),
    })

    return {
        orgUnitIds: data ?? EMPTY_SET,
        loading: isLoading,
    }
}
