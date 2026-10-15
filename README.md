# Rex World · Study Sanctuary

An English study dashboard with PTE practice, a study calendar, countdown events, a focus timer, activity statistics and daily reflections.

## Storage

- Cloudflare D1: question counts, eligible focus sessions, countdown events and study dates. Sessions shorter than 60 seconds are excluded.
- Notion: practice notes, reflections and attachments, through the configured Notion Worker.
- Browser: drafts, practice settings, avatar and connection preferences. Local drafts and settings do not transfer automatically to another browser.

Connect D1 once using the Worker URL and your own sync key. Changes sync automatically; **Sync Now** requests an immediate sync. Keys are entered in the website and never shipped in source files. Configure the Notion service separately in **Notion Archive**.

## Deployment

Publish the main branch root with GitHub Pages. The D1 synchronization Worker is deployed separately to Cloudflare. Open the HTTPS website online once to prepare the offline cache. Cloud services require a connection. Releases replace the old application cache without deleting personal study records.

## Release 2026-10-16-audit-1

Retains the rotating 32-facet diamond, handwritten wordmark and continuous feather flow. Removes retired graphics, old navigation and unused styles. Fixes midnight practice dates, Notion deletion reconciliation, lazy archive attachments and query-string offline navigation.

## Validation

Automated checks cover the dashboard modules, midnight drafts, 15-image batching, Notion deletion reconciliation, reflection drafts, archive refresh, and D1 record validation, authentication, cross-device synchronization, conflicts, deletions and migration. Browser checks cover practice counts, timer completion, statistics periods, countdown events and reflection drafts/links. Attachment batching is verified with mocked requests; this release does not create test records in a live Notion workspace. Offline D1 changes retry when connected. PTE file selections are not a persistent offline upload queue; reflections still require Save to Notion.

Only the current background, default avatar and application icon are shipped. No retired login, hanging crystal, theme variants, hourglass images, local secrets, screenshots, drafts or backups are included.
