# Technology Stack

## Build System & Tools

- **Build Tool**: Vite with TypeScript compilation
- **Package Manager**: pnpm (lockfile: pnpm-lock.yaml)
- **TypeScript**: ES2022 target with strict mode enabled
- **Bundling**: Library mode with UMD and ESM outputs

## Dependencies

- **Runtime**: `css-line-break` for CSS-compatible line breaking
- **Dev Dependencies**: TypeScript, Vite, vite-plugin-dts for type definitions

## Common Commands

```bash
# Development server with sample
pnpm dev

# Build library for distribution
pnpm build

# Build documentation site
pnpm build-docs

# Preview built documentation
pnpm preview
```

## TypeScript Configuration

- Target: ES2022 with DOM libraries
- Module system: ESNext with bundler resolution
- Strict type checking enabled
- Source maps generated for debugging
- No unused locals/parameters allowed

## Library Output

- **Main**: `./dist/index.umd.cjs` (CommonJS)
- **Module**: `./dist/index.js` (ESM)
- **Types**: `./dist/index.d.ts`
- Dual package.json exports for both require() and import
