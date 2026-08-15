# `.well-known/assetlinks.json` — TEMPLATE ONLY

**FINAL `assetlinks.json` cannot be generated until the Android package name
and signing certificate SHA-256 fingerprint are known.**

The file next to this one (`assetlinks.json`) is a syntactically valid
[Digital Asset Links](https://developers.google.com/digital-asset-links)
statement list, but its values are placeholders:

- `PACKAGE_NAME_PLACEHOLDER` → must become the real Android `applicationId`
  (e.g. `com.azkala.app`) once the TWA/Bubblewrap project is built.
- `SHA256_CERT_FINGERPRINT_PLACEHOLDER` → must become the SHA-256
  fingerprint of the **release signing certificate** used to sign the
  Android app bundle uploaded to Google Play (obtained via
  `keytool -list -v -keystore <your-release-key>.keystore` or from the Play
  Console's App Signing page after upload).

## Why this location

This repo serves the frontend (`frontend/public/`) and the backend API as
two separate origins (see `backend/routes/web.php`:
`'frontend' => env('FRONTEND_URL', ...)`). A TWA's Digital Asset Links file
must be served from the **domain the Android app actually launches as its
verified origin** — i.e. the frontend's production domain, not the API
domain. `frontend/public/` is copied verbatim into the Vite build output by
Vite's static `publicDir` handling, and `frontend/nginx.conf`'s
`location / { try_files $uri $uri/ /index.html; }` serves any file that
physically exists (including this one) before falling back to the SPA
shell — so once this file is deployed as part of the normal frontend build,
it is automatically reachable at `https://<production-domain>/.well-known/assetlinks.json`
with no extra web-server configuration.

## Do not deploy the placeholder values to production

Do not point Bubblewrap/Android Studio at this file, and do not consider
TWA "verified", until both placeholders above are replaced with real
values. See `docs/TWA_SETUP.md` for the full sequence.
