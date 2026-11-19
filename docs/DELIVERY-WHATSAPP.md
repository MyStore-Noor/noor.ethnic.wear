# Delivery verification and WhatsApp ordering

## What the customer can check

- **PIN decides city and state.** The checkout PIN is matched against the offline India Post list (`public/pincode-map.json`, copied from the requested Tannu reference store) — 36 states/UTs, 19,486 PINs. A valid PIN auto-fills **City / District** and **State** as read-only fields, so the customer can never type a city or state that does not belong to that PIN. Checking is automatic after six digits and can also be triggered with **Check delivery**.
- **Verified deliverable PIN under the order.** The order summary shows a green “Verified deliverable PIN” block with the PIN, city and state below the item lines and subtotal, and the same block appears on the confirmation step. The WhatsApp message repeats `Verified deliverable PIN: … · City, State`.
- **Contact details.** Full name, **email address** and a strict 10-digit Indian mobile number are required. Autofill prefixes `+91`, `91` or `0` are stripped automatically (also on blur) so exactly 10 digits are stored and sent; a `+91` prefix is displayed beside the field.
- **No invented promises.** Free shipping, a 4–7 day window or guaranteed courier coverage is *not* claimed unless the owner fills the related Sheet settings. Without owner data the panel says delivery timing and charges, and courier coverage, will be confirmed on WhatsApp.
- **Order checks.** Name, a valid 10-digit Indian mobile number, a complete address, PIN, real sizes, per-item availability and quantities 1–10 are all validated before a WhatsApp request can be opened. Sold-out or invalid bags show the reason and disable checkout.
- **Final message** includes the verified PIN place plus any owner-configured delivery days and shipping fee. It always asks for availability, delivery charges and the total to be confirmed before payment.

## Sheet controls (owner)

`Settings` (key → value):

| key | purpose |
| --- | --- |
| `delivery_days` | Optional, e.g. `4-7 business days`. Shown after PIN verification. |
| `shipping_fee` | Optional, number, `0` = free. Shown after PIN verification. |
| `blocked_pincodes` | Optional, space/comma/pipe separated PINs that must not pass. |
| `blocked_states` | Optional state names to block. |
| `allowed_states` | Optional allow-list; if set, all other states are blocked. |

`DeliveryRules` tab (per PIN, district or state override): `pincode, state, district, serviceable, delivery_days, shipping_fee, active`.
The most specific matching active row wins. This is what the reference store's admin delivery rules do; it is served by the Apps Script bridge (`scripts/Code.gs`) and included in the build snapshot (`scripts/snapshot.mjs`).

Orders written through the Apps Script bridge store the validated details in `Orders` columns A–M:
`order_id, created_at, name, phone, address, pincode, total, status, items, email, city, state, delivery_check`
(`delivery_check` records that the PIN was verified on the storefront; it is never claimed as a confirmed courier booking).

## WhatsApp touch points

- Floating green WhatsApp button at the bottom-right of every page. Its number comes **only** from the Sheet `whatsapp` setting (hidden if the setting is blank), with a pulse animation and a WhatsApp glyph.
- Themed WhatsApp links in the bag, help panel, size guide and desktop navigation. Every link uses `wa.me` with a prefilled, page-aware message.

## Verified in this build

- `npm test` — 15 tests, including 6 delivery/PIN/validation tests against the real India Post dataset.
- Browser QA at 390, 820 and 1440 px: unknown PIN `999999` is rejected, `302001` resolves to Jaipur/Rajasthan and fills the read-only city and state, checkout stays disabled until verification, a blank email is refused without opening a new tab, `+91`/`91`/`0` phone prefixes are stripped to 10 digits, and the WhatsApp message carries the email, city, state and verified deliverable PIN.
