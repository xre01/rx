# Rex World Sanctuary release validation

## Scope

Continue PR #10 with the approved cream, mist-blue and champagne layout, two-column practice cards, a compact reflection toolbar and aligned desktop column bottoms. Add the approved book/origami, lighthouse, mountain path and persevering hiker artwork. Background assets contain no text or stored statistics.

Existing Notion/D1 synchronization, data schemas, record-processing scripts and backend Workers are unchanged. The presentation module uses existing inputs and control nodes/handlers. The weekly summary only reads the existing dashboard store.

## Cleanup

- Remove the superseded mountain/leaf metric assets and six obsolete review screenshots.
- Retain only the current desktop/mobile release screenshots and this validation note.
- Audit runtime JavaScript and top-level CSS/image/icon references: no unreferenced runtime files identified. Build sources, tests, current icon variants and operational documentation are retained.
- Upgrade the offline resource cache to rex-focus-offline-20261026-sanctuary-release1. Activation removes older rex-focus-offline-* static caches, including the previously current 20261024-light1 cache, and obsolete requests in the active cache. Other application caches remain intact.
- No localStorage, IndexedDB, drafts, focus sessions, avatars, Notion data or D1 records are cleared.
- npm test now includes every tests/*.cjs regression script instead of only a subset.

## Validation

All 28 regression scripts passed. They cover rich-text edits, reading data, PTE records and XP, D1/cloud reconciliation, Notion retries and conflict handling, offline queues, push notifications, resource cache cleanup and presentation invariants.

Chromium checks at 1672, 1280, 1024, 768, 760, 600, 390 and 320 CSS pixels found no horizontal overflow. Desktop reflection and weekly-progress bottoms aligned exactly at 1672px and 1280px. At narrow widths panels stack naturally.

Browser smoke checks passed: Listening count save/reload, reflection draft reload, Images/Audio/Files chooser activation with correct accept filters, Links editor open/close, reflection history, disconnected Save to Notion retaining the draft, timer start/pause/close, countdown dialog, calendar previous month/return to today, weekly view visibility, PNG generation, Reading/Archive navigation. No page script errors.

Resource existence, icon dimensions, duplicate resources, authenticated-request cache bypass, cache cleanup and git diff whitespace checks passed.

## Verification boundary

No production Notion/D1 account credentials were supplied. Production authentication/writes were not exercised; existing mocked synchronization tests passed. Browser checks used an isolated profile with disposable records; existing user learning records were not accessed or modified. Static-cache cleanup reaches each device when it receives and activates the updated service worker online.
