# Chrome Shuffle Tabs Extension

## Project Overview

This is a **Chrome Extension (Manifest V3)** that helps manage browser tabs through shuffling, merging, moving, and snoozing features.

## Tech Stack

- **Language**: TypeScript
- **Build Tool**: Vite (v7.3.1) with `@crxjs/vite-plugin` for Chrome extension builds
- **Testing**: Vitest with sinon for mocking
- **Linting**: ESLint + Prettier
- **Package Manager**: pnpm (v8.11.0) — use pnpm, not npm or yarn
- **Node Version**: 24.14.0 (specified in `package.json` via Volta)

## Project Structure

```
.
├── background.ts         # Service worker - handles alarms, commands, and keyboard shortcuts
├── button-handlers.ts   # Popup UI event handlers
├── popup.html           # Extension popup interface
├── manifest.json        # Chrome extension manifest (v3)
├── src/
│   ├── actions.ts       # Core tab manipulation functions (shuffle, merge, move, snooze, wake)
│   ├── actions.test.ts  # Unit tests for actions
│   └── storage.ts       # Chrome storage helpers
├── dist/                # Built extension output
├── dev/                 # Development files
└── vite.config.ts       # Vite configuration
```

## Available Commands

```bash
pnpm install          # Install dependencies
pnpm start            # Start dev server (watches for changes)
pnpm build            # Build production extension
pnpm test             # Run tests
pnpm test:ui          # Run tests with UI
pnpm test:coverage    # Run tests with coverage
pnpm lint             # Run linter
pnpm lint:fix         # Fix linting issues
pnpm lint:format      # Check formatting
pnpm lint:format:fix  # Fix formatting
pnpm release          # Create release (standard-version)
```

## Features

### 1. Shuffle Tabs

- Randomly shuffles all non-pinned tabs in the current window
- Triggered via: **Alt+S** keyboard shortcut
- Also available via popup button

### 2. Merge Windows

- Moves all tabs from all windows into the first window
- Available via popup button

### 3. Move Tab

- Moves the current tab to another window
- Available via popup button

### 4. Snooze Tab(s)

- Stores tab URLs in local storage and removes tabs from browser
- **Snooze (single)**: Snoozes the currently active tab via **Alt+Z** keyboard shortcut
- **Snooze (all)**: Snoozes all inactive tabs in current window via popup button
- Snooze duration increases exponentially with each snooze (10min → 20min → 40min...)
- Maintains snooze history to track snooze counts

### 5. Unsnooze (Wake Up)

- **Unsnooze All**: Opens all snoozed tabs
- **Unsnooze Some**: Opens up to N snoozed tabs (default: 5)
- **Auto-wake**: Background alarm runs every minute to automatically open snoozed tabs if:
  - There are fewer than `maxTabs` open tabs (default: 15)
  - The tab's wake-up time has passed

## Extension Permissions

```json
{
  "permissions": ["alarms", "activeTab", "tabs", "storage", "scripting"]
}
```

## Storage Schema

The extension uses `chrome.storage.local` with the following keys:

| Key                 | Type                                                        | Description                                            |
| ------------------- | ----------------------------------------------------------- | ------------------------------------------------------ |
| `tabs`              | `SnoozedTab[]`                                              | Array of snoozed tab objects                           |
| `maxTabs`           | `number`                                                    | Maximum open tabs before auto-wake stops (default: 15) |
| `wakeUpEnabled`     | `boolean`                                                   | Whether auto-wake feature is enabled                   |
| `snoozedTabHistory` | `Record<string, { count: number, lastSnoozeDate: number }>` | Tracks snooze count per URL                            |

### SnoozedTab Type

```typescript
interface SnoozedTab {
  url: string
  wakeUpAt: number // Unix timestamp
}
```

## Running the Extension

1. Build the extension: `pnpm build`
2. In Chrome, go to `chrome://extensions/`
3. Enable "Developer mode" (top right)
4. Click "Load unpacked" and select the `dist` folder

For development with hot reload:

1. Run `pnpm start`
2. In Chrome extensions, load from the `dev` folder
3. Or use Chrome's "Update" button to reload after changes

## Testing

Tests use Vitest with sinon for mocking Chrome APIs. The mock sets `global.chrome` with stubbed `tabs` and `windows` APIs.

Run tests:

```bash
pnpm test        # Single run
pnpm test:ui     # With browser UI
pnpm coverage    # With coverage report
```

## Key Implementation Details

- Uses `webextension-polyfill` for cross-browser API compatibility in `background.ts`
- `src/actions.ts` uses native `chrome` global (type definitions from `@types/chrome`)
- Background service worker (`background.ts`) runs continuously to handle:
  - Keyboard commands
  - Periodic alarm for auto-wake
  - Badge updates
- Popup (`button-handlers.ts`) directly manipulates DOM in popup context

## Known TODOs (from code comments)

- Variable `REFRESH_PERIOD` in `background.ts` should be configurable
- Command names (`myKeyCombination`, `snoozeCombination`) should be renamed to meaningful names
- Actions and key combinations should be documented in the UI

## Releasing

Uses `standard-version` for semantic versioning:

```bash
pnpm release
```

This updates version in `package.json` and `manifest.json`, creates a git tag, and updates CHANGELOG.md.
