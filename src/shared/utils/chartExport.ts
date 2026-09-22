import Highcharts from 'highcharts'
import 'highcharts/modules/exporting'
import { downloadBlob, toFileName } from './download'

export type ImageFormat = 'png' | 'svg'

Highcharts.setOptions({ exporting: { enabled: false } })

const PNG_SCALE = 2

const EXPORT_OPTIONS: Highcharts.Options = {
    plotOptions: {
        series: {
            dataLabels: {
                enabled: true,
                allowOverlap: false,
            },
        },
    },
}


function getChartSvg(chart: Highcharts.Chart): string | undefined {
    const exportable = chart as Highcharts.Chart & {
        getSVG?: (options?: Highcharts.Options) => string
    }
    if (typeof exportable.getSVG === 'function') {
        return exportable.getSVG(EXPORT_OPTIONS)
    }
    const node = chart.container?.querySelector('svg')
    return node ? new XMLSerializer().serializeToString(node) : undefined
}

function getSvgSize(
    svg: string,
    chart: Highcharts.Chart
): { width: number; height: number } {
    const width = Number(/\bwidth="(\d+(?:\.\d+)?)"/.exec(svg)?.[1])
    const height = Number(/\bheight="(\d+(?:\.\d+)?)"/.exec(svg)?.[1])
    return {
        width: width || chart.chartWidth || 800,
        height: height || chart.chartHeight || 500,
    }
}

function svgToPngBlob(
    svg: string,
    width: number,
    height: number
): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas')
        canvas.width = width * PNG_SCALE
        canvas.height = height * PNG_SCALE
        const context = canvas.getContext('2d')
        if (!context) {
            reject(new Error('Canvas is not supported in this browser'))
            return
        }

        const image = new Image()
        const url = URL.createObjectURL(
            new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
        )

        image.onload = () => {
            context.fillStyle = '#ffffff'
            context.fillRect(0, 0, canvas.width, canvas.height)
            context.drawImage(image, 0, 0, canvas.width, canvas.height)
            URL.revokeObjectURL(url)
            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(blob)
                } else {
                    reject(new Error('Failed to render the chart image'))
                }
            }, 'image/png')
        }
        image.onerror = () => {
            URL.revokeObjectURL(url)
            reject(new Error('Failed to render the chart image'))
        }
        image.src = url
    })
}

interface DownloadChartImageParams {
    chart: Highcharts.Chart
    format: ImageFormat
    title?: string
}

export async function downloadChartImage({
    chart,
    format,
    title,
}: DownloadChartImageParams) {
    const svg = getChartSvg(chart)
    if (!svg) {
        throw new Error('The visualization could not be exported as an image')
    }

    if (format === 'svg') {
        downloadBlob(
            new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }),
            toFileName(title, 'svg')
        )
        return
    }

    const { width, height } = getSvgSize(svg, chart)
    const blob = await svgToPngBlob(svg, width, height)
    downloadBlob(blob, toFileName(title, 'png'))
}
