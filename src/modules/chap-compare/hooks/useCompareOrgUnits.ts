import { useConfig } from '@dhis2/app-runtime'
import { useQueries } from '@tanstack/react-query'
import { useMemo } from 'react'
import { z } from 'zod'
import { CHAP_ROUTE_PREFIX } from '../constants'
import { ActualCaseSchema } from '../schemas'

async function chapFetch<T>(url: string, schema: z.ZodType<T>): Promise<T> {
    const res = await fetch(url, { credentials: 'include' })
    if (!res.ok) {
        throw new Error(`CHAP API error ${res.status}: ${url}`)
    }
    const json: unknown = await res.json()
    return schema.parse(json)
}

const EMPTY_SET = new Set<string>()

 
export function useCompareOrgUnits(backtestIds: number[]): {
    orgUnitIds: Set<string>
    loading: boolean
} {
    const { baseUrl } = useConfig()

    const results = useQueries({
        queries: backtestIds.map((id) => ({
            queryKey: ['chap-compare', 'backtest-org-units', id],
            staleTime: 5 * 60 * 1000,
            queryFn: () => {
                const params = new URLSearchParams({ isDatasetId: 'false' })
                return chapFetch(
                    `${baseUrl}/api/${CHAP_ROUTE_PREFIX}/analytics/actualCases/${id}?${params.toString()}`,
                    z.object({ data: z.array(ActualCaseSchema) })
                )
            },
            select: (res: { data: { ou: string }[] }) =>
                new Set(res.data.map((c) => c.ou)),
        })),
    })

    const orgUnitIds = useMemo(() => {
        if (backtestIds.length === 0) {
            return EMPTY_SET
        }
        const set = new Set<string>()
        for (const result of results) {
            for (const ou of result.data ?? []) {
                set.add(ou)
            }
        }
        return set
    }, [results, backtestIds.length])

    return {
        orgUnitIds,
        loading: results.some((q) => q.isLoading),
    }
}
