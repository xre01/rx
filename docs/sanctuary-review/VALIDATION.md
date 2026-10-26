# Sanctuary reference polish

Based on PR #10 commit f9b8a7b7b3828f1c3988cc9320b440abbc1f5971.

Fix stylesheet specificity, cream/mist-blue/champagne colors, card proportions, sidebar badge, reference-image landscape and leaf decoration. Keep calendar activity, selected date, today border, keyboard focus and hidden view states distinct. Add a read-only weekly chart using the existing RexDashboardStore API. Cache the new presentation resources for offline use; cache handlers and authentication exclusions are unchanged.

## Validation

All 27 pre-existing tests/*.cjs scripts passed. New sanctuary-presentation test passed: real store totals, refresh, empty counts, Sydney today and existing storage retention.

Chromium rendering at 1672, 1280, 1024, 768, 760, 600, 390 and 320 CSS pixels: no horizontal overflow. Desktop/mobile screenshots in this directory.

Listening count save/reload, reflection draft reload, timer open/start/pause/close, countdown dialog, calendar previous month/return to today, weekly view visibility, PNG generation, Reading and Archive navigation passed with no page script errors.

Existing tests cover Notion attachment/retry/conflict behavior, D1 round trips, offline queues, reading records, XP, push and resource cache exclusions.

## Limits

No live Notion or D1 credentials were supplied; live server authentication and writes were not exercised. Existing synchronization, data schema and record-processing source files are unchanged.

This is not pixel-identical: the reference contains an intensity legend and alternate countdown formatting that differ from the app. Original behavior takes priority; no fake controls or fabricated study data were introduced. Weekly chart displays actual counts, including zeroes.

Screenshots use an isolated empty browser profile; interaction checks used disposable local test records. No user account or existing learning records were accessed. No merge or deployment to main.

## Practice layout follow-up

Match the detail reference with a two-column grid, blue SVG icons, type descriptions and compact minus/input/plus controls. Steppers use the existing native numeric input and emit normal input/change events; the original Log Today form still owns persistence. No autosave or synchronization behavior changes. Browser checks include the increment control, persistence and all eight viewport widths.

## Speaking layout follow-up

DI, SGD, RL and RTS now use a two-column icon/title/description card grid. Existing completed/target inputs, upload and delete controls retain their original DOM nodes and handlers. Narrow cards switch to one column using a container query. All eight viewport checks and the existing browser smoke flow passed; no page script errors. No data or sync source changes.
