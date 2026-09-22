import i18n from '@dhis2/d2-i18n'
import {
    Button,
    ButtonStrip,
    Modal,
    ModalActions,
    ModalContent,
    ModalTitle,
} from '@dhis2/ui'
import { OrgUnitSelector } from '@hisptz/dhis2-ui'
import { useMemo, useState } from 'react'
import styles from './OrgUnitFilterModal.module.css'
import { useOrgUnitsByIds } from '@/shared/hooks/useOrgUnitsByIds'
import {
    parseOrgUnitSelection,
    serializeOrgUnitSelection,
} from '@/shared/utils'
interface SelectorOrgUnit {
    id: string
    path?: string
    displayName?: string
    children: SelectorOrgUnit[]
}

interface SelectorValue {
    orgUnits?: SelectorOrgUnit[]
    levels?: string[]
    groups?: string[]
}

interface OrgUnitFilterModalProps {
    selectedIds: string[]
    onUpdate: (ids: string[]) => void
    onClose: () => void
}

export function OrgUnitFilterModal({
    selectedIds,
    onUpdate,
    onClose,
}: OrgUnitFilterModalProps) {
    const { orgUnitIds, levels, groups } = useMemo(
        () => parseOrgUnitSelection(selectedIds),
        [selectedIds]
    )
    const { orgUnits, loading } = useOrgUnitsByIds(orgUnitIds)

    if (loading) {
        return null
    }

    return (
        <OrgUnitFilterModalContent
            initialValue={{
                orgUnits: orgUnits.map((ou) => ({ ...ou, children: [] })),
                levels,
                groups,
            }}
            onUpdate={onUpdate}
            onClose={onClose}
        />
    )
}

function OrgUnitFilterModalContent({
    initialValue,
    onUpdate,
    onClose,
}: {
    initialValue: SelectorValue
    onUpdate: (ids: string[]) => void
    onClose: () => void
}) {
    const [value, setValue] = useState<SelectorValue>(initialValue)

    function handleUpdate() {
        onUpdate(
            serializeOrgUnitSelection({
                orgUnitIds: (value.orgUnits ?? []).map((ou) => ou.id),
                levels: value.levels ?? [],
                groups: value.groups ?? [],
            })
        )
    }

    return (
        <Modal hide={false} onClose={onClose}>
            <ModalTitle>{i18n.t('Select Organisation Unit(s)')}</ModalTitle>
            <ModalContent>
                <div className={styles.compact}>
                    <OrgUnitSelector
                        value={value}
                        onUpdate={setValue}
                        showLevels
                        showGroups
                        searchable
                    />
                </div>
            </ModalContent>
            <ModalActions>
                <ButtonStrip>
                    <Button onClick={onClose}>{i18n.t('Cancel')}</Button>
                    <Button primary onClick={handleUpdate}>
                        {i18n.t('Update')}
                    </Button>
                </ButtonStrip>
            </ModalActions>
        </Modal>
    )
}
