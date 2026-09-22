import { useLayoutEffect, useRef, useState } from 'react'

export function useHeaderRowHeight() {
    const containerRef = useRef<HTMLDivElement | null>(null)
    const [height, setHeight] = useState(0)

    useLayoutEffect(() => {
        const row = containerRef.current?.querySelector('thead > tr')
        if (!row) {
            return
        }

        const measure = () => setHeight(row.getBoundingClientRect().height)
        measure()

        const observer = new ResizeObserver(measure)
        observer.observe(row)
        return () => observer.disconnect()
    }, [])

    return { containerRef, height }
}
