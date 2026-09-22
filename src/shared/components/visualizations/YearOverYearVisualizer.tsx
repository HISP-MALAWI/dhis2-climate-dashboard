import { PeriodUtility } from '@hisptz/dhis2-utils'
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'
import { isEmpty, uniq } from 'lodash'
import { RefObject, useMemo } from 'react'
import {
    AnalyticsData,
    VisualizationChartType,
    YearOverYearVisualizationConfig,
} from '@/shared/schemas'

export interface YearOverYearChartVisualizerProps {
    analytics?: Map<string, AnalyticsData>
    visualization: YearOverYearVisualizationConfig
    colors: string[]
    setRef: RefObject<HighchartsReact.RefObject | null>
}

export function YearOverYearVisualizer({
    analytics,
    visualization,
    colors,
    setRef,
}: YearOverYearChartVisualizerProps) {
    const series: Highcharts.SeriesOptionsType[] = useMemo(() => {
        if (!analytics) {
            return []
        }
        return Array.from(analytics.entries()).map(([key, value]) => {
            const rows = value.rows ?? []
            const valueIndex = (value.headers ?? []).findIndex(
                ({ name }) => name === 'value'
            )
            const categories = value.metaData?.dimensions?.pe ?? []
            return {
                name: PeriodUtility.getPeriodById(key).name,
                dataLabels: {
                    enabled: true,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter(this: any) {
                        if (this.y == null) {
                            return null
                        }
                        return Highcharts.numberFormat(
                            this.y as number,
                            0,
                            '.',
                            ','
                        )
                    },
                    style: {
                        fontSize: '10px',
                        fontWeight: 'normal',
                        textOutline: 'none',
                    },
                },
                data: categories.map((category) => {
                    const row = rows.find((row) => row.includes(category))
                    if (!row) {
                        return null
                    }
                    return parseFloat(row[valueIndex]!)
                }),
            } as unknown as Highcharts.SeriesOptionsType
        })
    }, [analytics])

    const categories = useMemo(() => {
        if (!analytics) {
            return []
        }
        const allCategories = Array.from(analytics.values())
            .map((value) => value.metaData?.dimensions?.pe ?? [])
            .flat()
        return uniq(allCategories).map((category) =>
            PeriodUtility.getPeriodById(category).name.replace(/\d{4}/, '')
        )
    }, [analytics])

    const options: Highcharts.Options = useMemo(() => {
        const chartType =
            visualization?.type === VisualizationChartType.YEAR_OVER_YEAR_LINE
                ? 'line'
                : 'column'
        const subtitleText =
            visualization?.title ??
            (isEmpty(visualization?.filters)
                ? ''
                : visualization.filters
                      ?.map((filter) =>
                          filter.items
                              .map((item) => item.displayName)
                              .join(', ')
                      )
                      .join(', '))

        return {
            chart: { type: chartType },
            title: { text: '' },
            subtitle: {
                text: subtitleText,
                style: { color: '#000', fontSize: '16px', fontWeight: 'bold' },
            },
            xAxis: { categories, title: { text: '' } },
            yAxis: { title: { text: '' } },
            series,
            legend: { enabled: true },
            tooltip: { shared: true },
            credits: { enabled: false },
            exporting: {
                sourceWidth: 1200,
                buttons: { contextButton: { enabled: false } },
            },
            colors,
        }
    }, [series, categories])

    return (
        <div style={{ width: '100%', height: `100%` }}>
            <HighchartsReact
                allowChartUpdate
                containerProps={{ style: { height: '100%' } }}
                highcharts={Highcharts}
                options={options}
                ref={setRef}
            />
        </div>
    )
}
