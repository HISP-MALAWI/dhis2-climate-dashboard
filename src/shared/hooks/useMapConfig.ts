import { useDataQuery } from '@dhis2/app-runtime'
import { MapConfig } from '@/shared/schemas'

const ITEMS_FIELDS =
    'items[dimensionItem~rename(id),dimensionItemType,displayName~rename(name)]'

const MAP_FIELDS =
    'id,name,basemap,zoom,' +
    'mapViews[*,' +
    `columns[dimension,filter,${ITEMS_FIELDS}],` +
    `rows[dimension,filter,${ITEMS_FIELDS}],` +
    `filters[dimension,filter,${ITEMS_FIELDS}],` +
    'organisationUnits[id,path],' +
    'legendSet[id],' +
    'dataDimensionItems[dataDimensionItemType,indicator[id],dataElement[id],programIndicator[id]]' +
    ']'

const MAP_QUERY = {
    map: {
        resource: 'maps',
        id: ({ id }: Record<string, unknown>) => id as string,
        params: { fields: MAP_FIELDS },
    },
}

export function useMapConfig(mapId: string) {
    const { loading, error, data } = useDataQuery<{ map: MapConfig }>(
        MAP_QUERY,
        { variables: { id: mapId } }
    )

    return { loading, error, mapConfig: data?.map }
}
