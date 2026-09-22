export const NATIONAL_OU_LEVEL = 1
export const STATE_OU_LEVEL = 2
export const COUNTY_OU_LEVEL = 3
export const ACTUAL_CASES_INDICATOR_ID = 'cxoN0qG3eAr'
export type ForecastLineDashStyle = 'Solid' | 'ShortDash' | 'Dash' | 'Dot'

export interface ForecastReferenceLine {
    id: string
    label: string
    indicatorId: string
    color: string
    dashStyle: ForecastLineDashStyle
    tableEmphasis: 'alert' | 'neutral'
}

export const EPIDEMIC_THRESHOLD_LINE: ForecastReferenceLine = {
    id: 'threshold',
    label: 'Threshold',
    indicatorId: 'RETaCdWkvKb',
    color: '#dc2626',
    dashStyle: 'Solid',
    tableEmphasis: 'alert',
}

export const FIRST_QUARTILE_LINE: ForecastReferenceLine = {
    id: '1st-quartile',
    label: '1st Quartile',
    indicatorId: 'v81bfitDlJb',
    color: '#ca8a04',
    dashStyle: 'ShortDash',
    tableEmphasis: 'neutral',
}

export const THIRD_QUARTILE_LINE: ForecastReferenceLine = {
    id: '3rd-quartile',
    label: '3rd Quartile',
    indicatorId: 'yAnvXW6kVNk',
    color: '#7c3aed',
    dashStyle: 'ShortDash',
    tableEmphasis: 'neutral',
}

/** Every reference line the page fetches, in legend order. */
export const FORECAST_REFERENCE_LINES: ForecastReferenceLine[] = [
    EPIDEMIC_THRESHOLD_LINE,
    FIRST_QUARTILE_LINE,
    THIRD_QUARTILE_LINE,
]

export interface ForecastChartTab {
    id: string
    label: string
    referenceLines: ForecastReferenceLine[]
}

export const FORECAST_CHART_TABS: ForecastChartTab[] = [
    {
        id: 'chart',
        label: 'Prediction Chart',
        referenceLines: [EPIDEMIC_THRESHOLD_LINE],
    },
    {
        id: 'chart-1st-quartile',
        label: 'Quartile Chart',
        referenceLines: [
            EPIDEMIC_THRESHOLD_LINE,
            FIRST_QUARTILE_LINE,
            THIRD_QUARTILE_LINE,
        ],
    },
]

// CHAP prediction dataset (ESysCAEIUDy) quantile data elements
export const QUANTILE_LOW_ID = 'SfcTL7FJ7qU' // Q10 (0.1)
export const QUANTILE_MID_LOW_ID = 'jN9w6xYz2M9' // Q25 (0.25)
export const QUANTILE_MEDIAN_ID = 'fnM4dIyLn9F' // Q50 (0.5)
export const QUANTILE_MID_HIGH_ID = 'CAXpbaybMmL' // Q75 (0.75)
export const QUANTILE_HIGH_ID = 'CPR0u7i0uwQ' // Q90 (0.9)

// Table / chart window
export const HISTORICAL_MONTHS = 12
export const PREDICTION_MONTHS = 3

// KPI data element IDs
export const TOTAL_FEVER_ID = 'D1EMZrhkGP9'
export const CONFIRMED_FACILITY_ID = 'OLtqBQdJWdW'
export const CLINICAL_DIAGNOSIS_ID = 'zgZOa9q52CX'
export const CONFIRMED_COMMUNITY_ID = 'Oxm0IAaulsK'

export const KPI_IDS = [
    TOTAL_FEVER_ID,
    CONFIRMED_FACILITY_ID,
    CLINICAL_DIAGNOSIS_ID,
    CONFIRMED_COMMUNITY_ID,
] as const

export const MAP_IDS = ['lDJtyAP0Ko9', 'eQCC7MMxPSk'] as const //

export const COUNTY_LEVEL_PIVOT = 'oSptbtHLw0M'
