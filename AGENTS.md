# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

- `npm run dev` - Start development server with HMR
- `npm run build` - Build for production (outputs to dist/)
- `npm run lint` - Run ESLint on all files
- `npm run preview` - Preview production build locally
- `npx tsc --noEmit` - Type check without emitting files

## Architecture

This is a React 19 + TypeScript + Vite 7 frontend application.

**Entry points:**
- `index.html` - HTML entry point that loads the React app
- `src/main.tsx` - React DOM root, renders the App component
- `src/App.tsx` - Root React component

**Configuration:**
- `tsconfig.json` - TypeScript configuration (strict mode enabled)
- `vite.config.ts` - Vite configuration with React plugin
- `eslint.config.js` - ESLint flat config with TypeScript parser

**Styling:** Tailwind CSS with `index.css` for globals.

## Component Structure

**Workout Builder** (`src/components/workout/`):
- `WorkoutBuilder.tsx` - Main container with name, description, chart, and segment list
- `WorkoutChart.tsx` - SVG visualization of the workout timeline
- `SegmentList.tsx` - Renders segments in reverse order (newest at top)
- `SegmentEditor.tsx` - Recursive editor for block/ramp/repeat segments

**Workout Player** (`src/components/workout/`):
- `WorkoutPlayer.tsx` - Execution view with target power display and controls
- `PlayerControls.tsx` - Play/pause/stop/save buttons
- `TargetDisplay.tsx` - Shows target vs actual power
- `WorkoutProgress.tsx` - Progress bar and time display

## Type Definitions

**Data Model** (`src/types/`):
- `workout.ts` - Segment types (Block, Ramp, Repeat), Workout, FlatStep, ExecutionStatus
- `recording.ts` - RecordSample, WorkoutRecording for FIT export
- `bluetooth.ts` - LiveData interface for sensor readings
- `web-bluetooth.d.ts` - Web Bluetooth API type declarations

## State Management

- `src/contexts/WorkoutContext.tsx` - Workout library and execution state
- `src/contexts/BluetoothContext.tsx` - Device connections and live data
- `src/contexts/SettingsContext.tsx` - User settings (rider/bike weight)
- Hooks in `src/hooks/` expose context values (`useWorkout`, `useBluetooth`, `useSettings`)
- `useRecorder` hook captures sensor data during workout execution

## Services

**Bluetooth** (`src/services/bluetooth/`):
- `ftms.ts` - FTMS protocol constants and Indoor Bike Data parser
- `heartRate.ts` - Heart Rate Service parser
- `trainerControl.ts` - ERG mode control (set target power)
- `index.ts` - Device connection and subscription functions

**Export** (`src/services/export/`):
- `fitEncoder.ts` - FIT binary file encoder
- `index.ts` - Export recording to file download

## Code Conventions

- TypeScript with strict mode - all functions and components have explicit types
- Tailwind CSS for styling
- Duration inputs accept seconds or "mm:ss" format
- Props interfaces defined inline or above component

## Color Scheme

**Custom theme colors** (defined in `src/index.css`):
- `synth-purple`: #3A056F - primary brand purple
- `synth-red`: #C50202 - primary brand red
- `synth-accent`: #00f3ff - cyan accent

**Backgrounds:**
- App background: `bg-[#0a0a0f]` (near-black)
- Surfaces: `slate-800`, `slate-900`, `gray-800`, `gray-700`
- Cards/panels: `slate-800/50` with `border-slate-700`

**Text:**
- Primary: white
- Secondary: `gray-400`
- Brand headings: gradient `from-synth-red to-synth-purple`

**Segment type borders:**
- Block: `border-blue-500`
- Ramp: `border-yellow-500`
- Repeat: `border-purple-500`

**Chart visualization:**
- Power line/fill: blue (`#3b82f6`)
- Current position: emerald (`#10b981`)
- Actual power marker: amber (`#fbbf24`)

**Buttons:**
- Primary CTA: gradient `from-synth-red to-synth-purple`
- Save/export: `emerald-600`
- Strava: `orange-600`
- Secondary: `slate-700`
- Destructive/cancel: `red-500` on hover
