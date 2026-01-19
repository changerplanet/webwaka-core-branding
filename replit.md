# WebWaka Core Branding

## Overview

A headless TypeScript library for brand identity, theming, and visual asset management. This is part of the WebWaka Core Substrate.

## Project Structure

```
src/           - TypeScript source files
dist/          - Compiled JavaScript output
```

## Development

### Commands

- `npm run dev` - Watch mode for development (compiles on file changes)
- `npm run build` - One-time TypeScript compilation
- `npm run lint` - Run linter (not configured yet)
- `npm test` - Run tests (not configured yet)

### Workflow

The TypeScript Build workflow runs `npm run dev` which watches for changes and recompiles automatically.

## Architecture

This is a core module that provides:
- Brand configuration interfaces
- Theme management
- Visual asset management utilities

Consumed by Suite modules (POS, SVM, MVM, etc.) via npm package installation.

## Recent Changes

- 2026-01-19: Initial Replit setup with TypeScript configuration
