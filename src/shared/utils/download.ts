/** Triggers a browser download for the given content. */
export function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
}

/** Strips characters that are unsafe or awkward in file names. */
export function toFileName(name: string | undefined, extension: string) {
    const base = (name ?? 'visualization')
        .trim()
        .replace(/[\\/:*?"<>|]+/g, '')
        .replace(/\s+/g, '-')
        .slice(0, 120)
    return `${base || 'visualization'}.${extension}`
}
