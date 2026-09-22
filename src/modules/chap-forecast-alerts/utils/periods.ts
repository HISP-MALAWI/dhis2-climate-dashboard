function addMonths(date: Date, n: number): Date {
    return new Date(date.getFullYear(), date.getMonth() + n, 1)
}

export function getMonthPeriod(date: Date): string {
    return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`
}

/**
 * Each month's data is submitted to DHIS2 on the 15th of the following month.
 * e.g. March data is submitted on April 15th.
 * - On/after the 15th: previous month's data is available → historical ends at
 *   previous month, predictions start from current month.
 * - Before the 15th: only data up to 2 months ago → predictions start from
 *   the previous month.
 */
const DATA_SUBMISSION_DAY = 15

function getDataOffset(): number {
    return new Date().getDate() >= DATA_SUBMISSION_DAY ? 0 : -1
}

export function getHistoricalPeriods(count: number): string[] {
    const now = new Date()
    const offset = getDataOffset()
    // End at: previous month (if past 15th) or 2 months ago (before 15th)
    return Array.from({ length: count }, (_, i) =>
        getMonthPeriod(addMonths(now, offset - count + i))
    )
}

export function getPredictionPeriods(count: number): string[] {
    const now = new Date()
    const offset = getDataOffset()
    // Start at: current month (if past 15th) or previous month (before 15th)
    return Array.from({ length: count }, (_, i) =>
        getMonthPeriod(addMonths(now, offset + i))
    )
}

const MONTH_LABELS = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
]

export function formatPeriod(period: string): string {
    const year = period.slice(0, 4)
    const month = parseInt(period.slice(4, 6), 10) - 1
    return `${MONTH_LABELS[month]} ${year}`
}

export function parseAnalyticsRows(
    headers: { name: string }[],
    rows: string[][]
): Map<string, Map<string, number>> {
    const dxIdx = headers.findIndex((h) => h.name === 'dx')
    const peIdx = headers.findIndex((h) => h.name === 'pe')
    const valueIdx = headers.findIndex((h) => h.name === 'value')

    const result = new Map<string, Map<string, number>>()
    for (const row of rows) {
        const period = row[peIdx]
        const dx = row[dxIdx]
        const value = parseFloat(row[valueIdx])
        if (!Number.isNaN(value)) {
            if (!result.has(period)) {
                result.set(period, new Map())
            }
            result.get(period)!.set(dx, value)
        }
    }
    return result
}
