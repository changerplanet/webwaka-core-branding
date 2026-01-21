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
├── errors/          - Custom error types
│   └── index.ts     - CrossTenantAccessError, SnapshotTenantMismatchError
├── utils/           - Utility functions
│   ├── hash.ts      - SHA-256 hashing and canonical JSON
│   ├── freeze.ts    - Deep freeze utility for immutability
│   └── index.ts
├── __tests__/       - Test files
│   └── engine.test.ts
└── index.ts         - Main exports
dist/                - Compiled JavaScript output
```

## APIs Exposed

- `resolveBranding(context, layers)` - Resolve branding tokens deterministically (requires context.evaluationTime)
- `generateBrandingSnapshot(context, layers)` - Generate verifiable snapshot (requires context.evaluationTime)
- `verifyBrandingSnapshot(snapshot, evaluationTime)` - Verify snapshot integrity with time-based validation
- `resolveFromSnapshot(snapshot, evaluationTime, contextTenantId?)` - Resolve from cached snapshot with tenant validation
- `deepFreeze(obj)` - Deep freeze utility for immutability

## Error Types

- `CrossTenantAccessError` - Thrown when tenant isolation is violated during resolution
- `SnapshotTenantMismatchError` - Thrown when snapshot tenant doesn't match context tenant

## Capabilities

- `branding:define` - Define branding tokens
- `branding:layer.apply` - Apply branding layers
- `branding:resolve` - Resolve branding for context
- `branding:snapshot.generate` - Generate snapshots
- `branding:snapshot.verify` - Verify snapshot integrity

## Invariants Enforced

1. **Hierarchy Precedence**: system < partner < tenant < suite < component < contextual
2. **Determinism**: Same input always produces same output (evaluationTime required, no Date.now())
3. **Time-bound Layers**: Expired/not-yet-valid layers are excluded based on context.evaluationTime
4. **Tenant Isolation**: No cross-tenant token leakage (throws CrossTenantAccessError)
5. **Snapshot Integrity**: SHA-256 checksum verification with tamper detection
6. **Offline-safe**: Snapshots can be evaluated without network
7. **Immutability**: All outputs are deeply frozen (readonly)

## Development

### Commands

- `npm run dev` - Watch mode for development
- `npm run build` - Build TypeScript
- `npm test` - Run tests
- `npm run test:coverage` - Run tests with coverage (target: ≥80%)

### Workflow

The TypeScript Build workflow runs `npm run build` which compiles TypeScript to JavaScript.

## Recent Changes

- 2026-01-21: Enhanced determinism and tenant isolation
  - Required evaluationTime for all resolution and snapshot operations
  - Added CrossTenantAccessError and SnapshotTenantMismatchError
  - Added deepFreeze utility for immutable outputs
  - JSON serialization round-trip tests
  - 29 tests, 84.14% coverage

- 2026-01-19: Implemented Phase 3E-3 Core Branding Engine
  - Domain models with Zod validation
  - Branding resolution with hierarchy enforcement
  - Snapshot generation with SHA-256 checksums
