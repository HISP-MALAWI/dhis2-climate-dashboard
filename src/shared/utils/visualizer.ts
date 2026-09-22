import { ChartType } from '@hisptz/dhis2-analytics'
import { LegendSet } from '@hisptz/dhis2-utils'
import type Highcharts from 'highcharts'
import type { YAxisOptions } from 'highcharts'
import { camelCase, compact, fromPairs, get, isEmpty } from 'lodash'
import {
    AnalyticsDimensionSchema,
    DimensionConfig,
    LegendSetConfig,
    VisualizationChartType,
    VisualizationConfig,
} from '@/shared/schemas'

interface MultiSeriesConfig {
    series?: Array<{ id: string; as: 'column' | 'line'; yAxis?: number }>
    yAxes?: Array<Partial<YAxisOptions>>
}

export interface MultiSeriesColors {
    seriesColors: string[]
    hasCustomColors: boolean
}

export function getChartLayout(visualization: VisualizationConfig): {
    category: AnalyticsDimensionSchema[]
    series: AnalyticsDimensionSchema[]
    filter: AnalyticsDimensionSchema[]
} {
    return {
        category: visualization.rows.map((row) => row.dimension),
        series: visualization.columns.map((col) => col.dimension),
        filter: visualization.filters.map((filter) => filter.dimension) ?? [],
    }
}

export type { MultiSeriesConfig }

export function getMultiSeriesConfig(
    config: VisualizationConfig
): MultiSeriesConfig | undefined {
    if (!config.series || config.series.length === 0) {
        return undefined
    }

    const allDimensions = [...config.columns, ...config.rows, ...config.filters]
    const dxItems = allDimensions.find((d) => d.dimension === 'dx')?.items ?? []

    const overrideById = new Map(config.series.map((s) => [s.dimensionItem, s]))

    const baseAs: 'column' | 'line' =
        config.type === VisualizationChartType.COLUMN ||
            config.type === VisualizationChartType.BAR
            ? 'column'
            : 'line'

    const seriesItems = dxItems.map((item) => {
        const override = overrideById.get(item.id)
        const as: 'column' | 'line' = override?.type
            ? override.type.toLowerCase() === 'column'
                ? 'column'
                : 'line'
            : baseAs
        const yAxis = override?.axis ?? 0
        return { id: item.id, as, yAxis }
    })

    // Only activate multi-series if there is a genuine mix of types or axes
    const uniqueTypes = new Set(seriesItems.map((s) => s.as))
    const uniqueAxes = new Set(seriesItems.map((s) => s.yAxis))
    if (uniqueTypes.size <= 1 && uniqueAxes.size <= 1) {
        return undefined
    }

    const hasSecondAxis = uniqueAxes.has(1)
    const axisConfigs = config.axes ?? []
    const axisBase = (index: number) => {
        const axisConfig = axisConfigs.find((a) => a.index === index)
        const titleText = axisConfig?.title?.text ?? ''
        const titleColor = axisConfig?.title?.fontStyle?.textColor ?? '#000000'
        const bold = axisConfig?.title?.fontStyle?.bold ?? false
        return {
            title: {
                text: titleText,
                style: {
                    color: titleColor,
                    fontWeight: bold ? 'bold' : 'normal',
                    fontSize: '14px',
                },
            },
            labels: {
                enabled: true,
                style: {
                    color: '#000000',
                    fontWeight: 'normal',
                    fontSize: '14px',
                },
            },
            plotLines: [
                {
                    color: '#000000',
                    dashStyle: 'Solid' as Highcharts.DashStyleValue,
                    width: 2,
                    zIndex: 1000,
                    label: { text: '' },
                },
                {
                    color: '#bbbbbb',
                    dashStyle: 'Solid' as Highcharts.DashStyleValue,
                    zIndex: 1000,
                    width: 2,
                    label: { text: '' },
                },
            ],
        }
    }

    const yAxes = hasSecondAxis
        ? [axisBase(0), { ...axisBase(1), opposite: true }]
        : undefined

    return { series: seriesItems, yAxes }
}

export function getSeriesColors(
    config: VisualizationConfig
): MultiSeriesColors {
    if (!config.series || config.series.length === 0) {
        return { seriesColors: [], hasCustomColors: false }
    }

    const colorById = new Map(
        config.series
            .filter((s) => s.color)
            .map((s) => [s.dimensionItem, s.color!])
    )
    if (colorById.size === 0) {
        return { seriesColors: [], hasCustomColors: false }
    }

    const allDimensions = [...config.columns, ...config.rows, ...config.filters]
    const dxItems = allDimensions.find((d) => d.dimension === 'dx')?.items ?? []

    const seriesColors = dxItems.map((item) => colorById.get(item.id) ?? '')
    return { seriesColors, hasCustomColors: true }
}

export function getChartType(config: VisualizationConfig): ChartType {
    if (config.type.match(/YEAR_OVER_YEAR_/)) {
        return config.type
            .replace('YEAR_OVER_YEAR_', '')
            .toLowerCase()
            .replace('_', '-') as ChartType
    }
    return config.type.toLowerCase().replace('_', '-') as ChartType
}

export function getYAxisOverrides(
    config: VisualizationConfig
): Highcharts.YAxisOptions | undefined {
    const rangeAxes = (config.axes ?? []).filter((a) => a.type === 'RANGE')
    if (rangeAxes.length === 0) {
        return undefined
    }

    const primaryAxis = rangeAxes[0]!

    const plotLines = compact(
        rangeAxes.map((axis) => {
            if (!axis.targetLine) {
                return undefined
            }
            const { value, title } = axis.targetLine
            const color = title?.fontStyle?.textColor ?? '#000000'
            const label = title?.text
                ? {
                    text: title.text,
                    style: {
                        color,
                        fontWeight: title.fontStyle?.bold ? 'bold' : 'normal',
                        fontSize: title.fontStyle?.fontSize
                            ? `${title.fontStyle.fontSize}px`
                            : '13px',
                    },
                    align: 'center' as const,
                    y: -8,
                }
                : undefined
            return {
                value,
                color,
                dashStyle: 'Solid' as Highcharts.DashStyleValue,
                width: 2,
                zIndex: 5,
                label,
            } satisfies Highcharts.YAxisPlotLinesOptions
        })
    )

    const overrides: Highcharts.YAxisOptions = {}

    if (primaryAxis.maxValue !== undefined) {
        overrides.max = primaryAxis.maxValue
    }
    if (primaryAxis.minValue !== undefined) {
        overrides.min = primaryAxis.minValue
    }
    if (plotLines.length > 0) {
        overrides.plotLines = plotLines
    }

    return Object.keys(overrides).length > 0 ? overrides : undefined
}

export function getVisualizationLegendSet(
    config: VisualizationConfig
): LegendSetConfig | undefined {
    if (!config.legend) {
        return
    }
    const legendConfig = config.legend
    switch (legendConfig.strategy) {
        case 'FIXED':
            if (!legendConfig.set?.id) {
                return
            }
            return legendConfig.set as LegendSet
        case 'BY_DATA_ITEM':
            return compact(
                config.dataDimensionItems.map((item) => {
                    const dataItem = get(
                        item,
                        camelCase(item.dataDimensionItemType.toLowerCase())
                    )

                    if (dataItem.legendSet) {
                        return {
                            dataItem: dataItem.id,
                            legendSet: dataItem.legendSet as LegendSet,
                        }
                    }
                    return undefined
                })
            )
    }
}

interface SelectedValues {
    searchParams?: Map<string, string>
    selectedOrgUnits?: string[]
    selectedPeriods?: string[]
}

function getDimensionItems(
    dimension: DimensionConfig[],
    { searchParams, selectedPeriods, selectedOrgUnits }: SelectedValues
) {
    const orgUnitParams = !isEmpty(selectedOrgUnits)
        ? selectedOrgUnits
        : searchParams?.get('ou')?.split(',')
    const periodParams = !isEmpty(selectedPeriods)
        ? selectedPeriods
        : searchParams?.get('pe')?.split(',')
    return fromPairs(
        dimension.map((column) => {
            if (column.dimension === 'ou') {
                if (isEmpty(orgUnitParams)) {
                    return [
                        column.dimension,
                        column.items.map((item) => item.id),
                    ]
                }
                return [column.dimension, orgUnitParams!]
            }
            if (column.dimension === 'pe') {
                if (isEmpty(periodParams)) {
                    return [
                        column.dimension,
                        column.items.map((item) => item.id),
                    ]
                }
                return [column.dimension, periodParams!]
            }
            return [
                column.dimension,
                compact(column.items).map((item) => item.id),
            ]
        })
    )
}

function getColumnItems(
    config: VisualizationConfig,
    selectedValues: SelectedValues
) {
    return getDimensionItems(config.columns, selectedValues)
}

function getRowItems(
    config: VisualizationConfig,
    selectedValues: SelectedValues
) {
    return getDimensionItems(config.rows, selectedValues)
}

function getFilterItems(
    config: VisualizationConfig,
    selectedValues: SelectedValues
) {
    return getDimensionItems(config.filters, selectedValues)
}

export function getVisualizationDimensions(
    config: VisualizationConfig,
    selectedValues: SelectedValues
): {
    [key: string]: Array<string>
} {
    const rows = getRowItems(config, selectedValues)
    const columns = getColumnItems(config, selectedValues)

    return {
        ...rows,
        ...columns,
    }
}

export function getVisualizationFilters(
    config: VisualizationConfig,
    selectedValues: SelectedValues
): {
    [key: string]: Array<string>
} {
    return getFilterItems(config, selectedValues)
}
