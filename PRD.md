# Product Requirements Document: SIGINT Dashboard
## Total Intelligence & Financial Signal Platform

**Version:** 0.1.0 — Foundation
**Date:** 2026-03-15
**Status:** Draft

---

## 1. Vision

A browser-based intelligence dashboard that fuses real-time geospatial, geopolitical, and financial data into a single terminal-grade interface — combining the analytical density of a Bloomberg Terminal with the visual grammar of a classified intelligence workstation. The dashboard surfaces actionable intelligence across global events and translates geopolitical signals into financial positioning across crypto, equities, futures, and prediction markets.

---

## 2. Core Design Philosophy

### 2.1 Visual Identity: "Bloomberg meets SCIF"
- **Left half of the brain:** Bloomberg Terminal — dense data grids, tickers, watchlists, P&L, order flow, heatmaps
- **Right half of the brain:** Intelligence agency terminal — 3D globe, satellite tracks, flight paths, threat overlays, NVG/FLIR shaders, CRT scan lines
- **Unified aesthetic:** Dark theme, monospace typography, green/amber/white phosphor color palettes, subtle scan line effects on data panels, terminal-style command input

### 2.2 Interaction Model
- Click any entity on the globe (country, city, asset, vessel, flight) → context panel slides in with all relevant data
- Keyboard-driven command bar (Bloomberg-style `/command` input)
- Split-pane layouts — user can tile globe, charts, news, and data feeds in any arrangement
- Everything is linkable: clicking a country highlights related tickers, news, and signals automatically

---

## 3. System Architecture

### 3.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Browser Client                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐ │
│  │  Globe    │ │ Financial│ │  News /  │ │  Signal    │ │
│  │  Engine   │ │  Panels  │ │  Feeds   │ │  Engine    │ │
│  │ (CesiumJS)│ │ (Charts) │ │ (YouTube)│ │ (Analysis) │ │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └─────┬──────┘ │
│       │             │            │              │        │
│  ┌────┴─────────────┴────────────┴──────────────┴──┐    │
│  │              Unified State Layer                 │    │
│  │         (Entity selection, filters, time)        │    │
│  └──────────────────┬──────────────────────────────-┘    │
└─────────────────────┼───────────────────────────────────┘
                      │
          ┌───────────┴───────────┐
          │    Data Aggregation   │
          │       Backend         │
          │  (Node.js / Python)   │
          └───────────┬───────────┘
                      │
    ┌─────────┬───────┴────┬──────────┬─────────────┐
    │         │            │          │             │
  Globe    Financial    News       Flight/      Satellite
  Data     APIs         APIs       ADS-B        TLE
```

### 3.2 Technology Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **3D Globe** | CesiumJS (open-source) | Full 3D globe with terrain, imagery, entity support. No API key cost for base globe. Google 3D Tiles can be overlaid later. |
| **Frontend Framework** | React 18 + TypeScript | Component model, ecosystem, type safety |
| **State Management** | Zustand | Lightweight, minimal boilerplate, works well with real-time data |
| **Financial Charts** | Lightweight Charts (TradingView) | Professional financial charting, free, performant |
| **Data Grid** | AG Grid (Community) | Bloomberg-style dense data tables |
| **Layout System** | react-mosaic or golden-layout | Tiling window manager for terminal-like panel arrangement |
| **Styling** | Tailwind CSS + custom CSS variables | Rapid theming, dark mode, CRT/phosphor effects via CSS |
| **Backend** | Node.js (Express/Fastify) | WebSocket relay, API key proxying, rate limit management |
| **Real-time Transport** | WebSockets + Server-Sent Events | Low-latency data push |
| **Build Tool** | Vite | Fast builds, HMR, TypeScript support |

### 3.3 Why CesiumJS over Google 3D Tiles Direct
- Free and open-source (no per-session billing)
- Native support for satellites (CZML), flight paths, polylines, billboards
- Built-in time animation (for satellite orbit propagation)
- Can still load Google Photorealistic 3D Tiles as a tileset layer
- Entity picking (click-to-inspect) is built into the API

---

## 4. Feature Specification

### Phase 1: Foundation (MVP — "Get It Running")

#### 4.1 Interactive 3D Globe
- **Globe rendering** with CesiumJS, dark imagery basemap (Mapbox Dark or natural earth night)
- **Country boundaries** with hover/click interaction
- **City markers** for major financial centers (NYC, London, Tokyo, HK, Singapore, Frankfurt, etc.)
- **Click-to-select**: clicking a country or city opens a context panel
- **Camera fly-to** animations when selecting entities
- **Night/day terminator line** showing real-time sun position

#### 4.2 Financial Data Overlay
- **Ticker watchlist panel** — user-configurable list of symbols (stocks, crypto, futures)
- **Live price feed** via free APIs:
  - Crypto: CoinGecko / Binance WebSocket
  - Stocks: Yahoo Finance / Alpha Vantage / Polygon.io (free tier)
  - Futures: delayed data via free feeds
- **Mini-charts** (sparklines) next to each ticker
- **Full chart view** — click a ticker to open TradingView-style candlestick chart
- **Market heatmap** — treemap of sectors/assets colored by daily performance
- **Geo-linking**: selecting a country highlights tickers domiciled/exposed there

#### 4.3 News & Media Feed
- **YouTube live news integration**:
  - Embedded YouTube player panel
  - Curated channel list (Bloomberg, CNBC, Al Jazeera, Reuters, Sky News, etc.)
  - Quick-switch between live streams
  - Search YouTube for topic-specific coverage
- **RSS/API news feed panel**:
  - Headlines from NewsAPI, GNews, or GDELT
  - Filterable by country, topic, asset
  - Sentiment indicator per headline (basic NLP)
- **Geo-linked news**: selecting a country filters news to that region

#### 4.4 Terminal Aesthetic & Layout
- **Dark theme** with CRT phosphor green (#00ff41) as primary accent
- **Scan line CSS overlay** (optional toggle)
- **Monospace font** (JetBrains Mono or IBM Plex Mono)
- **Tiling window manager**: drag, resize, and rearrange panels
- **Preset layouts**: "Full Globe", "Trading Floor", "Analyst Desk", "News Room"
- **Status bar** at bottom: UTC clock, session uptime, data feed health indicators
- **Command bar** (Ctrl+K): type commands like `goto:tokyo`, `chart:BTCUSD`, `news:ukraine`

#### 4.5 Real-Time Geospatial Feeds (Initial Set)
- **Live aircraft tracking** (OpenSky Network API) — plot commercial flights on globe
- **Satellite orbits** (CelesTrak TLE) — render ISS and major satellite constellations
- Click on flight/satellite → info panel with callsign, altitude, velocity, origin/destination

---

### Phase 2: Intelligence Layer

#### 4.6 Advanced Geospatial
- ADS-B Exchange integration (military/government flights)
- Vessel tracking (AIS via MarineTraffic or VesselFinder free API)
- Earthquake and natural disaster overlay (USGS API)
- Conflict zone overlays (ACLED data)
- Sanctions and trade restriction mapping

#### 4.7 Visual Shader Pipeline
- **Night Vision (NVG)** — green phosphor image intensification
- **FLIR Thermal** — false-color thermal palette with targeting reticle
- **CRT Mode** — full cathode-ray tube emulation (heavy scan lines, bloom, curvature)
- **Clean Mode** — standard rendering for readability
- Shaders implemented via CesiumJS post-processing or Three.js overlay

#### 4.8 Advanced Financial
- Portfolio tracking panel
- Correlation matrix between geopolitical events and asset prices
- Alert system: "notify me when [country/asset/event] triggers [condition]"
- Options flow / unusual activity feed (if data accessible)

---

### Phase 3: Signal Engine (Intelligence → Financial Translation)

#### 4.9 Signal Framework
The core innovation: a systematic methodology for translating geopolitical intelligence into financial signals.

**Signal Categories:**

| Category | Example Signals | Target Markets |
|----------|----------------|----------------|
| **Conflict Escalation** | Troop movements, airspace closures, UN votes | Defense stocks, oil futures, safe havens (gold, CHF, JPY) |
| **Sanctions & Trade** | New sanctions, trade deal progress, tariff changes | Affected country ETFs, commodity futures, shipping stocks |
| **Energy & Commodities** | Pipeline disruptions, OPEC decisions, refinery incidents | Crude oil, natural gas, energy sector ETFs |
| **Political Instability** | Elections, coups, protests, leadership changes | Country ETFs, currency pairs, sovereign bonds |
| **Natural Disasters** | Earthquakes, hurricanes, floods | Insurance stocks, rebuilding materials, agricultural futures |
| **Technology & Cyber** | Major breaches, regulatory actions, AI policy | Tech sector, cybersecurity ETFs, crypto |
| **Monetary Policy** | Central bank signals, rate decisions, QE/QT | Bonds, forex, rate-sensitive equities |
| **Supply Chain** | Port closures, shipping bottlenecks, factory shutdowns | Shipping stocks, affected manufacturers, commodity prices |

**Signal Schema:**
```typescript
interface IntelSignal {
  id: string;
  timestamp: Date;
  category: SignalCategory;
  source: DataSource[];
  geography: GeoEntity[];          // countries, regions, coordinates
  confidence: number;              // 0-1, based on source quality and corroboration
  severity: 'low' | 'medium' | 'high' | 'critical';
  summary: string;

  // Financial translation
  affected_assets: AssetImpact[];  // ticker, direction, magnitude estimate
  time_horizon: 'immediate' | 'short' | 'medium' | 'long';
  historical_analogs: HistoricalEvent[];  // similar past events and their market impact

  // Tracking
  status: 'active' | 'developing' | 'resolved';
  updates: SignalUpdate[];
}

interface AssetImpact {
  ticker: string;
  asset_class: 'equity' | 'crypto' | 'commodity' | 'forex' | 'bond' | 'prediction';
  expected_direction: 'bullish' | 'bearish' | 'volatile';
  confidence: number;
  reasoning: string;
}
```

---

## 5. Test Methodology

### 5.1 Philosophy
Testing is not an afterthought — it is the mechanism by which we prove the system works and the signals have value. Every layer has its own test regime.

### 5.2 Test Layers

#### Layer 1: Unit Tests (Vitest)
- All utility functions, data transformers, signal processors
- Financial calculations (P&L, returns, position sizing)
- Signal scoring algorithms
- Date/time handling (UTC conversions, market hours)
- Coverage target: **90%+ on business logic**

#### Layer 2: Component Tests (React Testing Library + Vitest)
- Every UI panel renders without crashing
- Ticker display updates when data changes
- Globe entity click dispatches correct state updates
- News feed filters correctly by geography/topic
- Layout system persists user arrangement

#### Layer 3: Integration Tests (Playwright)
- End-to-end flow: load app → globe renders → click country → data panel opens → correct data shown
- YouTube embed loads and switches channels
- Financial chart renders with mock data
- WebSocket reconnection after disconnect
- Command bar executes commands correctly

#### Layer 4: Data Feed Validation
- **Schema validation**: every API response validated against expected schema (Zod)
- **Staleness detection**: alert if any feed hasn't updated in expected interval
- **Rate limit monitoring**: track API quota usage, fail gracefully before limit hit
- **Fallback testing**: verify graceful degradation when a feed goes offline
- Each data source has a health check endpoint tested every 60 seconds

#### Layer 5: Visual Regression Tests (Playwright screenshots)
- Globe renders correctly in each shader mode
- Panel layout matches snapshots for each preset
- Chart rendering matches expected output
- Dark theme consistency across all panels

#### Layer 6: Performance Tests
- Globe maintains **60fps** with 1,000 entities rendered
- Initial load time under **3 seconds** (after asset cache)
- WebSocket message processing latency under **50ms**
- Memory usage stays under **500MB** after 1 hour of operation
- Lighthouse CI score: **90+** performance

### 5.3 Signal Engine Backtesting (Critical)

This is the most important test regime — it validates whether intelligence signals actually predict market movements.

#### Backtesting Framework

```
┌──────────────────────────────────────────────────────┐
│                Backtesting Pipeline                    │
│                                                       │
│  Historical Events    Historical Market Data          │
│  (GDELT, ACLED,  ──→  Signal Engine  ──→  Simulated  │
│   news archives)       (same algo)       Trades       │
│                                                       │
│            ┌─────────────────────────┐                │
│            │   Performance Metrics   │                │
│            │  - Sharpe Ratio         │                │
│            │  - Win Rate             │                │
│            │  - Max Drawdown         │                │
│            │  - Signal Accuracy      │                │
│            │  - Time-to-Impact       │                │
│            │  - False Positive Rate  │                │
│            └─────────────────────────┘                │
└──────────────────────────────────────────────────────┘
```

#### Backtesting Methodology

1. **Historical Event Collection**
   - Source: GDELT Global Knowledge Graph (2015-present)
   - Source: ACLED conflict data
   - Source: News archives (Common Crawl, GDELT)
   - Categorize each event by signal type

2. **Market Data Collection**
   - Minute-level price data for all relevant assets
   - Source: Polygon.io historical, CoinGecko historical, Yahoo Finance
   - Align timestamps to event timestamps

3. **Signal Generation (Retrospective)**
   - Run the signal engine against historical events
   - Record: what signal was generated, confidence level, predicted direction, predicted time horizon

4. **Trade Simulation**
   - For each signal, simulate entering a position at next available price
   - Apply realistic constraints:
     - Slippage model (0.1% for liquid assets, higher for illiquid)
     - Transaction costs
     - Position sizing based on signal confidence
     - Stop-loss and take-profit levels
   - Track P&L per trade and cumulative

5. **Evaluation Metrics**

   | Metric | Target | Description |
   |--------|--------|-------------|
   | **Signal Accuracy** | >60% | % of signals where predicted direction was correct |
   | **Sharpe Ratio** | >1.5 | Risk-adjusted return |
   | **Win Rate** | >55% | % of simulated trades that were profitable |
   | **Max Drawdown** | <15% | Largest peak-to-trough loss |
   | **False Positive Rate** | <20% | % of signals that had no measurable market impact |
   | **Avg Time-to-Impact** | Measured | Average time between signal and peak price movement |
   | **Information Ratio** | >1.0 | Alpha relative to tracking error |
   | **Profit Factor** | >1.5 | Gross profits / gross losses |

6. **Walk-Forward Validation**
   - Train on 2015-2023 data, test on 2024-2025
   - Rolling 6-month training windows
   - No lookahead bias — signals only use information available at time of event
   - Out-of-sample performance must be within 80% of in-sample

7. **Paper Trading Phase**
   - After backtesting passes thresholds, run signals in real-time with paper trades
   - Minimum **90-day paper trading period** before any live deployment
   - Compare paper results to backtest expectations
   - Track signal latency (time from event to signal generation)

8. **Statistical Significance**
   - Minimum 200 trades per signal category before declaring statistical significance
   - Chi-squared test for signal accuracy vs random
   - Bootstrap confidence intervals on all metrics
   - Monte Carlo simulation for drawdown distribution

### 5.4 Continuous Quality Gates

| Gate | Trigger | Action |
|------|---------|--------|
| Build fails | Any PR | Block merge |
| Unit test coverage drops below 85% | Any PR | Block merge |
| Lighthouse performance < 85 | Deploy | Block deploy |
| Data feed offline > 5 min | Runtime | Page on-call, show degraded state |
| Signal accuracy drops below 55% (rolling 30-day) | Daily cron | Pause signal category, alert team |
| Paper trade Sharpe < 1.0 (rolling 30-day) | Daily cron | Flag for review |

---

## 6. Data Sources (Complete Reference)

### Free / Open APIs

| Source | Data | Rate Limit | Auth |
|--------|------|-----------|------|
| **CoinGecko** | Crypto prices, market data | 10-30/min | API key (free) |
| **Binance WebSocket** | Real-time crypto trades | Unlimited | None |
| **Yahoo Finance** (via yfinance) | Stock prices, fundamentals | Unofficial, moderate | None |
| **Alpha Vantage** | Stock/forex/crypto | 5/min, 500/day | API key (free) |
| **OpenSky Network** | Live aircraft positions | 100/day (anon), 4000/day (registered) | Optional account |
| **CelesTrak** | Satellite TLE orbital data | Generous | None |
| **GDELT** | Global event data, news | Generous | None |
| **ACLED** | Conflict event data | Registration required | API key (free for research) |
| **NewsAPI** | Headlines from 80K sources | 100/day (free) | API key |
| **USGS** | Earthquake data | Generous | None |
| **YouTube Data API** | Live stream search, embed | 10,000 units/day | API key |
| **GNews** | News headlines | 100/day (free) | API key |
| **Polygon.io** | Stock/crypto data | 5/min (free) | API key |

### Premium APIs (Phase 2+)

| Source | Data | Cost |
|--------|------|------|
| **ADS-B Exchange** | Military/gov flights | ~$10/mo |
| **MarineTraffic** | Vessel positions | Tiered |
| **Polymarket** | Prediction market odds | Free API |
| **Kalshi** | Regulated prediction markets | Free API |
| **Unusual Whales** | Options flow | ~$40/mo |

---

## 7. Implementation Roadmap

### Sprint 1 (Week 1-2): Skeleton
- [x] Project scaffolding (Vite + React + TypeScript)
- [ ] CesiumJS globe rendering with dark basemap
- [ ] Basic panel layout system (4-panel grid)
- [ ] Status bar with UTC clock
- [ ] Dark terminal theme with CRT accent styling

### Sprint 2 (Week 3-4): Globe Interactivity
- [ ] Country boundary data loaded onto globe (GeoJSON)
- [ ] Click-to-select country → info panel
- [ ] Camera fly-to animation on selection
- [ ] Major city markers with labels
- [ ] Night/day terminator line
- [ ] Flight tracking (OpenSky) — planes on globe

### Sprint 3 (Week 5-6): Financial Core
- [ ] Ticker watchlist panel with live crypto prices (Binance WS)
- [ ] Stock price integration (Alpha Vantage / Yahoo)
- [ ] TradingView Lightweight Charts integration
- [ ] Market heatmap (treemap component)
- [ ] Geo-linking: country selection → relevant tickers highlighted

### Sprint 4 (Week 7-8): News & Media
- [ ] YouTube embed panel with channel switcher
- [ ] Live news channel presets (Bloomberg, CNBC, etc.)
- [ ] RSS/API news feed panel (NewsAPI / GDELT headlines)
- [ ] News filtering by country/topic
- [ ] Geo-linked news (select country → filter headlines)

### Sprint 5 (Week 9-10): Polish & Performance
- [ ] Command bar (Ctrl+K) with command parsing
- [ ] Layout presets (save/load arrangements)
- [ ] Satellite tracking (CelesTrak TLE)
- [ ] Performance optimization (entity clustering, LOD)
- [ ] Full test suite (unit, component, integration)
- [ ] Visual regression baselines

### Sprint 6 (Week 11-14): Signal Engine v1
- [ ] Signal schema implementation
- [ ] Historical event data pipeline (GDELT ingest)
- [ ] Historical market data pipeline
- [ ] Backtesting framework
- [ ] Signal → asset mapping rules (initial rule set)
- [ ] Backtest evaluation dashboard
- [ ] Paper trading system

### Sprint 7 (Week 15-18): Intelligence Shaders & Advanced
- [ ] NVG shader (post-processing)
- [ ] FLIR thermal shader
- [ ] CRT full emulation shader
- [ ] CCTV feed integration (traffic cameras)
- [ ] Vessel tracking (AIS)
- [ ] Conflict zone overlays
- [ ] Prediction market integration (Polymarket, Kalshi)

---

## 8. File Structure (Planned)

```
intel_dashboard/
├── public/
│   ├── assets/           # Static assets (icons, fonts)
│   └── cesium/           # CesiumJS static files
├── src/
│   ├── main.tsx          # Entry point
│   ├── App.tsx           # Root component
│   ├── components/
│   │   ├── Globe/        # CesiumJS globe wrapper
│   │   ├── Panels/       # Financial, News, Signal panels
│   │   ├── Layout/       # Tiling window manager
│   │   ├── Charts/       # TradingView chart components
│   │   ├── Terminal/     # Command bar, status bar
│   │   └── Shaders/      # Post-processing effects
│   ├── feeds/
│   │   ├── flights.ts    # OpenSky integration
│   │   ├── satellites.ts # CelesTrak TLE
│   │   ├── crypto.ts     # Binance WebSocket
│   │   ├── stocks.ts     # Stock price feeds
│   │   ├── news.ts       # NewsAPI / GDELT
│   │   └── youtube.ts    # YouTube live streams
│   ├── signals/
│   │   ├── engine.ts     # Signal generation logic
│   │   ├── categories.ts # Signal category definitions
│   │   ├── scoring.ts    # Confidence scoring
│   │   └── backtest.ts   # Backtesting framework
│   ├── store/
│   │   ├── globe.ts      # Globe state (selection, camera)
│   │   ├── market.ts     # Financial data state
│   │   ├── signals.ts    # Active signals state
│   │   └── layout.ts     # Panel layout state
│   ├── styles/
│   │   ├── theme.css     # CRT/terminal theme variables
│   │   ├── scanlines.css # Scan line overlay
│   │   └── fonts.css     # Monospace font loading
│   ├── types/
│   │   └── index.ts      # TypeScript type definitions
│   └── utils/
│       ├── geo.ts        # Geospatial utilities
│       ├── format.ts     # Number/date formatting
│       └── api.ts        # API client helpers
├── server/
│   ├── index.ts          # Backend entry point
│   ├── routes/           # API proxy routes
│   ├── ws/               # WebSocket relay
│   └── feeds/            # Server-side data aggregation
├── tests/
│   ├── unit/             # Vitest unit tests
│   ├── components/       # Component tests
│   ├── integration/      # Playwright E2E tests
│   ├── visual/           # Screenshot regression tests
│   └── backtest/         # Signal backtesting tests
├── backtest/
│   ├── data/             # Historical event + market data
│   ├── results/          # Backtest output
│   └── configs/          # Backtest parameter configs
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
├── playwright.config.ts
├── tailwind.config.ts
├── PRD.md                # This document
└── CLAUDE.md             # AI development context
```

---

## 9. Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| Browser Support | Chrome 120+, Firefox 120+, Edge 120+ |
| Initial Load | < 3s on broadband (after Cesium asset cache) |
| Frame Rate | 60fps with < 1,000 entities on globe |
| Memory | < 500MB after 1 hour |
| Data Freshness | Crypto: real-time, Stocks: < 15min delay (free tier), Flights: < 10s delay |
| Uptime Target | 99% (limited by upstream API availability) |
| Accessibility | Keyboard navigation for all panels, high contrast mode |

---

## 10. Risk Register

| Risk | Impact | Mitigation |
|------|--------|-----------|
| API rate limits exceeded | Data feeds go stale | Implement caching layer, use WebSocket where available, queue requests |
| CesiumJS performance on low-end hardware | Poor UX | Progressive quality settings, 2D fallback mode, entity culling |
| Signal engine produces false positives | Bad trades | Extensive backtesting, paper trading phase, conservative position sizing, human-in-the-loop approval |
| Google 3D Tiles API cost | Budget overrun | Use CesiumJS world terrain (free) as default, 3D tiles as opt-in premium layer |
| YouTube API quota exhaustion | No live news | Cache stream URLs, use direct embed URLs, fallback to RSS-only news |
| Overfitting in backtests | Inflated signal accuracy | Walk-forward validation, out-of-sample testing, bootstrap confidence intervals |
| WebSocket connection drops | Missing real-time data | Automatic reconnection with exponential backoff, last-known-value display |

---

## 11. Success Criteria

### MVP (Phase 1) — "Is it useful?"
- [ ] Dashboard loads in browser with interactive 3D globe
- [ ] Can click any country and see relevant financial + news data
- [ ] Live crypto and stock prices updating in real-time
- [ ] YouTube live news embeds work with channel switching
- [ ] At least 3 preset layouts work correctly
- [ ] All Phase 1 tests pass

### Phase 2 — "Is it insightful?"
- [ ] Flight and satellite tracking visible on globe
- [ ] Shader modes (NVG, FLIR, CRT) functional
- [ ] News automatically correlates with geographic selection
- [ ] Conflict and event data overlays on globe

### Phase 3 — "Does it make money?"
- [ ] Signal engine backtest Sharpe ratio > 1.5
- [ ] Signal accuracy > 60% across all categories
- [ ] Paper trading results within 80% of backtest expectations
- [ ] At least 3 signal categories pass statistical significance

---

## 12. Open Questions

1. **LLM Integration**: Should we use an LLM (Claude API) to generate real-time signal analysis from news events? If so, cost implications per query.
2. **Multi-user**: Is this single-user initially or do we need auth/accounts from the start?
3. **Mobile**: Any mobile responsiveness requirements or desktop-only for v1?
4. **Data storage**: Do we need persistent storage (PostgreSQL) from the start for signal history, or is in-memory sufficient for MVP?
5. **Regulatory**: Any compliance concerns with displaying financial data + generating trade signals? (Disclaimer: "for informational purposes only")

---

*This is a living document. It will be updated as development progresses and decisions are made.*
