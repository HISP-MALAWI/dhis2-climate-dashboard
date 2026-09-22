import i18n from '@dhis2/d2-i18n'
import { createFileRoute } from '@tanstack/react-router'
import HighchartsReact from 'highcharts-react-official'
import { useEffect, useMemo, useRef, useState } from 'react'
import { KpiVisualizationItem } from './components/KpiVisualizationItem'
import { OrgUnitSidebar } from './components/OrgUnitSidebar'
import {
    COUNTY_LEVEL_PIVOT,
    COUNTY_OU_LEVEL,
    FORECAST_CHART_TABS,
    FORECAST_REFERENCE_LINES,
    KPI_IDS,
    MAP_IDS,
    NATIONAL_OU_LEVEL,
    STATE_OU_LEVEL,
} from './constants'
import { useForecastData } from './hooks/useForecastData'
import { useAllCounties, useCounties, useStates } from './hooks/useOrgUnitLevel'
import type { OrgUnit } from './hooks/useOrgUnitLevel'
import { buildForecastTableMatrix } from './utils/forecastTable'
import { getPredictionPeriods } from './utils/periods'
import { DisplayItemContainer } from '@/shared/components/visualizations/DisplayItemContainer'
import { MapItem } from '@/shared/components/visualizations/MapItem'
import { PredictionChart } from '@/shared/components/visualizations/PredictionChart'
import { VisualizationItem } from '@/shared/components/visualizations/VisualizationItem'

export const Route = createFileRoute('/chap-forecast-alerts/')({
    component: ChapForecastAlerts,
})

function ChapForecastAlerts() {
    const chartRef = useRef<HighchartsReact.RefObject | null>(null)
    const [selectedState, setSelectedState] = useState<OrgUnit | null>(null)
    const [selectedCounty, setSelectedCounty] = useState<OrgUnit | null>(null)
    const predictionPeriods = useMemo(() => getPredictionPeriods(3), [])

    const { states: nationalOrgUnits, loading: nationalLoading } =
        useStates(NATIONAL_OU_LEVEL)
    const { states, loading: statesLoading } = useStates(STATE_OU_LEVEL)
    const { counties, loading: countiesLoading } = useCounties(
        selectedState?.id ?? null
    )
    const { allCounties, loading: allCountiesLoading } =
        useAllCounties(COUNTY_OU_LEVEL)

    const allStates = [...nationalOrgUnits, ...states]
    const isNationalSelected = nationalOrgUnits.some(
        (ou) => ou.id === selectedState?.id
    )

    useEffect(() => {
        if (!selectedState && nationalOrgUnits.length > 0) {
            setSelectedState(nationalOrgUnits[0] ?? null)
        }
    }, [nationalOrgUnits, selectedState])

    const activeOrgUnit = selectedCounty ?? selectedState

    const { rows, loading: forecastLoading } = useForecastData(
        activeOrgUnit?.id ?? null,
        FORECAST_REFERENCE_LINES
    )

    const [isTableView, setIsTableView] = useState(false)
    const forecastMatrix = useMemo(
        () =>
            buildForecastTableMatrix({ rows, chartTabs: FORECAST_CHART_TABS }),
        [rows]
    )

    function handleStateSelect(ou: OrgUnit) {
        setSelectedState(ou)
        setSelectedCounty(null)
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex gap-4 items-start">
                <OrgUnitSidebar
                    states={allStates}
                    statesLoading={nationalLoading || statesLoading}
                    counties={isNationalSelected ? [] : counties}
                    countiesLoading={!isNationalSelected && countiesLoading}
                    allCounties={allCounties}
                    allCountiesLoading={allCountiesLoading}
                    selectedStateId={selectedState?.id ?? null}
                    onStateSelect={handleStateSelect}
                    selectedCountyId={selectedCounty?.id ?? null}
                    onCountySelect={setSelectedCounty}
                />

                <div className="flex min-w-0 flex-1 flex-col gap-4">
                    <div className="grid grid-cols-4 gap-4">
                        {[...KPI_IDS].map((id) => (
                            <KpiVisualizationItem
                                key={id}
                                id={id}
                                orgUnitId={activeOrgUnit?.id ?? null}
                                defaultPeriodIds={predictionPeriods}
                                className="h-36"
                            />
                        ))}
                    </div>

                    <div className="h-128">
                        <DisplayItemContainer
                            title={i18n.t('Malaria Forecast — {{name}}', {
                                name: activeOrgUnit?.displayName ?? '…',
                            })}
                            chartRef={isTableView ? undefined : chartRef}
                            tableMatrix={
                                isTableView ? forecastMatrix : undefined
                            }
                            loading={forecastLoading}
                        >
                            <PredictionChart
                                ref={chartRef}
                                rows={rows}
                                orgUnitName={activeOrgUnit?.displayName ?? ''}
                                chartTabs={FORECAST_CHART_TABS}
                                onTableViewChange={setIsTableView}
                            />
                        </DisplayItemContainer>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {[...MAP_IDS].map((mapId) => (
                    <MapItem
                        key={mapId}
                        id={mapId}
                        defaultPeriodIds={predictionPeriods}
                        className="h-160"
                    />
                ))}
            </div>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-1">
                <VisualizationItem
                    id={COUNTY_LEVEL_PIVOT}
                    defaultPeriodIds={predictionPeriods}
                    className="h-160"
                />
            </div>
        </div>
    )
}
