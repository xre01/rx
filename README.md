# Rex World · 

A lightweight study app with Home planning, PTE practice, reading notes, dated study timelines, reflections, focus timing and Notion/D1 sync.

## Features

- Speaking uploads: DI, SGD and RL use images plus audio; RTS uses a prompt plus audio. Today and past dates use the same submission flow.
- WE and Reading use upload dialogs with question navigation; Reading also supports batch mistake screenshots.
- Count-only backfills are separate from attachment submissions. Home’s Reflection icon opens the reader/editor/history; drafts and files remain local until saved to Notion.
- Weekly Review includes recorded local counts and backfills. PNG exports support day, Monday–Sunday week, month and year.
- The PTE study timeline opens from its header icon. Five dates per page are grouped by year; day details show practice/focus totals and saved Notion check-ins, with on-demand audio/images. Search reads saved check-in content and reports partial results.
- One stylesheet and six themes, with illustrated mobile navigation that blends into each theme’s page background. Reduced-motion preferences are respected.

## Storage and sync

PTE files are selected for explicit submission; they are not a persistent offline upload queue. Reflection files are stored in IndexedDB. Unsynced records remain tied to the browser and site origin.

Notion and Cloudflare D1 require the user's existing service configuration. Notion receives notes and attachments; D1 receives dashboard metrics, My Day tasks and Habits. No credentials are included in the source. D1 data stays on this device until D1 is connected, then changes sync automatically while online.

## Validation

Local checks cover syntax, resource references and hashes, historical speaking upload payloads with mocked responses, duplicate submissions, date validation, count backfills, archive search with mocked content, PNG period aggregation including leap years, and service-worker cache behavior. Browser checks cover view switching, icon-driven readers, profile connections, theme navigation, timers and mobile layout.

Live Notion/D1 integration needs the user's configured service and was not exercised by creating remote test records. GitHub Pages serves the committed frontend; Cloudflare Workers require a separate deployment.

## Reading journal

Reading is a native navigation panel alongside Home and PTE. Its bookshelf shows three 2:3 covers per row with shelf dividers. Article notes appear in a year-grouped timeline, five per page; selecting one opens a full reader. Search, tags and image/audio/document/link attachments are supported.

Reading and PTE share the My World Notion database through the existing authenticated Cloudflare gateway. `Type` separates `Reading`, `PTE` and future `Work` records. Reading still uses `/api/reading/*` and PTE still uses `/api/entries`; frontend records, statistics and XP stay separate. Configure the gateway once under Me → Notion; Reading shares that connection and aborts requests when it changes or disconnects. The server-side Notion token stays in Cloudflare. Drafts and selected files are retained locally until sync succeeds. Me also contains D1 configuration; both services offer an optional remembered-key bookmark. Turning the bookmark off retains the current session while removing persistent key storage.

The already deployed reading API supports status, migration, record sync and authenticated media. Book/article metadata and sync receipts are stored in its existing Durable Object; Notion pages display readable notes, dates and source links. The gateway must retain this Durable Object state when deploying changes. Notes edited in Notion are not automatically imported into the website; edit reading content from the Reading panel.

Practice, reading and focus records no longer award XP. The Study Days card shows the number of completed practices. Reading deletions sync as tombstones and move Notion records to Trash.

## Rich notes release

Reading and PTE Speaking/Writing/Reading support native Notion text annotations and structured blocks. Listening is unchanged. Plain-text records remain supported. The six appearance themes remain device-local.

Frontend files are deployed by GitHub Pages. `workers/notion-worker.mjs` is the separately deployed Cloudflare source; keep the existing secrets and Durable Object bindings when updating it. No credentials belong in the repository.

Checks (run from the repository root):

```sh
node tests/reading-sync.cjs
node tests/pte-rich-sync.cjs
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

Home is now the default landing panel; PTE Prep, Reading and Notion Archive remain separate navigation entries. The homepage brings together a dated agenda (optional time and priority, completion filters, editing and deletion), important dates, custom daily habits with streaks and seven-day history, and shortcuts to study and focus. Habits also include monthly check-in totals, active days, a daily activity calendar and per-habit counts.

Planner tasks and habits are cached in `rex-home-planner-v1` and sync as separate versioned records to the configured Cloudflare D1 service. They do not award XP, change PTE question counts or sync through the study APIs or Notion. Deletions sync as tombstones; reconnecting another device restores its task and habit records. Important dates reuse `rex-countdown-targets-v1` and the existing dashboard sync. Dates and streaks follow Australia/Sydney calendar days; milestones show days remaining, today, or days elapsed. Storage failures retain open form inputs; unreadable planner storage blocks writes to preserve existing data.

Run `node tests/home-page.cjs` for the planner regression checks. After changing runtime assets, run `node scripts/version-assets.cjs` so HTML and service-worker hashes stay consistent.

Tasks support Repeat: Does not repeat, Daily, Weekdays (Monday–Friday), Weekly (the start date's weekday), and Custom days. Repeating tasks begin on the selected start date and store completion independently for each occurrence. Editing a recurring task changes its series; deleting it removes the series and its completion history. Existing one-off tasks remain supported.

For fixed-day cycles such as rent every 28 days, choose `Every N days` and enter the interval. Occurrences are calculated as start date plus multiples of that many calendar days, independently of month lengths and daylight-saving time. `Selected weekdays` remains the separate weekday-based option.

Home Focus totals all saved PTE, Reading and general Home focus records for the Sydney day, including saved partial sessions of at least a minute, with duplicate IDs excluded. Home's timer statistics show all areas. Reading statistics remain Reading-only; PTE statistics exclude both Reading and Home sessions. New general sessions started from Home use a `Home · ` source marker; existing unmarked sessions retain their legacy PTE classification. Opening another panel does not reclassify a running session.

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

The content-versioned asset cache replaces only owned application resource caches; user records, attachments and recovery backups are retained. Character icon artwork uses transparent assets from PokeAPI/sprites (official-artwork 877, 10187 and 10024). The Pokémon navigation also uses the [Hoenn Champion Ribbon via PokéSprite](https://msikma.github.io/pokesprite/overview/misc.html) and user-provided artwork of Ash and Pikachu. Pokémon artwork belongs to its respective owners.

D1 service source is tracked in workers/sync-worker.mjs. Deploy the Worker before the frontend. Schema version 3 adds validated per-task and per-habit planner records, including completion history and display order. No D1 table migration is required; the existing DB binding and all revisions are preserved.


Calendar annotations are bundled locally from lunar-javascript 1.7.8 (MIT; licenses/lunar-javascript.txt), with no dependency on browser Intl Chinese-calendar support. Build calendar-labels.js using node scripts/build-calendar.cjs. Supported annotation years: 1900–2100. The display prioritizes a major holiday, then a Chinese solar term, then the lunar day; the full lunar date and all coincident labels remain in the accessible description.

China annotations cover New Year, Labour Day, National Day and selected traditional lunar festivals including New Year’s Eve, Spring Festival, Lantern Festival, Dragon Boat, Qixi, Mid-Autumn, Double Ninth and Laba, plus the 24 solar terms. Australia annotations are limited to New Year, Australia Day, Good Friday, Easter Sunday/Monday, Christmas and Boxing Day. These are festival dates, not a state-specific legal leave or substitute-holiday calendar. Date references: https://www.hko.gov.hk/sc/gts/time/conversion.htm and https://www.fairwork.gov.au/employment-conditions/public-holidays/2026-public-holidays .

PTE dates appear as separate PTE annotations in Home day/month calendars. Opening an exam annotation routes to PTE Countdown; it does not create a Home countdown or task. Focus records remain classified independently.


### Undated lists and task deadlines
Home's checklist tab beside Month shows undated tasks. The existing plus button opens the same form; a blank Date places a task in the checklist. Tasks with a scheduled time or repeat rule require a date. Due date and due time are independent optional fields, and rollover preserves the original deadline. Recurring deadlines follow the occurrence's offset from the series start.
Checklist completions save completedAt in milliseconds, displayed in Australia/Sydney time. Completing all subtasks completes the parent. Reopening a task clears its completion time; completing it again records a new time. Legacy completed records with no timestamp show only Completed. Completed checklist tasks sort newest first, then older/legacy completions, followed by unfinished tasks.
Deploy workers/sync-worker.mjs before publishing the frontend. Its plannerLists, plannerDeadlines and plannerCompletionTimes capabilities enable the additional validated fields in the existing records table. The frontend retains pending changes locally while connected to an older Worker. No D1 migration is required. Task date/checklist conversion preserves subtask completion state. The music feature was removed before release.


## Save recovery, sync reliability and startup loading

Focus sessions report a successful local save only after storage accepts the record. A failed save retains the original session ID and offers Retry save; when browser storage permits, the paused timer also retains that pending record across reloads. Retrying merges with the current focus history and deduplicates already saved IDs. If browser storage is completely unavailable, keep the page open until retry succeeds.

Dashboard sync coordinates tabs with Web Locks where available, reloads shared queue state inside the lock, and captures local edits again after network waits. Conflicts retain both versions and offer Keep my version or Use D1 version in Connections. Network/server failures retry with bounded backoff; invalid credentials stop automatic retries. A successful response with no pending records is required before reporting Synced to D1. Notion requests have a 20-second timeout, honor short Retry-After delays, and retry reads/query requests; ambiguous writes return to the existing submission/receipt flow instead of being replayed automatically.

The theme applies before rendering; remaining initial scripts preserve their dependency order with defer. Reading's editor loads on the first reader/editor action, and PNG export loads on first use. Failed feature loads can be retried. The service worker first installs the core app, then fills the editor/export and seasonal-image cache after page startup. The offline status reports full readiness only after this optional cache completes. Existing records, credentials and attachment stores are retained.

Build with pnpm build and run pnpm test. Deployment uses the existing GitHub Pages frontend and separately deployed workers/notion-worker.mjs; preserve all existing Worker secrets, bindings and Durable Object state. This update does not require a D1 schema change.


## Connection switches

Notion and D1 connection controls use capsule switches with a white thumb, green enabled track, press feedback and drag-to-set interaction. Tapping, dragging, Space/Enter and directional keys use the same existing connection/disconnection handlers. Short drags snap back, vertical scrolling/cancelled gestures leave the service unchanged, and syncing disables the switch. The adjacent manual-sync button and the existing credential/disconnection behavior remain unchanged. Reduced-motion preferences disable transitions.
