# Noor store, Sheet kaise chalegi

## 1. Aapki Sheet

https://docs.google.com/spreadsheets/d/1UlPFsN1aL1OIi_5tpOc8pF3WstbzPOdf1QFygp9E8Ro/edit

Settings me `whatsapp` khaali hai. Apna asli WhatsApp country code ke saath daaliye (sirf digits). Jab tak khaali hai, checkout safely disabled rahega. Koi demo number nahi hai.

- Settings: naam, announcement, hero copy, logo/image path, Instagram, story aur delivery/return policy.
- Products: price rupees me, compare_price old price, images aur sizes `|` se separate. `active` aur `in_stock`: `true`/`false`.
- Categories: id ko product category se match rakhein. Khaali category me products invent nahi honge.
- Orders: WhatsApp requests. Request saved ka matlab payment/confirmed order nahi hai.
- OrderItems: har request ki alag items.
- Reviews/Coupons: future extension, abhi storefront me enabled nahi.

4 starter products source repo se add hain. Saare reference products lane ke liye Products tab select karein, File > Import > Upload > `docs/catalog-import.csv` > Replace current sheet. Puri spreadsheet replace mat karein. Prices, product rights, images aur availability launch se pehle verify karein.

## 2. Private Sheet bridge, recommended

1. Sheet me Extensions > Apps Script.
2. `scripts/Code.gs` ka code paste aur Save.
3. Deploy > New deployment > Web app. Execute as: Me. Access: Anyone. Authorize apne account se. Public endpoint sirf curated catalog expose karta hai, orders read nahi kar sakta.
4. `/exec` URL copy karein. GitHub repo Settings > Secrets and variables > Actions > Variables me `SHEETS_WEBAPP_URL` banayein.
5. Actions > Deploy Noor to GitHub Pages > Run workflow. Build config aur snapshot automatically Sheet se banayega.
6. Browser me `/exec?action=catalog` check karein, `ok:true` aana chahiye. Ek test order bhejkar Orders aur OrderItems verify karein, phir WhatsApp me message Send karein.

Bridge ke bina sirf public-readable Settings/Products/Categories CSV read hota hai. **Puri Sheet public mat karein**, kyunki usme customer details hongi. Private bridge best hai. Local preview ke liye `public/config.json` me webAppUrl set kiya ja sakta hai. URL secret nahi, public website ko chahiye. Koi Google API token browser me nahi daalna.

Script update ke baad Manage deployments > Edit > New version > Deploy zaroor karein.

Apps Script public order endpoint me product/size/quantity/price validation, formula escaping, write lock aur per-phone short cooldown hai. CAPTCHA/strong abuse protection nahi; high traffic par dedicated backend protection lagayein. Browser CORS/deployment settings ko real device par verify karna zaroori hai. Save fail hua to website sach batati hai aur WhatsApp message fir bhi ready karti hai.

## 3. GitHub Pages + Actions

Repo Settings > Pages > Build and deployment > Source: GitHub Actions. Current branch push ya manual workflow run deployment karega. Agar environment branch restriction ho to current `arena/5beb3e1b-noor-ethnic-wear` ko allow karein. Relative assets project Pages URL aur custom domain dono par kaam karte hain.

Apne domain ke liye Actions variable `CUSTOM_DOMAIN` me sirf domain daalein, protocol/path nahi. DNS provider par GitHub Pages ke current documented A records / www CNAME set karein, Pages me domain verify karein aur Enforce HTTPS enable karein. Domain abhi user se confirm hona baaki hai; existing website ka domain bina confirmation change nahi kiya gaya.

## 4. Roz ka kaam

Sheet row save karne ke ~30 seconds me active page update. Modal khula ho to close karne ke baad refresh cycle chalegi. Product remove/inactive karne par naya catalog use hota hai. Offline last-good data clearly labeled hai. WhatsApp me stock, delivery aur final total confirm karein. Bag auto-clear nahi hota kyunki message khulna order confirmed nahi hota.

Shipping fee automatic add nahi hoti. Order message subtotal bhejta hai, final charges owner confirm karega. Payment verify, GST invoice aur shipment tracking is static version me nahi hain.

## Verification notes

Build aur CSV/product/message unit tests pass hain. Sandbox network Google endpoints aur product image CDN ko reach nahi kar sakta, isliye actual live Sheet/WhatsApp write flow test pending hai. Browser engine download bhi network restriction ki wajah se blocked tha; desktop/mobile visual QA ko verified nahi maana gaya. Original branding files local hain, product photos source CDN par rehti hain.

## Updated: full-catalog revision

The first-version four-product instructions above are superseded by [IMPORT-STATUS.md](IMPORT-STATUS.md): all 448 source products are now in the website export, and the actual Sheet bulk import awaits Google's desktop **Allow access** permission. WhatsApp is now configured in the actual Sheet using the supplied owner number.

Settings `show_categories`, `show_home_rails`, `show_story`, `show_service_strip`, `show_closing`: `false` hides a section, `true` shows it. The extra hero copy has been removed outright. `hero_image` is desktop, `hero_image_tablet` is tablet, `hero_image_mobile` is the phone portrait. Each image is shown uncropped at its own aspect ratio. Poster artwork includes the owner's printed offer/payment/return statements; the site itself only makes WhatsApp order requests, so confirm your policy and poster claims before launch.

HomeSections rows: change `title`, `subtitle`, `collection`, `count` or `active`. Product rows additionally support `collections` (pipe-separated), `size_pricing` (JSON in rupees), `colour_group`, `details` (pipe-separated) and `published_at`.

Browser automation is now available and passed at 390/820/1440px with external services mocked. Earlier note about no browser verification describes the first revision, not the latest tests. Live Sheet writes/real-device performance still need authorization and real-service testing.
