import HighchartsReact from 'highcharts-react-official'
import { useMemo, useRef } from 'react'
import { buildBacktestRows } from '../hooks/buildBacktestRows'
import type { CompareBacktestData } from '../schemas'
import { CompareEvaluationChart } from './CompareEvaluationChart'
import { DisplayItemContainer } from '@/shared/components/visualizations'
import type { ChartRef } from '@/shared/schemas'

interface EvaluationPanelProps {
    orgUnitId: string
    backtest: CompareBacktestData
}

function EvaluationPanel({ orgUnitId, backtest }: EvaluationPanelProps) {
    const chartRef = useRef<HighchartsReact.RefObject | null>(null)
    const rows = useMemo(
        () =>
            buildBacktestRows({
                orgUnitId,
                actualCases: backtest.actualCases,
                evalEntries: backtest.evalEntries,
            }),
        [orgUnitId, backtest.actualCases, backtest.evalEntries]
    )

    return (
        <DisplayItemContainer chartRef={chartRef as ChartRef}>
            <CompareEvaluationChart
                ref={chartRef}
                evaluationName={backtest.backtestName}
                rows={rows}
            />
        </DisplayItemContainer>
    )
}

interface OrgUnitCompareChartCardProps {
    orgUnitId: string
    orgUnitName: string
    backtests: CompareBacktestData[]
}

export function OrgUnitCompareChartCard({
    orgUnitId,
    orgUnitName,
    backtests,
}: OrgUnitCompareChartCardProps) {
    return (
        <div className="flex flex-col gap-2 rounded-md border border-gray-200 bg-white p-4 shadow-sm">
            <h3 className="text-base font-semibold text-gray-900">
                {orgUnitName}
            </h3>
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {backtests.map((bt) => (
                    <EvaluationPanel
                        key={bt.backtestId}
                        orgUnitId={orgUnitId}
                        backtest={bt}
                    />
                ))}
            </div>
        </div>
    )
}
