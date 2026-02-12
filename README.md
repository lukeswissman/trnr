# TRNR

A browser-based bike trainer app. Build structured workouts, connect to your smart trainer over Bluetooth, ride in ERG mode, and export your data as FIT files.

> Side project experiment with Web Bluetooth, React 19, and some bespoke training aspects.

**[Live App](https://lukeswissman.github.io/trnr/)**

## Features

### Workout Builder
- Create structured workouts with three segment types: **blocks** (steady power), **ramps** (linear power progression), and **repeats** (nested loops)
- Drag-and-drop reordering of segments
- Real-time SVG chart visualization of the workout power profile
- Training zone distribution breakdown (Z1-Z7 based on FTP)
- Duration input supports seconds or `mm:ss` format

### Workout Player
- **ERG mode** &mdash; automatically controls trainer resistance to match target power
- **Display mode** &mdash; shows targets without controlling the trainer
- Live target vs. actual power comparison
- Progress bar with elapsed and remaining time
- Pause, resume, and stop controls
- Post-workout summary with average/max power, heart rate, cadence, and duration

### Bluetooth Connectivity
- FTMS (Fitness Machine Service) protocol for smart trainers
- Heart Rate Service for HR monitors
- Real-time data: power, speed, cadence, distance, heart rate
- Multiple simultaneous device connections
- Hardware test page for troubleshooting

### Export & Integration
- **FIT file export** (Garmin-compatible binary format) for workout recordings
- One-click Strava upload workflow (exports FIT + opens Strava upload page)
- 1-second sample resolution with power, HR, cadence, speed, and distance

### Rider Settings
- Rider and bike weight for physics-based speed calculation
- FTP for training zone computation
- Max HR tracking
- All settings persisted in localStorage

## Browser Support

TRNR requires the [Web Bluetooth API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API), which is supported in:

- Chrome (desktop & Android)
- Edge
- Samsung Internet

Safari and Firefox do not currently support Web Bluetooth.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- npm

### Install & Run

```bash
git clone git@github.com:lukeswissman/trnr.git
cd trnr
npm install
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173/trnr/`).

### Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with HMR |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run test` | Run tests in watch mode |
| `npm run test:run` | Run tests once |
| `npx tsc --noEmit` | Type check |

## Tech Stack

- **React 19** + **TypeScript 5.9** (strict mode)
- **Vite 7** for bundling and dev server
- **Tailwind CSS 4** for styling
- **@dnd-kit** for drag-and-drop
- **Vitest** for testing
- **Web Bluetooth API** for trainer and HR sensor connectivity

## Project Structure

```
src/
├── components/
│   ├── workout/          # Builder, player, chart, segments, summary
│   └── common/           # Logo, settings, device list, connect buttons
├── contexts/             # WorkoutContext, BluetoothContext, SettingsContext
├── hooks/                # useWorkout, useBluetooth, useSettings, useRecorder
├── services/
│   ├── bluetooth/        # FTMS parsing, HR parsing, ERG trainer control
│   └── export/           # FIT binary encoder, Strava export
├── types/                # Workout, recording, bluetooth, Web Bluetooth API types
└── utils/                # Zones, stats, speed physics, workout storage
```

## Deployment

Deployed to GitHub Pages via CI/CD. The `main` branch is automatically built and deployed on push. The `develop` branch runs checks (lint, type check, tests) without deploying.
