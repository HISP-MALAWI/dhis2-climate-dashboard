import '@/index.css'
import { DialogProvider } from '@hisptz/dhis2-ui'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
    createHashHistory,
    createRouter,
    RouterProvider,
} from '@tanstack/react-router'
import { routeTree } from '@/routeTree.gen'

const hashHistory = createHashHistory()

const router = createRouter({ routeTree, history: hashHistory })

declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router
    }
}

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: false,
            retryDelay: 0,
            refetchInterval: false,
        },
    },
})

const MyApp = () => (
    <QueryClientProvider client={queryClient}>
        <DialogProvider>
            <RouterProvider router={router} />
        </DialogProvider>
    </QueryClientProvider>
)

export default MyApp
