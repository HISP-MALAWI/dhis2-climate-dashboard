import { clamp } from 'lodash'
import { useCallback, useLayoutEffect, useRef, useState } from 'react'

interface FitFontSizeOptions {
     maxSize: number
     minSize: number
}

export function useFitFontSize(
    text: string,
    { maxSize, minSize }: FitFontSizeOptions
) {
    const containerRef = useRef<HTMLDivElement | null>(null)
    const textRef = useRef<HTMLSpanElement | null>(null)
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const [fontSize, setFontSize] = useState(maxSize)

    const measure = useCallback(() => {
        const container = containerRef.current
        const textEl = textRef.current
        if (!container || !textEl) {
            return
        }

        const { width, height } = container.getBoundingClientRect()
        if (width === 0 || height === 0) {
            return
        }

        canvasRef.current ??= document.createElement('canvas')
        const context = canvasRef.current.getContext('2d')
        if (!context) {
            return
        }

        const { fontWeight, fontFamily, fontStyle } = getComputedStyle(textEl)
        context.font = `${fontStyle} ${fontWeight} ${maxSize}px ${fontFamily}`
        const textWidth = context.measureText(text).width
        if (textWidth === 0) {
            return
        }

        const scale = Math.min(width / textWidth, height / (maxSize * 1.2), 1)
        setFontSize(clamp(Math.floor(maxSize * scale), minSize, maxSize))
    }, [text, maxSize, minSize])

    useLayoutEffect(() => {
        measure()

        const container = containerRef.current
        if (!container) {
            return
        }
        const observer = new ResizeObserver(measure)
        observer.observe(container)
        return () => observer.disconnect()
    }, [measure])

    return { containerRef, textRef, fontSize }
}
