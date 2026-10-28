// Optional browser QA: npm install --no-save --package-lock=false playwright-core @sparticuz/chromium
import {chromium as playwright} from 'playwright-core';
import chromium from '@sparticuz/chromium';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';

const snapshot=JSON.parse(await readFile('public/store-snapshot.json','utf8'));
const errors=[];
for(const width of [390,820,1440]){
const browser=await playwright.launch({executablePath:await chromium.executablePath(),args:chromium.args,headless:true});
const context=await browser.newContext({viewport:{width,height:900}});await context.route('https://wa.me/**',r=>r.fulfill({contentType:'text/html',body:'WhatsApp destination test'}));const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
await page.route('https://docs.google.com/**',r=>r.abort());await page.route('https://cdn.shopify.com/**',async r=>r.fulfill({contentType:'image/png',body:await readFile('public/assets/mark.png')}));
await page.goto('http://127.0.0.1:5174');await page.waitForFunction(()=>document.querySelector('#product-count').textContent.includes('448'));
assert.equal(await page.locator('.hero-copy').count(),0);assert.ok((await page.locator('#hero-image').evaluate(img=>img.currentSrc)).includes(width<768?'banner-mobile':width<1024?'banner-tablet':'banner-desktop'));await page.screenshot({path:`/home/user/noor-home-${width}.png`});assert.equal(await page.locator('.home-rail').count(),5);
assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow at ${width}`);
await page.locator('#products [data-product]').first().click();await page.locator('#add-form').waitFor();
assert.ok(await page.locator('[data-gallery-index]').count()>1);await page.locator('[data-gallery-step="1"]').click();assert.match(await page.locator('#gallery-count').textContent(),/^2 \/ /);
await page.locator('#gallery-expand').click();assert.ok(await page.locator('#lightbox').evaluate(e=>e.open));await page.locator('#lightbox-close').click();
await page.locator('#add-form button').first().click();await page.locator('#bag-open').click();assert.match(await page.locator('#panel-content').textContent(),/Subtotal/);
await page.locator('#checkout-open').click();await page.locator('#checkout').waitFor();await page.locator('[name="name"]').fill('QA Customer');await page.locator('[name="phone"]').fill('9999999999');await page.locator('[name="address"]').fill('Test address Jaipur');await page.locator('[name="pincode"]').fill('302001');
const popupPromise=page.waitForEvent('popup');await page.locator('#checkout button').click();const popup=await popupPromise;await popup.waitForURL(/wa.me|whatsapp/, {timeout:15000}).catch(()=>{});assert.ok(popup.url().includes('919785795831'));await popup.close();await page.locator('#panel-close').click();
await page.locator('#advanced-open').click();await page.locator('#filter-stock').check();await page.locator('#reset-filters').click();assert.match(await page.locator('#product-count').textContent(),/448/);
// Product deep links open even when navigating back to the same product.
await page.locator('#products [data-product]').first().click();await page.locator('#panel-close').click();await page.locator('#products a').first().click();await page.locator('#add-form').waitFor();await page.locator('#panel-close').click();
await page.evaluate(()=>{document.documentElement.style.scrollBehavior='auto';window.scrollTo(0,0);});await page.screenshot({path:`/home/user/noor-${width}.png`,fullPage:false});
console.log(`PASS ${width}px: 448 products, 5 rails, gallery, bag, WhatsApp destination, filters, no horizontal overflow`);await browser.close();}
assert.deepEqual(errors,[]);
