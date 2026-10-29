# Noor storefront — status and roadmap

## Live deployment

- GitHub Pages is enabled for this repository and publishes the **branch root** (`build_type: legacy`).
- Because the app is plain ES modules, the published root is the real storefront: `index.html`, `style.css`, `src/`, plus a byte-identical mirror of the runtime files in `public/` (`assets/`, `config.json`, `store-snapshot.json`, `pincode-map.json`) and a `.nojekyll` marker so Pages does not run Jekyll.
- `npm run sync:pages` refreshes that mirror; `tests/pages-root.test.js` fails the build if it drifts, so the live site can never silently serve stale data or images.
- The workflow **builds, tests and then verifies the live URL**: it waits for the branch deployment and compares the served `index.html`, `src/app.js` and `store-snapshot.json` with the commit, plus the PIN list and hero asset.
- If the repository is ever switched to the “GitHub Actions” Pages source, the same workflow detects it and deploys the built `dist/` through `actions/deploy-pages` instead.

## Done

- 448-product catalog, full product pages, gallery, size chart, wishlist, bag, WhatsApp checkout.
- Real India Post PIN verification (36 states/UTs, 19,486 PINs), PIN-derived read-only city/state, verified deliverable PIN under the order.
- Contact validation: name, email, 10-digit mobile with `+91`/`91`/`0` prefix stripping, address, stock, size and quantity checks.
- Fixed WhatsApp button and themed WhatsApp links using the Sheet number only.
- Owner controls in Google Sheets: settings, visibility, categories, rails, delivery rules.
- Resilience: retries with jittered backoff for reads, unchanged data never re-renders the grid, refresh pauses for hidden tabs/offline/recent interaction, image fallback, offline notice, double-submit protection, debounced search/filters.

## Remaining owner actions

1. Deploy the Apps Script bridge (`scripts/Code.gs`) as a web app and set the `SHEETS_WEBAPP_URL` repository variable, so orders and live settings reach the Sheet. Until then the site uses the committed snapshot.
2. Approve the external `IMPORTHTML` catalog import from the desktop browser (CatalogImport consent) if the Sheet itself should hold all 448 rows.
3. Point the purchased domain at Pages (`CUSTOM_DOMAIN` repository variable) once the DNS records are ready.
4. Optional premium additions: reviews from the Reviews tab, coupon codes from the Coupons tab, order lookup for customers, and a payment gateway. None of these are live yet and none are advertised on the storefront.
