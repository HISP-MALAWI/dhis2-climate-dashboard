export const numberFormatter = (value: number) =>
    Intl.NumberFormat('en-GB', {
        notation: 'standard',
        maximumFractionDigits: 0,
    }).format(value)
