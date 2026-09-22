import { Card } from '@dhis2/ui'

interface SectionHeaderProps {
    title: string
    description: string
}

export function SectionHeader({ title, description }: SectionHeaderProps) {
    return (
        <Card className="p-4">
            <div className="flex flex-col gap-1">
                <h2 className="text-lg font-semibold text-gray-800">
                    {title}
                </h2>
                <p className="text-sm text-gray-600">{description}</p>
            </div>
        </Card>
    )
}
