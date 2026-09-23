import { EWARS_INDICATOR_IDS } from './constants'

export const EWARS_DATA_ELEMENTS = {
    predictedRate: EWARS_INDICATOR_IDS.predictedRate,
    predictedRateLower: EWARS_INDICATOR_IDS.predictedRate_lower,
    predictedRateUpper: EWARS_INDICATOR_IDS.predictedRate_upper,
    predictedCases: EWARS_INDICATOR_IDS.predictedCases,
    predictedCasesLower: EWARS_INDICATOR_IDS.predictedCases_lower,
    predictedCasesUpper: EWARS_INDICATOR_IDS.predictedCases_upper,
    endemicChannel: EWARS_INDICATOR_IDS.endemicChannel,
    outbreakProbability: EWARS_INDICATOR_IDS.outbreak_probability,
    alarmSignal: EWARS_INDICATOR_IDS.alarmSignal,
    alarmThreshold: EWARS_INDICATOR_IDS.alarmThreshold,
    outbreakPeriod: EWARS_INDICATOR_IDS.outbreakPeriod,
} as const

export const NUMERIC_EWARS_DATA_ELEMENTS = Object.values(EWARS_DATA_ELEMENTS)

export const PLUGIN_DEFAULTS = {
    discoveryWeeksBack: 52,
    discoveryWeeksForward: 12,
    displayedWeeks: 26,
} as const