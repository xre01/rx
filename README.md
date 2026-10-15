# Rex World · Study Sanctuary

An English study dashboard with PTE practice, a study calendar, countdown events, a focus timer, activity statistics and daily reflections.

## Storage

- Cloudflare D1: question counts, eligible focus sessions, countdown events and study dates. Sessions shorter than 60 seconds are excluded.
- Notion: practice notes, reflections and attachments, through the configured Notion Worker.
- Browser: drafts, practice settings, avatar and connection preferences. Local drafts and settings do not transfer automatically to another browser.

Connect D1 once using the Worker URL and your own sync key. Changes sync automatically; **Sync Now** requests an immediate sync. Keys are entered in the website and never shipped in source files. Configure the Notion service separately in **Notion Archive**.

## Deployment

Publish the main branch root with GitHub Pages. The D1 Worker source and schema in `worker/` deploy separately to Cloudflare. Open the HTTPS website online once to prepare the offline cache. Cloud services require a connection. Releases replace the old application cache without deleting personal study records.

## Validation

```
node tests/dashboard-sync.cjs .
node --test --experimental-test-isolation=none worker/worker.test.mjs
```

Only the current background, default avatar and application icon are shipped. No retired login, hanging crystal, theme variants, hourglass images, local secrets, screenshots, drafts or backups are included.
