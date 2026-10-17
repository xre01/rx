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
