# Focus XP

Every 300 saved focus seconds earns 1 EXP, capped at 30 EXP per Sydney calendar day. Completed sessions and early-ended sessions both count. Paused/unsaved time does not count. Existing saved history is included when this rule is first loaded.

Seconds accumulate across sessions on the same day; incomplete five-minute portions do not carry to another day. A session belongs to the day it ended, matching dashboard records. The total is derived from current saved records, not awarded again on each sync. Duplicate IDs are ignored; deleting records recalculates the daily capped award and removes only the corresponding Focus XP contribution. PTE and Reading XP remain separate contributions.

The existing D1 focus/abandoned records are sufficient: each device recalculates Focus XP after sync, so no D1 schema change is required. The timer shows today's awarded Focus XP and daily cap.

Validation: `node tests/focus-xp.cjs` covers rates, combined partial sessions, cap/deletion behavior, Sydney midnight, duplicate/future records, cloud updates, idempotency and preservation of PTE/Reading XP.
