import i18n from '@dhis2/d2-i18n'
import { MenuItem } from '@dhis2/ui'
import { IconImage16, IconTable16 } from '@dhis2/ui-icons'
import type { ImageFormat, TableDataFormat } from '@/shared/utils'

export interface DownloadHandlers {
    onDownloadImage?: (format: ImageFormat) => void
    onDownloadData?: (format: TableDataFormat) => void
    imageFormats?: ImageFormat[]
}

interface DownloadMenuItemsProps extends DownloadHandlers {
    onSelect: () => void
}

export function DownloadMenuItems({
    onDownloadImage,
    onDownloadData,
    imageFormats = ['png', 'svg'],
    onSelect,
}: DownloadMenuItemsProps) {
    if (!onDownloadImage && !onDownloadData) {
        return null
    }

    return (
        <>
            <div className="px-3 pt-3 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                {i18n.t('Download')}
            </div>
            {onDownloadImage && imageFormats.includes('png') && (
                <MenuItem
                    label={i18n.t('Image (.png)')}
                    icon={<IconImage16 />}
                    onClick={() => {
                        onSelect()
                        onDownloadImage('png')
                    }}
                />
            )}
            {onDownloadImage && imageFormats.includes('svg') && (
                <MenuItem
                    label={i18n.t('Vector image (.svg)')}
                    icon={<IconImage16 />}
                    onClick={() => {
                        onSelect()
                        onDownloadImage('svg')
                    }}
                />
            )}
            {onDownloadData && (
                <> 
                    <MenuItem
                        label={i18n.t('Excel (.xls)')}
                        icon={<IconTable16 />}
                        onClick={() => {
                            onSelect()
                            onDownloadData('excel')
                        }}
                    />
                </>
            )}
        </>
    )
}
