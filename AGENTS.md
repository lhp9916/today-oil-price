# Repository Guidelines

## Project Structure & Module Organization

A Vue 3 + Vite uTools plugin for querying Chinese fuel prices.

- `src/` — renderer (Vue). `App.vue` holds global state; `views/` has the three tabs (Today, History, Calendar); `components/` holds presentational parts; `api/` wraps storage, province metadata, and service calls.
- `public/` — uTools plugin files, copied verbatim into `dist/`: `plugin.json` (manifest + `tools`), `preload.js` (Node-side requests and MCP tool registration), `shared/oil-data.json` (single source for provinces and fuel types), `logo.png`.
- `vite.config.mjs` — build config, including the single-file inliner.

## Build, Test, and Development Commands

- `npm install` — install dependencies.
- `npm run dev` — start Vite on `127.0.0.1:5173` for hot-reload debugging (point uTools at `public/`).
- `npm run build` — produce `dist/`. Inlines CSS/JS into one `index.html`, strips the `development` field, and removes `assets/` so the plugin loads offline. Point uTools at `dist/` to test the release build.

There is no test runner or linter configured. Verify changes by rebuilding and exercising the affected path.

## Coding Style & Naming Conventions

- 2-space indentation, single quotes, no trailing semicolons.
- `camelCase` for functions and variables, `PascalCase` for components, `snake_case` for MCP tool names.
- Comments in Chinese, matching existing files.
- Keep renderer and preload separate: the renderer must not call network APIs directly.

## Testing Guidelines

No framework is installed. Before committing, confirm:

- `npm run build` succeeds and `dist/` contains `index.html`, `plugin.json`, `preload.js`, `logo.png`, `shared/oil-data.json`.
- Province lookup, area switching, and the fallback path for provinces without current prices still work.
- MCP tools (`oil_price_get`, `oil_price_history`, `oil_price_provinces`) respond correctly.

## Commit & Pull Request Guidelines

Commits follow Conventional Commits with Chinese subjects, e.g. `feat: 新增 MCP / AI 工具调用能力 (v1.1.0)`.

Pull requests should describe the change, list verification steps, and note any manifest version bump. Include screenshots for UI changes.

## Architecture Notes

Upstream price APIs send no CORS headers, so every request runs in `preload.js` via Node `http`/`https` and is exposed through `window.services`. `shared/oil-data.json` is consumed twice: `require` from preload and the `@oil-data` alias in the renderer — update it once, never duplicate the tables.
