import i18n from '@dhis2/d2-i18n'
import { Chip } from '@dhis2/ui'
import { IconWorld16 } from '@dhis2/ui-icons'
import { useState } from 'react'
import { OrgUnitFilterModal } from '@/shared/components/OrgUnitFilterModal'
import { useFilters } from '@/shared/hooks/useFilters'

export function GlobalOrgUnitFilter() {
    const [open, setOpen] = useState(false)
    const { orgUnitIds, setOrgUnitIds } = useFilters()
    const isActive = orgUnitIds.length > 0

    function handleUpdate(ids: string[]) {
        setOrgUnitIds(ids)
        setOpen(false)
    }

    const label = isActive
        ? i18n.t('Org unit ({{count}})', { count: orgUnitIds.length })
        : i18n.t('Org unit')

    return (
        <>
            <Chip
                selected={isActive}
                dense
                onClick={() => setOpen(true)}
                onRemove={isActive ? () => setOrgUnitIds([]) : undefined}
                marginBottom={0}
                marginTop={0}
                marginLeft={0}
                marginRight={0}
            >
                <span className="flex items-center gap-1">
                    <IconWorld16 />
                    {label}
                </span>
            </Chip>
            {open && (
                <OrgUnitFilterModal
                    selectedIds={orgUnitIds}
                    onUpdate={handleUpdate}
                    onClose={() => setOpen(false)}
                />
            )}
        </>
    )
}
