import HighchartsReact from 'highcharts-react-official'
import { useRef } from 'react'
import { buildRows } from '../hooks/useEvaluationData'
import type { ActualCase, EvaluationEntry } from '../schemas'
import { EvaluationChart } from './EvaluationChart'
import { DisplayItemContainer } from '@/shared/components/visualizations'
import type { ChartRef } from '@/shared/schemas'

interface OrgUnitChartCardProps {
    orgUnitId: string
    orgUnitName: string
    evaluationName: string
    actualCases: ActualCase[]
    evalEntries: EvaluationEntry[]
    selectedSplitPeriod: string | null
}

export function OrgUnitChartCard({
    orgUnitId,
    orgUnitName,
    evaluationName,
    actualCases,
    evalEntries,
    selectedSplitPeriod,
}: OrgUnitChartCardProps) {
    const chartRef = useRef<HighchartsReact.RefObject | null>(null)
    const rows = buildRows({ orgUnitId, actualCases, evalEntries, activeSplitPeriod: selectedSplitPeriod })

    return (
        <DisplayItemContainer title={orgUnitName} chartRef={chartRef as ChartRef}>
            <EvaluationChart
                ref={chartRef}
                evaluationName={evaluationName}
                rows={rows}
            />
        </DisplayItemContainer>
    )
}
