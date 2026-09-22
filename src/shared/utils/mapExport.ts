import { toBlob } from 'html-to-image'
import { Map as LeafletMap } from 'leaflet'
import { downloadBlob, toFileName } from './download'

const PNG_SCALE = 2

const EXCLUDED_SELECTORS = [
    '.leaflet-control-zoom',
    '.leaflet-control-layers',
    '.leaflet-control-attribution',
]

function isExcluded(node: HTMLElement): boolean {
    return EXCLUDED_SELECTORS.some((selector) => node.matches?.(selector))
}

function mountExportClone(
    container: HTMLElement,
    width: number,
    height: number
): { clone: HTMLElement; remove: () => void } {
    const clone = container.cloneNode(true) as HTMLElement
    clone.style.width = `${width}px`
    clone.style.height = `${height}px`

    const sources = container.querySelectorAll<HTMLCanvasElement>('canvas')
    const targets = clone.querySelectorAll<HTMLCanvasElement>('canvas')
    sources.forEach((source, index) => {
        const target = targets[index]
        if (!target || source.width === 0 || source.height === 0) {
            return
        }
        target.width = source.width
        target.height = source.height
        target.getContext('2d')?.drawImage(source, 0, 0)
    })

    const host = document.createElement('div')
    host.style.cssText = [
        'position: fixed',
        'top: 0',
        'left: -100000px',
        `width: ${width}px`,
        `height: ${height}px`,
        'pointer-events: none',
        'opacity: 1',
    ].join(';')
    host.appendChild(clone)
    document.body.appendChild(host)

    return { clone, remove: () => host.remove() }
}

interface DownloadMapImageParams {
    map: LeafletMap
    title?: string
}

export async function downloadMapImage({ map, title }: DownloadMapImageParams) {
    const container = map.getContainer()
    const { width, height } = container.getBoundingClientRect()
    if (width === 0 || height === 0) {
        throw new Error('The map is not ready yet')
    }

    const { clone, remove } = mountExportClone(container, width, height)

    const options = {
        pixelRatio: PNG_SCALE,
        backgroundColor: '#ffffff',
        width,
        height,
        filter: (node: HTMLElement) => !isExcluded(node),
        skipFonts: false,
        cacheBust: false,
    }

    try {
        await toBlob(clone, options)
        const blob = await toBlob(clone, options)

        if (!blob) {
            throw new Error('Failed to render the map image')
        }
        downloadBlob(blob, toFileName(title, 'png'))
    } finally {
        remove()
    }
}
