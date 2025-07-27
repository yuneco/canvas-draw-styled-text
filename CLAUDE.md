# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development

- `npm run dev` - Start development server for sample app (uses sample/vite.config.sample.ts)
- `npm run build` - Build library (creates dist/ with UMD and ES modules)
- `npm run build-docs` - Build sample docs and run TypeScript compiler
- `npm run preview` - Preview built sample app

### Testing

- `pnpm test` - Run tests with Vitest
- `pnpm test:ui` - Run tests with Vitest UI interface  
- `pnpm test:browser` - Run tests in browser mode (requires Playwright)

### TypeScript

- `tsc` - Type check the codebase

## Architecture

This is a TypeScript library that draws styled and multiline text on HTML Canvas with advanced text layout features.

### Core Components

**Main Entry (`src/index.ts`)**
Exports the primary API: `drawStyledText`, `measureStyledText`, `defineText`, and extension system.

**Text Drawing Engine (`src/drawText/`)**

- `drawTextLines.ts` - Main drawing logic with canvas rendering, style application, and line positioning
- `breakLine.ts` - Line breaking algorithm for text wrapping
- `splitText.ts` - Text segmentation using Intl.Segmenter
- `sharedCtx.ts` - Shared canvas context for text measurement

**Type Definitions (`src/drawText/defs/`)**

- `defineText.ts` - Helper for creating typed StyledText objects
- `style.ts` - Font and layout style definitions
- `extension.ts` - Extension system types for custom text decorations
- `metrix.ts` - Text measurement and positioning types

**Extensions (`src/extensions/`)**

- `underline.ts` - Underline text decoration. Sample implementation.
- `marker.ts` - Highlight marker decoration. Sample implementation.

**Browser Compatibility (`src/drawText/compatibility/`)**

- `safari.ts` - Safari-specific vertical text rendering fixes

### Key Features

- **Multi-style text**: Different font styles within single text block
- **Text wrapping**: CSS-compatible line breaking using `css-line-break` library
- **Vertical writing**: Japanese vertical text (vertical-rl) with Safari compatibility fixes
- **Extensions**: Custom text decorations via extension system
- **Performance optimization**: Pre-measured text matrices for repeated rendering
- **Text alignment**: left, center, right alignment support

### Sample App

The `sample/` directory contains a Vite-based demo app that showcases library features.
