# Rex World · Study Sanctuary

A static English study dashboard with PTE practice, Notion attachments, a study calendar, countdown events, focus sessions and daily reflections.

## Current release

2026-10-16-mint-feather-1 uses a sage, mist-blue and ivory theme with restrained champagne-gold accents. Click **Rex World** to open the focus timer. Decorative feathers share one animation loop, update at most 30 times per second, and pause while scrolling, off screen, in the background or when reduced motion is preferred.

The default transparent avatar is a 17 KB WebP. No background photograph, external web font, rose, diamond, retired theme artwork or preview copy is shipped.

## Uploads and storage

- Choose attachments, review the filenames and use **Remove** for any incorrect selection. PTE uploads start only when **Sync** is clicked. Images and media previews update after removal.
- Notion attachments are sent through the configured Worker in idempotent batches of at most five files. PTE supports up to 15 images plus audio, at most 20 MiB in total. Generic practice and reflection forms permit up to 15 attachments.
- Cloudflare D1 stores dashboard counts, eligible focus sessions, countdown events and study dates. It is a separate service from Notion. Dashboard changes sync automatically only after the user configures that service.
- Drafts, practice settings, avatar and connection preferences remain in browser storage. Reflection drafts and their files are saved in IndexedDB. PTE file selections are temporary; they are not a persistent offline upload queue.
- Keys are entered by the user and are not included in the repository. Remembering a Notion key is optional and stores it only in that browser.

## Publish and offline use

Publish the **main** branch root through GitHub Pages. Open the HTTPS site online once to install its offline cache. New releases remove only old application caches; personal study records in local storage and IndexedDB are retained. Notion and D1 still need an internet connection. HTTPS Workers are deployed separately.

## Release validation

The release was checked with a DOM adapter, fake local IndexedDB, a controlled clock, mocked network requests and service-worker cache mocks. Checks cover application startup, practice module switching, repeat-task progress, count persistence, navigation, avatar/profile controls, focus timing and statistics, countdown add/delete, calendar navigation, attachment removal, explicit PTE uploads, Notion batching/retries/deletion reconciliation, D1 synchronization/disconnect, reflection drafts, resource hashes and offline cache behavior.

These checks do not create records in a live Notion workspace or deploy a Cloudflare Worker. Browser rendering and live backend integration are separate from the mocked checks.
