import { z } from 'zod'

export const ThresholdRowSchema = z.object({
    period: z.string(),
    label: z.string(),
    actual: z.number().nullable(),
    thresholds: z.record(z.string(), z.number().nullable()),
})

export type ThresholdRow = z.infer<typeof ThresholdRowSchema>
