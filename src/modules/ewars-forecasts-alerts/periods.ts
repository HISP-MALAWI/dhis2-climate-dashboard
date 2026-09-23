export function formatWeekPeriod(period: string) {
    if (!period) {return ''}

    const isoMatch = /^(\d{4})W(\d{2})$/.exec(period)
    if (isoMatch) {
        return `${isoMatch[1]}-W${isoMatch[2]}`
    }

    const dashedMatch = /^(\d{4})-(W\d{2})$/.exec(period)
    if (dashedMatch) {
        return `${dashedMatch[1]}-${dashedMatch[2]}`
    }

    return period
}

function isoWeekPeriod(date: Date) {
    const value = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    const day = value.getUTCDay() || 7
    value.setUTCDate(value.getUTCDate() + 4 - day)
    const yearStart = new Date(Date.UTC(value.getUTCFullYear(), 0, 1))
    const week = Math.ceil(((value.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
    return `${value.getUTCFullYear()}W${String(week).padStart(2, '0')}`
}

export function buildDiscoveryPeriods(date: Date, weeksBack: number, weeksForward: number) {
    const periods: string[] = []
    const current = new Date(date)
    current.setDate(current.getDate() - ((current.getDay() + 6) % 7) - weeksBack * 7)
    for (let index = 0; index <= weeksBack + weeksForward; index += 1) {
        periods.push(isoWeekPeriod(current))
        current.setDate(current.getDate() + 7)
    }
    return periods
}

export function latestWeekPeriods(periods: string[], count: number) {
    return [...periods].sort().slice(-count)
}

export function weekPeriodRangeEndingAt(period: string | undefined, count: number) {
    if (!period) {return []}
    const match = /^(\d{4})W(\d{2})$/.exec(period)
    if (!match) {return [period]}
    const date = new Date(Date.UTC(Number(match[1]), 0, 1))
    date.setUTCDate(date.getUTCDate() + (Number(match[2]) - 1) * 7)
    return Array.from({ length: count }, (_, index) => {
        const week = new Date(date)
        week.setUTCDate(week.getUTCDate() - (count - index - 1) * 7)
        return isoWeekPeriod(week)
    })
}
