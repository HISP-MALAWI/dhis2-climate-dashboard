import { z } from 'zod'
import { analyticsDimensionSchema } from './visualization'

export enum MapLayerType {
    THEMATIC = 'thematic',
    ORG_UNIT = 'orgUnit',
    EARTH_ENGINE = 'earthEngine',
}

export enum ThematicMapType {
    CHOROPLETH = 'choropleth',
    BUBBLE = 'bubble',
}

const mapItemSchema = z.object({
    id: z.string(),
    dimensionItemType: z.string().optional(),
    name: z.string().optional(),
})

const mapDimensionSchema = z.object({
    dimension: analyticsDimensionSchema,
    items: z.array(mapItemSchema),
})

export const mapSchema = z.object({
    id: z.string(),
    basemap: z.string().optional(),
    name: z.string(),
    zoom: z.number().optional(),
    mapViews: z.array(
        z.object({
            id: z.string(),
            layer: z.string(),
            thematicMapType: z.string().optional(),
            renderingStrategy: z.enum(['SINGLE', 'TIMELINE']).optional(),
            type: z.string().optional(),
            name: z.string().optional(),
            displayName: z.string().optional(),
            colorScale: z.string().optional(),
            classes: z.number().optional(),
            config: z.string().optional(),
            radiusHigh: z.number().optional(),
            radiusLow: z.number().optional(),
            legendSet: z.object({ id: z.string() }).optional(),
            relativePeriods: z.record(z.string(), z.boolean()).optional(),
            userOrganisationUnit: z.boolean().optional(),
            userOrganisationUnitChildren: z.boolean().optional(),
            userOrganisationUnitGrandChildren: z.boolean().optional(),
            organisationUnitLevels: z.array(z.number()).optional().default([]),
            itemOrganisationUnitGroups: z
                .array(z.string())
                .optional()
                .default([]),
            organisationUnits: z
                .array(z.object({ id: z.string(), path: z.string() }))
                .optional()
                .default([]),
            dataDimensionItems: z
                .array(
                    z
                        .object({ dataDimensionItemType: z.string() })
                        .and(
                            z.record(
                                z.enum([
                                    'dataElement',
                                    'indicator',
                                    'programIndicator',
                                ]),
                                z.object({ id: z.string() })
                            )
                        )
                )
                .optional()
                .default([]),
            columns: z.array(mapDimensionSchema).optional().default([]),
            rows: z.array(mapDimensionSchema).optional().default([]),
            filters: z.array(mapDimensionSchema).optional().default([]),
            categoryDimensions: z
                .array(
                    z.object({
                        categoryOptions: z.array(z.object({ id: z.string() })),
                        category: z.object({ id: z.string() }),
                    })
                )
                .optional()
                .default([]),
            organisationUnitGroupSetDimensions: z
                .array(z.object({ id: z.string() }))
                .optional()
                .default([]),
        })
    ),
})

export type MapConfig = z.infer<typeof mapSchema>
