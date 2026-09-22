export const NATIONAL_OU_LEVEL = 1
export const STATE_OU_LEVEL = 2
export const COUNTY_OU_LEVEL = 3

export const ACTUAL_CASES_INDICATOR_ID = 'VqICaehXI2W'

export interface ThresholdType {
    id: string
    label: string
    indicatorId: string
    color: string
    description: string
}

export const THRESHOLD_TYPES: ThresholdType[] = [
    {
        id: 'mean+2sd',
        label: 'Mean + 2SD Method',
        indicatorId: 'HoTLp4sTUIS',
        color: '#dc2626',
        description: 'CHAP epidemic threshold: mean plus two standard deviations based on historical malaria case data',
    },
    {
        id: 'median',
        label: 'Median Method',
        indicatorId: 'HmSLCouqIRD',
        color: 'gray',
        description: 'Historical median weekly case count — represents the expected baseline level',
    },
    {
        id: '1st-quartile',
        label: '1st Quartile Method',
        indicatorId: 'v81bfitDlJb',
        color: '#db2777',
        description: 'Lower quartile threshold — 25% of historical weekly case counts fall below this value',
    },
    {
        id: '3rd-quartile',
        label: ' 3rd Quartile Method ',
        indicatorId: 'yAnvXW6kVNk',
        color: '#ca8a04',
        description: 'Upper quartile threshold — 75% of historical weekly case counts fall below this value',
    },
    {
        id: 'c-sum',
        label: 'Cumulative Sum (C-SUM)',
        indicatorId: 'yJwzWEQKact',
        color: '#0891b2',
        description: 'CUSUM control chart signal — detects sustained upward shifts in case counts over time',
    },
    {
        id: 'c-sum+1.96sd',
        label: 'C-SUM + 1.96SD Method',
        indicatorId: 'MOrm1hrkMAv',
        color: '#7c3aed',
        description: 'Cumulative sum plus 1.96 standard deviations — 95% confidence upper bound for outbreak detection',
    },
]
