import { useDataQuery } from '@dhis2/app-runtime'
import { useEffect } from 'react'

export interface OrgUnit {
    id: string
    displayName: string
}

const statesQuery = {
    orgUnits: {
        resource: 'organisationUnits',
        params: (vars: Record<string, unknown>) => ({
            level: vars.level as number,
            fields: 'id,displayName',
            paging: false,
            order: 'displayName:asc',
        }),
    },
}

export function useStates(level: number) {
    const { data, loading } = useDataQuery<{
        orgUnits: { organisationUnits: OrgUnit[] }
    }>(statesQuery, { variables: { level } })

    return {
        states:
            (data?.orgUnits as unknown as { organisationUnits: OrgUnit[] })
                ?.organisationUnits ?? [],
        loading,
    }
}

export function useAllCounties(level: number) {
    const { data, loading } = useDataQuery<{
        orgUnits: { organisationUnits: OrgUnit[] }
    }>(statesQuery, { variables: { level } })

    const raw =
        (data?.orgUnits as unknown as { organisationUnits: OrgUnit[] })
            ?.organisationUnits ?? []
    return { allCounties: raw, loading }
}

const countiesQuery = {
    parent: {
        resource: 'organisationUnits',
        id: (vars: Record<string, unknown>) => vars.stateId as string,
        params: { fields: 'children[id,displayName]' },
    },
}

export function useCounties(stateId: string | null) {
    const { data, loading, refetch } = useDataQuery<{
        parent: { children: OrgUnit[] }
    }>(countiesQuery, { lazy: true })

    useEffect(() => {
        if (stateId) {
            refetch({ stateId })
        }
    }, [stateId, refetch])

    const raw =
        (data?.parent as unknown as { children: OrgUnit[] })?.children ?? []
    const sorted = [...raw].sort((a, b) =>
        a.displayName.localeCompare(b.displayName)
    )

    return { counties: sorted, loading }
}
