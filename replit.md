# WebWaka Core Branding

## Overview

A headless TypeScript library for brand identity, theming, and visual asset management. This is part of the WebWaka Core Substrate. Implements Phase 3E-3 of the WebWaka Modular Rebuild.

**Classification:** Core Module
**Type:** Headless TypeScript library (NO UI)

## Project Structure

```
src/
├── models/          - Zod-validated domain models
│   ├── tokens.ts    - Token schemas (Primitive, Semantic, Brand, Behavioral)
│   ├── branding.ts  - Branding schemas (Layer, Context, Snapshot)
│   └── index.ts
├── engine/          - Branding resolution engine
│   ├── resolver.ts  - Core resolution logic
│   ├── snapshot.ts  - Snapshot generation and verification
│   └── index.ts
├── utils/           - Utility functions
│   ├── hash.ts      - SHA-256 hashing and canonical JSON
│   └── index.ts
├── __tests__/       - Test files
│   └── engine.test.ts
└── index.ts         - Main exports
dist/                - Compiled JavaScript output
```

## APIs Exposed

- `resolveBranding(context, layers)` - Resolve branding tokens deterministically
- `generateBrandingSnapshot(context, layers)` - Generate verifiable snapshot
- `verifyBrandingSnapshot(snapshot)` - Verify snapshot integrity
- `resolveFromSnapshot(snapshot, evaluationTime?)` - Resolve from cached snapshot

## Capabilities

- `branding:define` - Define branding tokens
- `branding:layer.apply` - Apply branding layers
- `branding:resolve` - Resolve branding for context
- `branding:snapshot.generate` - Generate snapshots
- `branding:snapshot.verify` - Verify snapshot integrity

## Invariants Enforced

1. **Hierarchy Precedence**: system < partner < tenant < suite < component < contextual
2. **Determinism**: Same input always produces same output
3. **Time-bound Layers**: Expired/not-yet-valid layers are excluded
4. **Tenant Isolation**: No cross-tenant token leakage
5. **Snapshot Integrity**: SHA-256 checksum verification
6. **Offline-safe**: Snapshots can be evaluated without network

## Development

### Commands

- `npm run dev` - Watch mode for development
- `npm run build` - Build TypeScript
- `npm test` - Run tests
- `npm run test:coverage` - Run tests with coverage

### Workflow

The TypeScript Build workflow runs `npm run dev` which watches for changes and recompiles automatically.

## Recent Changes

- 2026-01-19: Implemented Phase 3E-3 Core Branding Engine
  - Domain models with Zod validation
  - Branding resolution with hierarchy enforcement
  - Snapshot generation with SHA-256 checksums
  - Comprehensive tests (38 tests, >80% coverage)
