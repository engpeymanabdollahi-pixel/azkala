# Android TWA project — NOT YET GENERATED

This directory intentionally contains **only a configuration template**
(`twa-manifest.json`), not a real Bubblewrap/Android Studio project (no
Gradle wrapper, no `app/` module, no `AndroidManifest.xml`).

## Why no real project was generated

Bubblewrap's `bubblewrap init` command needs to **fetch a live,
HTTPS-reachable `manifest.json`** (`--manifest=https://<domain>/manifest.json`)
to bootstrap the project — it downloads the real icons, reads the real
`start_url`/`theme_color`, and bakes the real production **domain** and
**Android package name** into multiple generated files at once
(`AndroidManifest.xml`'s `asset_statements` metadata, `build.gradle`'s
`applicationId`, `strings.xml`, the Gradle wrapper, etc.).

Azkala's production domain does not exist yet (HTTPS is not configured —
see `docs/TWA_SETUP.md`), and no Android package name or signing
certificate has been chosen. Generating a full project right now would mean
inventing a fake domain and package name and stamping them across dozens of
generated files — exactly what this task was told not to do. So instead,
this directory holds the **input configuration** Bubblewrap will need, with
every unknown value marked as a placeholder, plus the exact commands to run
once those values are real.

## `twa-manifest.json` placeholders

| Placeholder | Real value comes from |
|---|---|
| `PACKAGE_NAME_PLACEHOLDER` | Your chosen Android `applicationId` (e.g. `com.azkala.app`) — reverse-DNS, chosen once, cannot change after Play Store publish |
| `PRODUCTION_DOMAIN_PLACEHOLDER` | The production frontend domain, once HTTPS is live (e.g. `azkala.com`) |
| `SIGNING_KEY_ALIAS_PLACEHOLDER` | The alias you choose when generating (or already have) the release signing keystore |

`themeColor`/`navigationColor` (`#0d9488`) and `backgroundColor`
(`#ffffff`) were copied from the real, already-hardened
`frontend/public/manifest.json` — those are not placeholders.

## Exact next steps (run locally, once the placeholders above are real)

```bash
# 1. Install Bubblewrap CLI (requires Node.js + a local JDK; not run in
#    this sandbox — no real domain to fetch from, no Android SDK installed)
npm install -g @bubblewrap/cli

# 2. Initialize the real project FROM this template's values — do this in
#    a fresh directory, then copy/merge the generated project back here,
#    OR run bubblewrap directly with --manifest pointing at the real
#    manifest.json once production HTTPS is live:
bubblewrap init --manifest="https://PRODUCTION_DOMAIN_PLACEHOLDER/manifest.json"

# 3. When prompted, use the values from twa-manifest.json above
#    (packageId, host, signing key alias, etc.) instead of Bubblewrap's
#    own auto-detected defaults where they differ.

# 4. Generate (or point to an existing) release keystore. NEVER commit the
#    .keystore/.jks file — see the repo root .gitignore, which already
#    excludes *.keystore, *.jks, and android-twa/.bubblewrap/.
bubblewrap build

# 5. Verify Digital Asset Links before shipping (must be 200, not the
#    placeholder file):
curl -s "https://PRODUCTION_DOMAIN_PLACEHOLDER/.well-known/assetlinks.json"

# 6. Follow docs/TWA_SETUP.md from "Local testing" onward.
```

## What is safe to commit later

- `twa-manifest.json` once filled with the real (non-secret) domain/package
  values — this file contains no secrets by design.
- The Bubblewrap-generated Android project source (Gradle files, Java/Kotlin
  wrapper, resources) **except** the signing keystore itself.

## What must never be committed

- The release `.keystore`/`.jks` file.
- The keystore password / key alias password (store these in a secrets
  manager or CI secret store, never in this repo).
