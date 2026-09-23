import { useDataEngine } from '@dhis2/app-runtime'
import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import { parseAvailableOrgUnits, parseSeriesResponse } from './analytics'
import EwarsChart from './components/EwarsChart'
import { EWARS_DATA_ELEMENTS, NUMERIC_EWARS_DATA_ELEMENTS, PLUGIN_DEFAULTS } from './metadata'
import {
    buildDiscoveryPeriods,
    formatWeekPeriod,
    latestWeekPeriods,
    weekPeriodRangeEndingAt,
} from './periods'

const REQUIRED_IDS = NUMERIC_EWARS_DATA_ELEMENTS

type AnalyticsResult = {
    headers?: Array<{ name: string; column?: string }>
    rows?: string[][]
}

type MetadataResponse = {
    levels: { organisationUnitLevels: Array<{ id: string; displayName: string; level: number }> }
    dataElements: { dataElements: Array<{ id: string }> }
}

function errorMessage(error: unknown) {
    const value = error as { details?: { message?: string; description?: string }; message?: string }
    return value?.details?.message || value?.details?.description || value?.message || 'The DHIS2 request failed.'
}

function safeStorageGet(key: string) {
    try {
        return window.localStorage.getItem(key)
    } catch {
        return null
    }
}

function safeStorageSet(key: string, value: string | number) {
    try {
        window.localStorage.setItem(key, String(value))
    } catch {
        return undefined
    }
}

function Spinner({ label = 'Loading' }: { label?: string }) {
    return <div className="p-6 text-sm text-slate-500" role="status">{label}…</div>
}

function ErrorState({ title, error, onRetry }: { title: string; error: unknown; onRetry: () => void }) {
    return (
        <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-red-800" role="alert">
            <h3 className="font-semibold">{title}</h3>
            <p className="mt-1 text-sm">{errorMessage(error)}</p>
            <button className="mt-3 rounded-md border border-red-300 bg-white px-3 py-1.5 text-sm" type="button" onClick={onRetry}>
                Try again
            </button>
        </div>
    )
}

function EmptyState({ levelName, onReload }: { levelName: string; onReload: () => void }) {
    return (
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-slate-700">
            <h3 className="font-semibold">No EWARS prediction data found</h3>
            <p className="mt-1 text-sm">No organisation units at {levelName} have values for <code>{EWARS_DATA_ELEMENTS.predictedCases}</code> in the configured search window.</p>
            <button className="mt-3 rounded-md border border-slate-300 px-3 py-1.5 text-sm" type="button" onClick={onReload}>Reload results</button>
        </div>
    )
}

export const Route = createFileRoute('/ewars-forecasts-alerts/')({
    component: EwarsForecastsAlertsModule,
})

function EwarsForecastsAlertsModule() {
    const engine = useDataEngine()
    const requestSequence = useRef({ discovery: 0, series: 0 })
    const [levels, setLevels] = useState<Array<{ id: string; displayName: string; level: number }>>([])
    const [level, setLevel] = useState<number | null>(null)
    const [missingMetadata, setMissingMetadata] = useState<string[]>([])
    const [bootLoading, setBootLoading] = useState(true)
    const [bootError, setBootError] = useState<unknown>(null)
    const [availableUnits, setAvailableUnits] = useState<ReturnType<typeof parseAvailableOrgUnits>>([])
    const [selectedOu, setSelectedOu] = useState('')
    const [discoveryLoading, setDiscoveryLoading] = useState(false)
    const [discoveryError, setDiscoveryError] = useState<unknown>(null)
    const [points, setPoints] = useState<ReturnType<typeof parseSeriesResponse>>([])
    const [seriesLoading, setSeriesLoading] = useState(false)
    const [seriesError, setSeriesError] = useState<unknown>(null)
    const [reloadNonce, setReloadNonce] = useState(0)
    const [metric, setMetric] = useState<'rate' | 'cases'>(() => (safeStorageGet('ewars:metric') as 'rate' | 'cases') || 'rate')

    const discoveryPeriods = useMemo(() => buildDiscoveryPeriods(new Date(), PLUGIN_DEFAULTS.discoveryWeeksBack, PLUGIN_DEFAULTS.discoveryWeeksForward), [])

    useEffect(() => {
        let active = true
        setBootLoading(true)
        setBootError(null)
        engine.query<MetadataResponse>({
            levels: { resource: 'organisationUnitLevels', params: { fields: 'id,displayName,level', paging: false } },
            dataElements: { resource: 'dataElements', params: { fields: 'id,displayName,valueType', filter: `id:in:[${REQUIRED_IDS.join(',')}]`, paging: false } },
        }).then((data) => {
            if (!active) {return}
            const fetchedLevels = [...(data.levels?.organisationUnitLevels || [])].sort((a, b) => a.level - b.level)
            const foundIds = new Set((data.dataElements?.dataElements || []).map((item) => item.id))
            setLevels(fetchedLevels)
            setMissingMetadata(REQUIRED_IDS.filter((id) => !foundIds.has(id)))
            const stored = Number(safeStorageGet('ewars:level'))
            const defaultLevel = fetchedLevels.find((item) => item.level === stored) || fetchedLevels.find((item) => /district/i.test(item.displayName)) || fetchedLevels[1] || fetchedLevels[0]
            setLevel(defaultLevel?.level ?? null)
        }).catch((error) => { if (active) {setBootError(error)} }).finally(() => { if (active) {setBootLoading(false)} })
        return () => { active = false }
    }, [engine, reloadNonce])

    useEffect(() => {
        if (!level || missingMetadata.length || bootLoading) {return}
        const sequence = ++requestSequence.current.discovery
        setDiscoveryLoading(true)
        setDiscoveryError(null)
        engine.query<{ predictions: AnalyticsResult }>({
            predictions: { resource: 'analytics', params: { dimension: [`dx:${EWARS_DATA_ELEMENTS.predictedCases}`, `pe:${discoveryPeriods.join(';')}`, `ou:LEVEL-${level}`], skipRounding: true, includeNumDen: false, hierarchyMeta: true, displayProperty: 'NAME' } },
        }).then((data) => {
            if (sequence !== requestSequence.current.discovery) {return}
            const units = parseAvailableOrgUnits(data.predictions)
            setAvailableUnits(units)
            const storedOu = safeStorageGet('ewars:ou')
            setSelectedOu(units.find((unit) => unit.id === storedOu)?.id || units[0]?.id || '')
        }).catch((error) => {
            if (sequence === requestSequence.current.discovery) {setDiscoveryError(error)}
        }).finally(() => {
            if (sequence === requestSequence.current.discovery) {setDiscoveryLoading(false)}
        })
    }, [engine, level, missingMetadata, bootLoading, discoveryPeriods, reloadNonce])

    const selectedUnit = availableUnits.find((unit) => unit.id === selectedOu)
    const selectedPeriods = useMemo(() => weekPeriodRangeEndingAt(latestWeekPeriods(selectedUnit?.periods || [], 1)[0], PLUGIN_DEFAULTS.displayedWeeks), [selectedUnit])

    useEffect(() => {
        console.log(availableUnits)
        
        if (!selectedOu || !selectedPeriods.length) {
            setPoints([])
            return
        }
        const sequence = ++requestSequence.current.series
        setSeriesLoading(true)
        setSeriesError(null)
        engine.query<{ series: AnalyticsResult }>({
            series: { resource: 'analytics', params: { dimension: [`dx:${NUMERIC_EWARS_DATA_ELEMENTS.join(';')}`, `pe:${selectedPeriods.join(';')}`], filter: `ou:${selectedOu}`, skipRounding: true, includeNumDen: false, displayProperty: 'NAME' } },
        }).then((data) => {
            if (sequence === requestSequence.current.series) {setPoints(parseSeriesResponse(data.series, selectedPeriods))}
        }).catch((error) => {
            if (sequence === requestSequence.current.series) {setSeriesError(error)}
        }).finally(() => {
            if (sequence === requestSequence.current.series) {setSeriesLoading(false)}
        })
    }, [engine, selectedOu, selectedPeriods, reloadNonce])

    const currentLevel = levels.find((item) => item.level === level)
    const predictionKey = metric === 'rate' ? 'predictedRate' : 'predictedCases'
    const predictionWeeks = points.filter((point) => Number.isFinite(point[predictionKey])).length
    const alarmWeeks = points.filter((point) => Number(point.alarmSignal) > 0).length
    const outbreakWeeks = points.filter((point) => Number(point.outbreakPeriod) > 0).length
    const reload = () => setReloadNonce((value) => value + 1)

    if (bootLoading) {return <main className="ewars-plugin"><Spinner label="Checking EWARS metadata" /></main>}
    if (bootError) {return <main className="ewars-plugin"><ErrorState title="Could not load DHIS2 metadata" error={bootError} onRetry={reload} /></main>}
    if (missingMetadata.length) {return <main className="ewars-plugin"><ErrorState title="EWARS metadata is incomplete" error={{ message: `Missing data elements: ${missingMetadata.join(', ')}` }} onRetry={reload} /></main>}

    return (
        <main className="ewars-plugin flex flex-col gap-4 rounded-xl bg-slate-50 p-4">
            <header className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
                <div><h2 className="text-lg font-semibold text-slate-800">EWARS predictions</h2><p className="text-sm text-slate-500">Weekly predicted incidence, credible intervals, endemic channel, and alarm signals</p></div>
                <button className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm" type="button" onClick={reload}>Reload results</button>
            </header>
            <section className="flex flex-wrap items-end justify-between gap-4" aria-label="EWARS chart filters">
                <label className="flex flex-col gap-1 text-sm text-slate-700">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Organisation unit</span>
                    <select className="rounded-md border border-slate-300 bg-white px-3 py-2" value={selectedOu} onChange={(event) => { setSelectedOu(event.target.value); safeStorageSet('ewars:ou', event.target.value) }} disabled={discoveryLoading || !availableUnits.length}>
                        {!availableUnits.length && <option value="">No units with data</option>}
                        {availableUnits.map((unit) => <option key={unit.id} value={unit.id}>{unit.displayName}</option>)}
                    </select>
                    <small>{discoveryLoading ? 'Finding units with prediction data…' : `${availableUnits.length} unit${availableUnits.length === 1 ? '' : 's'} with prediction data`}</small>
                </label>
                <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-white p-1">
                    {(['rate', 'cases'] as const).map((value) => <button key={value} type="button" className={`rounded-md px-3 py-1.5 text-sm ${metric === value ? 'bg-slate-900 text-white' : 'text-slate-600'}`} onClick={() => { setMetric(value); safeStorageSet('ewars:metric', value) }}>{value === 'rate' ? 'RATE /100K' : 'CASES'}</button>)}
                </div>
                <label className="flex flex-col gap-1 text-sm text-slate-700">Prediction OU level
                    <select className="rounded-md border border-slate-300 bg-white px-3 py-2" value={level || ''} onChange={(event) => { const next = Number(event.target.value); setLevel(next); safeStorageSet('ewars:level', next) }}>{levels.map((item) => <option key={item.id} value={item.level}>{item.displayName} (L{item.level})</option>)}</select>
                </label>
            </section>
            <div className="flex flex-wrap gap-2 text-sm text-slate-600"><span className="rounded-full border bg-white px-3 py-1.5">{predictionWeeks} prediction weeks</span><span className="rounded-full border bg-white px-3 py-1.5">{alarmWeeks} alarm weeks</span><span className="rounded-full border bg-white px-3 py-1.5">{outbreakWeeks} outbreak weeks</span>{points.length > 0 && <span className="rounded-full border bg-white px-3 py-1.5">through {formatWeekPeriod(points[points.length - 1].period)}</span>}</div>
            {discoveryLoading ? <Spinner label={`Finding ${currentLevel?.displayName || 'organisation unit'} units with predictions`} /> : discoveryError ? <ErrorState title="Could not discover organisation units with prediction data" error={discoveryError} onRetry={reload} /> : !availableUnits.length ? <EmptyState levelName={currentLevel?.displayName || 'selected level'} onReload={reload} /> : seriesLoading ? <Spinner label={`Loading predictions for ${selectedUnit?.displayName || ''}`} /> : seriesError ? <ErrorState title="Could not load EWARS prediction series" error={seriesError} onRetry={reload} /> : points.length ? <EwarsChart points={points} metric={metric} /> : <EmptyState levelName={selectedUnit?.displayName || 'selected organisation unit'} onReload={reload} />}
        </main>
    )
}
