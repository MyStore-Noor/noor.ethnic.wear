# Customer copy and collection navigation

- Storefront interface is English-only. The decorative Devanagari word was replaced with a neutral ornament.
- The owner-liked festive category section is retained. Collection labels decode `&amp;` and normalize all-uppercase imported headings for display.
- Integration state, starter-catalog migration status, Sheet authorization, saved-snapshot and write-result messages are not rendered in the customer interface. Owner setup documentation remains in `docs/`.
- When products are already available, refresh failures do not interrupt the shopping experience. When no catalog can load, a plain retry instruction is shown, without backend details.
- WhatsApp checkout says that the customer must send a request and that availability, delivery charges and final total will be confirmed before payment. It does not falsely claim that the order was saved, paid or confirmed. Existing order-save attempts still run; only owner-oriented status copy was removed.
- Size-guide wording now helps shoppers compare measurements and request additional sizing help, without source-repo or implementation explanations.
- All collection entry points share `openCollection`: restore storefront, clear stale search/advanced filters/wishlist, reset pagination and sorting, set a shareable collection hash, update the collection heading, and explicitly scroll/focus the products. This works when selecting the same collection repeatedly.
- Browser regression checks exercise all five rail View all buttons with deliberately conflicting filters, matching source membership counts, pagination reset, repeated navigation and customer-copy assertions, at 390/820/1440px. External Google/CDN/WhatsApp services are mocked; live integrations are not implied by these tests.
