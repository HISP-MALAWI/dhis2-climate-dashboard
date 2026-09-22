import i18n from '@dhis2/d2-i18n'
import { CircularLoader, NoticeBox } from '@dhis2/ui'
import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { CompareOrgUnitSidebar } from './components/CompareOrgUnitSidebar'
import type { OrgUnitOption } from './components/CompareOrgUnitSidebar'
import { EvaluationMultiSelect } from './components/EvaluationMultiSelect'
import { OrgUnitCompareChartCard } from './components/OrgUnitCompareChartCard'
import { useBacktests } from './hooks/useBacktests'
import { useCompareData } from './hooks/useCompareData'
import { useCompareOrgUnits } from './hooks/useCompareOrgUnits'
import type { CompareBacktestData } from './schemas'
import { RequireUserGroup } from '@/shared/components/RequireUserGroup'
import { FLLOW_M_ADMIN_USER_GROUP_ID } from '@/shared/constants/accessControl'

export const Route = createFileRoute('/chap-compare/')({
    component: ChapCompare,
})

function ChapCompare() {
    return (
        <RequireUserGroup userGroupId={FLLOW_M_ADMIN_USER_GROUP_ID}>
            <ChapCompareContent />
        </RequireUserGroup>
    )
}

function ChapCompareContent() {
    const [selectedBacktestIds, setSelectedBacktestIds] = useState<number[]>([])
    const [orgUnits, setOrgUnits] = useState<OrgUnitOption[]>([])

    const {
        data: backtests,
        isLoading: backtestsLoading,
        error: backtestsError,
    } = useBacktests()

    const { orgUnitIds: chapOrgUnitIds, loading: chapOrgUnitsLoading } =
        useCompareOrgUnits(selectedBacktestIds)

    const orgUnitIds = useMemo(() => orgUnits.map((ou) => ou.id), [orgUnits])
    const { perBacktest, loading: dataLoading } = useCompareData({
        backtestIds: selectedBacktestIds,
        orgUnitIds,
    })

    const backtestNameById = useMemo(() => {
        const map = new Map<number, string>()
        for (const b of backtests ?? []) {
            map.set(Number(b.id), b.name ?? String(b.id))
        }
        return map
    }, [backtests])

    const compareBacktests: CompareBacktestData[] = useMemo(
        () =>
            perBacktest.map((bt) => ({
                backtestId: bt.backtestId,
                backtestName:
                    backtestNameById.get(bt.backtestId) ??
                    String(bt.backtestId),
                actualCases: bt.actualCases,
                evalEntries: bt.evalEntries,
            })),
        [perBacktest, backtestNameById]
    )

    if (backtestsError) {
        return (
            <NoticeBox error title={i18n.t('Failed to load evaluations')}>
                {String(backtestsError)}
            </NoticeBox>
        )
    }

    return (
        <div className="flex flex-col gap-4 pb-8">
            {/* Filter bar */}
            <div className="flex flex-wrap items-start gap-4 rounded-md border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex min-w-72 flex-col gap-0.5">
                    <span className="text-xs font-medium text-gray-500">
                        {i18n.t('Evaluations to compare')}
                    </span>
                    <EvaluationMultiSelect
                        backtests={backtests ?? []}
                        loading={backtestsLoading}
                        selectedIds={selectedBacktestIds}
                        onChange={(ids) => {
                            setSelectedBacktestIds(ids)
                            setOrgUnits([])
                        }}
                    />
                </div>
            </div>

            {/* Sidebar + content */}
            <div className="flex items-stretch gap-4">
                <CompareOrgUnitSidebar
                    chapOrgUnitIds={chapOrgUnitIds}
                    chapLoading={chapOrgUnitsLoading}
                    selected={orgUnits}
                    onChange={setOrgUnits}
                />

                <div className="min-w-0 flex-1">
                    {selectedBacktestIds.length === 0 ? (
                        <NoticeBox title={i18n.t('No evaluations selected')}>
                            {i18n.t(
                                'Select two evaluations above to compare their predictions.'
                            )}
                        </NoticeBox>
                    ) : orgUnits.length === 0 ? (
                        <NoticeBox title={i18n.t('No org units selected')}>
                            {i18n.t(
                                'Select counties in the sidebar to view comparison charts. Only counties with data in the selected evaluations are shown.'
                            )}
                        </NoticeBox>
                    ) : dataLoading ? (
                        <div className="flex items-center justify-center py-16">
                            <CircularLoader />
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {orgUnits.map((ou) => (
                                <OrgUnitCompareChartCard
                                    key={ou.id}
                                    orgUnitId={ou.id}
                                    orgUnitName={ou.displayName}
                                    backtests={compareBacktests}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
