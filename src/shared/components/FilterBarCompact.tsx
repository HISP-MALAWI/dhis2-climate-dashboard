import i18n from '@dhis2/d2-i18n'
import { Button, Card } from '@dhis2/ui'
import { IconCalendar16, IconCross16, IconWorld16 } from '@dhis2/ui-icons'
import { PeriodSelectorModal } from '@hisptz/dhis2-ui'
import { useState } from 'react'
import { OrgUnitFilterModal } from '@/shared/components/OrgUnitFilterModal'
import { useFilters } from '@/shared/hooks/useFilters'

function FilterInput({
    label,
    value,
    icon,
    onClick,
}: {
    label: string
    value: string
    icon: React.ReactNode
    onClick: () => void
}) {
    return (
        <div className="flex flex-col gap-0.5">
            <span className="text-xs text-black">{label}</span>
            <button
                onClick={onClick}
                className="flex min-w-36 items-center justify-between gap-2 rounded border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-700 hover:border-gray-400"
            >
                <span className="truncate">{value}</span>
                <span className="shrink-0 text-gray-400">{icon}</span>
            </button>
        </div>
    )
}

export function FilterBarCompact() {
    const [ouOpen, setOuOpen] = useState(false)
    const [peOpen, setPeOpen] = useState(false)
    const { orgUnitIds, setOrgUnitIds, periodIds, setPeriodIds, clearFilters } =
        useFilters()

    const hasFilters = orgUnitIds.length > 0 || periodIds.length > 0

    const ouValue =
        orgUnitIds.length > 0
            ? i18n.t('{{count}} selected', { count: orgUnitIds.length })
            : ''

    const peValue =
        periodIds.length > 0
            ? i18n.t('{{count}} selected', { count: periodIds.length })
            : ''

    return (
        <Card>
            <div className="flex items-end gap-4 p-4">
                <FilterInput
                    label={i18n.t('Location')}
                    value={ouValue}
                    icon={<IconWorld16 />}
                    onClick={() => setOuOpen(true)}
                />
                <FilterInput
                    label={i18n.t('Period')}
                    value={peValue}
                    icon={<IconCalendar16 />}
                    onClick={() => setPeOpen(true)}
                />
                {hasFilters && (
                    <Button
                        small
                        secondary
                        icon={<IconCross16 />}
                        onClick={clearFilters}
                    >
                        {i18n.t('Clear filters')}
                    </Button>
                )}

                {ouOpen && (
                    <OrgUnitFilterModal
                        selectedIds={orgUnitIds}
                        onUpdate={(ids) => {
                            setOrgUnitIds(ids)
                            setOuOpen(false)
                        }}
                        onClose={() => setOuOpen(false)}
                    />
                )}
                {peOpen && (
                    <PeriodSelectorModal
                        selectedPeriods={periodIds}
                        onUpdate={(selected: Array<string>) => {
                            setPeriodIds(selected)
                            setPeOpen(false)
                        }}
                        onClose={() => setPeOpen(false)}
                        hide={false}
                        enablePeriodSelector
                    />
                )}
            </div>
        </Card>
    )
}
