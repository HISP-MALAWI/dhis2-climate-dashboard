import { DateTime } from 'luxon'

export function getLastNMonthsPeriodIds(n: number, from: DateTime = DateTime.now()): string[] {
    return Array.from({ length: n }, (_, i) =>
        from.minus({ months: n - i }).toFormat('yyyyLL')
    )
}
