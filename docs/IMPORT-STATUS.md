# Full catalog migration, 28 October 2026

## Verified in the website

- Requested Tannu branch contains **448 unique products** and **2,904 non-empty image URLs**.
- All source products, source rupee prices, comparison prices, every image, full source size lists, size-wise availability and prices, descriptions/details, colour-group links and collection memberships are preserved.
- 17 source products are marked sold out. They remain visible but cannot be added to the bag.
- One source product has no photo. A branded placeholder is used, not an invented product photo.
- New Arrivals, Trending, curated Best Sellers, Lehenga Choli and More from Noor rails follow source memberships. Best Sellers is the source curated collection, not a claim of measured sales on this new store.
- No source customer reviews were copied as reviews of this new store. Backend invoices, OTP, payments and shipment tracking were not recreated by copying UI.

## Verified in the actual Google Sheet

- WhatsApp and support phone: **919785795831**.
- Categories: all 11 source collection definitions, Noor-branded choice title.
- HomeSections: five source-style home rails with title, subtitle, collection, active and count controls.
- Settings: responsive hero image URLs and show/hide flags.
- Previous Products tab was backed up as `Products_Before_Full_Import` before setting up the bulk migration.

## Google authorization still required

Google returned this exact error for the external CSV import:

> Please use a desktop web browser to allow access to fetch data from external urls.

Open [CatalogImport A1](https://docs.google.com/spreadsheets/d/1UlPFsN1aL1OIi_5tpOc8pF3WstbzPOdf1QFygp9E8Ro/edit#gid=1920105493&range=A1) on a desktop browser, select A1 and press **Allow access**.

Once Google authorizes and imports the public CSV:

1. `CatalogImport` fills 448 product rows plus headers from the migration file.
2. `Products` automatically references all 448 rows. Until import is ready it shows the backed-up four products instead of an error.
3. Settings `catalog_version` automatically changes from `pending-import` to `tannu-448-v2` after all 448 handles arrive.
4. To make each product directly editable, copy Products `A1:Q449`, then **Edit > Paste special > Values only** into the same range. Alternatively use `Noor Store > Make imported products editable` after installing `scripts/Code.gs`.
5. Keep the version marker `tannu-448-v2` after materializing. Later product additions/removals do NOT need 448 rows and are fully allowed.

Alternative: run `importAllReferenceProducts` in the authorized bound Apps Script. This validates 448 handles, takes a backup, and imports actual editable values directly. It is never exposed as an anonymous HTTP action.

## Live Sheet access

The private Apps Script bridge is still needed for live private-Sheet reads and order saving. The public website does not contain an API token. Until authorized, the full reference export is shown as a last-known snapshot, with a connection status notice. This is **not** a claim that live Sheet sync or live order writes have been verified.
