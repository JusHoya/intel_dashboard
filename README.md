```
 _____ _____ _____ _____ _____ _____    ____              _     _                         _
/  ___|_   _|  __ \_   _|   | |_   _|  |    \ ___ ___ ___| |_ _| |___ ___ _____ ___  ___| |_
\ `--.  | | | |  \/ | | | | | | | |    |  |  | .'|_ -|   | . | . | . | .'|_-_  |  _||  _| . |
 `--. \ | | | | __  | | | | | | | |    |  |  |__,|___|_|_|___|___|___|__,|_____|_|  |___|___|
/\__/ /_| |_| |_\ \_| |_| |\  | | |    |____/
\____/ \___/ \____/\___/\_| \_/ \_/
```

# SIGINT Dashboard

**Total Intelligence & Financial Signal Platform**

A browser-based intelligence dashboard fusing real-time geospatial, geopolitical, and financial data into a single terminal-grade interface. Bloomberg Terminal meets classified intelligence workstation.

> **Status:** `PRE-ALPHA` | **Current Sprint:** 7 COMPLETE | **Last Updated:** 2026-03-23

---

## Quick Start

```bash
# Prerequisites: Node.js 20+, npm 10+

# Install dependencies
npm install

# Set up environment variables (see .env.example)
cp .env.example .env

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

> Sprint 1 complete — run `npm run dev` to launch the dashboard.

---

## What Is This?

SIGINT Dashboard is a real-time intelligence terminal that:

1. **Renders the world** — Interactive 3D globe (CesiumJS) with live aircraft, satellite orbits, and geopolitical overlays
2. **Tracks markets** — Live crypto, stock, and futures data with Bloomberg-style dense panels and TradingView charts
3. **Streams news** — Embedded YouTube live news feeds and API-driven headline aggregation, geo-linked to the globe
4. **Generates signals** — Translates geopolitical intelligence into actionable financial signals across crypto, equities, futures, and prediction markets
5. **Looks the part** — CRT scan lines, night vision, FLIR thermal, and military-spec shader pipeline over a dark terminal aesthetic

Inspired by [Bilawal Sidhu's WorldView](https://x.com/bilawalsidhu) — the intelligence aesthetic built on public data.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Browser Client                       │
│                                                          │
│   ┌──────────┐  ┌──────────┐  ┌────────┐  ┌──────────┐ │
│   │  Globe   │  │ Financial│  │  News  │  │  Signal  │ │
│   │  Engine  │  │  Panels  │  │  Feeds │  │  Engine  │ │
│   │(CesiumJS)│  │ (Charts) │  │(YouTube│  │(Analysis)│ │
│   └────┬─────┘  └────┬─────┘  └───┬────┘  └────┬─────┘ │
│        └──────────────┴────────────┴─────────────┘       │
│                  Unified State (Zustand)                  │
└──────────────────────────┬───────────────────────────────┘
                           │
                ┌──────────┴──────────┐
                │   Backend (Node.js) │
                │  API Proxy / WS Hub │
                └──────────┬──────────┘
                           │
         ┌────────┬────────┼────────┬────────┐
       Globe   Finance   News   Flights  Satellites
       Data    APIs      APIs   ADS-B    TLE
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| 3D Globe | CesiumJS |
| Frontend | React 18 + TypeScript |
| Build | Vite |
| State | Zustand |
| Charts | TradingView Lightweight Charts |
| Data Grid | AG Grid (Community) |
| Layout | react-mosaic |
| Styling | Tailwind CSS + CRT/terminal theme |
| Backend | Node.js (Fastify) |
| Real-time | WebSockets + SSE |
| Testing | Vitest + Playwright |

---

## Data Sources

### Currently Integrated

| Source | Data | Status |
|--------|------|--------|
| Binance WebSocket | Real-time crypto prices (8 pairs) | `LIVE` |
| Server Proxy (simulated) | Stock quotes (12 equities) | `LIVE` (mock data, Alpha Vantage ready) |
| OpenSky Network | Live aircraft positions | `LIVE` |
| GDELT DOC 2.0 | News headlines (50 articles, global + geo-filtered) | `LIVE` |
| YouTube Embed | Live news streams (11 channels) | `LIVE` |

### Planned (by Sprint)

| Source | Data | Sprint | Free Tier |
|--------|------|--------|-----------|
| Binance WebSocket | Real-time crypto | 3 | Unlimited |
| CoinGecko | Crypto market data | 3 | 10-30 req/min |
| Alpha Vantage | Stocks, forex | 3 | 500 req/day |
| OpenSky Network | Live aircraft | 2 | 4,000 req/day |
| CelesTrak | Satellite orbits | 5 | Unlimited |
| YouTube Data API | Live news streams | 4 | 10K units/day |
| NewsAPI / GDELT | Headlines, events | 4 | 100 req/day |
| USGS | Earthquakes | 6 | Unlimited |
| ACLED | Conflict events | 6 | Free (research) |
| Polygon.io | Market data | 6 | 5 req/min |
| ADS-B Exchange | Military flights | 7 | ~$10/mo |
| Polymarket | Prediction markets | 7 | Free |

---

## Sprint Progress

### Overall Roadmap

```
Sprint 1 ████████████████████████████████████  COMPLETE
Sprint 2 ████████████████████████████████████  COMPLETE
Sprint 3 ████████████████████████████████████  COMPLETE
Sprint 4 ████████████████████████████████████  COMPLETE
Sprint 5 ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  NOT STARTED
Sprint 6 ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  NOT STARTED
Sprint 7 ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  NOT STARTED
```

---

### Sprint 1: Skeleton (Week 1-2)
**Goal:** Get the app scaffolded and rendering a globe in the browser with the terminal aesthetic.

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1.1 | Project scaffolding (Vite + React + TS) | `DONE` | Vite 8, React 19, TypeScript strict |
| 1.2 | CesiumJS globe rendering with dark basemap | `DONE` | Dark globe with day/night terminator via resium |
| 1.3 | Basic panel layout system (4-panel grid) | `DONE` | react-mosaic 2x2 grid, 65/35 split favoring globe |
| 1.4 | Status bar with UTC clock | `DONE` | UTC clock, session uptime, feed health indicators |
| 1.5 | Dark terminal theme with CRT accent styling | `DONE` | Phosphor green theme, CRT scanlines, JetBrains Mono |

**Sprint 1 Deliverable:** Browser opens → dark terminal UI with interactive 3D globe + placeholder panels

---

### Sprint 2: Globe Interactivity (Week 3-4)
**Goal:** Make the globe clickable and overlay the first real-time data feed.

| # | Task | Status | Notes |
|---|------|--------|-------|
| 2.1 | Country boundary GeoJSON on globe | `DONE` | 15 countries with green terminal-style boundaries |
| 2.2 | Click-to-select country → info panel | `DONE` | Entity Intel panel with type badge, coords, metadata |
| 2.3 | Camera fly-to animation on selection | `DONE` | 1.5s fly-to animation on click |
| 2.4 | Major city markers with labels | `DONE` | 15 financial centers with green dots + labels |
| 2.5 | Night/day terminator line | `DONE` | Globe lighting enabled in Sprint 1 |
| 2.6 | Flight tracking (OpenSky Network) | `DONE` | Express proxy + amber flight dots + mock fallback |

**Sprint 2 Deliverable:** Click countries → context panel. Live aircraft visible on globe.

---

### Sprint 3: Financial Core (Week 5-6)
**Goal:** Bloomberg-style financial panels with live data.

| # | Task | Status | Notes |
|---|------|--------|-------|
| 3.1 | Ticker watchlist with live crypto (Binance WS) | `DONE` | 8 crypto pairs via combined miniTicker stream, auto-reconnect |
| 3.2 | Stock price integration (Alpha Vantage) | `DONE` | 12 equities via server proxy, simulated random walk, AV-ready |
| 3.3 | TradingView Lightweight Charts | `DONE` | Candlestick chart with real-time kline WS updates, terminal theme |
| 3.4 | Market heatmap (treemap) | `DONE` | Grid heatmap, red/green intensity by 24h change % |
| 3.5 | Geo-linking: country → relevant tickers | `DONE` | Country click highlights associated tickers in watchlist |
| 3.6 | White civilian aircraft icons | `DONE` | White (#ffffff) for civilian, red stays for military |
| 3.7 | Flight trajectory arcs on hover/select | `DONE` | Geodesic cyan arc from departure→arrival via OpenSky Routes API |
| 3.8 | Airport data lookup (ICAO → coordinates) | `DONE` | Static ~600 major airports in `src/data/airports.ts` |
| 3.9 | Google Photorealistic 3D Tiles toggle | `DONE` | Terminal ↔ Photorealistic mode switch, API key via backend |
| 3.10 | Globe toolbar (view mode toggle) | `DONE` | Floating top-right button, green/amber terminal-styled |
| 3.11 | Scene property switching per mode | `DONE` | Globe show/hide, atmosphere, lighting per mode |

**Sprint 3 Deliverable:** Live financial data flowing. Click a country, see its tickers. White aircraft, trajectory arcs on hover, toggleable Google 3D Tiles.

---

### Sprint 4: News & Media (Week 7-8)
**Goal:** Live news feeds integrated and geo-linked.

| # | Task | Status | Notes |
|---|------|--------|-------|
| 4.1 | YouTube embed panel + channel switcher | `DONE` | 11 live channels, autoplay muted, channel selector bar |
| 4.2 | Live news channel presets | `DONE` | Bloomberg, CNBC, Yahoo Finance, Al Jazeera, France 24, DW, Sky News, ABC AU, NDTV, NHK, Arirang |
| 4.3 | RSS/API news feed panel (GDELT) | `DONE` | GDELT DOC 2.0 API, 50 articles, English-language filter, 5-min cache, Node https proxy |
| 4.4 | News filtering by country/topic | `DONE` | Filter badge with clear button, re-queries GDELT with country/topic params |
| 4.5 | Geo-linked news (country → headlines) | `DONE` | Globe country click → news filter badge + GDELT re-fetch for that country |

**Sprint 4 Deliverable:** YouTube live streams embedded. Headlines update by selected region.

---

### Sprint 5: Polish & Performance (Week 9-10)
**Goal:** Power-user features and test coverage.

| # | Task | Status | Notes |
|---|------|--------|-------|
| 5.1 | Command bar (Ctrl+K) | `NOT STARTED` | |
| 5.2 | Layout presets (save/load) | `NOT STARTED` | |
| 5.3 | Satellite tracking (CelesTrak TLE) | `NOT STARTED` | |
| 5.4 | Performance optimization | `NOT STARTED` | |
| 5.5 | Full test suite (unit + component + E2E) | `NOT STARTED` | |
| 5.6 | Visual regression baselines | `NOT STARTED` | |

**Sprint 5 Deliverable:** Production-quality MVP. All panels optimized. Full test coverage.

---

### Sprint 6: Signal Engine v1 (Week 11-14)
**Goal:** Build and validate the intelligence-to-financial-signal pipeline.

| # | Task | Status | Notes |
|---|------|--------|-------|
| 6.1 | Signal schema implementation | `NOT STARTED` | |
| 6.2 | Historical event pipeline (GDELT) | `NOT STARTED` | |
| 6.3 | Historical market data pipeline | `NOT STARTED` | |
| 6.4 | Backtesting framework | `NOT STARTED` | |
| 6.5 | Signal → asset mapping rules | `NOT STARTED` | |
| 6.6 | Backtest evaluation dashboard | `NOT STARTED` | |
| 6.7 | Paper trading system | `NOT STARTED` | |

**Sprint 6 Deliverable:** Backtested signal engine with measurable accuracy. Paper trading live.

**Target Metrics:**

| Metric | Target | Actual |
|--------|--------|--------|
| Signal Accuracy | >60% | — |
| Sharpe Ratio | >1.5 | — |
| Win Rate | >55% | — |
| Max Drawdown | <15% | — |
| False Positive Rate | <20% | — |
| Profit Factor | >1.5 | — |

---

### Sprint 7: Intelligence Shaders & Advanced (Week 15-18)
**Goal:** Full intelligence aesthetic and advanced data sources.

| # | Task | Status | Notes |
|---|------|--------|-------|
| 7.1 | NVG shader (post-processing) | `NOT STARTED` | |
| 7.2 | FLIR thermal shader | `NOT STARTED` | |
| 7.3 | CRT full emulation shader | `NOT STARTED` | |
| 7.4 | CCTV feed integration | `NOT STARTED` | |
| 7.5 | Vessel tracking (AIS) | `NOT STARTED` | |
| 7.6 | Conflict zone overlays | `NOT STARTED` | |
| 7.7 | Prediction market integration | `NOT STARTED` | |

**Sprint 7 Deliverable:** Full intelligence terminal experience with shader pipeline and advanced feeds.

---

## Test Coverage

| Layer | Framework | Target | Current |
|-------|-----------|--------|---------|
| Unit Tests | Vitest | 90% (business logic) | 85 tests passing |
| Component Tests | React Testing Library | All panels render | StatusBar, PlaceholderPanel, ScanlineOverlay, InfoPanel, FinancialPanel, Sparkline, MarketHeatmap |
| Integration Tests | Playwright | Core user flows | 0% |
| Data Feed Validation | Zod | All API responses | 0% |
| Visual Regression | Playwright screenshots | All shader modes | 0% |
| Performance | Lighthouse CI | 90+ score | — |
| Signal Backtesting | Custom framework | See Sprint 6 metrics | — |

---

## Quality Gates

| Gate | Threshold | Status |
|------|-----------|--------|
| Build passes | All PRs | `N/A` |
| Unit coverage > 85% | All PRs | `N/A` |
| Lighthouse perf > 85 | All deploys | `N/A` |
| Data feed uptime | > 95% rolling | `N/A` |
| Signal accuracy (30-day rolling) | > 55% | `N/A` |
| Paper trade Sharpe (30-day rolling) | > 1.0 | `N/A` |

---

## Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| Initial Load | < 3s (cached) | — |
| Frame Rate | 60fps @ 1K entities | — |
| Memory (1hr) | < 500MB | — |
| WS Message Latency | < 50ms | — |

---

## Environment Setup

### Required API Keys

Create a `.env` file from `.env.example`:

```env
# Required for Sprint 1
VITE_CESIUM_ION_TOKEN=           # Free at https://cesium.com/ion/

# Required for Sprint 2
OPENSKY_USERNAME=                 # Free at https://opensky-network.org/
OPENSKY_PASSWORD=

# Required for Sprint 3
ALPHA_VANTAGE_API_KEY=           # Free at https://www.alphavantage.co/
COINGECKO_API_KEY=               # Free at https://www.coingecko.com/

# Sprint 4 (no keys required — GDELT is free, YouTube uses direct embeds)
# YOUTUBE_API_KEY=               # Optional, for search API. Embeds work without key
# NEWSAPI_KEY=                   # Optional, GDELT used instead (free, no key)

# Optional (Phase 2+)
POLYGON_API_KEY=
ADSB_EXCHANGE_API_KEY=
```

### Browser Requirements
- Chrome 120+, Firefox 120+, or Edge 120+
- WebGL 2.0 support
- Recommended: dedicated GPU for shader pipeline

---

## Project Structure

```
intel_dashboard/
├── src/
│   ├── components/
│   │   ├── Globe/          # CesiumJS 3D globe + layers
│   │   ├── Financial/      # Watchlist, chart, heatmap
│   │   ├── News/           # News feed, YouTube embed
│   │   ├── Panels/         # Info panel, placeholders
│   │   ├── Layout/         # Tiling window manager
│   │   ├── Terminal/       # Status bar, scanlines
│   │   └── Shaders/        # NVG, FLIR, CRT effects (planned)
│   ├── feeds/              # Real-time data integrations
│   ├── signals/            # Intelligence → financial engine
│   ├── store/              # Zustand state management
│   ├── styles/             # CRT/terminal theme
│   ├── types/              # TypeScript definitions
│   └── utils/              # Shared utilities
├── server/                 # API proxy + WebSocket relay
├── tests/                  # Unit, component, E2E, backtest
├── backtest/               # Historical data + results
├── PRD.md                  # Full product requirements
├── CLAUDE.md               # AI development context
└── README.md               # This file
```

---

## Changelog

### 2026-03-22 — Sprint 4 Complete: News & Media
- **INTEL FEED panel** replaces placeholder: FEED and VIDEO view modes
- **GDELT DOC 2.0 integration** — 50 English-language articles fetched via Node.js `https` proxy (free, no API key), 5-minute server-side cache, rate-limit resilient
- **YouTube live embed** — 11 curated 24/7 news channels (Bloomberg TV, CNBC, Yahoo Finance, Al Jazeera, France 24, DW News, Sky News, ABC AU, NDTV, NHK World, Arirang TV) with channel switcher bar
- **Tone/sentiment indicators** — NEG/NEU/POS badges per article based on GDELT tone score, color-coded red/neutral/green
- **Geo-linked news filtering** — clicking a country on the globe shows filter badge and re-queries GDELT for that country's headlines; clear button to reset
- **News Zustand store** — items, filter (country/topic), view mode, selected channel, loading state
- **Feed health indicator** — NEWS status dot in status bar (green online, red offline)
- Server endpoint: `/api/news` (GDELT DOC 2.0 proxy with caching, English-language filter, country/topic query params)
- New files: `src/components/News/` (NewsPanel, NewsFeed, VideoPlayer), `src/store/news.ts`, `src/feeds/news.ts`, `src/types/news.ts`, `src/data/channels.ts`

### 2026-03-17 — Sprint 3 Update: Visual Upgrades
- **White civilian aircraft** — civilian flights now render as white icons/labels for better contrast against the green terminal UI; military stays red
- **Flight trajectory arcs** — hover or click a flight to see a geodesic cyan arc from departure to destination airport, resolved via OpenSky Routes API with server-side caching
- **Airport lookup** — static ICAO→coordinate map of ~250 major world airports for endpoint resolution
- **Google Photorealistic 3D Tiles** — toggleable via toolbar button; globe surface hides, country borders hide (z-fighting prevention), atmosphere enables; API key served from backend env
- **Globe toolbar** — floating top-right button toggles between TERMINAL and 3D PHOTO modes with green/amber terminal styling
- **Scene switching** — globe.show, lighting, atmosphere, sky objects all toggle per view mode
- **Mouse hover tracking** — throttled (100ms) MOUSE_MOVE handler identifies hovered flights for trajectory display
- Server endpoints: `/api/flight-route` (OpenSky Routes proxy, 5-min cache), `/api/google-tiles/key` (env key endpoint)

### 2026-03-16 — Sprint 3 Complete
- **Financial Panel** replaces placeholder: watchlist, chart, and heatmap view modes
- **Live crypto prices** via Binance WebSocket (8 pairs: BTC, ETH, SOL, XRP, BNB, ADA, DOGE, AVAX)
- **Stock quotes** via server proxy (12 equities: AAPL, MSFT, GOOGL, AMZN, NVDA, TSLA, TSM, BABA, TM, SHEL, SAP, VALE) with simulated random walk (Alpha Vantage ready)
- **TradingView candlestick chart** (lightweight-charts v5) with terminal theme, real-time kline WebSocket updates
- **Market heatmap** — grid-based treemap with red/green intensity by 24h change %
- **Geo-linking** — clicking a country on the globe highlights associated tickers in the watchlist
- **Sparkline SVG component** — inline price trend for each ticker row
- **Price flash animations** — green/red flash on price tick
- **Market Zustand store** — tickers, watchlist, candles, view mode, geo-linked symbols
- Server `/api/stocks` endpoint with cache and mock fallback
- 41 new tests (85 total across 12 test files)

### 2026-03-15 — Sprint 2 Complete
- Country boundaries (15 countries) with green terminal-style GeoJSON overlay
- Click-to-select any entity → Entity Intel panel with type badge, coords, metadata
- Camera fly-to animation (1.5s) on entity selection
- 15 major financial center markers (NYC, London, Tokyo, etc.) with green dot + label
- Night/day terminator via globe lighting
- Flight tracking: Express proxy for OpenSky Network API with 25-flight mock fallback
- Entity Intel panel replaces signals placeholder, shows dossier-style readout
- 15 new tests (35 total across 7 test files)

### 2026-03-15 — Sprint 1 Complete
- Vite 8 + React 19 + TypeScript (strict) scaffolding
- CesiumJS globe rendering via resium with dark basemap and day/night terminator
- react-mosaic 4-panel tiling layout (Globe, Financial, Intel Feed, Signals)
- Terminal status bar with UTC clock, session uptime, feed health indicators
- CRT terminal theme: phosphor green (#00ff41), scanline overlay, JetBrains Mono
- Zustand stores for layout, globe, and app state
- 20 unit/component tests passing (Vitest + React Testing Library)

### 2026-03-15 — Project Inception
- Created PRD with full architecture, feature spec, and test methodology
- Established 7-sprint roadmap (18 weeks)
- Defined signal engine schema and backtesting framework
- Set up project repository and documentation

---

## License

Private — not yet licensed for distribution.

---

## Disclaimer

This software is for **informational and research purposes only**. It does not constitute financial advice, investment recommendations, or solicitation to buy or sell any financial instruments. Signal outputs are experimental and have not been validated for live trading. Use at your own risk.
