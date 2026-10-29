// Optional browser QA: npm install --no-save --package-lock=false playwright-core @sparticuz/chromium
import {chromium as playwright} from 'playwright-core';
import chromium from '@sparticuz/chromium';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {normalizeProduct,productMatches} from '../src/store.js';
const snapshot=JSON.parse(await readFile('public/store-snapshot.json','utf8'));
const BASE=process.env.QA_BASE||'http://127.0.0.1:5174';
const errors=[];
for(const width of [390,820,1440]){
 const browser=await playwright.launch({executablePath:await chromium.executablePath(),args:chromium.args,headless:true});
 const context=await browser.newContext({viewport:{width,height:900}});
 await context.route('https://wa.me/**',r=>r.fulfill({contentType:'text/html',body:'WhatsApp destination test'}));
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://docs.google.com/**',r=>r.abort());
 await page.route('https://cdn.shopify.com/**',async r=>r.fulfill({contentType:'image/png',body:await readFile('public/assets/mark.png')}));
 await page.goto(BASE);
 // Smooth scrolling is a product feature; QA scrolls instantly so element positions stay stable.
 await page.addStyleTag({content:'html{scroll-behavior:auto!important}'});await page.waitForFunction(()=>document.querySelector('#product-count').textContent.includes('448'));
 assert.equal(await page.locator('.hero-copy').count(),0);
 assert.ok((await page.locator('#hero-image').evaluate(img=>img.currentSrc)).includes(width<768?'pussya-banner-mobile-v4':width<1024?'pussya-banner-tablet-v4':'pussya-banner-desktop-v4'));
 await page.screenshot({path:`/home/user/noor-new-home-${width}.png`});
 assert.equal(await page.locator('.home-rail').count(),5);
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`home overflow at ${width}`);
 // The floating WhatsApp button always takes its number and prefilled message from the Sheet settings.
 const fab=page.locator('#wa-fab');assert.equal(await fab.isVisible(),true);const fabHref=await fab.getAttribute('href');
 assert.ok(fabHref.startsWith('https://wa.me/919785795831?text='),'WhatsApp button must use the Sheet number');
 assert.match(decodeURIComponent(fabHref),/Noor Ethnic Wear/);
 const fabBox=await fab.boundingBox();assert.ok(fabBox.x+fabBox.width>width-90&&fabBox.y+fabBox.height>900-90,'WhatsApp button must sit bottom-right');
 // Customer copy never exposes owner-only integration messages.
 assert.equal(await page.locator('#sync-status').isVisible(),false);
 assert.doesNotMatch(await page.locator('body').innerText(),/store Sheet|source size|reference pieces|needs authorization|live connection|configuration|नूर/i);
 assert.equal(await page.locator('#categories').innerText().then(t=>t.includes('&amp;')),false);
 // Every rail's View all must clear stale filters and navigate to its full collection.
 const sectionRows=snapshot.homeSections.filter(r=>r.active==='true');
 for(const row of sectionRows){
   await page.evaluate(()=>{document.querySelector('#search').value='no-match-customer-test';document.querySelector('#filter-price').value='1';document.querySelector('#search').dispatchEvent(new Event('input',{bubbles:true}));});
   await page.locator(`.home-rail [data-category="${row.collection}"]`).click();
   const expected=snapshot.products.map(normalizeProduct).filter(p=>p.active&&productMatches(p,row.collection)).length;
   assert.match(await page.locator('#product-count').textContent(),new RegExp('^'+expected+' pieces'));
   assert.equal(await page.locator('#search').inputValue(),'');assert.equal(await page.locator('#filter-price').inputValue(),'');
   assert.ok(page.url().includes('#collection='+encodeURIComponent(row.collection)));
   assert.equal(await page.locator('#products .product-card').count(),Math.min(24,expected));
   await page.waitForFunction(()=>{const y=document.querySelector('#collection').getBoundingClientRect().top;return y>=0&&y<230;});
 }
 // Same collection URL still scrolls and resets pagination on a repeated View all.
 await page.locator('#load-more').click();assert.ok(await page.locator('#products .product-card').count()>24);
 await page.locator('.home-rail [data-category="all"]').click();assert.equal(await page.locator('#products .product-card').count(),24);
 await page.locator('#products [data-product]').first().click();await page.locator('#product-page #add-form').waitFor();await page.waitForFunction(()=>window.scrollY<5);
 assert.equal(await page.locator('#panel').evaluate(e=>e.open),false);
 assert.equal(await page.locator('#storefront').evaluate(e=>e.hidden),true);
 assert.ok(page.url().includes('#product='));
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`PDP overflow at ${width}`);
 await page.waitForTimeout(200);assert.ok(await page.locator('.gallery-main').isVisible());await page.screenshot({path:`/home/user/noor-new-product-${width}.png`});
 assert.ok(await page.locator('[data-gallery-index]').count()>1);await page.locator('[data-gallery-step="1"]').click();
 assert.match(await page.locator('#gallery-count').textContent(),/^2 \/ /);
 await page.keyboard.press('ArrowRight');assert.match(await page.locator('#gallery-count').textContent(),/^3 \/ /);
 await page.locator('#gallery-expand').click();assert.ok(await page.locator('#lightbox').evaluate(e=>e.open));await page.locator('#lightbox-close').click();
 // A proper inline size chart is reachable without losing the product view.
 await page.locator('#product-size-link').click();
 await page.locator('#size-chart-section [data-chart-unit="cm"]').click();
 assert.match(await page.locator('#size-chart-section .fit-summary strong').textContent(),/86.4 cm/);
 await page.locator('#size-chart-section [data-chart-size="M [38]"]').click();
 assert.equal(await page.locator('#add-form [name="size"]:checked').inputValue(),'M [38]');
 assert.match(await page.locator('#size-chart-section .fit-summary strong').textContent(),/96.5 cm/);
 await page.locator('#size-chart-section [data-chart-size="L [40]"]').click();
 assert.equal(await page.locator('#add-form [name="size"]:checked').inputValue(),'M [38]');
 await page.locator('#size-chart-section [data-chart-size="M [38]"]').click();
 await page.screenshot({path:`/home/user/noor-new-size-chart-${width}.png`});
 // A help modal must not destroy the PDP or reset its selected size.
 await page.locator('footer [data-info="size"]').click();await page.locator('#panel .size-guide').waitFor();
 await page.locator('#panel-close').click();assert.equal(await page.locator('#add-form [name="size"]:checked').inputValue(),'M [38]');
 await page.locator('#add-form button').first().click();await page.locator('#bag-open').click();
 assert.match(await page.locator('#panel-content').textContent(),/Subtotal/);
 await page.locator('#checkout-open').click();await page.locator('#checkout').waitFor();
 await page.locator('[name="name"]').fill('QA Customer');
 // Autofill prefixes (+91 / 91 / 0) must be stripped to exactly 10 digits.
 await page.locator('[name="phone"]').fill('+91 97857 95831');
 assert.equal(await page.locator('[name="phone"]').inputValue(),'9785795831');
 await page.locator('[name="phone"]').fill('09785795831');assert.equal(await page.locator('[name="phone"]').inputValue(),'9785795831');
 await page.locator('[name="phone"]').fill('919785795831');assert.equal(await page.locator('[name="phone"]').inputValue(),'9785795831');
 await page.locator('[name="phone"]').blur();assert.equal(await page.locator('[name="phone"]').inputValue(),'9785795831');
 await page.locator('[name="address"]').fill('12 Johari Bazaar, near Hawa Mahal, Jaipur');
 assert.equal(await page.locator('#checkout [name="email"]').getAttribute('type'),'email');
 // Checkout verification: an unknown PIN is rejected, a real PIN is verified, and only then can WhatsApp open.
 await page.locator('[name="pincode"]').fill('999999');await page.locator('#check-pin').click();
 await page.waitForFunction(()=>document.querySelector('#pin-status').classList.contains('fail'));
 assert.equal(await page.locator('#checkout-submit').isDisabled(),true);
 assert.match(await page.locator('#pin-status').innerText(),/couldn’t find this PIN/);
 assert.equal(await page.locator('#checkout-city').inputValue(),'');assert.equal(await page.locator('#checkout-state').inputValue(),'');
 await page.locator('[name="pincode"]').fill('302001');await page.locator('#check-pin').click();
 await page.waitForFunction(()=>document.querySelector('#pin-status').classList.contains('ok'));
 assert.match(await page.locator('#pin-status').innerText(),/Jaipur, Rajasthan/);
 assert.match(await page.locator('#pin-status').innerText(),/Delivery timing and charges are confirmed on WhatsApp/);
 // City and state are filled from the PIN itself and cannot be typed over.
 assert.equal(await page.locator('#checkout-city').inputValue(),'Jaipur');
 assert.equal(await page.locator('#checkout-state').inputValue(),'Rajasthan');
 assert.equal(await page.locator('#checkout-city').getAttribute('readonly'),'');assert.equal(await page.locator('#checkout-state').getAttribute('readonly'),'');
 // The verified deliverable PIN sits directly under the order summary.
 assert.equal(await page.locator('#verified-delivery').isVisible(),true);
 assert.match(await page.locator('#verified-delivery').innerText(),/Verified deliverable PIN/i);
 assert.match(await page.locator('#verified-delivery').innerText(),/302001/);
 assert.match(await page.locator('#verified-delivery').innerText(),/Jaipur, Rajasthan/);
 assert.ok(await page.locator('.order-review #verified-delivery').count()===1);
 assert.equal(await page.locator('#checkout-submit').isEnabled(),true);
 // Missing email is refused before WhatsApp opens, and focus returns to the field.
 await page.locator('#checkout-submit').click();
 await page.waitForFunction(()=>document.querySelector('#checkout [name="email"]').getAttribute('aria-invalid')==='true');
 assert.equal(context.pages().length,1);
 await page.locator('[name="email"]').fill('qa.customer@example.com');
 await page.locator('[name="email"]').blur();
 await page.screenshot({path:`/home/user/noor-new-checkout-${width}.png`});
 const popupPromise=page.waitForEvent('popup');await page.locator('#checkout-submit').click();const popup=await popupPromise;
 await popup.waitForURL(/wa.me|whatsapp/,{timeout:15000}).catch(()=>{});assert.ok(popup.url().includes('919785795831'));
 const waText=decodeURIComponent(popup.url());
 for(const expected of ['Verified deliverable PIN: 302001','Jaipur, Rajasthan','City / District: Jaipur','State: Rajasthan','Email: qa.customer@example.com','Phone: +91 9785795831'])assert.ok(waText.includes(expected),'WhatsApp message missing '+expected);
 assert.doesNotMatch(await page.locator('#panel-content').innerText(),/Sheet|saved|recorded|setup|configuration/i);assert.match(await page.locator('#panel-content').innerText(),/Send your WhatsApp message/);
 assert.match(await page.locator('#panel-content .verified-pin').innerText(),/302001/);
await page.evaluate(()=>document.querySelector('#panel').close());await page.evaluate(()=>document.querySelector('#product-back').click());await page.waitForFunction(()=>document.querySelector('#product-page').hidden===true);await page.locator('#advanced-open').waitFor({state:'visible'});
 assert.equal(await page.locator('#product-page').evaluate(e=>e.hidden),true);
 await page.evaluate(()=>document.querySelector('#advanced-open').click());await page.locator('#filter-stock').check();await page.evaluate(()=>document.querySelector('#reset-filters').click());
 assert.match(await page.locator('#product-count').textContent(),/448/);
 await page.locator('#products a').first().click();await page.locator('#add-form').waitFor();
 await page.reload();await page.locator('#product-page #add-form').waitFor();assert.equal(await page.locator('#storefront').evaluate(e=>e.hidden),true);
 console.log(`PASS ${width}px: new banner, full PDP + deep link/reload/back, gallery, inches/cm chart, sold-out guard, size retention, bag + email + PIN-derived city/state + verified deliverable PIN + WhatsApp, fixed WhatsApp button, offline recovery + retry, back-to-top, no overflow`);
 await browser.close();
}
assert.deepEqual(errors,[]);
