# Noor Ethnic Wear, the Diwali edit

A small, static, mobile-first storefront. Vanilla JavaScript and CSS, bundled with Vite. Original logo and festive poster from the supplied Noor reference; Sheet catalog and direct WhatsApp order requests based on the supplied Tannu workflow. No server runtime or payment gateway is required on GitHub Pages.

## Run

```
npm ci
npm run dev
npm test
npm run build
```

## Store control

[Open the Store Control Sheet](https://docs.google.com/spreadsheets/d/1UlPFsN1aL1OIi_5tpOc8pF3WstbzPOdf1QFygp9E8Ro/edit)

Read [the Hinglish owner guide](docs/STORE-SETUP.md). Products, prices, available sizes, descriptions, WhatsApp and policies come from the Sheet. Four actual reference products were added as starter rows. The complete reference catalog is in `docs/catalog-import.csv`, ready for import, with source prices and available sizes preserved. Stock values are source availability flags, not verified stock counts.

`public/store-snapshot.json` is a starter Sheet-shaped last-good snapshot, not a second catalog to maintain. The deployment updates it from the Sheet bridge when configured. It provides an honest labeled offline preview, never a fallback WhatsApp number. Runtime refreshes use the Sheet every 30 seconds while the tab is visible and dialogs are closed. No third-party font dependency or heavy animation library.

## Deployment status

The GitHub Actions workflow is included. Publishing, Apps Script authorization and custom-domain DNS must be completed before calling the store live. No domain is assumed from conflicting comments in the old repository. Do not publish the entire Sheet because Orders contains private customer details.

## Implemented

Responsive original-brand hero, category filters, search, price sorting, wishlist, product details, source size choices, persistent bag, quantity edits, customer form and WhatsApp message, reduced motion, keyboard dialogs, Sheet-backed settings and validated Apps Script order capture. No invented reviews, fake order confirmations or unsupported payment claims.

Not copied: old database, admin authentication, UPI payment verification, coupons, invoices, shipment tracking. This version intentionally uses direct WhatsApp confirmation; corresponding unused Sheet tabs are reserved for later features.
