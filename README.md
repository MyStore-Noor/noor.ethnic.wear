# Noor Ethnic Wear, full catalog festive store

Static, mobile-first storefront using original Noor artwork and the requested Tannu reference catalog/workflow. Vanilla JavaScript/CSS with Vite; GitHub Pages Actions deployment included.

## Run

```
npm ci
npm run dev
npm test
npm run build
```

## This revision

- **448 products, 2,904 photo URLs**, all source prices, size pricing/availability, descriptions, colours and memberships.
- Original Noor image-only hero with desktop/tablet/mobile image sources, using the original Pussya reference banner files on all devices.
- Source-style category circles and Trending, curated Best Sellers, New Arrivals, Lehenga Choli and Explore rails.
- Advanced collection, colour, size, fabric, price and availability filters; search, sorting, wishlist and persistent shopping bag.
- Thumbnail gallery, previous/next, swipe, keyboard navigation, hover zoom, full-screen viewer, colour-linked products, quantity, buy now, share, detail/shipping/returns accordions.
- Sheet phone set to the supplied number; no contact fallback embedded in JS. All contact UI uses loaded settings.
- Sheet settings hide/show categories, home rails, story, services and closing CTA. Categories and HomeSections have their own active flags.
- Refined directional-fill buttons, press feedback and second-photo hover. Saga page content was inspected, but its exact animation implementation was not available through the fetched text, so these are independently implemented rather than claimed pixel-identical copies.

[Store Control Sheet](https://docs.google.com/spreadsheets/d/1UlPFsN1aL1OIi_5tpOc8pF3WstbzPOdf1QFygp9E8Ro/edit)

**Read [IMPORT-STATUS](docs/IMPORT-STATUS.md) for the external-data permission needed to complete the Google Sheet bulk import.** Existing Products were backed up. The website already contains all 448 reference products as a labeled snapshot; live private-Sheet sync and order writes await the Apps Script deployment, described in [STORE-SETUP](docs/STORE-SETUP.md).

## Catalog export

`public/store-snapshot.json` is a full exported last-known catalog/settings payload, not a second runtime catalog to maintain. The build replaces it from the authorized Sheet bridge. `public/catalog-seed.json` and `docs/catalog-import.csv` are the one-time migration inputs. A migration marker prevents the old four-row starter Sheet from silently truncating the full reference export. After migration, intentional product removals are respected.

To regenerate migration files from a local checkout of the supplied reference:

```
node scripts/import-reference.mjs /path/to/reference/apps/web/src/data/catalog.json
```

## Verification

`npm test`: 9 tests for CSV parsing, type handling, order messages, all 448 unique handles/2904 photos, CSV integrity, memberships, size pricing and sold-out flags.

`tests/browser.mjs`: optional headless Chromium QA at 390, 820 and 1440px. Passed gallery, full-screen, bag, customer form, WhatsApp destination, advanced filter reset, home rails, repeated product links and horizontal-overflow checks. CDN photos and WhatsApp navigation are stubbed in these tests; no actual customer order or message was sent. Actual CDN accessibility, Google writes and real-device network performance remain unverified.

## Deployment

Current-branch push triggers `.github/workflows/pages.yml`. GitHub Pages enablement was previously denied by the integration (403). Custom domain is still unconfirmed. No claim of production publication or live payment confirmation is made.

## Latest product-page fix

The hero now uses the exact desktop, tablet, mobile and fluid banner files from the requested Pussya branch. The previous three-panel artwork files have been deleted, and HTML plus Sheet paths point to the new versioned files. Product details now have a dedicated full-page hash route, separate from shopping/help modals. A Saga-inspired size chart provides inches/cm, source-label measurements, sold-out states and a measuring illustration without inventing garment dimensions. See [HERO-PDP-REVISION](docs/HERO-PDP-REVISION.md).
