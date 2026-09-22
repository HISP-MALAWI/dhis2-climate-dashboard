import i18n from '@dhis2/d2-i18n'
import type { ForecastChartTab } from '../constants'
import type { ForecastRow } from '../schemas'
import type { TableMatrix } from '@/shared/utils'

export type ForecastRowEmphasis = 'none' | 'median' | 'alert'

export interface ForecastTableRowDef {
    label: string
    emphasis: ForecastRowEmphasis
    get: (row: ForecastRow) => number | null
}

export function formatForecastValue(value: number | null): string {
    if (value === null) {
        return '—'
    }
    return value.toLocaleString('en-GB', { maximumFractionDigits: 0 })
}

const QUANTILE_ROWS: ForecastTableRowDef[] = [
    {
        label: 'Quantile 0.1 (low)',
        emphasis: 'none',
        get: (r) => r.quantileLow,
    },
    { label: 'Quantile 0.25', emphasis: 'none', get: (r) => r.quantileMidLow },
    {
        label: 'Quantile 0.5 (median)',
        emphasis: 'median',
        get: (r) => r.quantileMedian,
    },
    { label: 'Quantile 0.75', emphasis: 'none', get: (r) => r.quantileMidHigh },
    {
        label: 'Quantile 0.9 (high)',
        emphasis: 'none',
        get: (r) => r.quantileHigh,
    },
]

/** Quantiles followed by every reference line the visible tabs contribute. */
export function getForecastTableRows(
    chartTabs: ForecastChartTab[]
): ForecastTableRowDef[] {
    const seen = new Set<string>()
    const referenceRows: ForecastTableRowDef[] = []
    for (const tab of chartTabs) {
        for (const line of tab.referenceLines) {
            if (seen.has(line.id)) {
                continue
            }
            seen.add(line.id)
            referenceRows.push({
                label: line.label,
                emphasis: line.tableEmphasis === 'alert' ? 'alert' : 'none',
                get: (r) => r.referenceValues[line.id] ?? null,
            })
        }
    }
    return [...QUANTILE_ROWS, ...referenceRows]
}

interface BuildForecastTableMatrixParams {
    rows: ForecastRow[]
    chartTabs: ForecastChartTab[]
}

/**
 * The forecast table transposed for export: one column per prediction period,
 * built from the same row definitions the table renders.
 */
export function buildForecastTableMatrix({
    rows,
    chartTabs,
}: BuildForecastTableMatrixParams): TableMatrix {
    const predictionRows = rows.filter((r) => r.isPrediction)
    const tableRows = getForecastTableRows(chartTabs)

    return {
        rows: [
            [i18n.t('Quantiles'), ...predictionRows.map((r) => r.label)],
            ...tableRows.map(({ label, get }) => [
                label,
                ...predictionRows.map((r) => formatForecastValue(get(r))),
            ]),
        ],
        headerRowCount: 1,
    }
}
