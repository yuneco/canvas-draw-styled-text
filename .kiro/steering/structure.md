# Project Structure

## Root Level

- `src/` - Main library source code
- `sample/` - Demo application and usage examples
- `docs/` - Built documentation site
- `dist/` - Compiled library output (generated)

## Source Organization (`src/`)

```
src/
├── index.ts                    # Main library exports
├── drawText/                   # Core text rendering logic
│   ├── defs/                   # Type definitions and interfaces
│   ├── compatibility/          # Browser compatibility fixes
│   ├── breakLine.ts           # Line breaking logic
│   ├── debugDraw.ts           # Debug visualization utilities
│   ├── drawTextLines.ts       # Main drawing function
│   ├── sharedCtx.ts           # Shared canvas context utilities
│   └── splitText.ts           # Text segmentation logic
└── extensions/                 # Built-in extensions(Sample implementation)
```

## Architecture Patterns

### Core Modules

- **defs/**: Contains all type definitions and interfaces
- **drawText/**: Main rendering engine with modular components
- **extensions/**: Pluggable text effects system

### Extension System

- Extensions implement the `Extension<O>` interface
- Each extension defines its own option type
- Extensions hook into the `beforeSegment` rendering phase
- Built-in extensions serve as implementation examples

### Sample Application

- `sample/` contains a complete demo with interactive controls
- Uses separate Vite config for development server
- Demonstrates all library features and extension usage

## File Naming Conventions

- Use camelCase for TypeScript files
- Group related functionality in subdirectories
- Separate type definitions in `defs/` folder
- Extensions follow `[name]Extension` pattern
