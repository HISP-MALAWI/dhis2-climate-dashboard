import i18n from '@dhis2/d2-i18n'
import { createFileRoute } from '@tanstack/react-router'
import { SectionHeader } from './components/SectionHeader'
import {
    ANC_POSITIVITY_ID,
    CLINICAL_DIAGNOSIS_ID,
    CONFIRMED_COMMUNITY_ID,
    CONFIRMED_FACILITY_ID,
    CONFIRMED_FEMALE_ID,
    CONFIRMED_MALE_ID,
    DEATHS_ID,
    DEATHS_MAP_ID,
    F07_REPORTING_RATE_MAP_ID,
    F19_REPORTING_RATE_MAP_ID,
    IPTP1_ID,
    IPTP3_COVERAGE_MAP_ID,
    IPTP3_ID,
    LLIN_ANC_ID,
    LLIN_EPI_ID,
    LLIN_ROUTINE_ID,
    LLIN_TREND_ID,
    MAP_ID,
    MONTHLY_TREND_ID,
    OUTCOMES_ID,
    REPORTED_CASES_MAP_ID,
    SEVERE_CASES_ID,
    SEVERE_TREATED_ID,
    TIMELINESS_F07_ID,
    TIMELINESS_F19_ID,
    TOTAL_FEVER_ID,
} from './constants'
import { MapItem } from '@/shared/components/visualizations/MapItem'
import { VisualizationItem } from '@/shared/components/visualizations/VisualizationItem'

export const Route = createFileRoute('/current-malaria-situation/')({
    component: CurrentMalariaSituation,
})

function CurrentMalariaSituation() {
    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 xl:flex-row">
                {/* Left column */}
                <div className="flex flex-col gap-4 min-w-0 xl:flex-[3]">
                    <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                        <VisualizationItem
                            id={TOTAL_FEVER_ID}
                            className="h-40"
                        />
                        <VisualizationItem
                            id={CONFIRMED_FACILITY_ID}
                            className="h-40"
                        />
                        <VisualizationItem
                            id={CLINICAL_DIAGNOSIS_ID}
                            className="h-40"
                        />
                        <VisualizationItem
                            id={CONFIRMED_COMMUNITY_ID}
                            className="h-40"
                        />
                    </div>
                    <div className="flex flex-col gap-2 md:flex-row md:h-128">
                        <VisualizationItem
                            id={MONTHLY_TREND_ID}
                            className="h-96 md:h-full md:flex-3"
                        />
                        <div className="grid grid-cols-3 gap-2 md:flex md:flex-col md:flex-1">
                            <VisualizationItem
                                id={SEVERE_CASES_ID}
                                className="h-36 md:flex-1"
                            />
                            <VisualizationItem
                                id={SEVERE_TREATED_ID}
                                className="h-36 md:flex-1"
                            />
                            <VisualizationItem
                                id={DEATHS_ID}
                                className="h-36 md:flex-1"
                            />
                        </div>
                    </div>
                    
                </div>

                {/* Right column */}
                <div className="flex flex-col gap-2 min-w-0 xl:flex-2">
                    <MapItem
                        id={MAP_ID}
                        className="h-120 xl:flex-1 xl:min-h-120"
                    />
                    
                </div>
            </div>

            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <MapItem id={REPORTED_CASES_MAP_ID} className="h-160" />
                <MapItem id={DEATHS_MAP_ID} className="h-160" />
            </div>

            <SectionHeader
                title={i18n.t('Malaria Prevention')}
                description={i18n.t(
                    'This section provides an overview of key malaria prevention interventions in Malawi. It includes insecticide-treated nets (ITNs) distributed through routine services to EPI and ANC clients, as well as IPTp1 and IPTp3 provided to pregnant women during antenatal care (ANC). The section also presents monthly trends in LLIN distribution and a state-level map showing IPTp3 coverage, helping users understand how malaria prevention interventions are being delivered across the country.'
                )}
            />
            <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
                <VisualizationItem id={LLIN_ROUTINE_ID} className="h-40" />
                <VisualizationItem id={LLIN_ANC_ID} className="h-40" />
                <VisualizationItem id={LLIN_EPI_ID} className="h-40" />
                <VisualizationItem id={IPTP1_ID} className="h-40" />
                <VisualizationItem id={IPTP3_ID} className="h-40" />
            </div>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <VisualizationItem id={LLIN_TREND_ID} className="h-150" />
                <MapItem id={IPTP3_COVERAGE_MAP_ID} className="h-150" />
            </div>

            <SectionHeader
                title={i18n.t('Malaria Data Reporting Performance')}
                description={i18n.t(
                    'This section provides an overview of completeness and timeliness for the two key malaria reporting streams: the MOH F07 Malaria Reporting Form for facility data and the MOH F19 BHI Reporting Form for community data. It includes reporting trends and maps to help data managers identify reporting gaps and follow up with data entrants. The target for both completeness and timeliness is 70%. Timely reporting is critical as the malaria prediction model is triggered on the 16th of each month, ensuring sufficient and up-to-date data are available for disease prediction.'
                )}
            />
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <VisualizationItem id={TIMELINESS_F07_ID} className="h-160" />
                <VisualizationItem id={TIMELINESS_F19_ID} className="h-160" />
            </div>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <MapItem id={F07_REPORTING_RATE_MAP_ID} className="h-160" />
                <MapItem id={F19_REPORTING_RATE_MAP_ID} className="h-160" />
            </div>
        </div>
    )
}
