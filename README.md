# ClawPilot

OpenClaw Intelligent Fallback Optimizer & Dashboard

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Electron](https://img.shields.io/badge/Electron-34.0+-47848F?style=flat-square&logo=electron)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-19.0+-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

## Overview

ClawPilot is a real-time desktop monitoring and optimization platform for OpenClaw's intelligent model fallback system. It transforms static fallback chains into **dynamic, health-based routing** with predictive failover, cost analytics, and intelligent task-based model selection.

Watch your AI models in real-time. Optimize costs. Prevent outages before they happen.

```
┌──────────────────────────────────────────────────────────┐
│  ClawPilot Dashboard                        [_] [□] [X]   │
├──────────────────────────────────────────────────────────┤
│                                                            │
│  Model Health Overview                                    │
│  ┌──────────────┬──────────────┬──────────────┐           │
│  │ Claude Opus  │ GPT-5        │ Gemini 3 Pro │           │
│  │ ● HEALTHY    │ ● HEALTHY    │ ⚠ SLOW       │           │
│  │ 124ms        │ 89ms         │ 2.1s         │           │
│  │ $0.42/hr     │ $0.38/hr     │ $0.15/hr     │           │
│  │ 99.8% uptime │ 99.2% uptime │ 87.1% uptime │           │
│  └──────────────┴──────────────┴──────────────┘           │
│                                                            │
│  Optimal Fallback Chain                                   │
│  Claude Opus → Gemini 3 Pro → GPT-5                       │
│                                                            │
│  Cost This Month: $127.34 → Potential Savings: $18.50     │
│                                                            │
└──────────────────────────────────────────────────────────┘
```

## Key Features

### Real-time Model Health Dashboard
Monitor all connected AI models with live health scoring, latency tracking, error rates, and uptime metrics. See which models are healthy, slow, or failing at a glance.

### Intelligent Fallback Optimization
Dynamic chain reordering based on real-time health scores with hysteresis. No more fixed fallback chains—let your system automatically route to the best performing model right now.

### Task-Based Smart Routing
Automatic model selection based on task complexity and type. Route simple queries to cost-effective models, code generation to specialized models, and long-context analysis to models with large context windows.

### Predictive Failover
Linear regression-based failure prediction identifies models at risk before they fail. Proactively prepare failover strategies and maintain "warm standby" connections.

### Cost Analytics & Optimization
Track spending by model with detailed breakdowns. Get intelligent savings suggestions like "40% of simple queries went to Opus last week—switching to Haiku would save $30/month."

### Fallback Simulator
Test scenarios without disrupting production. Simulate Claude outages, rate limits, multi-provider failures, and compare current vs. optimized fallback chains.

### Alert System
Desktop notifications for model failures, fallback storms, and predictive alerts. Optional Slack/Discord/Telegram webhook integration for team notifications.

### OpenClaw Native Integration
Direct WebSocket connection to OpenClaw Gateway with typed message routing via service bus. Full support for auth profiles, rate limits, and cooldown states.

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Desktop App** | Electron 34 | Cross-platform desktop application |
| **UI Framework** | React 19 + TypeScript 5.7 | Responsive, type-safe interface |
| **Styling** | Tailwind CSS + shadcn/ui | Clean, accessible components |
| **Charting** | Recharts | Real-time metrics visualization |
| **State Management** | Zustand | Lightweight reactive state |
| **Gateway Connection** | WebSocket (ws) | OpenClaw real-time protocol |
| **Local Database** | SQLite (better-sqlite3) | Metrics, events, and history |
| **ORM** | Drizzle ORM | Type-safe database queries |
| **Build System** | Vite + electron-forge | Fast development and distribution |
| **Testing** | Vitest | Unit testing framework |

## Getting Started

### Prerequisites

- **Node.js** 18+ (for build) or standalone Electron binary
- **OpenClaw Gateway** running on `ws://127.0.0.1:18789` (configurable)
- **Modern OS** (macOS 12+, Windows 10+, or Linux with glibc 2.29+)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/openclaw-optimizer.git
cd openclaw-optimizer

# Install dependencies
npm install

# Start development server
npm run dev
```

The Electron app will launch with hot module reloading. Connect to your OpenClaw Gateway and start monitoring.

### Building for Distribution

```bash
# Create platform-specific installers
npm run make

# Output: out/make/
#   ├── zip/darwin/     (macOS)
#   ├── zip/win32/      (Windows)
#   └── zip/linux/      (Linux)
```

## Architecture

### 3-Layer Electron Design

```
┌─────────────────────────────────────────────────┐
│  Renderer Process (React UI)                    │
│  • Dashboard, Optimizer, Analytics, Simulator   │
│  • Zustand stores, real-time updates            │
└────────────────┬────────────────────────────────┘
                 │ IPC (typed service bus)
┌────────────────▼────────────────────────────────┐
│  Main Process (Core Engine)                     │
│  • Gateway connection (WebSocket)               │
│  • Health scoring, cost tracking, predictions   │
│  • Alerts and notifications                     │
└────────────────┬────────────────────────────────┘
                 │ SQLite WAL mode
┌────────────────▼────────────────────────────────┐
│  Local Database                                 │
│  • Metrics, events, settings, history           │
└─────────────────────────────────────────────────┘
```

### Typed Inter-Process Communication

ClawPilot uses a **service bus pattern** for strict type safety:

```typescript
// Main process emits events
serviceBus.emit('metrics-updated', { models, costs });

// Renderer subscribes with full TypeScript support
serviceBus.on('metrics-updated', (data: MetricsEvent) => {
  // Zustand store updates automatically
});
```

### 5-Tier Update Strategy

1. **High-frequency** (100ms) - Latency, error rates (ring buffers, bounded memory)
2. **Real-time** (1s) - Health scores, alerts
3. **Standard** (5s) - UI charts, request logs
4. **Periodic** (30s) - Cost rollups, predictions
5. **Batch** (hourly) - Database cleanup, reports

Ring buffers keep memory usage constant regardless of monitoring duration.

### Database Schema

7 tables with Drizzle ORM migrations:

```typescript
// Metrics tracking
models, metrics, fallback_events

// Cost analysis
cost_logs, cost_predictions

// Configuration
settings, alert_rules
```

All queries are programmatic and type-safe. No raw SQL.

## Project Structure

```
openclaw-optimizer/
├── src/
│   ├── main/                    # Electron main process
│   │   ├── index.ts             # App initialization
│   │   ├── ipc-router.ts        # IPC request routing
│   │   ├── service-bus.ts       # Typed event system
│   │   ├── gateway/             # OpenClaw WebSocket client
│   │   │   ├── connection.ts    # Connection management
│   │   │   └── handlers.ts      # Message handlers
│   │   ├── optimizer/           # Fallback optimization
│   │   │   ├── health-scorer.ts # Health score calculation
│   │   │   ├── task-classifier.ts # Task-based routing
│   │   │   └── predictor.ts     # Failure prediction
│   │   ├── metrics/             # Real-time metrics
│   │   │   ├── collector.ts     # Metric collection
│   │   │   └── cost-tracker.ts  # Cost analytics
│   │   ├── alerts/              # Notification system
│   │   │   ├── manager.ts       # Alert orchestration
│   │   │   └── notifier.ts      # Desktop/webhook alerts
│   │   ├── db/                  # SQLite with Drizzle
│   │   │   ├── schema.ts        # Table definitions
│   │   │   ├── migrations.ts    # Schema migrations
│   │   │   └── queries.ts       # Type-safe queries
│   │   ├── simulator/           # Fallback scenario testing
│   │   └── config/              # Configuration management
│   │
│   ├── renderer/                # React UI
│   │   ├── App.tsx              # Root component
│   │   ├── pages/               # Page components
│   │   │   ├── Dashboard.tsx    # Real-time health overview
│   │   │   ├── Optimizer.tsx    # Optimization controls
│   │   │   ├── Analytics.tsx    # Cost analytics
│   │   │   ├── Simulator.tsx    # Scenario testing
│   │   │   └── Settings.tsx     # Configuration
│   │   ├── components/          # Reusable UI components
│   │   │   ├── ModelCard.tsx    # Model status card
│   │   │   ├── FallbackChain.tsx # Chain visualization
│   │   │   ├── charts/          # Chart components
│   │   │   └── layout/          # Layout components
│   │   ├── hooks/               # Custom React hooks
│   │   ├── stores/              # Zustand state stores
│   │   │   ├── gateway-store.ts # Gateway connection state
│   │   │   ├── models-store.ts  # Model status state
│   │   │   ├── metrics-store.ts # Metrics state
│   │   │   └── alerts-store.ts  # Alert state
│   │   └── lib/                 # Utilities and helpers
│   │
│   ├── shared/                  # Shared types & constants
│   │   ├── types.ts             # TypeScript interfaces
│   │   ├── constants.ts         # Shared constants
│   │   └── protocols.ts         # IPC & WebSocket protocols
│   │
│   └── preload/                 # Preload script (security)
│       └── index.ts             # IPC bridge
│
├── tests/
│   ├── main/
│   │   ├── health-scorer.test.ts    # Health scoring tests
│   │   ├── task-classifier.test.ts  # Task routing tests
│   │   ├── predictor.test.ts        # Prediction tests
│   │   └── ring-buffer.test.ts      # Memory management tests
│   └── vitest.config.ts
│
├── resources/                   # App assets
├── forge.config.ts              # Electron Forge config
├── vite.main.config.ts          # Main process build
├── vite.renderer.config.ts      # Renderer process build
├── tsconfig.json                # TypeScript config
└── package.json
```

## Development

### Running in Development Mode

```bash
# Start with hot reload
npm run dev

# Tests watch mode
npm run test:watch

# Run specific test
npm run test -- health-scorer
```

### Running Tests

```bash
# All tests
npm run test

# With coverage
npm run test -- --coverage

# Watch mode
npm run test:watch
```

All 19 unit tests are passing. Tests cover:
- Health score calculation accuracy
- Task classification logic
- Predictive failure detection
- Memory-bounded ring buffer operations

### Code Quality

```bash
# Type check
npx tsc --noEmit

# Linting
npm run lint
```

### Building

```bash
# Development build (unpackaged)
npm run dev

# Production package (all platforms)
npm run make

# DMG for macOS
npm run make -- --platform=darwin

# NSIS installer for Windows
npm run make -- --platform=win32

# AppImage for Linux
npm run make -- --platform=linux
```

## Configuration

### OpenClaw Gateway Connection

Edit settings to connect to your OpenClaw instance:

```json
{
  "gateway": {
    "url": "ws://127.0.0.1:18789",
    "reconnectInterval": 5000,
    "maxReconnectAttempts": 10
  },
  "optimizer": {
    "autoOptimize": true,
    "scoreWeights": {
      "stability": 0.3,
      "latency": 0.3,
      "cost": 0.2,
      "uptime": 0.2
    }
  }
}
```

### Alert Rules

Configure which events trigger alerts:

```json
{
  "alerts": [
    {
      "type": "model-down",
      "enabled": true,
      "channels": ["desktop", "slack"]
    },
    {
      "type": "cost-threshold",
      "threshold": 500,
      "period": "month",
      "channels": ["desktop"]
    }
  ]
}
```

## API & Integration

### WebSocket Gateway Protocol

ClawPilot communicates with OpenClaw via typed messages:

```typescript
// Connection established
{ type: 'gateway:ready', timestamp: '2026-04-05T...' }

// Model status update
{
  type: 'metrics:update',
  models: [
    { name: 'Claude Opus', latency: 124, errorRate: 0.002 }
  ]
}

// Request completed
{
  type: 'request:completed',
  model: 'Claude Opus',
  latency: 1240,
  tokens: 450,
  cost: 0.003
}
```

### IPC Commands

Send commands from renderer to main process:

```typescript
// Trigger immediate reoptimization
await ipc.invoke('optimizer:recompute-chain');

// Simulate a failure
await ipc.invoke('simulator:test-scenario', {
  failedModel: 'Claude',
  duration: 5000
});

// Get cost projections
const projection = await ipc.invoke('analytics:project-costs', {
  timeframe: 'month'
});
```

## Roadmap

### v1.0 (Current)
- Real-time health dashboard
- Dynamic fallback optimization
- Task-based smart routing
- Cost analytics and tracking
- Alert system
- Fallback simulator

### v1.1
- Predictive failure detection
- Multi-gateway management
- Community fallback presets
- Enhanced simulator scenarios

### v2.0
- AI-based automatic tuning
- Mobile companion app
- OpenClaw plugin integration
- Advanced ML-based cost optimization

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Write tests for new functionality
4. Ensure all tests pass (`npm test`)
5. Commit with clear messages
6. Push to your fork
7. Open a Pull Request

### Development Guidelines

- **TypeScript**: Full strict mode. No `any` types without justification.
- **Testing**: Aim for >80% coverage. Tests are required for new features.
- **Components**: Keep components small and focused. Use custom hooks for logic.
- **Performance**: Profile before optimizing. Avoid unnecessary re-renders.
- **Documentation**: Update docs when adding features. Add JSDoc comments.

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

## Acknowledgments

ClawPilot was built to bring intelligence and observability to OpenClaw's fallback system. It's designed to be the control tower for AI model routing.

**Questions?** Open an issue or check the [PROJECT.md](PROJECT.md) for detailed architecture and roadmap.
