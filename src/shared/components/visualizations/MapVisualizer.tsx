import {
    DHIS2Map,
    EarthEngineLayerConfig,
    getColorScale,
    MapProps,
    ThematicLayerConfig,
} from '@hisptz/dhis2-analytics'
import { OrgUnitSelection } from '@hisptz/dhis2-utils'
import { Map as LeafletMap } from 'leaflet'
import { forEach, head, isEmpty, set } from 'lodash'
import { memo, useCallback, useMemo, useState } from 'react'
import styles from './MapVisualizer.module.css'
import { useMapLabelCollision } from '@/shared/hooks/useMapLabelCollision'
import { MapConfig, MapLayerType } from '@/shared/schemas'

const VALUE_LABEL_CONFIG = {
    labels: true,
    labelFontWeight: 'bold',
    labelTemplate: '{name}\n{value}',
}

export interface MapViewProps {
    setRef: (map: LeafletMap) => void
    mapConfig: MapConfig
    periodSelection?: MapProps['periodSelection']
    orgUnitSelection?: MapProps['orgUnitSelection']
}

export function getOrgUnitSelectionFromIds(ous: string[]) {
    const orgUnitSelection: OrgUnitSelection = {
        userOrgUnit: false,
        userSubUnit: false,
        userSubX2Unit: false,
        orgUnits: [],
        levels: [],
        groups: [],
    }
    forEach(ous, (ou) => {
        if (ou === 'USER_ORGUNIT') {
            set(orgUnitSelection, ['userOrgUnit'], true)
        } else if (ou === 'USER_ORGUNIT_CHILDREN') {
            set(orgUnitSelection, ['userSubUnit'], true)
        } else if (ou === 'USER_ORGUNIT_GRANDCHILDREN') {
            set(orgUnitSelection, ['userSubX2Unit'], true)
        } else {
            if (ou.includes('LEVEL-')) {
                orgUnitSelection.levels!.push(ou.replace('LEVEL-', ''))
                return
            }
            if (ou.includes('GROUP-')) {
                orgUnitSelection.groups!.push(ou.replace('GROUP-', ''))
                return
            }
            orgUnitSelection.orgUnits!.push({
                id: ou,
                children: [],
                path: '',
            })
        }
    })
    return orgUnitSelection
}

export const MapVisualizer = memo(function MapVisualizer({
    mapConfig,
    setRef,
    periodSelection,
    orgUnitSelection,
}: MapViewProps) {
    const [map, setMap] = useState<LeafletMap | null>(null)
    const handleRef = useCallback(
        (instance: LeafletMap) => {
            setMap(instance)
            setRef(instance)
        },
        [setRef]
    )
    useMapLabelCollision(map)

    const thematicLayers = useMemo(() => {
        return mapConfig.mapViews
            ?.filter((view) => view.layer.includes(MapLayerType.THEMATIC))
            ?.map((view) => {
                const dataItem = head(head(view.columns)?.items)
                if (!dataItem) {
                    return null
                }

                return {
                    id: view.id,
                    enabled: true,
                    type: view.thematicMapType?.toLowerCase() ?? 'choropleth',
                    dataItem: {
                        id: dataItem.id,
                        type: dataItem.dimensionItemType ?? 'INDICATOR',
                        legendSet: view.legendSet?.id,
                        displayName: view.displayName ?? dataItem.name,
                        legendConfig: {
                            scale: view.classes,
                            colorClass: view.colorScale
                                ? getColorScale(view.colorScale)
                                : undefined,
                        },
                    },
                    name: view.displayName ?? dataItem.name,
                    labelConfig: VALUE_LABEL_CONFIG,
                    control: {
                        enabled: true,
                        position: 'topright',
                    },
                    radius: {
                        min: view.radiusLow ?? 20,
                        max: view.radiusHigh ?? 20,
                    },
                } as ThematicLayerConfig
            })
            .filter((l): l is ThematicLayerConfig => l !== null)
    }, [mapConfig.mapViews])

    const boundaryLayer = useMemo(() => {
        return head(
            mapConfig.mapViews
                ?.filter((view) => view.layer === MapLayerType.ORG_UNIT)
                .map(
                    (view) =>
                        ({
                            id: view.id,
                            enabled: true,
                        }) as MapProps['boundaryLayer']
                )
        )
    }, [mapConfig.mapViews])

    const earthEngineLayers: EarthEngineLayerConfig[] = useMemo(() => {
        return mapConfig.mapViews
            .filter((view) => view.layer === MapLayerType.EARTH_ENGINE)
            .map((view) => {
                const config = JSON.parse(view.config!)
                return {
                    id: config.band,
                    enabled: true,
                    type: config.band,
                    aggregations: config.aggregationType,
                    name: view.displayName,
                    params: {
                        ...config.style,
                        palette: config.style.palette.join(','),
                    },
                    filters: {
                        period: config.period.id,
                    },
                } as EarthEngineLayerConfig
            })
    }, [mapConfig.mapViews])

    const renderingStrategy = useMemo(() => {
        return head(
            mapConfig.mapViews.filter((view) =>
                view.layer.includes(MapLayerType.THEMATIC)
            )
        )?.renderingStrategy
    }, [mapConfig.mapViews])

    const activePeriodSelection = useMemo(() => {
        if (periodSelection) {
            return periodSelection
        }

        const periods = head(
            mapConfig.mapViews.filter((view) =>
                view.layer.includes(MapLayerType.THEMATIC)
            )
        )
            ?.filters?.map(({ items }) => items.map(({ id }) => id))
            .flat()

        const resolvedPeriods: string[] = !isEmpty(periods)
            ? periods!
            : ['THIS_YEAR']

        // For SINGLE renderingStrategy (non-timeline), use only the latest period.
        // Passing all periods as analytics dimensions returns per-period rows which
        // can't be meaningfully aggregated client-side for indicators.
        if (renderingStrategy !== 'TIMELINE' && resolvedPeriods.length > 1) {
            return { periods: [resolvedPeriods[resolvedPeriods.length - 1]] }
        }

        return { periods: resolvedPeriods }
    }, [mapConfig.mapViews, periodSelection, renderingStrategy])

    const activeOrgUnitSelection = useMemo(() => {
        if (orgUnitSelection) {
            return orgUnitSelection
        }

        const orgUnitConfig = head(
            mapConfig.mapViews.filter(
                (view) => !view.layer.includes(MapLayerType.ORG_UNIT)
            )
        )
            ?.rows?.map(({ items }) => items.map(({ id }) => id))
            .flat()

        return getOrgUnitSelectionFromIds(orgUnitConfig ?? [])
    }, [mapConfig.mapViews, orgUnitSelection])
    return (
        <div className={styles.mapRoot}>
            <DHIS2Map
                mapOptions={{
                    trackResize: true,
                    zoomControl: true,
                    scrollWheelZoom: false,
                    bounceAtZoomLimits: true,
                    boxZoom: true,
                    zoom: mapConfig.zoom ?? 1,
                    attributionControl: false,
                    style: {
                        height: '100%',
                        width: '100%',
                        background: '#FFFFFF',
                    },
                }}
                earthEngineLayers={earthEngineLayers}
                base={{ enabled: false, url: '', attribution: '' }}
                controls={[
                    {
                        type: 'scale',
                        position: 'bottomleft',
                        options: { imperial: false, metric: true },
                    },
                    { type: 'compass', position: 'bottomleft' },
                ]}
                legends={{
                    collapsible: true,
                    enabled: true,
                    position: 'topright',
                }}
                setRef={handleRef}
                showPeriodTitle
                periodSelection={activePeriodSelection}
                boundaryLayer={boundaryLayer}
                orgUnitSelection={activeOrgUnitSelection}
                thematicLayers={thematicLayers}
                renderingStrategy={renderingStrategy}
                analyticsOptions={{ displayProperty: 'SHORTNAME' }}
            />
        </div>
    )
})
