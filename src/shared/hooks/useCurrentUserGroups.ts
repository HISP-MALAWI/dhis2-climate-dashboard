import { useDataQuery } from '@dhis2/app-runtime'

interface MeUserGroupsResponse {
    userGroups: Array<{ id: string }>
}

const meQuery = {
    me: {
        resource: 'me',
        params: {
            fields: 'userGroups[id]',
        },
    },
}

export function useCurrentUserGroups() {
    const { data, loading, error } = useDataQuery<{ me: MeUserGroupsResponse }>(
        meQuery
    )

    const userGroupIds = data?.me.userGroups.map((group) => group.id) ?? []

    return { userGroupIds, loading, error }
}

export function useHasUserGroup(userGroupId: string) {
    const { userGroupIds, loading, error } = useCurrentUserGroups()
    return { hasAccess: userGroupIds.includes(userGroupId), loading, error }
}
