# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Shuffle Tabs is a Chrome Extension (Manifest V3) for managing browser tabs — shuffling, sorting, merging windows, and snoozing/waking tabs. Uses `webextension-polyfill` for cross-browser compatibility.

## Commands

```bash
pnpm install          # Install dependencies (pnpm required, not npm/yarn)
pnpm start            # Dev build with hot reload → dev/ folder
pnpm build            # Production build → dist/ folder
pnpm test             # Run tests once
pnpm test:ui          # Interactive Vitest UI
pnpm test:coverage    # Tests with coverage report
pnpm lint             # ESLint + format check
pnpm lint:fix         # Auto-fix ESLint issues
pnpm lint:format:fix  # Auto-fix Prettier formatting
```

Running a single test file: `pnpm vitest run src/actions.test.ts`

## Loading the Extension

- Dev: run `pnpm start`, load the `dev/` folder in `chrome://extensions/` (Developer mode on)
- Production: run `pnpm build`, load the `dist/` folder

## Architecture

The extension has three execution contexts:

1. **Service worker** (`background.ts`) — listens for keyboard commands (`shuffleTabs`, `snoozeTab`, `altSnooze`), runs a recurring alarm (every minute) for auto-wake logic, and updates the badge count.

2. **Popup** (`popup.html` + `button-handlers.ts`) — renders the UI and wires up click handlers for all tab management buttons.

3. **Core logic** (`src/actions.ts`) — all tab manipulation functions. This is the main file to work in. Imported by both the service worker and popup.

Supporting files:

- `src/storage.ts` — thin wrappers around `chrome.storage.local`
- `src/constants.ts` — `REFRESH_PERIOD`, `TABS_TO_WAKE_PER_PERIOD`
- `types/tabs.d.ts` — global `SnoozedTab` interface

## Storage Schema

Uses `chrome.storage.local`:

| Key                 | Type                                                      | Purpose                                                        |
| ------------------- | --------------------------------------------------------- | -------------------------------------------------------------- |
| `tabs`              | `SnoozedTab[]`                                            | Snoozed tabs pending restoration                               |
| `maxTabs`           | `number`                                                  | Auto-wake stops when open tab count exceeds this (default: 15) |
| `wakeUpEnabled`     | `boolean`                                                 | Whether auto-wake is active                                    |
| `snoozedTabHistory` | `Record<string, {count: number, lastSnoozeDate: number}>` | Per-URL snooze count for exponential duration scaling          |

## Snooze Duration Logic

Snooze duration scales exponentially based on how many times a URL has been snoozed: 15min → 30min → 60min → ... The count is tracked in `snoozedTabHistory`.

## Testing

Vitest + happy-dom environment + Sinon for stubbing Chrome APIs. Tests live alongside source files (`src/actions.test.ts`). TypeScript strict mode is enabled (`noUnusedLocals`, `noUnusedParameters`).

## Release

Uses `standard-version`: `pnpm release` bumps version in both `package.json` and `manifest.json`, creates a git tag, and updates `CHANGELOG.md`.
