import i18n from '@dhis2/d2-i18n'
import { CircularLoader, Input } from '@dhis2/ui'
import { useState } from 'react'
import type { OrgUnit } from '../hooks/useOrgUnitLevel'

interface OrgUnitSidebarProps {
    states: OrgUnit[]
    statesLoading: boolean
    counties: OrgUnit[]
    countiesLoading: boolean
    allCounties: OrgUnit[]
    allCountiesLoading: boolean
    selectedStateId: string | null
    onStateSelect: (ou: OrgUnit) => void
    selectedCountyId: string | null
    onCountySelect: (ou: OrgUnit) => void
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

function OrgUnitList({
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
            <p className="px-3 py-3 text-xs text-gray-400 italic">
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

export function OrgUnitSidebar({
    states,
    statesLoading,
    counties,
    countiesLoading,
    allCounties,
    allCountiesLoading,
    selectedStateId,
    onStateSelect,
    selectedCountyId,
    onCountySelect,
}: OrgUnitSidebarProps) {
    const [query, setQuery] = useState('')

    const isSearching = query.trim().length > 0
    const countyItems = isSearching ? allCounties : counties
    const countyLoading = isSearching ? allCountiesLoading : countiesLoading

    return (
        <div className="flex w-52 shrink-0 flex-col overflow-hidden rounded border border-gray-200 bg-white shadow-sm h-168">
            <SectionHeader label={i18n.t('Country/States')} />
            <SearchInput
                value={query}
                onChange={setQuery}
                placeholder={i18n.t('Search states or counties…')}
            />
            <div className="max-h-64 overflow-y-auto border-b border-gray-200">
                <OrgUnitList
                    items={states}
                    loading={statesLoading}
                    selectedId={selectedStateId}
                    onSelect={onStateSelect}
                    query={query}
                />
            </div>

            <SectionHeader label={i18n.t('Counties')} />
            {!selectedStateId && !isSearching ? (
                <p className="px-3 py-3 text-xs text-gray-400 italic">
                    {i18n.t('Select a zone to view districts')}
                </p>
            ) : (
                <div className="flex-1 overflow-y-auto min-h-0">
                    <OrgUnitList
                        items={countyItems}
                        loading={countyLoading}
                        selectedId={selectedCountyId}
                        onSelect={onCountySelect}
                        query={query}
                    />
                </div>
            )}
        </div>
    )
}
