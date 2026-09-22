import i18n from '@dhis2/d2-i18n'
import { Button, Card, MenuItem, Popover } from '@dhis2/ui'
import {
    IconClock16,
    IconFullscreen16,
    IconLocation16,
    IconMore16,
} from '@dhis2/ui-icons'
import { PeriodSelectorModal } from '@hisptz/dhis2-ui'
import { useRef, useState } from 'react'
import { DownloadHandlers, DownloadMenuItems } from './DownloadMenuItems'
import { OrgUnitFilterModal } from '@/shared/components/OrgUnitFilterModal'
import { useFilters } from '@/shared/hooks/useFilters'

interface VisualizationMenuProps extends DownloadHandlers {
    onFullscreen: () => void
    selectedOrgUnits?: string[]
    selectedPeriods?: string[]
    onOrgUnitChange?: (ids: string[]) => void
    onPeriodChange?: (ids: string[]) => void
}

export function VisualizationMenu({
    onFullscreen,
    selectedOrgUnits: itemOrgUnits,
    selectedPeriods: itemPeriods,
    onOrgUnitChange,
    onPeriodChange,
    onDownloadImage,
    onDownloadData,
    imageFormats,
}: VisualizationMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null)
    const [menuOpen, setMenuOpen] = useState(false)
    const [ouOpen, setOuOpen] = useState(false)
    const [periodOpen, setPeriodOpen] = useState(false)

    const { orgUnitIds, periodIds, setOrgUnitIds, setPeriodIds } = useFilters()
    const isPerItem =
        onOrgUnitChange !== undefined || onPeriodChange !== undefined
    const activeOrgUnits = isPerItem ? (itemOrgUnits ?? []) : orgUnitIds
    const activePeriods = isPerItem ? (itemPeriods ?? []) : periodIds

    function handleOuUpdate(ids: string[]) {
        if (isPerItem) {
            onOrgUnitChange?.(ids)
        } else {
            setOrgUnitIds(ids)
        }
        setOuOpen(false)
    }

    function handlePeriodUpdate(selected: string[]) {
        if (isPerItem) {
            onPeriodChange?.(selected)
        } else {
            setPeriodIds(selected)
        }
        setPeriodOpen(false)
    }

    return (
        <>
            <div ref={menuRef}>
                <Button
                    small
                    secondary
                    icon={<IconMore16 />}
                    onClick={() => setMenuOpen((o) => !o)}
                />
            </div>

            {menuOpen && menuRef.current && (
                <Popover
                    reference={menuRef.current}
                    placement="bottom-end"
                    onClickOutside={() => setMenuOpen(false)}
                >
                    <Card>
                        <div className="px-3 pt-3 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                            {i18n.t('View')}
                        </div>
                        <MenuItem
                            label={i18n.t('Full page')}
                            icon={<IconFullscreen16 />}
                            onClick={() => {
                                setMenuOpen(false)
                                onFullscreen()
                            }}
                        />
                        <div className="px-3 pt-3 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                            {i18n.t('Filters')}
                        </div>
                        <MenuItem
                            label={i18n.t('Location')}
                            icon={<IconLocation16 />}
                            onClick={() => {
                                setMenuOpen(false)
                                setOuOpen(true)
                            }}
                        />
                        <MenuItem
                            label={i18n.t('Period')}
                            icon={<IconClock16 />}
                            onClick={() => {
                                setMenuOpen(false)
                                setPeriodOpen(true)
                            }}
                        />
                        <DownloadMenuItems
                            onSelect={() => setMenuOpen(false)}
                            onDownloadImage={onDownloadImage}
                            onDownloadData={onDownloadData}
                            imageFormats={imageFormats}
                        />
                    </Card>
                </Popover>
            )}

            {ouOpen && (
                <OrgUnitFilterModal
                    selectedIds={activeOrgUnits}
                    onUpdate={handleOuUpdate}
                    onClose={() => setOuOpen(false)}
                />
            )}

            {periodOpen && (
                <PeriodSelectorModal
                    selectedPeriods={activePeriods}
                    onUpdate={handlePeriodUpdate}
                    onClose={() => setPeriodOpen(false)}
                    hide={false}
                    enablePeriodSelector
                />
            )}
        </>
    )
}
