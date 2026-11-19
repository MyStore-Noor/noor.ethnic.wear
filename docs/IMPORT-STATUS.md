# Catalog migration and current import status

## Current revision — 19 November 2026

- Website snapshot: **488 unique products**, **2,944 non-empty image URLs** and catalog version **`noor-488-v4`**.
- This is the original 448-product / 2,904-photo Tannu reference plus 40 curated in-stock additions in two batches. The additions are documented in [STOCK-ADDITIONS.md](STOCK-ADDITIONS.md) and stored locally as optimised WebP images.
- `docs/catalog-import.csv` contains all 488 rows. `scripts/Code.gs` imports the current seed from this branch and sets `catalog_version` to `noor-488-v4`.
- The website already displays the complete local snapshot. The live private-Sheet bridge and order writes still require the owner's Apps Script deployment; this is not a claim that live Sheet sync has been verified.
- Current categories: the 11 source collections plus **Just Added**. Current home rails: the five source-style rails plus **Just Added**.

## Historical reference migration — 28 October 2026

### Verified in the reference export

- Requested Tannu branch contained **448 unique products** and **2,904 non-empty image URLs**.
- Source rupee prices, comparison prices, images, size lists, size-wise availability and prices, descriptions/details, colour-group links and collection memberships were preserved.
- 17 source products are marked sold out. They remain visible but cannot be added to the bag.
- One source product has no photo. A branded placeholder is used, not an invented product photo.
- Best Sellers is the source curated collection, not a claim of measured sales on this new store.
- No source customer reviews were copied as reviews of this new store. Backend invoices, OTP, payments and shipment tracking were not recreated by copying UI.

### Verified in the actual Google Sheet

- WhatsApp and support phone: **919785795831**.
- Categories: 11 source collection definitions and the Noor-branded choice title.
- HomeSections: five source-style rails with title, subtitle, collection, active and count controls.
- Previous Products tab was backed up as `Products_Before_Full_Import` before the historical bulk migration setup.

## Google authorization still required

Google returned this exact error for the historical external CSV import:

> Please use a desktop web browser to allow access to fetch data from external urls.

Open [CatalogImport A1](https://docs.google.com/spreadsheets/d/1UlPFsN1aL1OIi_5tpOc8pF3WstbzPOdf1QFygp9E8Ro/edit#gid=1920105493&range=A1) on a desktop browser, select A1 and press **Allow access**.

Once Google authorizes and imports the current public CSV:

1. `CatalogImport` fills 488 product rows plus headers from `docs/catalog-import.csv`.
2. `Products` references all 488 rows. Until import is ready the website continues to use the committed snapshot.
3. Settings `catalog_version` changes from `pending-import` to `noor-488-v4` after all 488 handles arrive.
4. To make each product directly editable, copy Products `A1:Q489`, then **Edit > Paste special > Values only** into the same range. Alternatively use `Noor Store > Make imported products editable` after installing `scripts/Code.gs`.
5. Keep the version marker `noor-488-v4` after materializing. Later product additions or removals do not require a fixed 488-row count.

Alternative: run `importAllReferenceProducts` in the authorized bound Apps Script. It validates the current seed, takes a backup, and imports editable values directly. It is never exposed as an anonymous HTTP action.

## Live Sheet access

The private Apps Script bridge is still needed for live private-Sheet reads and order saving. The public website does not contain an API token. Until authorized, the full local snapshot is shown with a connection status notice only when a bridge is configured. This is **not** a claim that live Sheet sync or live order writes have been verified.
