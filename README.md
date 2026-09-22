# DHIS2 Climate Dashboard

A DHIS2 web application (deployed as **FLLOW-M Dashboard**) that visualizes the relationship between climate variables and malaria indicators, and surfaces CHAP model forecasts, evaluations, and epidemic thresholds. Built on the [DHIS2 Application Platform](https://github.com/dhis2/app-platform).

## Overview

| Page                             | Route                           | Description                                                                                                                    |
| -------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Current Malaria Situation**    | `/current-malaria-situation`    | Key malaria indicators — confirmed cases, deaths, outcomes, fever totals, LLIN/IPTp coverage, reporting rates — as single-value cards, charts, and maps |
| **Climate & Malaria Relationship** | `/climate-malaria-relationship` | Climatic suitability map plus correlation charts showing how temperature, precipitation, and humidity relate to confirmed malaria cases |
| **CHAP Evaluation** 🔒           | `/chap-evaluation`              | Per-org-unit comparison of a CHAP backtest's predictions against actual cases, sliced by split period                          |
| **Compare Evaluations** 🔒       | `/chap-compare`                 | Side-by-side comparison of several CHAP backtests over the same org units                                                       |
| **CHAP Forecast & Alerts**       | `/chap-forecast-alerts`         | Three-period malaria forecast: KPI cards, maps, prediction chart with threshold/quartile reference lines, and a forecast table  |
| **Threshold Analysis** 🔒        | `/chap-threshold`               | Actual cases against selectable epidemic-threshold methods (mean+2SD, median, quartiles, C-SUM)                                 |

🔒 = restricted to members of the **FLLOW-M Dashboard System Admin** user group (see [Access control](#access-control)).

The first two pages share a compact filter bar that scopes all visualizations by **org unit** and **period**; the selection lives in the URL (`?ou=…&pe=…`) so views are shareable. The CHAP pages hide that bar and use their own org-unit sidebars instead.

## Prerequisites

- Node.js ≥ 18
- [pnpm](https://pnpm.io/) (version pinned in `package.json` via `packageManager`)
- Access to a DHIS2 instance (v2.38+) with the target analytics data
- For the CHAP pages: a DHIS2 **route** exposing the CHAP API at `routes/chap/run/v1` (see [CHAP integration](#chap-integration))

## Getting Started

### 1. Clone and install

```bash
git clone <repo-url>
cd dhis2-climate-dashboard
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set your DHIS2 instance URL:

```env
DHIS2_PROXY_URL=https://play.dhis2.org/dev
```

### 3. Start the dev server

```bash
pnpm dev        # with DHIS2 proxy (requires .env)
pnpm start      # without proxy
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

```bash
pnpm dev          # Start dev server with DHIS2 proxy (requires .env)
pnpm start        # Start dev server without proxy
pnpm build        # Production build — outputs to build/
pnpm test         # Run tests (Jest, via d2-app-scripts)
pnpm lint         # ESLint + Prettier check
pnpm lint:check   # ESLint only
pnpm check-types  # TypeScript type check (tsc --noEmit)
pnpm format       # Auto-format with Prettier
pnpm deploy       # Deploy to a DHIS2 instance
```

To run a single test file:

```bash
pnpm test -- src/App.test.tsx
```

Jest is configured in `jest.config.js`, which extends the `@dhis2/cli-app-scripts` defaults and adds the `@/*` → `src/*` module mapping.

To deploy, run `pnpm build` first, then `pnpm deploy`. The command will prompt for the target server URL and DHIS2 credentials.

## Tech Stack

| Layer                | Library                                                     |
| -------------------- | ----------------------------------------------------------- |
| Framework            | React 18 + TypeScript (strict)                              |
| DHIS2 platform       | `@dhis2/app-runtime`, `@dhis2/ui`, `@dhis2/cli-app-scripts` |
| Analytics / maps     | `@hisptz/dhis2-analytics`, `@hisptz/dhis2-ui`               |
| Charts (custom)      | Highcharts + `highcharts-react-official`                    |
| Routing              | TanStack Router (file-based, generated from `src/modules/`) |
| Data fetching        | TanStack Query                                              |
| Schema validation    | Zod                                                         |
| Styling              | Tailwind CSS v4                                             |
| Internationalisation | `@dhis2/d2-i18n`                                            |

## CHAP integration

The four CHAP pages call the CHAP modelling service through a DHIS2 route, so all requests stay same-origin and reuse the user's DHIS2 session (`credentials: 'include'`). The route prefix is defined per module as `CHAP_ROUTE_PREFIX = 'routes/chap/run/v1'`, and endpoints used are:

| Endpoint                                        | Used by                                    |
| ----------------------------------------------- | ------------------------------------------ |
| `crud/backtests`                                | Backtest pickers on Evaluation and Compare |
| `analytics/compatible-backtests/{id}`           | Finding comparable backtests               |
| `analytics/actualCases/{backtestId}`            | Actual case series and available org units |
| `analytics/evaluation-entry`                    | Predicted quantiles per org unit / period  |

Forecast and threshold data come from ordinary DHIS2 analytics indicators; their IDs live in each module's `constants/` file (e.g. actual cases `VqICaehXI2W`, epidemic threshold `HoTLp4sTUIS`).

## Access control

CHAP Evaluation, Compare Evaluations, and Threshold Analysis are gated on membership of the user group whose ID is in [src/shared/constants/accessControl.ts](src/shared/constants/accessControl.ts). Gating happens in two places: `AppTabs` hides the tabs, and each page wraps its content in `RequireUserGroup` so a direct URL is also blocked. Point `FLLOW_M_ADMIN_USER_GROUP_ID` at the equivalent group on your instance when deploying elsewhere.

## Project Structure

```
src/
├── modules/                            # One folder per page/feature; file-based routes
│   ├── __root.tsx                      # Root layout (tabs + filter bar, ou/pe search params)
│   ├── index.tsx                       # Default route redirect
│   ├── current-malaria-situation/      # constants/, components/
│   ├── climate-malaria-relationship/   # constants/
│   ├── chap-evaluation/                # components/, constants/, hooks/, schemas/
│   ├── chap-compare/                   # components/, constants/, hooks/, schemas/
│   ├── chap-forecast-alerts/           # components/, constants/, hooks/, schemas/, utils/
│   └── chap-threshold/                 # components/, constants/, hooks/, schemas/
└── shared/
    ├── components/
    │   ├── visualizations/             # VisualizationItem, ChartVisualizer, MapVisualizer,
    │   │                               # TableVisualizer, SingleValueVisualizer, PredictionChart, …
    │   ├── AppTabs.tsx
    │   ├── FilterBarCompact.tsx         # GlobalOrgUnitFilter + GlobalPeriodFilter
    │   └── RequireUserGroup.tsx
    ├── constants/                      # App-wide constants (access control)
    ├── hooks/                          # useAnalytics, useVisualization, useMapConfig,
    │                                   # useFilters, useCurrentUserGroups, useVisualizationRefs
    ├── schemas/                        # Zod schemas + inferred TypeScript types
    └── utils/                          # Visualization helpers: colors, legends, periods,
                                        # numbers, pivotTable, chart/map/table export
```

Modules import from `@/shared/*` (the `@/*` alias maps to `src/*`); cross-module imports are the exception, not the rule.

## License

BSD-3-Clause
