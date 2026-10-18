# Rex World · Study Sanctuary

A lightweight English PTE dashboard with daily and weekly views, calendar backfills, reflections, focus timing, Notion archives and PNG statistics exports.

## Features

- Speaking uploads: DI, SGD and RL use images plus audio; RTS uses a prompt plus audio. Today and past dates use the same submission flow.
- WE and Reading use upload dialogs with question navigation; Reading also supports batch mistake screenshots.
- Count-only backfills are separate from attachment submissions. Reflections follow the selected calendar date and store drafts and files locally.
- Weekly Review includes recorded local counts and backfills. PNG exports support day, Monday–Sunday week, month and year.
- Notion Archive uses a calendar, content search and attachments loaded on demand. Search indexes the records returned by the configured service and indicates incomplete results.
- One stylesheet, no live backdrop blur, and lightweight feather animation above Rex World. Reduced-motion preferences are respected.

## Storage and sync

PTE files are selected for explicit submission; they are not a persistent offline upload queue. Reflection files are stored in IndexedDB. Local records remain tied to the browser and site origin.

Notion and Cloudflare D1 require the user's existing service configuration. Notion receives notes and attachments; D1 receives supported dashboard metrics. No credentials are included in the source. Nothing uploads until the relevant sync action or configured metrics sync runs.

## Validation

Local checks cover syntax, resource references and hashes, historical speaking upload payloads with mocked responses, duplicate submissions, date validation, count backfills, archive search with mocked content, PNG period aggregation including leap years, and service-worker cache behavior. Browser checks cover view switching, calendar-linked reflections, upload dialogs, profile, timer and mobile layout.

Live Notion/D1 integration needs the user's configured service and was not exercised by creating remote test records. The GitHub review branch does not deploy the website.

## Reading journal

Reading is a native sidebar panel alongside PTE and Notion Archive. It includes a bookshelf with dated book notes, article notes selected from a calendar, search, and image/audio/document/link attachments. Clicking the selected calendar date again collapses its notes.

Reading uses a separate Notion database through the existing authenticated Cloudflare gateway at `/api/reading/*`. Enter the gateway access key under Reading's Notion settings; the server-side Notion token stays in Cloudflare. Drafts and selected files are retained locally until sync succeeds. Reading credentials are session-scoped; existing Notion Archive session credentials can prefill the Reading connection. Test records were removed before release.

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
