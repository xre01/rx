# Rex World · Study Sanctuary

An English study dashboard with PTE practice, a study calendar, countdown events, a focus timer, activity statistics and daily reflections.

## Storage

- Cloudflare D1: question counts, eligible focus sessions, countdown events and study dates. Sessions shorter than 60 seconds are excluded.
- Notion: practice notes, reflections and attachments, through the configured Notion Worker.
- Browser: drafts, practice settings, avatar and connection preferences. Local drafts and settings do not transfer automatically to another browser.

Connect D1 once using the Worker URL and your own sync key. Changes sync automatically; **Sync Now** requests an immediate sync. Keys are entered in the website and never shipped in source files. Configure the Notion service separately in **Notion Archive**.

## Deployment

Publish the main branch root with GitHub Pages. The D1 synchronization Worker is deployed separately to Cloudflare. Open the HTTPS website online once to prepare the offline cache. Cloud services require a connection. Releases replace the old application cache without deleting personal study records.

## Validation

Validated with 19 automated checks covering D1 record validation, authentication, cross-device synchronization, conflicts, deletions and migration. Browser checks cover practice counts, timer completion, statistics periods, countdown events and reflection drafts/links. Live attachment upload to Notion was not verified in this release.

Only the current background, default avatar and application icon are shipped. No retired login, hanging crystal, theme variants, hourglass images, local secrets, screenshots, drafts or backups are included.
