# MCS Rainwater Harvesting Dashboard

Interactive decision-support dashboard for synthetic rainfall generation, roof-harvest estimation, and rainwater storage sizing for school facilities.

## Stack

- React 19
- TypeScript
- Vite
- Recharts

## Features

- Calibrate monthly rainfall parameters from uploaded historical daily CSV data
- Generate synthetic multi-year rainfall sequences with the semi-Markov rainfall engine
- Configure school buildings, catchment assumptions, and water-demand inputs
- Run water-balance analysis across tank-size ranges and branded storage options
- Import and export simulation reports as JSON

## Project Structure

- [App.tsx](/c:/Users/Teacher/OneDrive%20-%20Leon%20National%20High%20School/WEB%20APP%20DEVELOPMENT/rainwater-harvesting/App.tsx): main dashboard composition
- `components/`: UI modules and visualizations
- `hooks/`: non-visual app state orchestration
- `services/`: rainfall generation, inflow, water-balance, and analysis engines
- `utils/`: shared parsing, validation, and reporting helpers
- `tests/`: engine and analysis regression tests

## Run Locally

1. Install dependencies with `npm install`
2. Start the app with `npm run dev`

## Quality Checks

- Type check: `npm run typecheck`
- Run tests: `npm run test`
- Production build: `npm run build`

## Data Expectations

Historical calibration uploads should include at least:

- `Date`
- `Rain` or `Rain_mm`

Imported/exported reports use the project JSON schema defined in [types.ts](/c:/Users/Teacher/OneDrive%20-%20Leon%20National%20High%20School/WEB%20APP%20DEVELOPMENT/rainwater-harvesting/types.ts).
