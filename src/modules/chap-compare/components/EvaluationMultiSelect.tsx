import i18n from '@dhis2/d2-i18n'
import { CircularLoader, MultiSelect, MultiSelectOption } from '@dhis2/ui'
import { MAX_SELECTED_BACKTESTS } from '../constants'
import type { Backtest } from '../schemas'

interface EvaluationMultiSelectProps {
    backtests: Backtest[]
    loading: boolean
    selectedIds: number[]
    onChange: (ids: number[]) => void
}

export function EvaluationMultiSelect({
    backtests,
    loading,
    selectedIds,
    onChange,
}: EvaluationMultiSelectProps) {
    if (loading) {
        return <CircularLoader small />
    }

    const atMax = selectedIds.length >= MAX_SELECTED_BACKTESTS

    return (
        <MultiSelect
            selected={selectedIds.map(String)}
            onChange={({ selected }: { selected: string[] }) => {
                onChange(selected.map(Number).slice(0, MAX_SELECTED_BACKTESTS))
            }}
            placeholder={i18n.t('Select evaluations to compare…')}
        >
            {backtests.map((b) => {
                const value = String(b.id)
                const isSelected = selectedIds.includes(b.id)
                return (
                    <MultiSelectOption
                        key={b.id}
                        label={b.name ?? value}
                        value={value}
                        disabled={atMax && !isSelected}
                    />
                )
            })}
        </MultiSelect>
    )
}
