import { downloadBlob, toFileName } from './download'
import { formatValue, PivotModel } from './pivotTable'

export type TableDataFormat = 'csv' | 'excel'

export interface TableMatrix {
    rows: string[][]
    headerRowCount: number
}


export function buildTableMatrix(model: PivotModel): TableMatrix {
    const {
        rowLabel,
        outerColItems,
        innerColItems,
        hasInnerCol,
        outerRowItems,
        rowDims,
        colDims,
        getValue,
    } = model

    const outerHeader = [
        rowLabel,
        ...outerColItems.flatMap((outer) =>
            hasInnerCol ? innerColItems.map(() => outer.name) : [outer.name]
        ),
    ]

    const headerRows = hasInnerCol
        ? [
              outerHeader,
              [
                  '',
                  ...outerColItems.flatMap(() =>
                      innerColItems.map((inner) => inner.name)
                  ),
              ],
          ]
        : [outerHeader]

    const bodyRows = outerRowItems.map((rowItem) => [
        rowItem.name,
        ...outerColItems.flatMap((outer) => {
            if (!hasInnerCol) {
                return [
                    formatValue(
                        getValue({
                            [rowDims[0]!]: rowItem.id,
                            [colDims[0]!]: outer.id,
                        })
                    ),
                ]
            }
            return innerColItems.map((inner) =>
                formatValue(
                    getValue({
                        [rowDims[0]!]: rowItem.id,
                        [colDims[0]!]: outer.id,
                        [colDims[1]!]: inner.id,
                    })
                )
            )
        }),
    ])

    return {
        rows: [...headerRows, ...bodyRows],
        headerRowCount: headerRows.length,
    }
}

function escapeCsvCell(cell: string) {
    return /[",\n\r]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell
}

export function toCsv({ rows }: TableMatrix): string {
    return rows.map((row) => row.map(escapeCsvCell).join(',')).join('\r\n')
}

function escapeHtml(value: string) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
}

export function toExcelHtml(
    { rows, headerRowCount }: TableMatrix,
    title?: string
): string {
    const renderRow = (row: string[], isHeader: boolean) =>
        `<tr>${row
            .map((cell) => {
                const tag = isHeader ? 'th' : 'td'
                const isNumber = cell !== '' && !isNaN(Number(cell))
                const attrs = isNumber ? ' x:num' : ''
                return `<${tag}${attrs}>${escapeHtml(cell)}</${tag}>`
            })
            .join('')}</tr>`

    const rowsHtml = rows
        .map((row, index) => renderRow(row, index < headerRowCount))
        .join('')

    return `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8" /><title>${escapeHtml(
        title ?? 'Export'
    )}</title></head><body><table border="1">${rowsHtml}</table></body></html>`
}

interface DownloadTableDataParams {
    matrix: TableMatrix
    format: TableDataFormat
    title?: string
}

export function downloadTableData({
    matrix,
    format,
    title,
}: DownloadTableDataParams) {
    if (format === 'csv') {
        const blob = new Blob(['﻿', toCsv(matrix)], {
            type: 'text/csv;charset=utf-8;',
        })
        downloadBlob(blob, toFileName(title, 'csv'))
        return
    }

    const blob = new Blob([toExcelHtml(matrix, title)], {
        type: 'application/vnd.ms-excel;charset=utf-8;',
    })
    downloadBlob(blob, toFileName(title, 'xls'))
}
