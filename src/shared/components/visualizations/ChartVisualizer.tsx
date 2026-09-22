import { DHIS2Chart } from '@hisptz/dhis2-analytics'
import HighchartsReact from 'highcharts-react-official'
import { isEmpty } from 'lodash'
import { memo, RefObject, useRef } from 'react'
import { useResizeObserver } from 'usehooks-ts'
import {
    AnalyticsData,
    LegendSetConfig,
    VisualizationConfig,
} from '@/shared/schemas'
import {
    getChartLayout,
    getChartType,
    getMultiSeriesConfig,
    getSeriesColors,
    getYAxisOverrides,
    getVisualizationLegendSet,
} from '@/shared/utils'

export interface ChartVisualizerProps {
    analytics: AnalyticsData
    visualization: VisualizationConfig
    colors: string[]
    setRef: RefObject<HighchartsReact.RefObject | null>
    legendSet?: LegendSetConfig
}

export const ChartVisualizer = memo(function ChartVisualizer({
    analytics,
    visualization,
    colors,
    setRef,
}: ChartVisualizerProps) {
    const multiSeries = getMultiSeriesConfig(visualization)
    const type = multiSeries ? 'multi-series' : getChartType(visualization)
    const layout = getChartLayout(visualization)
    const legendSet = getVisualizationLegendSet(visualization)
    const { seriesColors, hasCustomColors } = getSeriesColors(visualization)
    const activeColors = hasCustomColors ? seriesColors : colors
    const targetPlotLines = getYAxisOverrides(visualization)

    const ref = useRef<HTMLDivElement>(null)
    const { height = 0 } = useResizeObserver<HTMLDivElement>({
        // @ts-expect-error ref will always have a nullable value
        ref: ref!,
        box: 'border-box',
    })
    return (
        <div ref={ref} style={{ width: '100%', height: '100%' }}>
            <DHIS2Chart
                immutable
                containerProps={{
                    style: {
                        height: '100%',
                    },
                }}
                analytics={analytics}
                // @ts-expect-error fixes on the lib
                setRef={setRef}
                config={{
                    type,
                    colors: activeColors,
                    layout,
                    height: height,
                    showFilterAsTitle: visualization.subtitle
                        ? false
                        : !isEmpty(visualization.filters),
                    name: visualization.displayName,
                    allowChartTypeChange: false,
                    legendSet: legendSet,
                    multiSeries,
                    highChartOverrides: {
                        ...(visualization.subtitle
                            ? {
                                  subtitle: {
                                      text: visualization.subtitle,
                                      style: {
                                          color: '#000',
                                          fontSize: '16px',
                                          fontWeight: 'bold',
                                      },
                                  },
                              }
                            : {}),
                        ...(targetPlotLines
                            ? { yAxis: targetPlotLines }
                            : {}),
                    },
                }}
            />
        </div>
    )
})
