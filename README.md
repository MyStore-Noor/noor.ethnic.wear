# Noor Ethnic Wear

A mobile-first static festive storefront for Anarkali suits, lehenga choli, sarees and suit sets. Vanilla JavaScript and CSS, built with Vite and published to GitHub Pages through GitHub Actions.

## Current revision

- **488 products and 2,944 photos**: the original 448-product / 2,904-photo reference catalog plus **40 curated, in-stock additions in two batches**. See [STOCK-ADDITIONS](docs/STOCK-ADDITIONS.md) for image provenance and the important note that this is a curated expansion, not a live inventory feed.
- **One uploaded hero poster**: `assets/noor-diwali-hero.webp` is an optimised WebP made from the owner's “Up to 75% Off” artwork. The old desktop, tablet, mobile and fluid `pussya-banner-*-v4.webp` files were removed from both `assets/` and `public/assets/`.
- A real-text, accessible offer strip under the poster repeats **Up to 75% off**, **Secure payment**, **Easy returns** and a Shop the offer link; the whole poster remains clickable.
- A new **Just Added** category, navigation link and home rail put the new stock first. New cards carry a small “Just in” label.
- Open Graph/canonical metadata, a single high-priority hero preload, stricter Pages-root pruning and a deployment build manifest were added.
- `.github/workflows/pages.yml` now runs on this branch. It tests, builds, uploads the exact artifact, deploys through `actions/deploy-pages`, and verifies the published commit, HTML, bundle, snapshot, PIN list and hero asset.

## Run

```bash
npm ci
npm run dev
npm test
npm run build
npm run sync:pages       # mirror public/ runtime files to the Pages root
npm run catalog:rebuild  # regenerate catalog artifacts from the 448-item base + stock additions
```

`npm run build` also writes `dist/build-info.json`. `scripts/check-live.mjs` uses that manifest to verify a workflow-built site, and falls back to source-file comparison for a legacy branch-root Pages deployment.

## Catalog

`public/store-snapshot.json` is the runtime last-known catalog. `public/catalog-seed.json` and `docs/catalog-import.csv` are regeneration inputs; `docs/stock-additions.json` is the canonical list of curated additions. The root `config.json`, `store-snapshot.json`, `pincode-map.json` and `assets/` mirror `public/` byte for byte, enforced by `tests/pages-root.test.js` and `npm run sync:pages`.

Current catalog version: **`noor-488-v4`**. The storefront uses the committed snapshot unless an authorised Sheet web-app bridge is configured. `scripts/Code.gs` contains the private-Sheet bridge and the 488-row import helper. The Sheet bulk import and live order writes still require the owner's Google authorization; see [IMPORT-STATUS](docs/IMPORT-STATUS.md) and [STORE-SETUP](docs/STORE-SETUP.md).

## Deployment

Live URL: <https://mystore-noor.github.io/noor.ethnic.wear/>

The Pages site uses the **GitHub Actions** build type. Pushes to `main` or `arena/c9f0b6fe-noor-ethnic-wear`, plus manual `workflow_dispatch`, trigger `.github/workflows/pages.yml`. The deploy job targets a dedicated `noor-pages` environment because the older `github-pages` environment has a branch allowlist that the current integration cannot edit. An optional `CUSTOM_DOMAIN` Actions variable writes `dist/CNAME`; no unverified domain has been assumed.

The workflow supports both publishing modes: in workflow mode it deploys `dist/`, and in legacy branch-root mode it verifies the served source files. Verification retries until the new snapshot, build manifest, hero image and full PIN list are live.

## Verification

`npm test` covers catalog integrity, CSV regeneration, all curated additions, Pages-root mirroring, stale-banner removal, delivery PINs, customer/order validation, retries and data signatures. Optional `npm run qa:browser` starts headless Chromium QA at 390, 820 and 1440px; install `playwright-core @sparticuz/chromium` with `npm install --no-save --package-lock=false` first and keep `npm run dev` running. The script checks the new stock batch, uploaded hero, responsive PDP, gallery, size chart, bag, PIN delivery and WhatsApp with external Google/CDN services mocked; on non-Linux-Lambda hosts it sets `AWS_EXECUTION_ENV` so the bundled AL2023 libraries load. This revision passed 27 unit tests, production build, three browser viewports, the Pages Action and a live deployment-manifest check. Actual live Sheet writes, real-device performance and payment collection remain outside this static storefront.

No payment is taken on the site. WhatsApp order requests ask the owner to confirm availability, delivery charges and the final total before payment.
