# SIGINT Dashboard — AI Development Context

## What is this?
A browser-based intelligence + financial dashboard. Bloomberg Terminal meets intelligence agency workstation. Interactive 3D globe with real-time geospatial data, financial feeds, news, and a signal engine that translates geopolitical events into financial positioning.

## Key Docs
- `PRD.md` — Full product requirements, architecture, test methodology, roadmap

## Tech Stack
- Frontend: React 18 + TypeScript + Vite
- Globe: CesiumJS
- Charts: TradingView Lightweight Charts
- State: Zustand
- Layout: react-mosaic
- Styling: Tailwind CSS + custom CRT/terminal theme
- Backend: Node.js (API proxy + WebSocket relay)
- Testing: Vitest (unit) + Playwright (E2E)

## Conventions
- TypeScript strict mode
- Functional components only
- Zustand stores in `src/store/`
- Data feed integrations in `src/feeds/`
- Signal engine logic in `src/signals/`
- All API keys proxied through backend (never exposed to client)

## Conventions
- GLSL shaders in `src/shaders/` as `.glsl.ts` exports

## Current Phase
Sprint 7 complete: Intelligence shaders (NVG night vision, FLIR thermal, CRT full emulation) as Cesium PostProcessStages. Media bias system with 60+ sources rated across political spectrum. Globe enhancements: CartoDB dark tile overlay for roads/state borders, 50 US state capital markers, conflict zone overlays (GDELT-sourced), vessel tracking (AIS ship positions). Prediction market integration (Polymarket). Fox News + NewsNation YouTube channels. Toolbar with shader mode selector and layer toggles.
