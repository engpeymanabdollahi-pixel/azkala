# Azkala — Android TWA (Trusted Web Activity) Setup

This document is the single source of truth for turning the Azkala PWA into
a Google Play–distributed Android app via a Trusted Web Activity. It was
written during the "TWA Infrastructure Preparation & PWA Hardening" pass —
every item marked **TODO / REQUIRED BEFORE PRODUCTION** is genuinely
unknown/undone as of this writing; nothing here is invented.

> **HTTPS is not configured, therefore final TWA verification and Google
> Play readiness cannot yet be confirmed.** Every phase below that depends
> on a live production HTTPS domain is explicitly marked as blocked.

---

## 1. Prerequisites

| Item | Status |
|---|---|
| PWA (manifest + Service Worker) | ✅ Ready — see `frontend/public/manifest.json`, `frontend/public/sw.js` |
| Node.js + npm (for Bubblewrap CLI) | Assumed available on the machine that builds the Android app — not part of this repo |
| JDK 17+ (Bubblewrap/Gradle requirement) | **TODO / REQUIRED BEFORE PRODUCTION** — install on the build machine |
| Android SDK / Android Studio (optional, for manual builds) | **TODO / REQUIRED BEFORE PRODUCTION** |
| A Google Play Console developer account | **TODO / REQUIRED BEFORE PRODUCTION** |

## 2. Production HTTPS requirement

**TODO / REQUIRED BEFORE PRODUCTION.** A TWA is a thin Android wrapper
around Chrome pointed at a real HTTPS origin — without it, nothing else in
this document can be completed:

- Digital Asset Links verification (§6) only works over HTTPS.
- The Android OS refuses to treat an HTTP origin as "verified" — the app
  would fall back to showing browser UI (address bar), defeating the point
  of a TWA.
- `frontend/src/lib/apiConfig.ts` now actively **refuses to build/run** in
  production without an `https://` `VITE_API_URL` (see §4/§9) — this was
  changed specifically because relying on it silently accepting HTTP was
  the previous risk.

Nothing here provisions a certificate, changes DNS, or touches any
production server — that remains an infrastructure task outside this
repository's scope.

## 3. Production domain

**TODO / REQUIRED BEFORE PRODUCTION.** No production domain is recorded
anywhere in this repository (`backend/.env.example`'s `APP_URL` and
`frontend/.env.example`'s `VITE_API_URL` both only carry local dev
defaults). Once chosen:

- Set `frontend/.env` (production build environment) → `VITE_API_URL=https://<api-domain>`.
- Set `backend/.env` (production) → `APP_URL`, `FRONTEND_URL`, `SANCTUM_STATEFUL_DOMAINS`, `SESSION_DOMAIN` to the real domain(s).
- Replace `PRODUCTION_DOMAIN_PLACEHOLDER` in `android-twa/twa-manifest.json` and `frontend/public/.well-known/assetlinks.json`'s eventual real values.

## 4. Android package name

**TODO / REQUIRED BEFORE PRODUCTION.** Not chosen yet. This is a
one-time, irreversible decision (Google Play does not allow changing an
app's `applicationId` after first publish). Convention: reverse-DNS, e.g.
`com.azkala.app` or `ir.azkala.app`. Once chosen, replace
`PACKAGE_NAME_PLACEHOLDER` in `android-twa/twa-manifest.json` and in the
final `assetlinks.json`.

## 5. Signing certificate SHA-256

**TODO / REQUIRED BEFORE PRODUCTION.** No signing key exists in this
repository (and per this task's constraints, none was generated — private
keys must never be committed; `.gitignore` was updated to exclude
`*.keystore`/`*.jks` and `android-twa/.bubblewrap/`). To obtain the
fingerprint once a release keystore exists:

```bash
keytool -list -v -keystore <your-release-key>.keystore
# → look for "SHA256:" under the certificate fingerprints
```

If distributing through **Google Play App Signing** (recommended), use the
SHA-256 shown on the Play Console's *App signing* page instead of your own
upload key's fingerprint — that is the certificate that actually signs the
APK end users receive.

## 6. Digital Asset Links

**Template prepared, not final.** See:

- `frontend/public/.well-known/assetlinks.json` — syntactically valid
  Digital Asset Links statement list with `PACKAGE_NAME_PLACEHOLDER` /
  `SHA256_CERT_FINGERPRINT_PLACEHOLDER`.
- `frontend/public/.well-known/README.md` — explains why it lives there
  (frontend origin, not the API origin) and how it reaches production
  automatically once the frontend is built and deployed (Vite copies
  `public/` verbatim; `frontend/nginx.conf`'s `try_files` serves it as a
  static file before falling back to the SPA shell).

**FINAL `assetlinks.json` cannot be generated until Android package name
and signing certificate SHA-256 are known.**

Once both are known:

1. Edit `frontend/public/.well-known/assetlinks.json`, replacing both
   placeholders with real values.
2. Deploy the frontend normally (no separate deploy step needed — it is a
   static file in `public/`).
3. Verify: `curl -s https://<production-domain>/.well-known/assetlinks.json`
   must return the real JSON (not the placeholder), with `Content-Type:
   application/json`.
4. Verify with Google's tool: `https://developers.google.com/digital-asset-links/tools/generator`.

## 7. Bubblewrap setup

**Prepared, not run** (needs the live domain from §2/§3 to fetch
`manifest.json` from). See `android-twa/README.md` for the full command
sequence. Summary:

```bash
npm install -g @bubblewrap/cli
bubblewrap init --manifest="https://<production-domain>/manifest.json"
# use the values already recorded in android-twa/twa-manifest.json when prompted
bubblewrap build
```

## 8. Build steps

1. Complete §2–§7 above.
2. `bubblewrap build` produces a signed `.aab` (Android App Bundle) using
   the keystore referenced in `twa-manifest.json`'s `signingKey`.
3. Confirm `assetlinks.json` is live and correct (§6, step 3) **before**
   uploading — Play Console will flag digital asset link failures during
   review otherwise.

## 9. Local testing

Before touching Android at all, the web app itself must behave correctly
as a PWA:

```bash
cd frontend
npm run build            # requires VITE_API_URL=https://... in the env — see apiConfig.ts
npm run preview           # serves the production build locally
```

Open the preview URL in Chrome DevTools → Application tab:
- **Manifest**: no errors, icons load, `theme_color` matches `#0d9488`.
- **Service Workers**: registered, activated, no console errors.
- **Lighthouse → PWA audit**: should pass installability checks.

Once an `.apk`/`.aab` exists (§8), install on a physical Android device or
emulator via `bubblewrap install` and confirm the app opens **without a
Chrome address bar** (that address bar appearing means Digital Asset Links
verification failed — check §6 again).

## 10. Internal testing

**TODO / REQUIRED BEFORE PRODUCTION.** Upload the `.aab` to Google Play
Console's **Internal testing** track. Add tester emails. This requires a
Google Play Console developer account (§1) which does not exist in this
repository's scope to create.

## 11. Play Console deployment checklist

**TODO / REQUIRED BEFORE PRODUCTION** — none of the following can be
started without §2–§5:

- [ ] Store listing (title, short/full description, screenshots — see §12
      note on Push, and the general PWA audit's note that `manifest.json`
      has no `screenshots`/`shortcuts` array; Play Store screenshots are
      uploaded separately in Play Console regardless, so this is not
      strictly blocking)
- [ ] Content rating questionnaire
- [ ] Target audience & content settings
- [ ] Data safety form (what data Azkala collects — auth, orders, uploads,
      push subscriptions; fill in honestly based on the actual backend
      behavior, not assumed)
- [ ] Privacy policy URL (`frontend` already has `/privacy` — confirm it is
      reachable at the real production domain)
- [ ] App signing opt-in (Play App Signing recommended, §5)
- [ ] Digital Asset Links verified (§6)
- [ ] Internal testing track passed (§10) before any wider release

## 12. Push notification setup

**Backend and Service Worker: implemented. Frontend wiring: now
implemented in this task** (`frontend/src/services/pwa/usePushNotification.ts`,
`frontend/src/services/api/pushSubscription.service.ts`, rendered as
`PushNotificationButton` in `AdminSettingsPage.tsx`'s "اطلاع‌رسانی" tab).

**Real, current constraint — not a TODO, an architectural fact:** the only
existing push routes (`POST /admin/push/subscribe`, `DELETE
/admin/push/unsubscribe/{id}`, `POST /admin/push/test`, `GET
/admin/push/vapid-public-key`) live under `routes/api.php`'s `admin` group,
gated by the `admin` middleware **and** `permission:support.manage`. That
means:

- Only an authenticated `users.role=admin` user who also holds the
  `support.manage` Administrative Permission can subscribe/unsubscribe —
  this is currently an **admin/support-staff feature** (e.g. get notified
  the instant a new support ticket arrives), not a customer-facing "get
  notified about your order" feature.
- This is why the button was wired into the admin settings page, not a
  customer-facing page — rendering it anywhere else would always fail with
  403.
- **TODO / REQUIRED BEFORE PRODUCTION** *(only if customer-facing push is
  actually wanted)*: a deliberate, separate architecture decision to add a
  customer-scoped subscribe/unsubscribe route (reusing
  `PushSubscriptionService`, which is already generic) — out of scope for
  this TWA-preparation task, which was explicitly told not to add new
  endpoints or change authorization.

**TODO / REQUIRED BEFORE PRODUCTION:** `VAPID_PUBLIC_KEY` /
`VAPID_PRIVATE_KEY` are not set in any real `.env` (only empty placeholders
now exist in `backend/.env.example`). Generate with:

```bash
npx web-push generate-vapid-keys
```

Without these, `GET /admin/push/vapid-public-key` returns a null
`publicKey`, and `usePushNotification`'s `subscribe()` now fails with a
clear, explicit error message (`کلید VAPID سرور تنظیم نشده است...`) instead
of a confusing silent failure.

## 13. Deep link testing

**Ready to test, not HTTPS-dependent for the SPA-fallback mechanics.**
`ProtectedRoute` (`frontend/src/App.tsx`) now preserves the intended
destination (path + query string + hash) and returns to it after a
successful login (see the PWA audit and this task's §4 changes) — for
example, opening `/dashboard/orders` while logged out shows the login
modal, and a successful login navigates back to `/dashboard/orders`, not
just `/`.

Test matrix once a domain exists:

| Scenario | Expected |
|---|---|
| Direct navigation to `/products/some-slug` (logged out) | Product page loads normally (public route) |
| Browser/TWA refresh on any deep route | Same page reloads (requires server-side SPA fallback — already correct in `frontend/nginx.conf`'s `try_files`, **only if that exact nginx config is what production actually runs** — verify this on the real server, it cannot be verified from this repo) |
| Direct navigation to `/dashboard/orders` (logged out) | Redirected to `/`, login modal opens, then **redirected back to `/dashboard/orders`** after successful login |
| Direct navigation to `/admin` (logged in as non-admin) | Redirected to `/` (existing `requireAdmin` behavior, unchanged) |
| Push notification click → SW's `notificationclick` → opens `url` from payload | Already implemented in `sw.js`, unchanged by this task |

## 14. Authentication testing

Covered functionally by the deep-link fix (§13). Additional TWA-specific
checks once an `.apk` exists:

- [ ] Login inside the TWA (Chrome Custom Tab context) sets the session
      cookie correctly — requires `SANCTUM_STATEFUL_DOMAINS`/`SESSION_DOMAIN`
      to be set to the real production domain (**TODO / REQUIRED BEFORE
      PRODUCTION** — currently only dev values exist).
- [ ] Killing and reopening the TWA app (simulating Android reclaiming the
      process) still shows the user as logged in — relies on the session
      cookie + `checkAuth()` on app start (`App.tsx`), already implemented
      and unaffected by this task.

## 15. File upload testing

No code changes were made in this task (the prior PWA audit already found
`ImageUploader.tsx`'s `accept="image/*" multiple` and
`BulkUploadModal.tsx`'s `accept=".xlsx,.xls,.csv"` to be TWA/Chrome-Android
compatible as-is). Once an `.apk` exists:

- [ ] Product image upload opens the Android camera/gallery picker
- [ ] Seller bulk-upload (`.xlsx`/`.csv`) opens the Android file picker and
      completes successfully

## 16. Payment testing (after connecting a real gateway)

**Not applicable yet.** The prior PWA audit found no real Iranian payment
gateway connected — `OrderController.php`'s `payment_url` field is
currently a dead/unused hardcoded string with no matching route, and the
frontend never uses it. When a real gateway (e.g. Zarinpal) is connected in
the future:

- [ ] Confirm the gateway redirect opens inside the same Chrome Custom Tab
      (TWA's default behavior for external-domain navigation — no extra
      code should be required, but verify empirically once integrated)
- [ ] Confirm the gateway's callback URL returns control to the app's own
      domain (not a dead-end outside the TWA)
- [ ] Re-run this whole checklist item once the gateway exists — nothing
      here can be verified today because there is nothing to test

## 17. Rollback procedure

If a published Android release causes problems:

1. **Play Console → Production → Release → Halt rollout** (if using
   staged rollout) or promote a previous release to 100% — Play Console
   keeps prior `.aab` releases available for this.
2. TWA rollback does **not** require a new Android release for most
   frontend/backend bugs — since the TWA just displays the live website,
   fixing and deploying `frontend`/`backend` normally (this repo's usual
   flow) fixes the content inside the already-installed app immediately,
   the same way any web deploy does.
3. An Android-side rollback (new `.aab`) is only needed for TWA-shell-level
   problems — e.g. a broken `assetlinks.json` causing the address bar to
   appear, or `manifest.json`/icon changes needing a fresh Bubblewrap
   build. Keep the signing keystore backed up (outside git, per §5) — a
   lost keystore makes it impossible to publish updates to an existing
   Play Store listing.
4. Service Worker rollback: if a bad `sw.js` ships, bump `CACHE_NAME` in
   `frontend/public/sw.js` (forces `activate` to purge old caches) and
   redeploy — no Android release needed, this is a normal web deploy.

---

## Summary table

| Item | Status | Ready now? | Depends on HTTPS? |
|---|---|---|---|
| PWA (manifest/SW) | Ready | Yes | No |
| Push notification (admin-only) | Ready (pending `VAPID_*` env values) | Partially | No |
| Deep links (SPA fallback + post-login redirect) | Ready | Yes | No |
| Production API config safety | Prepared (fails loudly if misconfigured) | No (needs real `VITE_API_URL`) | Yes |
| Digital Asset Links | Template only | No | Yes |
| Signing | Not configured | No | Yes |
| Android/TWA project | Prepared/Blocked (template + docs only) | No | Yes |
| Google Play readiness | Not evaluable yet | No | Yes |

**HTTPS is not configured, therefore final TWA verification and Google
Play readiness cannot yet be confirmed.**
