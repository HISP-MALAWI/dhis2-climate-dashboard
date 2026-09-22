import { useConfig } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import {
    Chip,
    CircularLoader,
    NoticeBox,
    SingleSelect,
    SingleSelectOption,
} from '@dhis2/ui'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { z } from 'zod'
import type { OrgUnitOption } from './components/EvaluationOrgUnitSidebar'
import { EvaluationOrgUnitSidebar } from './components/EvaluationOrgUnitSidebar'
import { OrgUnitChartCard } from './components/OrgUnitChartCard'
import { SplitPeriodSlider } from './components/SplitPeriodSlider'
import { useBacktestOrgUnits } from './hooks/useBacktestOrgUnits'
import { useBacktests } from './hooks/useBacktests'
import { useEvaluationData } from './hooks/useEvaluationData'
import { RequireUserGroup } from '@/shared/components/RequireUserGroup'
import { FLLOW_M_ADMIN_USER_GROUP_ID } from '@/shared/constants/accessControl'

export const Route = createFileRoute('/chap-evaluation/')({
    validateSearch: z.object({
        ou: z.string().optional(),
    }),
    component: ChapEvaluation,
})

function ChapEvaluation() {
    return (
        <RequireUserGroup userGroupId={FLLOW_M_ADMIN_USER_GROUP_ID}>
            <ChapEvaluationContent />
        </RequireUserGroup>
    )
}

function ChapEvaluationContent() {
    const { ou } = Route.useSearch()
    const navigate = useNavigate({ from: '/chap-evaluation/' })
    const { baseUrl } = useConfig()

    const [selectedBacktestId, setSelectedBacktestId] = useState<number | null>(
        null
    )
    // const [compareBacktestId, setCompareBacktestId] = useState<number | null>(null)
    const [selectedSplitPeriod, setSelectedSplitPeriod] = useState<
        string | null
    >(null)
    const [orgUnits, setOrgUnitsState] = useState<OrgUnitOption[]>([])
    const urlIds = useMemo(() => ou?.split(',').filter(Boolean) ?? [], [ou])

    const resolvedIdsKey = urlIds.join(',')
    const currentIdsKey = orgUnits.map((o) => o.id).join(',')
    const needsResolve =
        resolvedIdsKey !== '' && resolvedIdsKey !== currentIdsKey
    const { data: resolvedOus } = useQuery({
        queryKey: ['orgUnits-resolve', resolvedIdsKey],
        enabled: needsResolve,
        staleTime: Infinity,
        queryFn: async (): Promise<OrgUnitOption[]> => {
            const url = `${baseUrl}/api/organisationUnits?filter=id:in:[${urlIds.join(',')}]&fields=id,displayName&paging=false`
            const res = await fetch(url, { credentials: 'include' })
            if (!res.ok) {
                throw new Error(`Failed to resolve org units`)
            }
            const json = (await res.json()) as {
                organisationUnits: OrgUnitOption[]
            }
            return json.organisationUnits
        },
    })

    useEffect(() => {
        if (resolvedOus && resolvedOus.length > 0) {
            setOrgUnitsState(resolvedOus)
        }
    }, [resolvedOus])

    useEffect(() => {
        if (urlIds.length === 0) {
            setOrgUnitsState([])
        }
    }, [urlIds.length])

    function setOrgUnits(units: OrgUnitOption[]) {
        setOrgUnitsState(units)
        void navigate({
            search: (prev) => ({
                ...prev,
                ou:
                    units.length > 0
                        ? units.map((u) => u.id).join(',')
                        : undefined,
            }),
        })
    }

    const {
        data: backtests,
        isLoading: backtestsLoading,
        error: backtestsError,
    } = useBacktests()

    const activeBacktestId: number | null =
        selectedBacktestId ??
        (backtests && backtests.length > 0 ? Number(backtests[0]!.id) : null)

    // const { data: compatibleBacktests } = useCompatibleBacktests(activeBacktestId)
    const { orgUnitIds: chapOrgUnitIds, loading: chapOrgUnitsLoading } =
        useBacktestOrgUnits(activeBacktestId)

    const {
        actualCases,
        evalEntries,
        orgUnitDataMap,
        loading: dataLoading,
    } = useEvaluationData({ backtestId: activeBacktestId, orgUnits })

    const allSplitPeriods = useMemo(() => {
        const set = new Set<string>()
        for (const [, meta] of orgUnitDataMap) {
            for (const p of meta.splitPeriods) {
                set.add(p)
            }
        }
        return [...set].sort()
    }, [orgUnitDataMap])

    const SHOW_SPLIT_PERIOD_SLIDER = false
    const effectiveSplitPeriod = !SHOW_SPLIT_PERIOD_SLIDER
        ? null
        : allSplitPeriods.includes(selectedSplitPeriod ?? '')
          ? selectedSplitPeriod
          : (allSplitPeriods[0] ?? null)

    const activeBacktest = backtests?.find((b) => b.id === activeBacktestId)

    if (backtestsError) {
        return (
            <NoticeBox error title={i18n.t('Failed to load evaluations')}>
                {String(backtestsError)}
            </NoticeBox>
        )
    }

    return (
        <div className="flex flex-col gap-4 pb-24">
            {/* Filter bar */}
            <div className="flex flex-wrap items-start gap-4 rounded-md border border-gray-200 bg-white p-4 shadow-sm">
                {/* Evaluation selector */}
                <div className="flex min-w-48 flex-col gap-0.5">
                    <span className="text-xs font-medium text-gray-500">
                        {i18n.t('Evaluation')}
                    </span>
                    {backtestsLoading ? (
                        <CircularLoader small />
                    ) : (
                        <SingleSelect
                            selected={String(activeBacktestId ?? '')}
                            onChange={({
                                selected,
                            }: {
                                selected: string | undefined
                            }) => {
                                setSelectedBacktestId(
                                    selected ? Number(selected) : null
                                )
                                // setCompareBacktestId(null)
                                setSelectedSplitPeriod(null)
                                setOrgUnits([])
                            }}
                            placeholder={i18n.t('Select evaluation…')}
                        >
                            {(backtests ?? []).map((b) => (
                                <SingleSelectOption
                                    key={b.id}
                                    label={b.name ?? String(b.id)}
                                    value={String(b.id)}
                                />
                            ))}
                        </SingleSelect>
                    )}
                </div>

                {/* Compare selector */}
                {/* <div className="flex min-w-48 flex-col gap-0.5">
                    <span className="text-xs font-medium text-gray-500">
                        {i18n.t('Compare with')}
                    </span>
                    <SingleSelect
                        selected={String(compareBacktestId ?? '')}
                        onChange={({ selected }: { selected: string }) =>
                            setCompareBacktestId(selected ? Number(selected) : null)
                        }
                        placeholder={i18n.t('Select evaluation to compare…')}
                        disabled={!compatibleBacktests || compatibleBacktests.length === 0}
                    >
                        {(compatibleBacktests ?? []).map((b) => (
                            <SingleSelectOption
                                key={b.id}
                                label={b.name ?? String(b.id)}
                                value={String(b.id)}
                            />
                        ))}
                    </SingleSelect>
                </div> */}

                {/* Selected org unit chips */}
                {orgUnits.length > 0 && (
                    <div className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-gray-500">
                            {i18n.t('Organisation Units')}
                        </span>
                        <div className="flex flex-wrap gap-1">
                            {orgUnits.map((ou) => (
                                <Chip
                                    key={ou.id}
                                    onClick={() =>
                                        setOrgUnits(
                                            orgUnits.filter(
                                                (o) => o.id !== ou.id
                                            )
                                        )
                                    }
                                    onRemove={() =>
                                        setOrgUnits(
                                            orgUnits.filter(
                                                (o) => o.id !== ou.id
                                            )
                                        )
                                    }
                                >
                                    {ou.displayName}
                                </Chip>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Sidebar + content */}
            <div className="flex items-stretch gap-4">
                <EvaluationOrgUnitSidebar
                    chapOrgUnitIds={chapOrgUnitIds}
                    chapLoading={chapOrgUnitsLoading}
                    selected={orgUnits}
                    onChange={setOrgUnits}
                />

                <div className="min-w-0 flex-1">
                    {orgUnits.length === 0 ? (
                        <NoticeBox title={i18n.t('No org units selected')}>
                            {i18n.t(
                                'Select counties in the sidebar to view evaluation charts. Only counties with CHAP data are shown.'
                            )}
                        </NoticeBox>
                    ) : dataLoading ? (
                        <div className="flex items-center justify-center py-16">
                            <CircularLoader />
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {orgUnits.map((ou) => (
                                <OrgUnitChartCard
                                    key={ou.id}
                                    orgUnitId={ou.id}
                                    orgUnitName={ou.displayName}
                                    evaluationName={activeBacktest?.name ?? ''}
                                    actualCases={actualCases}
                                    evalEntries={evalEntries}
                                    selectedSplitPeriod={effectiveSplitPeriod}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Floating bottom split period slider */}
            {SHOW_SPLIT_PERIOD_SLIDER &&
                orgUnits.length > 0 &&
                allSplitPeriods.length > 0 && (
                    <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
                        <div className="w-full max-w-2xl rounded-xl border border-gray-200 bg-white px-6 shadow-[0_8px_32px_rgba(0,0,0,0.14)] pointer-events-auto">
                            <SplitPeriodSlider
                                splitPeriods={allSplitPeriods}
                                selectedSplitPeriod={effectiveSplitPeriod}
                                onChange={setSelectedSplitPeriod}
                            />
                        </div>
                    </div>
                )}
        </div>
    )
}
