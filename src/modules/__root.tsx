import { createRootRoute, Outlet, useRouterState } from '@tanstack/react-router'
import { z } from 'zod'
import { AppTabs } from '@/shared/components/AppTabs'
import { FilterBarCompact } from '@/shared/components/FilterBarCompact'

export const Route = createRootRoute({
    validateSearch: z.object({
        ou: z.string().optional(),
        pe: z.string().optional(),
    }),
    component: RootComponent,
})

function RootComponent() {
    const pathname = useRouterState({ select: (s) => s.location.pathname })
    const showFilterBar =
        !pathname.startsWith('/chap-forecast-alerts') &&
        !pathname.startsWith('/ewars-forecasts-alerts') &&
        !pathname.startsWith('/chap-evaluation') &&
        !pathname.startsWith('/chap-compare') &&
        !pathname.startsWith('/chap-threshold')

    return (
        <div className="flex h-full w-full flex-col bg-gray-50">
            <AppTabs />
            <main className="flex-1 overflow-y-auto p-6">
                {showFilterBar && (
                    <div className="h-26 pb-4">
                        <FilterBarCompact />
                    </div>
                )}
                <Outlet />
            </main>
        </div>
    )
}
