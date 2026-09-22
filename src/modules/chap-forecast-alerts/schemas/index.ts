import { z } from 'zod'

export const AnalyticsHeaderSchema = z.object({ name: z.string() })

export const AnalyticsResponseSchema = z.object({
    headers: z.array(AnalyticsHeaderSchema),
    rows: z.array(z.array(z.string())),
})

export type AnalyticsResponse = z.infer<typeof AnalyticsResponseSchema>

export interface ForecastRow {
    period: string
    label: string
    actual: number | null
    quantileLow: number | null
    quantileMidLow: number | null
    quantileMedian: number | null
    quantileMidHigh: number | null
    quantileHigh: number | null
    referenceValues: Record<string, number | null>
    isPrediction: boolean
}
