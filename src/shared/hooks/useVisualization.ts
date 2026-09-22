import { useDataQuery } from '@dhis2/app-runtime'
import type { VisualizationConfig } from '@/shared/schemas/visualization'
import { visualizationFields } from '@/shared/schemas/visualization'

interface UseVisualizationProps {
    visualizationId: string
}

interface UseVisualizationResult {
    loading: boolean
    error?: Error
    visualization?: VisualizationConfig
    refetch: () => void
}

const VISUALIZATION_QUERY = {
    visualization: {
        resource: 'visualizations',
        id: ({ id }: Record<string, unknown>) => id as string,
        params: {
            fields: visualizationFields.join(','),
        },
    },
}

export const useVisualization = ({
    visualizationId,
}: UseVisualizationProps): UseVisualizationResult => {
    const { loading, error, data, refetch } = useDataQuery<{
        visualization: VisualizationConfig
    }>(VISUALIZATION_QUERY, {
        variables: { id: visualizationId },
        lazy: !visualizationId,
    })

    return {
        loading,
        error,
        visualization: data?.visualization,
        refetch: refetch || (() => {}),
    }
}
