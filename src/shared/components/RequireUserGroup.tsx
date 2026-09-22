import i18n from '@dhis2/d2-i18n'
import { CircularLoader, NoticeBox } from '@dhis2/ui'
import type { ReactNode } from 'react'
import { useHasUserGroup } from '@/shared/hooks/useCurrentUserGroups'

interface RequireUserGroupProps {
    userGroupId: string
    children: ReactNode
}

export function RequireUserGroup({ userGroupId, children }: RequireUserGroupProps) {
    const { hasAccess, loading, error } = useHasUserGroup(userGroupId)

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <CircularLoader />
            </div>
        )
    }

    if (error) {
        return (
            <NoticeBox error title={i18n.t('Failed to verify access')}>
                {String(error)}
            </NoticeBox>
        )
    }

    if (!hasAccess) {
        return (
            <NoticeBox error title={i18n.t('Access restricted')}>
                {i18n.t(
                    'This page is only available to members of the FLLOW-M Dashboard System Admin user group.'
                )}
            </NoticeBox>
        )
    }

    return <>{children}</>
}
