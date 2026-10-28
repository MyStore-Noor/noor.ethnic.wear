// Optional browser QA: npm install --no-save --package-lock=false playwright-core @sparticuz/chromium
import {chromium as playwright} from 'playwright-core';
import chromium from '@sparticuz/chromium';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {normalizeProduct,productMatches} from '../src/store.js';
const snapshot=JSON.parse(await readFile('public/store-snapshot.json','utf8'));
const errors=[];
for(const width of [390,820,1440]){
 const browser=await playwright.launch({executablePath:await chromium.executablePath(),args:chromium.args,headless:true});
 const context=await browser.newContext({viewport:{width,height:900}});
 await context.route('https://wa.me/**',r=>r.fulfill({contentType:'text/html',body:'WhatsApp destination test'}));
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://docs.google.com/**',r=>r.abort());
 await page.route('https://cdn.shopify.com/**',async r=>r.fulfill({contentType:'image/png',body:await readFile('public/assets/mark.png')}));
 await page.goto('http://127.0.0.1:5174');await page.waitForFunction(()=>document.querySelector('#product-count').textContent.includes('448'));
 assert.equal(await page.locator('.hero-copy').count(),0);
 assert.ok((await page.locator('#hero-image').evaluate(img=>img.currentSrc)).includes(width<768?'pussya-banner-mobile-v4':width<1024?'pussya-banner-tablet-v4':'pussya-banner-desktop-v4'));
 await page.screenshot({path:`/home/user/noor-new-home-${width}.png`});
 assert.equal(await page.locator('.home-rail').count(),5);
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`home overflow at ${width}`);
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
 await page.locator('[name="name"]').fill('QA Customer');await page.locator('[name="phone"]').fill('9999999999');
 await page.locator('[name="address"]').fill('Test address Jaipur');await page.locator('[name="pincode"]').fill('302001');
 const popupPromise=page.waitForEvent('popup');await page.locator('#checkout button').click();const popup=await popupPromise;
 await popup.waitForURL(/wa.me|whatsapp/,{timeout:15000}).catch(()=>{});assert.ok(popup.url().includes('919785795831'));assert.doesNotMatch(await page.locator('#panel-content').innerText(),/Sheet|saved|recorded|setup|configuration/i);assert.match(await page.locator('#panel-content').innerText(),/Send your WhatsApp message/);await popup.close();await page.locator('#panel-close').click();
 await page.locator('#product-back').click();await page.locator('#advanced-open').waitFor({state:'visible'});
 assert.equal(await page.locator('#product-page').evaluate(e=>e.hidden),true);
 await page.locator('#advanced-open').click();await page.locator('#filter-stock').check();await page.locator('#reset-filters').click();
 assert.match(await page.locator('#product-count').textContent(),/448/);
 await page.locator('#products a').first().click();await page.locator('#add-form').waitFor();
 await page.reload();await page.locator('#product-page #add-form').waitFor();assert.equal(await page.locator('#storefront').evaluate(e=>e.hidden),true);
 console.log(`PASS ${width}px: new banner, full PDP + deep link/reload/back, gallery, inches/cm chart, sold-out guard, size retention, bag + WhatsApp, no overflow`);
 await browser.close();
}
assert.deepEqual(errors,[]);
