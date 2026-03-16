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

> **Status:** `PRE-ALPHA` | **Current Sprint:** 1 of 7 — Skeleton | **Last Updated:** 2026-03-15

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

> Sprint 1 is not yet complete — the app is not runnable yet. Check back after Sprint 1 closes.

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
| — | — | *No feeds integrated yet (Sprint 1)* |

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
Sprint 1 ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  IN PROGRESS
Sprint 2 ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  NOT STARTED
Sprint 3 ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  NOT STARTED
Sprint 4 ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  NOT STARTED
Sprint 5 ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  NOT STARTED
Sprint 6 ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  NOT STARTED
Sprint 7 ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  NOT STARTED
```

---

### Sprint 1: Skeleton (Week 1-2)
**Goal:** Get the app scaffolded and rendering a globe in the browser with the terminal aesthetic.

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1.1 | Project scaffolding (Vite + React + TS) | `NOT STARTED` | |
| 1.2 | CesiumJS globe rendering with dark basemap | `NOT STARTED` | |
| 1.3 | Basic panel layout system (4-panel grid) | `NOT STARTED` | |
| 1.4 | Status bar with UTC clock | `NOT STARTED` | |
| 1.5 | Dark terminal theme with CRT accent styling | `NOT STARTED` | |

**Sprint 1 Deliverable:** Browser opens → dark terminal UI with interactive 3D globe + placeholder panels

---

### Sprint 2: Globe Interactivity (Week 3-4)
**Goal:** Make the globe clickable and overlay the first real-time data feed.

| # | Task | Status | Notes |
|---|------|--------|-------|
| 2.1 | Country boundary GeoJSON on globe | `NOT STARTED` | |
| 2.2 | Click-to-select country → info panel | `NOT STARTED` | |
| 2.3 | Camera fly-to animation on selection | `NOT STARTED` | |
| 2.4 | Major city markers with labels | `NOT STARTED` | |
| 2.5 | Night/day terminator line | `NOT STARTED` | |
| 2.6 | Flight tracking (OpenSky Network) | `NOT STARTED` | |

**Sprint 2 Deliverable:** Click countries → context panel. Live aircraft visible on globe.

---

### Sprint 3: Financial Core (Week 5-6)
**Goal:** Bloomberg-style financial panels with live data.

| # | Task | Status | Notes |
|---|------|--------|-------|
| 3.1 | Ticker watchlist with live crypto (Binance WS) | `NOT STARTED` | |
| 3.2 | Stock price integration (Alpha Vantage) | `NOT STARTED` | |
| 3.3 | TradingView Lightweight Charts | `NOT STARTED` | |
| 3.4 | Market heatmap (treemap) | `NOT STARTED` | |
| 3.5 | Geo-linking: country → relevant tickers | `NOT STARTED` | |

**Sprint 3 Deliverable:** Live financial data flowing. Click a country, see its tickers.

---

### Sprint 4: News & Media (Week 7-8)
**Goal:** Live news feeds integrated and geo-linked.

| # | Task | Status | Notes |
|---|------|--------|-------|
| 4.1 | YouTube embed panel + channel switcher | `NOT STARTED` | |
| 4.2 | Live news channel presets | `NOT STARTED` | |
| 4.3 | RSS/API news feed panel (NewsAPI / GDELT) | `NOT STARTED` | |
| 4.4 | News filtering by country/topic | `NOT STARTED` | |
| 4.5 | Geo-linked news (country → headlines) | `NOT STARTED` | |

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
| Unit Tests | Vitest | 90% (business logic) | 0% |
| Component Tests | React Testing Library | All panels render | 0% |
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

# Required for Sprint 4
YOUTUBE_API_KEY=                  # Free at https://console.cloud.google.com/
NEWSAPI_KEY=                     # Free at https://newsapi.org/

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
│   │   ├── Globe/          # CesiumJS 3D globe
│   │   ├── Panels/         # Financial, news, signal panels
│   │   ├── Layout/         # Tiling window manager
│   │   ├── Charts/         # TradingView charts
│   │   ├── Terminal/       # Command bar, status bar
│   │   └── Shaders/        # NVG, FLIR, CRT effects
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
