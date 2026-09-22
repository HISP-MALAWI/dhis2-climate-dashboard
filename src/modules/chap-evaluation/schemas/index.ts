import { z } from 'zod'

// ---------------------------------------------------------------------------
// Backtests
// ---------------------------------------------------------------------------

export const BacktestSchema = z.object({
    /** Numeric identifier for the backtest run */
    id: z.union([z.number(), z.string()]).transform(Number),
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
    /** ISO monthly period, e.g. "2025-04" */
    period: z.string(),
    /** Quantile level: 0.1 | 0.25 | 0.5 | 0.75 | 0.9 */
    quantile: z.number(),
    value: z.number(),
    /** The forecast window this entry belongs to (e.g. "2025-04") */
    splitPeriod: z.string(),
})

export type EvaluationEntry = z.infer<typeof EvaluationEntrySchema>

// ---------------------------------------------------------------------------
// Derived chart data
// ---------------------------------------------------------------------------

export interface EvaluationPeriodRow {
    /** ISO month string, e.g. "2024-03" */
    period: string
    /** Human-readable label, e.g. "March 2024" */
    label: string
    actual: number | null
    q10: number | null
    q25: number | null
    q50: number | null
    q75: number | null
    q90: number | null
    /** True when this period belongs to the currently selected prediction window */
    isPrediction: boolean
}

export interface OrgUnitEvalData {
    orgUnitId: string
    orgUnitName: string
    rows: EvaluationPeriodRow[]
    /** Unique prediction window starts available in the data, sorted ascending */
    splitPeriods: string[]
}
