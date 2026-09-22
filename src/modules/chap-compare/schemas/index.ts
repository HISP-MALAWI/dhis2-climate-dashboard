import { z } from 'zod'

// ---------------------------------------------------------------------------
// Backtests
// ---------------------------------------------------------------------------

export const BacktestSchema = z.object({
    /** Numeric identifier for the backtest run */
    id: z.coerce.number(),
    name: z.string().nullable().optional(),
})

export type Backtest = z.infer<typeof BacktestSchema>

// ---------------------------------------------------------------------------
// Actual cases  (GET /v1/analytics/actualCases/{backtestId})
// ---------------------------------------------------------------------------

export const ActualCaseSchema = z.object({
    /** DHIS2 org unit UID */
    ou: z.string(),
    /** ISO monthly period, e.g. "202403" or "2024-03" */
    pe: z.string(),
    value: z.number().nullable(),
})

export type ActualCase = z.infer<typeof ActualCaseSchema>

/** Wrapper returned by /v1/analytics/actualCases/{backtestId} */
export const ActualCasesResponseSchema = z.object({
    featureId: z.string(),
    dhis2Id: z.string(),
    data: z.array(ActualCaseSchema),
})

export type ActualCasesResponse = z.infer<typeof ActualCasesResponseSchema>

// ---------------------------------------------------------------------------
// Evaluation entries  (GET /v1/analytics/evaluation-entry)
// ---------------------------------------------------------------------------

export const EvaluationEntrySchema = z.object({
    orgUnit: z.string(),
    period: z.string(),
    quantile: z.number(),
    value: z.number(),
    splitPeriod: z.string(),
})

export type EvaluationEntry = z.infer<typeof EvaluationEntrySchema>

// ---------------------------------------------------------------------------
// Derived chart data
// ---------------------------------------------------------------------------


export interface CompareBacktestData {
    backtestId: number
    backtestName: string
    actualCases: ActualCase[]
    evalEntries: EvaluationEntry[]
}

export interface EvaluationPeriodRow {
    period: string
    label: string
    actual: number | null
    q10: number | null
    q25: number | null
    q50: number | null
    q75: number | null
    q90: number | null
    isPrediction: boolean
}
