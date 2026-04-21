# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Dev server (localhost:3000)
npm run build    # Production build
npm run lint     # ESLint
npm start        # Production server
```

No test suite is configured.

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in:

```
TUYA_UID=          # Tuya account user ID
TUYA_REGION=       # API region: us | eu | cn | in
TUYA_CLIENT_ID=    # Tuya OAuth client ID
TUYA_SECRET=       # Tuya OAuth secret
ACCESS_PASSWORD=   # Local dashboard login password
```

## Architecture

**Next.js 15 App Router** with TypeScript, Tailwind CSS 4, and Material Design 3 dark theme. The app is a Smart Home dashboard that controls Tuya IoT devices (lights and switches) via the Tuya Cloud API.

### Request flow

```
Browser → Next.js Middleware (cookie auth) → App Router
  → GET  /api/devices  → Tuya API → device list
  → POST /api/control  → Tuya API → send command
  → POST /api/auth/login           → sets httpOnly cookie
```

The middleware at `src/middleware.ts` intercepts all routes except `/login` and `/api/auth/login`, validating the `auth_token` httpOnly cookie.

### Frontend state model

There is **no external state management library** — everything uses React hooks + `localStorage`.

- `src/app/page.tsx` — main dashboard; polls `/api/devices` every 5 seconds via `useInterval`, holds the device list.
- `src/components/DeviceCard.tsx` — per-device local state (power, brightness, colorTemp, workMode, colour). Sends debounced commands (350ms) to `/api/control`. Tracks a "pending command" ref to suppress polling updates during the 3-second grace period after a command.
- `useDeviceSettings()` hook — persists hidden/custom-named device metadata in `localStorage` under key `smartlife_device_settings`.

### Tuya integration

`src/lib/tuya.ts` initializes the `@tuya/tuya-connector-nodejs` client with the regional endpoint. `src/types/tuya.ts` defines all device/status interfaces and helpers:

- **HSV color format**: Tuya uses `h: 0–360`, `s: 0–1000`, `v: 0–1000`. Conversion helpers live in `src/types/tuya.ts`.
- **Brightness**: API range is `10–1000`. The UI applies gamma=2.5 logarithmic scaling for perceptual linearity.
- **Slider snapping**: Sliders snap to 10%, 25%, 50%, 75%, 100% of range.
- **Device categories**: `dj` = lights (power + brightness + color temp + HSV), `kg` = switches (power only).

### Key conventions

- All UI text is in **Portuguese**.
- `@/*` path alias resolves to `src/*`.
- Client components require `'use client'` directive at the top.
- Material Symbols icon font is loaded globally; use `<span className="material-symbols-rounded">icon_name</span>`.
