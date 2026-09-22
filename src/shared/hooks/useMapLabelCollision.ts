import { Map as LeafletMap } from 'leaflet'
import { useEffect } from 'react'

const LABEL_GAP = 4

function overlaps(a: DOMRect, b: DOMRect) {
    return !(
        a.right + LABEL_GAP < b.left ||
        b.right + LABEL_GAP < a.left ||
        a.bottom + LABEL_GAP < b.top ||
        b.bottom + LABEL_GAP < a.top
    )
}


export function useMapLabelCollision(map: LeafletMap | null) {
    useEffect(() => {
        if (!map) {
            return
        }

        const container = map.getContainer()
        let frame = 0

        const resolveCollisions = () => {
            frame = 0
            const labels = Array.from(
                container.querySelectorAll<HTMLElement>('.label-icon')
            )

            labels.forEach((label) => {
                label.style.visibility = ''
            })

            const placed: DOMRect[] = []
            for (const label of labels) {
                const text = label.firstElementChild ?? label
                const rect = text.getBoundingClientRect()
                if (rect.width === 0 || rect.height === 0) {
                    continue
                }
                if (placed.some((other) => overlaps(other, rect))) {
                    label.style.visibility = 'hidden'
                } else {
                    placed.push(rect)
                }
            }
        }

        const schedule = () => {
            if (frame === 0) {
                frame = requestAnimationFrame(resolveCollisions)
            }
        }

        schedule()
        map.on('zoomend moveend resize layeradd', schedule)

        const observer = new MutationObserver(schedule)
        observer.observe(container, { childList: true, subtree: true })

        return () => {
            map.off('zoomend moveend resize layeradd', schedule)
            observer.disconnect()
            if (frame !== 0) {
                cancelAnimationFrame(frame)
            }
        }
    }, [map])
}
