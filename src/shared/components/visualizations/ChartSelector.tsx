import HighchartsReact from 'highcharts-react-official'
import { RefObject } from 'react'
import { ChartVisualizer } from './ChartVisualizer'
import { SingleValueVisualizer } from './SingleValueVisualizer'
import { TableVisualizer } from './TableVisualizer'
import { YearOverYearVisualizer } from './YearOverYearVisualizer'
import {
    AnalyticsData,
    VisualizationChartType,
    VisualizationConfig,
    YearOverYearVisualizationConfig,
} from '@/shared/schemas'

export function ChartSelector({
    analytics,
    yoyAnalytics,
    visualization,
    tableRef,
    setRef,
    fullScreen,
    colors,
    containerRef,
}: {
    setRef: RefObject<HighchartsReact.RefObject | null>
    analytics?: AnalyticsData
    yoyAnalytics?: Map<string, AnalyticsData>
    visualization: VisualizationConfig
    tableRef: RefObject<HTMLTableElement | null>
    fullScreen: boolean
    colors: string[]
    containerRef?: RefObject<HTMLDivElement | null>
}) {
    const chartType = visualization.type
    switch (chartType) {
        case VisualizationChartType.SINGLE_VALUE:
            return (
                <SingleValueVisualizer
                    visualization={visualization}
                    analytics={analytics!}
                    colors={colors}
                    containerRef={containerRef}
                />
            )
        case VisualizationChartType.TABLE:
            return (
                <TableVisualizer
                    fullScreen={fullScreen}
                    setRef={tableRef}
                    analytics={analytics!}
                    visualization={visualization}
                />
            )
        case VisualizationChartType.YEAR_OVER_YEAR_LINE:
        case VisualizationChartType.YEAR_OVER_YEAR_COLUMN:
            return (
                <YearOverYearVisualizer
                    analytics={yoyAnalytics}
                    visualization={
                        visualization as YearOverYearVisualizationConfig
                    }
                    colors={colors}
                    setRef={setRef}
                />
            )
        default:
            return (
                <ChartVisualizer
                    colors={colors}
                    setRef={setRef}
                    analytics={analytics!}
                    visualization={visualization}
                />
            )
    }
}
