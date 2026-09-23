import type { EwarsChartPoint } from './components/EwarsChart'
import { EWARS_DATA_ELEMENTS } from './metadata'

type AnalyticsResult = {
    headers?: Array<{ name: string; column?: string }>
    metaData?: {
        items?: Record<string, { name?: string }>
    }
    rows?: string[][]
}

function columnIndex(result: AnalyticsResult | undefined, names: string[]) {
    const aliases = new Set(names.map((name) => name.toLowerCase().replace(/[^a-z]/g, '')))
    return result?.headers?.findIndex((header) => {
        const value = (header.name || header.column || '').toLowerCase().replace(/[^a-z]/g, '')
        return aliases.has(value)
    }) ?? -1
}

function cell(row: string[], index: number) {
    return index >= 0 ? row[index] : undefined
}

function numeric(value: string | undefined) {
    if (value === undefined || value === '') {return null}
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
}

export type AvailableOrgUnit = {
    id: string
    displayName: string
    periods: string[]
}

export function parseAvailableOrgUnits(data: AnalyticsResult | undefined) {
    const ouIndex = columnIndex(data, ['ou', 'organisationunit'])
    const nameIndex = columnIndex(data, ['ouname', 'organisationunitname', 'organisationunitdisplayname', 'displayname', 'name'])
    const periodIndex = columnIndex(data, ['pe', 'period'])
    const units = new Map<string, AvailableOrgUnit>()
    const metadataItems = data?.metaData?.items ?? {}

    for (const row of data?.rows ?? []) {
        const id = cell(row, ouIndex)
        if (!id) {continue}
        const displayName = metadataItems[id]?.name || cell(row, nameIndex) || id
        const unit = units.get(id) ?? { id, displayName, periods: [] }
        const period = cell(row, periodIndex)
        if (period && !unit.periods.includes(period)) {unit.periods.push(period)}
        units.set(id, unit)
    }

    return [...units.values()].sort((a, b) => a.displayName.localeCompare(b.displayName))
}

export function parseSeriesResponse(data: AnalyticsResult | undefined, periods: string[]): EwarsChartPoint[] {
    const dxIndex = columnIndex(data, ['dx', 'dataelement'])
    const periodIndex = columnIndex(data, ['pe', 'period'])
    const valueIndex = columnIndex(data, ['value'])
    const byPeriod = new Map<string, Map<string, number | null>>()

    for (const row of data?.rows ?? []) {
        const period = cell(row, periodIndex)
        const dataElement = cell(row, dxIndex)
        if (!period || !dataElement) {continue}
        const values = byPeriod.get(period) ?? new Map<string, number | null>()
        values.set(dataElement, numeric(cell(row, valueIndex)))
        byPeriod.set(period, values)
    }

    return periods.map((period) => {
        const values = byPeriod.get(period)
        const get = (key: keyof typeof EWARS_DATA_ELEMENTS) => values?.get(EWARS_DATA_ELEMENTS[key]) ?? null
        return {
            period,
            predictedRate: get('predictedRate'),
            predictedRateLower: get('predictedRateLower'),
            predictedRateUpper: get('predictedRateUpper'),
            endemicChannel: get('endemicChannel'),
            outbreakProbability: get('outbreakProbability'),
            alarmSignal: get('alarmSignal'),
            outbreakPeriod: get('outbreakPeriod'),
            predictedCases: get('predictedCases'),
            predictedCasesLower: get('predictedCasesLower'),
            predictedCasesUpper: get('predictedCasesUpper'),
        }
    })
}