import type {
    ActualCase,
    EvaluationEntry,
    EvaluationPeriodRow,
} from '../schemas'

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

interface BuildBacktestRowsArgs {
    orgUnitId: string
    actualCases: ActualCase[]
    evalEntries: EvaluationEntry[]
}

 
export function buildBacktestRows({
    orgUnitId,
    actualCases,
    evalEntries,
}: BuildBacktestRowsArgs): EvaluationPeriodRow[] {
    const actualByPeriod = new Map<string, number>()
    for (const pt of actualCases) {
        if (pt.ou === orgUnitId && pt.value !== null) {
            actualByPeriod.set(pt.pe, pt.value)
        }
    }

    const ouEntries = evalEntries.filter((e) => e.orgUnit === orgUnitId)
    const predictionPeriodSet = new Set(ouEntries.map((e) => e.period))

    const quantileByPeriod = new Map<string, Map<number, number>>()
    for (const entry of ouEntries) {
        if (!quantileByPeriod.has(entry.period)) {
            quantileByPeriod.set(entry.period, new Map())
        }
        quantileByPeriod.get(entry.period)!.set(entry.quantile, entry.value)
    }

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
