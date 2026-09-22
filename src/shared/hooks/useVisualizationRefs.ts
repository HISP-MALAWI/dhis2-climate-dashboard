import HighchartsReact from 'highcharts-react-official'
import { useRef } from 'react'

export function useVisualizationRefs() {
    const chartRef = useRef<HighchartsReact.RefObject>(null)
    const tableRef = useRef<HTMLTableElement>(null)

    return {
        chartRef,
        tableRef,
    }
}
