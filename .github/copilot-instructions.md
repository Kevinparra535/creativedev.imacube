# Copilot Instructions for creativedev.imacube

## Project Overview

This is a React 19.2 + TypeScript + Vite project using Rolldown as the bundler (via `rolldown-vite` package override). It's configured as a modern ESM-based application with strict TypeScript settings and flat ESLint configuration.

## Key Architecture Decisions

- **Rolldown Integration**: Uses `rolldown-vite@7.2.2` instead of standard Vite for improved build performance. This is enforced via `package.json` overrides.
- **React 19**: Running the latest React with new features like `react-jsx` transform and enhanced StrictMode.
- **Flat ESLint Config**: Uses the new flat config format (`eslint.config.js`) with `defineConfig` and `globalIgnores` - avoid legacy `.eslintrc` patterns.
- **TypeScript Project References**: Uses composite config with `tsconfig.app.json` (app code) and `tsconfig.node.json` (build tooling).

## Development Workflows

### Running the Project
```bash
npm run dev          # Start dev server with HMR
npm run build        # TypeScript check + production build
npm run preview      # Preview production build locally
npm run lint         # Run ESLint on entire codebase
```

### Build Process
The build runs TypeScript compilation first (`tsc -b`) before Vite build - both must pass. TypeScript uses `noEmit: true` since Vite handles transpilation.

## TypeScript Configuration

- **Strict Mode Enabled**: All strict checks active plus additional rules (`noUnusedLocals`, `noUnusedParameters`, `noUncheckedSideEffectImports`)
- **Bundler Module Resolution**: Uses `moduleResolution: "bundler"` with `allowImportingTsExtensions: true`
- **Verbatim Module Syntax**: `verbatimModuleSyntax: true` requires explicit `type` imports - use `import type { ... }` for types
- **Target**: ES2022 features available (top-level await, class fields, etc.)

## Code Conventions

### Import Patterns
```tsx
// Type-only imports must use 'type' keyword
import type { ComponentProps } from 'react'
// Regular imports
import { useState } from 'react'
// Asset imports work with Vite typing
import logo from './assets/logo.svg'
import publicAsset from '/public-asset.svg'  // Public folder assets use /
```

### Component Structure
- **Entry Point**: `src/main.tsx` renders into `#root` div with StrictMode wrapper
- **Styles**: Component-level CSS files (e.g., `App.css`) co-located with components
- **Assets**: Component assets in `src/assets/`, public static files in `public/`

## ESLint Configuration

Uses flat config with these plugins:
- `@eslint/js` - Core JavaScript rules
- `typescript-eslint` - TypeScript-specific rules (recommended preset)
- `eslint-plugin-react-hooks` - React Hooks rules (flat config)
- `eslint-plugin-react-refresh` - Fast Refresh rules for Vite

**Important**: When adding new ESLint rules, use the flat config API with `files: ['**/*.{ts,tsx}']` pattern and `extends` array. The `dist/` folder is globally ignored.

## Important Notes

- **No React Compiler**: Intentionally disabled for dev/build performance. Don't suggest enabling unless user requests.
- **Fast Refresh**: Uses Babel-based Fast Refresh via `@vitejs/plugin-react` (not SWC variant).
- **File Extensions**: TypeScript files use `.tsx` for components, `.ts` for utilities.
- **Public Folder**: Reference public assets with leading `/` (e.g., `/vite.svg` maps to `public/vite.svg`).

## When Extending the Project

- Add new components in `src/` with co-located `.css` files following the `App.tsx`/`App.css` pattern
- For type-aware linting, user can upgrade to `recommendedTypeChecked` config (see README.md)
- New dependencies should be compatible with React 19 and Vite 5+ ecosystem
- Maintain ESM-only architecture (`"type": "module"` in package.json)
