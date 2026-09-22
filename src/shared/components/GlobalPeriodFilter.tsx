import i18n from '@dhis2/d2-i18n'
import { Chip } from '@dhis2/ui'
import { IconCalendar16 } from '@dhis2/ui-icons'
import { PeriodSelectorModal } from '@hisptz/dhis2-ui'
import { useState } from 'react'
import { useFilters } from '@/shared/hooks/useFilters'

export function GlobalPeriodFilter() {
    const [open, setOpen] = useState(false)
    const { periodIds, setPeriodIds } = useFilters()
    const isActive = periodIds.length > 0

    function handleUpdate(selected: Array<string>) {
        setPeriodIds(selected)
        setOpen(false)
    }

    const label = isActive
        ? i18n.t('Period ({{count}})', { count: periodIds.length })
        : i18n.t('Period')

    return (
        <>
            <Chip
                selected={isActive}
                dense
                onClick={() => setOpen(true)}
                onRemove={isActive ? () => setPeriodIds([]) : undefined}
                marginBottom={0}
                marginTop={0}
                marginLeft={0}
                marginRight={0}
            >
                <span className="flex items-center gap-1">
                    <IconCalendar16 />
                    {label}
                </span>
            </Chip>
            {open && (
                <PeriodSelectorModal
                    selectedPeriods={periodIds}
                    onUpdate={handleUpdate}
                    onClose={() => setOpen(false)}
                    hide={false}
                    enablePeriodSelector
                />
            )}
        </>
    )
}
