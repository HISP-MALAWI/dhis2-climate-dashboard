/** CHAP route prefix (relative to the DHIS2 /api base) */
export const CHAP_ROUTE_PREFIX = 'routes/chap/run/v1'

/** Quantiles requested for the evaluation-entry endpoint */
export const EVALUATION_QUANTILES = [0.1, 0.25, 0.5, 0.75, 0.9] as const

/** DHIS2 org unit hierarchy level for states */
export const STATE_OU_LEVEL = 2

/** DHIS2 org unit hierarchy level for counties */
export const COUNTY_OU_LEVEL = 3

/** Maximum number of org units that can be charted at once */
export const MAX_SELECTED_ORG_UNITS = 10

/** Maximum number of evaluations that can be compared at once */
export const MAX_SELECTED_BACKTESTS = 2
