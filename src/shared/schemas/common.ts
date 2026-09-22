import { z } from 'zod'

export const ExportOptionsSchema = z.object({
    format: z.enum(['png', 'jpeg', 'pdf', 'svg']),
    filename: z.string().optional(),
    width: z.number().optional(),
    height: z.number().optional(),
})

export type ExportOptions = z.infer<typeof ExportOptionsSchema>
