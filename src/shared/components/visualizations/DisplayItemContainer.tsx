import { useAlert } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import { Card, CircularLoader, NoticeBox } from '@dhis2/ui'
import { Map as LeafletMap } from 'leaflet'
import React, { RefObject, Suspense, memo, useCallback } from 'react'
import { FullScreen, useFullScreenHandle } from 'react-full-screen'
import { VisualizationMenu } from './VisualizationMenu'
import type { ChartRef, DisplayItemProps } from '@/shared/schemas'
import {
    downloadChartImage,
    downloadMapImage,
    downloadTableData,
    ImageFormat,
    TableDataFormat,
    TableMatrix,
} from '@/shared/utils'

const CardLoading = () => (
    <div className="flex h-full items-center justify-center">
        <CircularLoader />
    </div>
)

const CardError = ({
    error,
    title,
}: {
    error?: Error | null
    title?: string
}) => (
    <div className="p-4">
        <NoticeBox error title={title ?? i18n.t('Visualization Error')}>
            {error?.message ??
                i18n.t('An error occurred while loading the visualization')}
        </NoticeBox>
    </div>
)

interface ErrorBoundaryState {
    hasError: boolean
    error?: Error
}

class VisualizationErrorBoundary extends React.Component<
    { children: React.ReactNode; title?: string },
    ErrorBoundaryState
> {
    constructor(props: { children: React.ReactNode; title?: string }) {
        super(props)
        this.state = { hasError: false }
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('Visualization error:', error, errorInfo)
    }

    render() {
        if (this.state.hasError) {
            return (
                <CardError error={this.state.error} title={this.props.title} />
            )
        }
        return this.props.children
    }
}

interface DisplayItemContainerProps extends DisplayItemProps {
    chartRef?: ChartRef
    selectedOrgUnits?: string[]
    selectedPeriods?: string[]
    onOrgUnitChange?: (ids: string[]) => void
    onPeriodChange?: (ids: string[]) => void
    tableMatrix?: TableMatrix
    mapRef?: RefObject<LeafletMap | null>
}

export const DisplayItemContainer = memo<DisplayItemContainerProps>(
    ({
        children,
        title,
        loading = false,
        error = null,
        chartRef,
        selectedOrgUnits,
        selectedPeriods,
        onOrgUnitChange,
        onPeriodChange,
        tableMatrix,
        mapRef,
    }) => {
        const handle = useFullScreenHandle()
        const { show: showError } = useAlert(
            ({ message }: { message: string }) => message,
            { critical: true }
        )

        const handleDownloadImage = useCallback(
            (format: ImageFormat) => {
                const chart = chartRef?.current?.chart
                const map = mapRef?.current
                const download = chart
                    ? downloadChartImage({ chart, format, title })
                    : map
                      ? downloadMapImage({ map, title })
                      : undefined

                if (!download) {
                    showError({
                        message: i18n.t('The visualization is not ready yet'),
                    })
                    return
                }

                download.catch((downloadError: Error) => {
                    showError({
                        message:
                            downloadError.message ||
                            i18n.t('Could not download the visualization'),
                    })
                })
            },
            [chartRef, mapRef, title, showError]
        )

        const handleDownloadData = useCallback(
            (format: TableDataFormat) => {
                if (!tableMatrix) {
                    return
                }
                downloadTableData({ matrix: tableMatrix, format, title })
            },
            [tableMatrix, title]
        )

        function handleFullscreen() {
            if (handle.active) {
                handle.exit()
            } else {
                handle.enter()
            }
        }

        function handleFullscreenChange() {
            chartRef?.current?.chart?.reflow()
        }

        return (
            <Card className="h-full w-full">
                <div className="flex h-full flex-col">
                    <div className="flex shrink-0 items-center justify-between  px-4 py-2">
                        {title && (
                            <h3 className="text-base font-semibold text-gray-900">
                                {title}
                            </h3>
                        )}
                        <div className="ml-auto">
                            <VisualizationMenu
                                onFullscreen={handleFullscreen}
                                selectedOrgUnits={selectedOrgUnits}
                                selectedPeriods={selectedPeriods}
                                onOrgUnitChange={onOrgUnitChange}
                                onPeriodChange={onPeriodChange}
                                onDownloadImage={
                                    chartRef || mapRef
                                        ? handleDownloadImage
                                        : undefined
                                }
                                imageFormats={
                                    mapRef && !chartRef ? ['png'] : undefined
                                }
                                onDownloadData={
                                    tableMatrix ? handleDownloadData : undefined
                                }
                            />
                        </div>
                    </div>
                    <FullScreen
                        handle={handle}
                        className="min-h-0 flex-1 bg-white"
                        onChange={handleFullscreenChange}
                    >
                        <div className="h-full overflow-hidden p-4">
                            {error ? (
                                <CardError error={error} title={title} />
                            ) : loading ? (
                                <CardLoading />
                            ) : (
                                <VisualizationErrorBoundary title={title}>
                                    <Suspense fallback={<CardLoading />}>
                                        {children}
                                    </Suspense>
                                </VisualizationErrorBoundary>
                            )}
                        </div>
                    </FullScreen>
                </div>
            </Card>
        )
    }
)

DisplayItemContainer.displayName = 'DisplayItemContainer'
