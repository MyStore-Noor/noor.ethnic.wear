# Noor storefront — status and roadmap

## Live deployment

- GitHub Pages uses the **GitHub Actions** build type. `.github/workflows/pages.yml` publishes from `main` or the current `arena/c9f0b6fe-noor-ethnic-wear` branch.
- The workflow tests, refreshes the optional Sheet snapshot, mirrors `public/` to the Pages root, builds Vite `dist/`, writes `dist/build-info.json`, uploads the exact artifact, deploys with `actions/deploy-pages`, then verifies the live site.
- Verification compares the published commit, HTML hash, JavaScript bundle hash, snapshot hash, product count, PIN list and hero asset against the downloaded build. A legacy branch-root deployment is also supported by falling back to source-file comparison.
- `npm run sync:pages` keeps the root mirror byte-identical to `public/` and prunes stale root assets; `tests/pages-root.test.js` fails CI on drift.
- Live URL: <https://mystore-noor.github.io/noor.ethnic.wear/>
- The deploy job targets a dedicated `noor-pages` environment because the pre-existing `github-pages` environment has a branch allowlist that the current integration cannot edit.

## Done

- 488-product catalog (448 reference products plus 40 curated additions in two batches), full product pages, gallery, size chart, wishlist, bag and WhatsApp checkout.
- One uploaded “Up to 75% Off” hero poster; old responsive Pussya banner files removed. Real-text offer highlights and a new Just Added rail improve accessibility and discovery.
- Real India Post PIN verification (36 states/UTs, 19,486 PINs), PIN-derived read-only city/state, verified deliverable PIN under the order.
- Contact validation: name, email, 10-digit mobile with `+91`/`91`/`0` prefix stripping, address, stock, size and quantity checks.
- Fixed WhatsApp button and themed WhatsApp links using the configured Sheet number only.
- Owner controls in Google Sheets: settings, visibility, categories, rails and delivery rules.
- Resilience: retries with jittered backoff, unchanged data never re-renders, refresh pauses for hidden tabs/offline/recent interaction, image fallback, offline notice, double-submit protection, debounced search/filters.
- Deployment manifest, stricter Pages-root sync and stale-asset pruning.

## Remaining owner actions

1. Deploy the Apps Script bridge (`scripts/Code.gs`) as a web app and set the `SHEETS_WEBAPP_URL` repository variable so orders and live settings reach the Sheet. Until then the site uses the committed snapshot.
2. Approve the external `IMPORTHTML` catalog import from a desktop browser if the Sheet itself should hold all 488 rows.
3. Point the purchased domain at Pages (`CUSTOM_DOMAIN` repository variable) once DNS records are ready. No unverified domain has been applied.
4. Optional premium additions: reviews, coupon codes, customer order lookup and a payment gateway. None are live and none are advertised on the storefront.
5. Confirm the poster's “Secure payment” and “Easy returns” claims against the real business policy before paid traffic is sent to the site.
