import { createFileRoute } from '@tanstack/react-router'
import { useMemo } from 'react'
import {
    CLIMATIC_SUITABILITY_MAP_ID,
    HUMIDITY_CORRELATION_VIZ_ID,
    PRECIPITATION_CORRELATION_VIZ_ID,
    RELATIONSHIP_BTN_CLIMATE_COVARIATES_ID,
    TEMPERATURE_CORRELATION_VIZ_ID,
} from './constants'
import { MapItem } from '@/shared/components/visualizations/MapItem'
import { VisualizationItem } from '@/shared/components/visualizations/VisualizationItem'
import { getLastNMonthsPeriodIds } from '@/shared/utils'

export const Route = createFileRoute('/climate-malaria-relationship/')({
    component: ClimateMalariaRelationship,
})

function ClimateMalariaRelationship() {
    // DHIS2 has no built-in "last 24 months" relative period.
    const last24Months = useMemo(() => getLastNMonthsPeriodIds(24), [])

    return (
        <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <MapItem id={CLIMATIC_SUITABILITY_MAP_ID} className="h-200" />
                <MapItem
                    id={RELATIONSHIP_BTN_CLIMATE_COVARIATES_ID}
                    className="h-200"
                />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-1">
                <VisualizationItem
                    id={PRECIPITATION_CORRELATION_VIZ_ID}
                    forcedPeriodIds={last24Months}
                    className="h-200"
                />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <VisualizationItem
                    id={HUMIDITY_CORRELATION_VIZ_ID}
                    className="h-160"
                />
                <VisualizationItem
                    id={TEMPERATURE_CORRELATION_VIZ_ID}
                    className="h-160"
                />
            </div>
        </div>
    )
}
