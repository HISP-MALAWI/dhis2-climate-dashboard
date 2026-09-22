import { LegendSet } from '@hisptz/dhis2-utils'
import { compact, isArray } from 'lodash'
import {
    AnalyticsData,
    DimensionConfig,
    LegendStrategy,
    VisualizationConfig,
} from '@/shared/schemas'
import { getVisualizationLegendSet } from '@/shared/utils/visualizer'

export interface PivotItem {
    id: string
    name: string
}

export interface PivotModel {
    rowLabel: string
    outerColItems: PivotItem[]
    innerColItems: PivotItem[]
    hasInnerCol: boolean
    outerRowItems: PivotItem[]
    rowDims: string[]
    colDims: string[]
    dxDimId: string
    getValue: (dims: Record<string, string>) => number | undefined
}

const HIDDEN_DIMENSION_KEYS = new Set(['pe', 'ou', 'dx', 'co'])

function getDimensionLabel(dim?: DimensionConfig): string | undefined {
    if (dim?.dimension !== 'ou') {
        return undefined
    }
    return 'Organisation Units'
}

export function formatValue(value: number | undefined): string {
    if (value === undefined) {
        return ''
    }
    return Number.isInteger(value)
        ? value.toString()
        : parseFloat(value.toFixed(2)).toString()
}

export function buildLegendMap(
    visualization: VisualizationConfig
): Map<string, LegendSet> | undefined {
    const { legend } = visualization
    if (!legend?.strategy) {
        return undefined
    }

    const allDxIds =
        compact([
            ...visualization.columns,
            ...visualization.rows,
            ...(visualization.filters ?? []),
        ])
            .find((d) => d.dimension === 'dx')
            ?.items.map((i) => i.id) ?? []

    if (legend.strategy === LegendStrategy.FIXED && legend.set) {
        return new Map(allDxIds.map((id) => [id, legend.set as LegendSet]))
    }

    if (legend.strategy === LegendStrategy.BY_DATA_ITEM) {
        const legendSets = getVisualizationLegendSet(visualization)
        if (isArray(legendSets) && legendSets.length > 0) {
            return new Map(
                legendSets.map(({ dataItem, legendSet }) => [
                    dataItem,
                    legendSet,
                ])
            )
        }
        if (legend.set) {
            const sharedSet = legend.set as LegendSet
            return new Map(allDxIds.map((id) => [id, sharedSet]))
        }
    }

    return undefined
}

interface BuildPivotModelParams {
    analytics: AnalyticsData
    visualization: VisualizationConfig
}


export function buildPivotModel({
    analytics,
    visualization,
}: BuildPivotModelParams): PivotModel {
    const getMetaItems = (dimId: string): PivotItem[] =>
        (analytics.metaData?.dimensions?.[dimId] ?? []).map((id) => ({
            id,
            name:
                (
                    analytics.metaData?.items?.[id] as
                        | { name?: string }
                        | undefined
                )?.name ?? id,
        }))

    const colDims = visualization.columns.map((d) => d.dimension)
    const outerColItems = getMetaItems(colDims[0] ?? 'dx')
    const innerColItems = colDims[1] ? getMetaItems(colDims[1]) : []
    const hasInnerCol = innerColItems.length > 0

    const rowDims = visualization.rows.map((d) => d.dimension)
    const outerRowItems = getMetaItems(rowDims[0] ?? 'ou')
    const dxDimId = colDims.find((d) => d === 'dx') ?? colDims[0] ?? 'dx'

    const headers = analytics.headers ?? []
    const valueIdx = headers.findIndex((h) => h.name === 'value')
    const valueMap = new Map<string, number>()
    for (const row of analytics.rows ?? []) {
        const key = headers
            .filter((_, i) => i !== valueIdx)
            .map((h) => {
                const actualIdx = headers.indexOf(h)
                return `${h.name}:${row[actualIdx]}`
            })
            .sort()
            .join('|')
        const val = parseFloat(row[valueIdx] ?? '')
        if (!isNaN(val)) {
            valueMap.set(key, val)
        }
    }

    function getValue(dims: Record<string, string>): number | undefined {
        const key = Object.entries(dims)
            .map(([k, v]) => `${k}:${v}`)
            .sort()
            .join('|')
        return valueMap.get(key)
    }

    const rawRowLabel =
        getDimensionLabel(visualization.rows[0]) ??
        visualization.rows[0]?.dimension ??
        ''
    const rowLabel = HIDDEN_DIMENSION_KEYS.has(rawRowLabel) ? '' : rawRowLabel

    return {
        rowLabel,
        outerColItems,
        innerColItems,
        hasInnerCol,
        outerRowItems,
        rowDims,
        colDims,
        dxDimId,
        getValue,
    }
}
