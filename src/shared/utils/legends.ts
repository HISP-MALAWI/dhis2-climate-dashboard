interface LegendSetLike {
    legends?: Array<{
        startValue?: number
        endValue?: number
        color?: string
    }>
}

export function getLegendColorFromValue({
    legendSet,
    value,
}: {
    legendSet?: LegendSetLike
    value?: number
}): string | null {
    if (!legendSet) {
        return null
    }
    if (value === undefined || isNaN(value)) {
        return null
    }
    const legends = legendSet?.legends ?? []
    const legend = legends.find((l) => {
        if (l.startValue === undefined || l.endValue === undefined) {
            return false
        }
        return (
            l.startValue === value ||
            l.endValue === value ||
            (l.startValue < value! && value! < l.endValue)
        )
    })
    return legend?.color ?? null
}
