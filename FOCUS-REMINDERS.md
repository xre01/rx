# Focus lock-screen reminders

Open Focus Timer → Lock-screen reminders → Enable reminders. Connect Notion once in this browser before setup (the existing gateway passphrase authorizes device enrollment). After enrollment, reminders use a separate device-only key; the Notion passphrase is not stored in the reminder database.

On iPhone/iPad, add Rex World to the Home Screen from Safari, open the installed app, then enable notifications. Use **Test in 10 seconds** and lock the screen to verify delivery on the actual device. Notifications need network access and system permission; Focus modes, notification settings and connectivity can delay or suppress delivery. This is Web Push, not an iPhone AlarmKit alarm.

Starting/resuming a countdown schedules a Cloudflare Durable Object alarm. Pause, end or switching to stopwatch cancels it. The UI confirms when scheduling succeeds. Offline changes remain pending until the app reconnects; a previously scheduled reminder cannot be cancelled remotely while offline. Timer records and D1 record sync are independent of notification setup.

The existing `CALENDAR` binding handles isolated `focus:<random device id>` objects; no new Cloudflare binding is needed. Each device receives a private capability and its own VAPID key pair. Push carries an empty payload; the service worker retrieves only this device's timer state. Notes, goals and Notion credentials are not sent to the push service. Push endpoints are restricted to supported browser push providers.

Transient push-provider failures retry through Durable Object alarms. Notifications expire after a short window instead of delivering a stale timer alarm much later. Disable reminders revokes the endpoint and cancels the pending cloud alarm. Reinstalling/clearing browser data may require enabling again.

Validation: `tests/focus-push.cjs`, `tests/focus-push-client.cjs`, `tests/focus-push-sw.cjs` cover authenticated enrollment, URL restrictions, VAPID signatures, schedule/cancel/retry, client transitions, offline pending changes and notification clicks. Actual iPhone lock-screen delivery requires the physical-device test above.

Compatibility: Workers outbound fetch uses `redirect: manual` and never follows push-provider redirects. The optional RFC 8030 Topic header is omitted after Apple rejected it with `400 BadWebPushTopic`; notification tags and reminder revisions still suppress duplicates. Provider rejection codes are retained in device reminder state and safe status-only logs; subscription endpoints and device keys are never logged by this feature.
