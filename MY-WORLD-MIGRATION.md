# My World calendar

Destination: the existing Reading and growth database under My world, already configured in the Worker. Reuse it; do not create another database.

Required properties: existing Name/title, Date/date and Tags/multi-select; add Type/select (`PTE`, `Reading`, `Work`), RecordKind/select (`Book`, `Article`, `Reading day`), RecordKey/rich-text. The calendar shows Name and Type. Keep an unfiltered total calendar and optional PTE/Reading filtered calendars.

## Deployment and migration order

1. Add the properties and rename the existing database My World. These changes are compatible with the old Worker.
2. Deploy `workers/notion-worker.mjs` to the existing `rex-notion-calendar` Worker. Preserve all secrets, variables, bindings, migrations and Durable Object namespaces. In particular, **do not change NOTION_DATA_SOURCE_ID or NOTION_DATABASE_ID**: they identify the legacy PTE source and its existing serialization/receipt object. The original reading object name is also unchanged. The new Notion destination is selected in code, independently of those identities.
3. Confirm authenticated `GET /api/reading/status` reports `calendarSchemaVersion: 1`. Check both record APIs before moving anything. New PTE records go to My World; legacy PTE pages remain readable while the migration runs.
4. Set Type=PTE on the legacy Daily Practice pages, then move the actual pages into My World. A compatible Type/select property may be added to the legacy source first. Preserve page IDs, original dates (including unset dates), titles, Tags, blocks and attachments; do not duplicate pages or rewrite their contents. The gateway's existing receipts continue referencing those same IDs.
5. Authenticated `POST /api/reading/calendar-migrate` tags recognized reading records and creates book-day calendar entries from their real log dates. This endpoint runs in the existing reading Durable Object, preserving its exact rich documents and sync metadata. Resolve any reported Notion conflicts rather than overwriting content. Retry is safe; inspect `unrecognized` before declaring coverage complete.
6. Verify migrated IDs/counts, preserved dates/attachments, PTE-only archive results, and original book/article counts from Reading. Re-query the legacy source to catch writes made during the migration. Keep the empty legacy database for rollback compatibility.

## Book dates

A book remains one original website record with its full notes and attachments. Each distinct note date has a `Reading day` calendar entry in the same database, linked to that original book. These entries are excluded from Reading's API so they cannot create duplicate books or XP. They follow website edits, renames and deletions. Articles keep their existing single-date record. Undated books/pages retain unset dates rather than inventing dates.

Validation: `pnpm test`, `node tests/my-world-sync.cjs`, `node tests/activity-separation.cjs`, `node tests/reading-xp.cjs`, `node tests/pte-xp.cjs`.
