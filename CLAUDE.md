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

## Current Phase
Sprint 6 complete: Signal engine translates GDELT news into financial signals across 8 categories (conflict, sanctions, energy, political, disaster, cyber, monetary, supply-chain). Confidence scoring, severity classification, asset impact mapping. Signal panel with list/detail views. Server-side backtesting framework + paper trading tracker.
