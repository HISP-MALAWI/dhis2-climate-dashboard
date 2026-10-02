import i18n from '@dhis2/d2-i18n'
import { Checkbox, CircularLoader, Input } from '@dhis2/ui'
import { useState } from 'react'
import { COUNTY_OU_LEVEL, MAX_SELECTED_ORG_UNITS, STATE_OU_LEVEL } from '../constants'
import { useAllCounties, useCounties, useStates } from '../hooks/useOrgUnitLevel'
import type { OrgUnit } from '../hooks/useOrgUnitLevel'

export interface OrgUnitOption {
    id: string
    displayName: string
}

interface EvaluationOrgUnitSidebarProps {
    chapOrgUnitIds: Set<string>
    chapLoading: boolean
    selected: OrgUnitOption[]
    onChange: (selected: OrgUnitOption[]) => void
}

function SectionHeader({ label }: { label: string }) {
    return (
        <div className="bg-[#1a5276] px-3 py-2">
            <span className="text-sm font-semibold text-white">{label}</span>
        </div>
    )
}

function SearchInput({
    value,
    onChange,
    placeholder,
}: {
    value: string
    onChange: (v: string) => void
    placeholder: string
}) {
    return (
        <div className="m-1">
            <Input
                type="search"
                value={value}
                onChange={({ value: v }: { value?: string }) =>
                    onChange(v ?? '')
                }
                placeholder={placeholder}
                dense
            />
        </div>
    )
}

function StateList({
    items,
    loading,
    selectedId,
    onSelect,
    query,
}: {
    items: OrgUnit[]
    loading: boolean
    selectedId: string | null
    onSelect: (ou: OrgUnit) => void
    query: string
}) {
    if (loading) {
        return (
            <div className="flex justify-center p-4">
                <CircularLoader small />
            </div>
        )
    }

    const filtered = query.trim()
        ? items.filter((ou) =>
              ou.displayName.toLowerCase().includes(query.toLowerCase())
          )
        : items

    if (filtered.length === 0) {
        return (
            <p className="px-3 py-3 text-xs italic text-gray-400">
                {i18n.t('No results')}
            </p>
        )
    }

    return (
        <ul className="overflow-y-auto">
            {filtered.map((ou) => (
                <li key={ou.id}>
                    <button
                        onClick={() => onSelect(ou)}
                        className={`w-full px-3 py-2 text-left text-sm transition-colors hover:bg-blue-50 ${
                            selectedId === ou.id
                                ? 'bg-blue-100 font-medium text-blue-900'
                                : 'text-gray-700'
                        }`}
                    >
                        {ou.displayName}
                    </button>
                </li>
            ))}
        </ul>
    )
}

function CountyList({
    items,
    loading,
    chapLoading,
    chapOrgUnitIds,
    selected,
    onToggle,
    query,
}: {
    items: OrgUnit[]
    loading: boolean
    chapLoading: boolean
    chapOrgUnitIds: Set<string>
    selected: OrgUnitOption[]
    onToggle: (ou: OrgUnit) => void
    query: string
}) {
    if (loading || chapLoading) {
        return (
            <div className="flex justify-center p-4">
                <CircularLoader small />
            </div>
        )
    }

    const chapFiltered = items.filter((ou) => chapOrgUnitIds.has(ou.id))
    const filtered = query.trim()
        ? chapFiltered.filter((ou) =>
              ou.displayName.toLowerCase().includes(query.toLowerCase())
          )
        : chapFiltered

    if (filtered.length === 0) {
        return (
            <p className="px-3 py-3 text-xs italic text-gray-400">
                {chapOrgUnitIds.size === 0
                    ? i18n.t('No evaluation data available')
                    : i18n.t('No matching counties')}
            </p>
        )
    }

    const selectedIds = new Set(selected.map((s) => s.id))
    const atMax = selected.length >= MAX_SELECTED_ORG_UNITS

    return (
        <ul className="overflow-y-auto">
            {filtered.map((ou) => {
                const isChecked = selectedIds.has(ou.id)
                const isDisabled = atMax && !isChecked
                return (
                    <li key={ou.id}>
                        <label
                            className={`flex cursor-pointer items-center gap-2 px-3 py-2 transition-colors hover:bg-blue-50 ${
                                isDisabled ? 'cursor-not-allowed opacity-50' : ''
                            } ${isChecked ? 'bg-blue-50' : ''}`}
                        >
                            <Checkbox
                                checked={isChecked}
                                disabled={isDisabled}
                                onChange={() => onToggle(ou)}
                                dense
                            />
                            <span className="text-sm text-gray-700">
                                {ou.displayName}
                            </span>
                        </label>
                    </li>
                )
            })}
        </ul>
    )
}

export function EvaluationOrgUnitSidebar({
    chapOrgUnitIds,
    chapLoading,
    selected,
    onChange,
}: EvaluationOrgUnitSidebarProps) {
    const [selectedStateId, setSelectedStateId] = useState<string | null>(null)
    const [query, setQuery] = useState('')

    const { states, loading: statesLoading } = useStates(STATE_OU_LEVEL)
    const { counties, loading: countiesLoading } = useCounties(selectedStateId)
    const { allCounties, loading: allCountiesLoading } = useAllCounties(COUNTY_OU_LEVEL)

    const isSearching = query.trim().length > 0
    const countyItems = isSearching ? allCounties : counties
    const countyLoading = isSearching ? allCountiesLoading : countiesLoading

    function handleToggle(ou: OrgUnit) {
        const isSelected = selected.some((s) => s.id === ou.id)
        if (isSelected) {
            onChange(selected.filter((s) => s.id !== ou.id))
        } else if (selected.length < MAX_SELECTED_ORG_UNITS) {
            onChange([...selected, { id: ou.id, displayName: ou.displayName }])
        }
    }

    return (
        <div className="flex w-56 shrink-0 flex-col overflow-hidden self-stretch rounded border border-gray-200 bg-white shadow-sm">
            <SectionHeader label={i18n.t('National / Zones')} />
            <SearchInput
                value={query}
                onChange={setQuery}
                placeholder={i18n.t('Search Districts or zones…')}
            />
            <div className="max-h-64 overflow-y-auto border-b border-gray-200">
                <StateList
                    items={states}
                    loading={statesLoading}
                    selectedId={selectedStateId}
                    onSelect={(ou) => setSelectedStateId(ou.id)}
                    query={query}
                />
            </div>

            <SectionHeader label={i18n.t('Districts')} />

            <div className="flex items-center justify-between px-3 py-1.5 text-xs text-gray-500">
                <span>{i18n.t('Select a max  of 10 districts')}</span>
                <span
                    className={
                        selected.length >= MAX_SELECTED_ORG_UNITS
                            ? 'font-medium text-amber-600'
                            : ''
                    }
                >
                    {selected.length}/{MAX_SELECTED_ORG_UNITS}
                </span>
            </div>

            <div className="min-h-0 flex-1 flex flex-col overflow-hidden">
                {!selectedStateId && !isSearching ? (
                    <p className="px-3 py-3 text-xs italic text-gray-400">
                        {i18n.t('Select a state to see counties')}
                    </p>
                ) : (
                    <div className="min-h-0 flex-1 overflow-y-auto">
                        <CountyList
                            items={countyItems}
                            loading={countyLoading}
                            chapLoading={chapLoading}
                            chapOrgUnitIds={chapOrgUnitIds}
                            selected={selected}
                            onToggle={handleToggle}
                            query={query}
                        />
                    </div>
                )}
            </div>
        </div>
    )
}
