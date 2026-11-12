# Rex World · Study Sanctuary

A lightweight English PTE dashboard with daily and weekly views, calendar backfills, reflections, focus timing, Notion archives and PNG statistics exports.

## Features

- Speaking uploads: DI, SGD and RL use images plus audio; RTS uses a prompt plus audio. Today and past dates use the same submission flow.
- WE and Reading use upload dialogs with question navigation; Reading also supports batch mistake screenshots.
- Count-only backfills are separate from attachment submissions. Reflections follow the selected calendar date and store drafts and files locally.
- Weekly Review includes recorded local counts and backfills. PNG exports support day, Monday–Sunday week, month and year.
- Notion Archive uses a calendar, content search and attachments loaded on demand. Search indexes the records returned by the configured service and indicates incomplete results.
- One stylesheet, calm colors and a frosted floating mobile navigation bar. Reduced-motion preferences are respected.

## Storage and sync

PTE files are selected for explicit submission; they are not a persistent offline upload queue. Reflection files are stored in IndexedDB. Unsynced records remain tied to the browser and site origin.

Notion and Cloudflare D1 require the user's existing service configuration. Notion receives notes and attachments; D1 receives dashboard metrics, My Day tasks and Habits. No credentials are included in the source. D1 data stays on this device until D1 is connected, then changes sync automatically while online.

## Validation

Local checks cover syntax, resource references and hashes, historical speaking upload payloads with mocked responses, duplicate submissions, date validation, count backfills, archive search with mocked content, PNG period aggregation including leap years, and service-worker cache behavior. Browser checks cover view switching, calendar-linked reflections, upload dialogs, profile, timer and mobile layout.

Live Notion/D1 integration needs the user's configured service and was not exercised by creating remote test records. The GitHub review branch does not deploy the website.

## Reading journal

Reading is a native sidebar panel alongside PTE and Notion Archive. It includes a bookshelf with dated book notes, article notes selected from a calendar, search, and image/audio/document/link attachments. Clicking the selected calendar date again collapses its notes.

Reading and PTE share the My World Notion database through the existing authenticated Cloudflare gateway. `Type` separates `Reading`, `PTE` and future `Work` records. Reading still uses `/api/reading/*` and PTE still uses `/api/entries`; frontend records, statistics and XP stay separate. Enter the gateway access key under Reading's Notion settings; the server-side Notion token stays in Cloudflare. Drafts and selected files are retained locally until sync succeeds. Reading credentials are session-scoped; existing Notion Archive session credentials can prefill the Reading connection.

The already deployed reading API supports status, migration, record sync and authenticated media. Book/article metadata and sync receipts are stored in its existing Durable Object; Notion pages display readable notes, dates and source links. The gateway must retain this Durable Object state when deploying changes. Notes edited in Notion are not automatically imported into the website; edit reading content from the Reading panel.

### Reading XP

Book notes award 3 XP per day with at least one non-empty note, shared across all books. Articles award 3 XP each, capped at 30 XP per note date. Empty books, empty notes and future dates do not earn XP. Reading XP is reconciled from surviving records, so edits/retries cannot award duplicate XP and deletion recalculates the daily caps without changing PTE XP. Deletions sync as tombstones and move Notion records to Trash.


## Rich notes release

Reading and PTE Speaking/Writing/Reading support native Notion text annotations and structured blocks. Listening is unchanged. Plain-text records remain supported. Preview themes and avatar frames are not part of this release.

Frontend files are deployed by GitHub Pages. `workers/notion-worker.mjs` is the separately deployed Cloudflare source; keep the existing secrets and Durable Object bindings when updating it. No credentials belong in the repository.

Checks (run from the repository root):

```sh
node tests/reading-sync.cjs
node tests/pte-rich-sync.cjs
node tests/reading-xp.cjs
```

A new service-worker cache version removes only older `rex-focus-offline-*` resource caches on activation. Notes, attachments, XP and browser-session connection keys are retained.

## Minimal reading editor

Reading uses a bundled, pinned Tiptap editor. The existing palette and note dialogs remain. The default toolbar shows File (book notes), paragraph style, bold, table and Aa; extra formatting stays in Aa. Table operations appear only when the selection is in a table. Paste HTML tables directly; select Markdown table source and choose Aa → Markdown → Table to convert it.

Old plain text, legacy HTML and Notion block arrays remain readable. On the first local save, the original local library is copied to rex-reading-editor-backup-v1; if that backup cannot be stored, saving stops. Existing fields and IDs are retained, with versioned editorBody/editorNote documents added for exact colors and table structure. Full documents are validated in the browser and Worker. HTML import and display use DOMPurify with a color-only CSS allowlist. Word stylesheet and row colors are imported when available; Safari may omit clipboard styling.

Book-note files are saved in the existing IndexedDB attachment store, referenced by attachmentIds on the log, and synchronized through the existing book record. The existing limit is 10 attachments per book record, with at most 20 MiB of pending upload data per request. Removing a file from a note unlinks it; stored book files are retained.

Build with pnpm install --frozen-lockfile and pnpm build. The generated reading-editor.js is committed so GitHub Pages needs no build service. Run pnpm test or the individual tests under tests/. The shared document validator is copied into the single-file Worker by the build.

Deployment: publish workers/notion-worker.mjs to the existing rex-notion-calendar Worker first, preserving every secret, binding and Durable Object namespace. Do not create a replacement namespace or change migration history. GET /api/reading/status must report editorSchemaVersion: 1. Then publish the frontend. New clients refuse sync with older Workers; old clients cannot overwrite versioned rich documents. Cache activation removes only obsolete owned asset caches.

Notion receives a readable projection; exact website formatting remains in Durable Object state. If Notion changes a versioned note, synchronization stops with a conflict rather than discarding the complete website document. Resolve the versions before retrying; no automatic merge is attempted. Keep the full Worker and browser data when rolling back. The backup is a browser-local recovery copy, not a replacement for a cloud export.

Validation includes HTML/table/color roundtrips, legacy blocks, XSS payloads, compact toolbar structure, book attachments, cloud document preservation, old-client rejection and the existing regression suite. iPhone hardware and the production Worker deployment require separate verification.

## Personal Home

Home is now the default landing panel; PTE Prep, Reading and Notion Archive remain separate navigation entries. The homepage brings together a dated agenda (optional time and priority, completion filters, editing and deletion), important dates, custom daily habits with streaks and seven-day history, and shortcuts to study and focus.

Planner tasks and habits are cached in `rex-home-planner-v1` and sync as separate versioned records to the configured Cloudflare D1 service. They do not award XP, change PTE question counts or sync through the study APIs or Notion. Deletions sync as tombstones; reconnecting another device restores its task and habit records. Important dates reuse `rex-countdown-targets-v1` and the existing dashboard sync. Dates and streaks follow Australia/Sydney calendar days; milestones show days remaining, today, or days elapsed. Storage failures retain open form inputs; unreadable planner storage blocks writes to preserve existing data.

Run `node tests/home-page.cjs` for the planner regression checks. After changing runtime assets, run `node scripts/version-assets.cjs` so HTML and service-worker hashes stay consistent.

Tasks support Repeat: Does not repeat, Daily, Weekdays (Monday–Friday), Weekly (the start date's weekday), and Custom days. Repeating tasks begin on the selected start date and store completion independently for each occurrence. Editing a recurring task changes its series; deleting it removes the series and its completion history. Existing one-off tasks remain supported.

For fixed-day cycles such as rent every 28 days, choose `Every N days` and enter the interval. Occurrences are calculated as start date plus multiples of that many calendar days, independently of month lengths and daylight-saving time. `Selected weekdays` remains the separate weekday-based option.

Home Focus totals all saved PTE, Reading and general Home focus records for the Sydney day, including saved partial sessions of at least a minute, with duplicate IDs excluded. Home's timer statistics show all areas. Reading statistics remain Reading-only; PTE statistics exclude both Reading and Home sessions. New general sessions started from Home use a `Home · ` source marker; existing unmarked sessions retain their legacy PTE classification. Opening another panel does not reclassify a running session. XP calculations are unchanged.

## Calm interface and interaction feedback

Home, PTE Prep, Reading, Archive, profile and dialogs share a low-saturation grey-green palette with warm neutral surfaces. The shared `calm` CSS layer replaces legacy decorative backgrounds, glossy cards and oversized navigation while preserving saved rich-note formatting. Small screens use a compact four-entry navigation. Selected states, keyboard focus, pressed states and destructive-action hover states have explicit visual treatments; reduced-motion preferences are respected.

`calm-ui.js` provides one dismissible live status notification, asynchronous button busy indicators and completion feedback. Home and Reading emit success only after a successful local save; existing sync statuses surface successful sync or failures without treating a click or a pending connection as a save. Failed forms retain their input. This release does not change storage destinations or cloud credentials.

Validation: `node tests/calm-ui.cjs` covers real save/failure integration, press/release, no false success on click, loading reset, hidden/pending status filtering, errors, notification dismissal, reduced motion, lifecycle cleanup and palette contrast. The full 33-script suite passes. Desktop and 390px mobile browser checks cover Home, PTE, Reading, Archive and task/note/timer dialogs. Production cloud writes were not used for visual verification.

The compact identity/navigation update reduces the visible avatar to 24px with a 44px profile control, removes its frame and shadow, and aligns the name beside it. Tablet-width windows use one horizontal navigation row; narrow phones retain two compact rows. Profile access, all four navigation entries and wide-screen sidebar navigation remain available. CSS/resource checks and 390px, 600px and desktop layout checks pass.

## Agenda views

Agenda now provides My day, Week and Month tabs, a date picker, previous/next period navigation, a Today action and one bottom-right add button. Completion filters are available under the options menu. Week view groups occurrences Monday–Sunday; month view shows dated task counts and the selected day's tasks. New tasks inherit the selected date. Existing task IDs, one-off completion and all recurrence rules are preserved, with completion stored separately for each occurrence. This interface change keeps the existing browser-local planner storage.

Regression coverage includes occurrence completion isolation, filtered month counts, selected-date creation, leap-month navigation, year rollover and keyboard tab selection. Phone and desktop layouts were checked in the local preview.


## Home and mobile navigation

Home includes day timelines and a monthly calendar with lunar dates. The former weekly agenda has been removed. Month dates toggle the inline add row. Habits support custom emoji and three transparent character icons. Mobile navigation uses Home, PTE, Reading, Archive and Me; Me opens the existing profile.

Home countdowns use rex-home-countdown-targets-v1. PTE countdowns retain rex-countdown-targets-v1 and require only an exam date. Existing records are retained; PTE dates are never automatically copied into the Home countdown list. D1 countdown IDs beginning home-countdown: are routed only to Home. Home category and pin fields survive a sync round-trip.

PTE reminders are opt-in per device. The nearest upcoming PTE date schedules notifications at 22:00 Australia/Sydney on the seven days before the exam, excluding exam day. Date changes/deletions cancel or replace the schedule. A separate authenticated reminder slot shares the existing push subscription without replacing focus alarms. Disabling notifications cancels both types. iPhone requires installation on the Home Screen and notification permission. Live delivery depends on the device and push service. Deploy the updated existing Worker before publishing the frontend, preserving all secrets and the CALENDAR Durable Object binding.

Asset cache version rex-focus-offline-20261112-planner-sync2 replaces only owned application resource caches; user records, attachments and recovery backups are retained. Character icon artwork uses transparent assets from PokeAPI/sprites (official-artwork 877, 10187, 10024); Pokémon artwork belongs to its respective owners.

D1 service source is tracked in workers/sync-worker.mjs. Deploy the Worker before the frontend. Schema version 3 adds validated per-task and per-habit planner records, including completion history and display order. No D1 table migration is required; the existing DB binding and all revisions are preserved.


Calendar annotations are bundled locally from lunar-javascript 1.7.8 (MIT; licenses/lunar-javascript.txt), with no dependency on browser Intl Chinese-calendar support. Build calendar-labels.js using node scripts/build-calendar.cjs. Supported annotation years: 1900–2100. The display prioritizes a major holiday, then a Chinese solar term, then the lunar day; the full lunar date and all coincident labels remain in the accessible description.

China annotations cover New Year, Labour Day, National Day and selected traditional lunar festivals including New Year’s Eve, Spring Festival, Lantern Festival, Dragon Boat, Qixi, Mid-Autumn, Double Ninth and Laba, plus the 24 solar terms. Australia annotations are limited to New Year, Australia Day, Good Friday, Easter Sunday/Monday, Christmas and Boxing Day. These are festival dates, not a state-specific legal leave or substitute-holiday calendar. Date references: https://www.hko.gov.hk/sc/gts/time/conversion.htm and https://www.fairwork.gov.au/employment-conditions/public-holidays/2026-public-holidays .

PTE dates appear as separate PTE annotations in Home day/month calendars. Opening an exam annotation routes to PTE Countdown; it does not create a Home countdown or task. Focus records remain classified independently.
