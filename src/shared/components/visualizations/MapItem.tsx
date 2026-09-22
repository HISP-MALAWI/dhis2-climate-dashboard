import { Map as LeafletMap } from 'leaflet'
import { useRef, useState } from 'react'
import { DisplayItemContainer } from './DisplayItemContainer'
import { MapVisualizer, getOrgUnitSelectionFromIds } from './MapVisualizer'
import { useFilters } from '@/shared/hooks/useFilters'
import { useMapConfig } from '@/shared/hooks/useMapConfig'

interface MapItemProps {
    id: string
    defaultPeriodIds?: string[]
    className?: string
}

export function MapItem({ id, defaultPeriodIds = [], className }: MapItemProps) {
    const mapRef = useRef<LeafletMap | null>(null)
    const { mapConfig, loading, error } = useMapConfig(id)
    const { paramsMap } = useFilters()

    const [selectedOrgUnits, setSelectedOrgUnits] = useState<string[]>([])
    const [selectedPeriods, setSelectedPeriods] = useState<string[]>([])

    const activeOrgUnits =
        selectedOrgUnits.length > 0
            ? selectedOrgUnits
            : (paramsMap.get('ou')?.split(',') ?? [])
    const fallbackPeriods = paramsMap.get('pe')?.split(',') ?? defaultPeriodIds
    const activePeriods =
        selectedPeriods.length > 0
            ? selectedPeriods
            : fallbackPeriods

    const orgUnitSelection =
        activeOrgUnits.length > 0
            ? getOrgUnitSelectionFromIds(activeOrgUnits)
            : undefined

    const periodSelection =
        activePeriods.length > 0 ? { periods: activePeriods } : undefined

    return (
        <div className={className}>
            <DisplayItemContainer
                title={mapConfig?.name}
                loading={loading}
                error={error}
                mapRef={mapRef}
                selectedOrgUnits={selectedOrgUnits}
                selectedPeriods={selectedPeriods}
                onOrgUnitChange={setSelectedOrgUnits}
                onPeriodChange={setSelectedPeriods}
            >
                {mapConfig && (
                    <MapVisualizer
                        mapConfig={mapConfig}
                        setRef={(map) => {
                            mapRef.current = map
                        }}
                        orgUnitSelection={orgUnitSelection}
                        periodSelection={periodSelection}
                    />
                )}
            </DisplayItemContainer>
        </div>
    )
}
