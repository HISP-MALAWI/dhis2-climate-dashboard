import { useDataQuery } from '@dhis2/app-runtime'
import { useEffect, useState } from 'react'
import { OrgUnitListResponseSchema, OrgUnitRef } from '@/shared/schemas'

const orgUnitsQuery = {
    orgUnits: {
        resource: 'organisationUnits',
        params: (variables: Record<string, unknown>) => ({
            fields: ['id', 'displayName', 'path'],
            filter: [`id:in:[${(variables.ids as string[]).join(',')}]`],
            paging: false,
        }),
    },
}

export function useOrgUnitsByIds(ids: string[]) {
    const idsKey = ids.join(',')
    const [orgUnits, setOrgUnits] = useState<OrgUnitRef[]>([])
    const [loading, setLoading] = useState(idsKey !== '')

    const { refetch } = useDataQuery<{ orgUnits: unknown }>(orgUnitsQuery, {
        lazy: true,
    })

    useEffect(() => {
        if (idsKey === '') {
            setOrgUnits([])
            setLoading(false)
            return
        }

        let cancelled = false
        setLoading(true)

        refetch({ ids: idsKey.split(',') })
            .then((data) => {
                if (cancelled) {
                    return
                }
                const parsed = OrgUnitListResponseSchema.safeParse(
                    (data as { orgUnits?: unknown } | undefined)?.orgUnits
                )
                setOrgUnits(parsed.success ? parsed.data.organisationUnits : [])
            })
            .catch(() => {
                if (!cancelled) {
                    setOrgUnits([])
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setLoading(false)
                }
            })

        return () => {
            cancelled = true
        }
    }, [idsKey, refetch])

    return { orgUnits, loading }
}
