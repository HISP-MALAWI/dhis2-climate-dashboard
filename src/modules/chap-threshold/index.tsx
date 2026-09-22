import i18n from '@dhis2/d2-i18n'
import { NoticeBox } from '@dhis2/ui'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { z } from 'zod'
import { ThresholdChart } from './components/ThresholdChart'
import {
    COUNTY_OU_LEVEL,
    NATIONAL_OU_LEVEL,
    STATE_OU_LEVEL,
    THRESHOLD_TYPES,
} from './constants'
import type { ThresholdType } from './constants'
import { useAllCounties, useCounties, useStates } from './hooks/useOrgUnitLevel'
import type { OrgUnit } from './hooks/useOrgUnitLevel'
import { useThresholdData } from './hooks/useThresholdData'
import { OrgUnitSidebar } from '@/modules/chap-forecast-alerts/components/OrgUnitSidebar'
import { RequireUserGroup } from '@/shared/components/RequireUserGroup'
import { DisplayItemContainer } from '@/shared/components/visualizations/DisplayItemContainer'
import { FLLOW_M_ADMIN_USER_GROUP_ID } from '@/shared/constants/accessControl'

export const Route = createFileRoute('/chap-threshold/')({
    validateSearch: z.object({
        ou: z.string().optional(),
    }),
    component: ChapThreshold,
})

function ThresholdTypeToggle({
    thresholdType,
    selected,
    onToggle,
}: {
    thresholdType: ThresholdType
    selected: boolean
    onToggle: (t: ThresholdType) => void
}) {
    return (
        <button
            onClick={() => onToggle(thresholdType)}
            title={thresholdType.description}
            className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-all ${
                selected
                    ? 'border-transparent text-white shadow-sm'
                    : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400 hover:text-gray-800'
            }`}
            style={
                selected
                    ? { backgroundColor: thresholdType.color, borderColor: thresholdType.color }
                    : {}
            }
        >
            <span
                className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: selected ? 'rgba(255,255,255,0.7)' : thresholdType.color }}
            />
            {thresholdType.label}
            {selected && (
                <span className="ml-1 opacity-70 text-xs leading-none">✕</span>
            )}
        </button>
    )
}

function ChapThreshold() {
    return (
        <RequireUserGroup userGroupId={FLLOW_M_ADMIN_USER_GROUP_ID}>
            <ChapThresholdContent />
        </RequireUserGroup>
    )
}

function ChapThresholdContent() {
    const { ou } = Route.useSearch()
    const navigate = useNavigate({ from: '/chap-threshold/' })

    const [selectedState, setSelectedState] = useState<OrgUnit | null>(null)
    const [selectedCounty, setSelectedCounty] = useState<OrgUnit | null>(null)
    const [selectedThresholds, setSelectedThresholds] = useState<ThresholdType[]>(
        [THRESHOLD_TYPES[0]].filter(Boolean) as ThresholdType[]
    )

    const { states: nationalOrgUnits, loading: nationalLoading } =
        useStates(NATIONAL_OU_LEVEL)
    const { states, loading: statesLoading } = useStates(STATE_OU_LEVEL)
    const { counties, loading: countiesLoading } = useCounties(
        selectedState?.id ?? null
    )
    const { allCounties, loading: allCountiesLoading } =
        useAllCounties(COUNTY_OU_LEVEL)

    const allStates = [...nationalOrgUnits, ...states]
    const isNationalSelected = nationalOrgUnits.some(
        (o) => o.id === selectedState?.id
    )

    useEffect(() => {
        if (!selectedState && nationalOrgUnits.length > 0) {
            setSelectedState(nationalOrgUnits[0] ?? null)
        }
    }, [nationalOrgUnits, selectedState])

    useEffect(() => {
        if (ou && allCounties.length > 0 && !selectedCounty) {
            const match = allCounties.find((c) => c.id === ou)
            if (match) {setSelectedCounty(match)}
        }
    }, [ou, allCounties, selectedCounty])

    const activeOrgUnit = selectedCounty ?? selectedState

    function handleStateSelect(o: OrgUnit) {
        setSelectedState(o)
        setSelectedCounty(null)
        void navigate({ search: (prev) => ({ ...prev, ou: undefined }) })
    }

    function handleCountySelect(o: OrgUnit) {
        setSelectedCounty(o)
        void navigate({ search: (prev) => ({ ...prev, ou: o.id }) })
    }

    function toggleThreshold(t: ThresholdType) {
        setSelectedThresholds((prev) => {
            const exists = prev.some((s) => s.id === t.id)
            if (exists) {
                return prev.filter((s) => s.id !== t.id)
            }
            return [...prev, t]
        })
    }

    const { rows, loading: dataLoading } = useThresholdData(
        activeOrgUnit?.id ?? null,
        selectedThresholds
    )

    return (
        <div className="flex flex-col gap-4 pb-6">
            {/* Threshold type selector bar */}
            <div className="flex flex-wrap items-center gap-3 rounded-md border border-gray-200 bg-white px-4 py-3 shadow-sm">
                <span className="text-sm font-medium text-gray-500 shrink-0">
                    {i18n.t('Threshold type')}
                </span>
                <div className="flex flex-wrap gap-2">
                    {THRESHOLD_TYPES.map((t) => (
                        <ThresholdTypeToggle
                            key={t.id}
                            thresholdType={t}
                            selected={selectedThresholds.some((s) => s.id === t.id)}
                            onToggle={toggleThreshold}
                        />
                    ))}
                </div>
                {selectedThresholds.length === 0 && (
                    <span className="text-xs italic text-amber-600">
                        {i18n.t('Select at least one threshold to display')}
                    </span>
                )}
            </div>

            {/* Sidebar + chart */}
            <div className="flex items-start gap-4">
                <OrgUnitSidebar
                    states={allStates}
                    statesLoading={nationalLoading || statesLoading}
                    counties={isNationalSelected ? [] : counties}
                    countiesLoading={!isNationalSelected && countiesLoading}
                    allCounties={allCounties}
                    allCountiesLoading={allCountiesLoading}
                    selectedStateId={selectedState?.id ?? null}
                    onStateSelect={handleStateSelect}
                    selectedCountyId={selectedCounty?.id ?? null}
                    onCountySelect={handleCountySelect}
                />

                <div className="h-168 min-w-0 flex-1">
                    {selectedThresholds.length === 0 ? (
                        <NoticeBox title={i18n.t('No threshold selected')}>
                            {i18n.t(
                                'Choose a threshold type above to compare against actual malaria cases.'
                            )}
                        </NoticeBox>
                    ) : (
                        <DisplayItemContainer
                            title={i18n.t(
                                'Threshold vs. Actual Cases — {{name}}',
                                {
                                    name: activeOrgUnit?.displayName ?? '…',
                                }
                            )}
                            loading={dataLoading}
                        >
                            <ThresholdChart
                                rows={rows}
                                orgUnitName={activeOrgUnit?.displayName ?? ''}
                                selectedThresholds={selectedThresholds}
                            />
                        </DisplayItemContainer>
                    )}
                </div>
            </div>
        </div>
    )
}
