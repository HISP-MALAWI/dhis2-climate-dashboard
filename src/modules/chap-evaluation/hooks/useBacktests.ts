import { useConfig } from '@dhis2/app-runtime'
import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { CHAP_ROUTE_PREFIX } from '../constants'
import { BacktestSchema } from '../schemas'

async function chapFetch<T>(
    url: string,
    schema: z.ZodType<T>
): Promise<T> {
    const res = await fetch(url, { credentials: 'include' })
    if (!res.ok) {
        throw new Error(`CHAP API error ${res.status}: ${url}`)
    }
    const json: unknown = await res.json()
    return schema.parse(json)
}

/** Fetch all available backtests */
export function useBacktests() {
    const { baseUrl } = useConfig()

    return useQuery({
        queryKey: ['chap', 'backtests'],
        queryFn: () =>
            chapFetch(
                `${baseUrl}/api/${CHAP_ROUTE_PREFIX}/crud/backtests`,
                z.array(BacktestSchema)
            ),
    })
}

/** Fetch backtests compatible for comparison with a given backtest */
export function useCompatibleBacktests(backtestId: number | null) {
    const { baseUrl } = useConfig()

    return useQuery({
        queryKey: ['chap', 'compatible-backtests', backtestId],
        enabled: backtestId !== null,
        queryFn: () =>
            chapFetch(
                `${baseUrl}/api/${CHAP_ROUTE_PREFIX}/analytics/compatible-backtests/${backtestId!}`,
                z.array(BacktestSchema)
            ),
    })
}
