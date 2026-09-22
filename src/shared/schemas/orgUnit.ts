import { z } from 'zod'

export const OrgUnitRefSchema = z.object({
    id: z.string(),
    displayName: z.string().optional(),
    path: z.string().optional(),
})

export const OrgUnitListResponseSchema = z.object({
    organisationUnits: z.array(OrgUnitRefSchema),
})

export type OrgUnitRef = z.infer<typeof OrgUnitRefSchema>
