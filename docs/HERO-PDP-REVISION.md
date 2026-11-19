# Hero and product-page revision history

**Current request (19 November 2026) supersedes all hero notes below:** the owner's uploaded “Up to 75% Off” poster is now the only hero asset, saved as `assets/noor-diwali-hero.webp` in both `assets/` and `public/assets/`. The four old `pussya-banner-*-v4.webp` files and the previous `hero_image_tablet` / `hero_image_mobile` settings were deleted. A real-text offer strip below the poster makes the offer, secure-payment and returns claims accessible as HTML; the whole poster remains one Shop the collection link.

The previous selection below is historical; the product-page and size-chart work remains in place.

## Hero artwork selection

The owner explicitly selected **Noor ka 3-layout artwork**, not the Tannu banner carrying Designer Clothing branding. Three independent files were extracted from the Noor reference's `assets/source/banners/_unused-3up-sheet.png`:

| Device | File | Native output dimensions | Source rectangle |
|---|---|---|---|
| Desktop, ≥1024px | `hero-noor-desktop-v3.webp` | 1195×793 | 1195×793+0+0 |
| Tablet, 768–1023px | `hero-noor-tablet-v3.webp` | 532×793 | 532×793+1203+0 |
| Mobile, <768px | `hero-noor-mobile-v3.webp` | 241×793 | 241×793+1742+0 |

These are the actual separate artwork panels, not one desktop composition cropped at runtime. White separators are excluded. The artwork is not stretched or clipped. Native panel resolution is limited by the supplied composite; no claim of new high-resolution photography or AI reconstruction is made. A higher-resolution original of each panel can replace these paths later.

HTML sources and media-specific preloads select the matching file. The three paths were also updated in the actual Google Sheet Settings, preventing old Sheet values from replacing the new artwork. Snapshot Settings were updated as well.

## Product details

The requested Tannu branch is cloned at `/home/user/reference-flow`, branch `arena/269464ec-tannu-product`. Its page/gallery/detail implementation was inspected.

Product links now show a dedicated full-page layout at `#product=HANDLE` rather than overloading the bag/help dialog. Desktop shows the gallery and purchase information side by side; mobile stacks them. Opening another help dialog no longer destroys the selected product or size. Browser reload/deep link, back-to-collection, selected-size persistence, keyboard gallery navigation and full-screen viewer were tested.

## Size chart

Inspected Saga reference: `https://sagafabrics.in/products/saga-039`, specifically the Women's Size & Fitting Chart. The implementation follows its unit toggle, selectable-size cards, selected-size summary, full-table and measuring-guide pattern.

Measurement values come from the selected Noor product's original numeric size labels, with inches-to-centimetres conversion. Product stock flags control Available/Sold out labels. Selecting an unavailable size in the chart can inspect its measurement but cannot select that size in the purchase form. Saga's short-kurti waist/hip/46-inch front-length values were deliberately not asserted as measurements of every Noor Anarkali/lehenga. Missing measurements are disclosed, including Free Size.

## Verification

9 unit tests pass. Browser QA at 390px, 820px and 1440px passes matching banner source, product page opening at the top, deep-link reload, back navigation, no horizontal overflow, gallery, unit conversion, selected-size synchronization, sold-out-size guard, size persistence after opening/closing help, bag and WhatsApp destination.

External product photos and WhatsApp are stubbed during browser QA. No real customer message/order was sent. Private Google bridge authorization and bulk-import permission remain separate pending setup, unchanged by this visual revision.
