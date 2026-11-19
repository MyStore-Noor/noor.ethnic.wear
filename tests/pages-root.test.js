import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access,readdir} from 'node:fs/promises';
import {compare,FILES,DIRS} from '../scripts/sync-pages.mjs';

const additions=JSON.parse(await readFile('docs/stock-additions.json','utf8')).products;
const expectedCount=448+additions.length;

test('GitHub Pages root mirrors the public runtime files byte for byte',async()=>{
  const {missing,different,extra}=await compare();
  assert.deepEqual(missing,[],'missing at repo root: '+missing.join(', '));
  assert.deepEqual(different,[],'out of date at repo root: '+different.join(', '));
  assert.deepEqual(extra,[],'stale files at repo root: '+extra.join(', '));
});

test('Files referenced by the published index.html exist at the Pages root',async()=>{
  const html=await readFile('index.html','utf8');
  assert.doesNotMatch(html,/pussya-banner|hero-desktop|hero-tablet/);
  const refs=[...html.matchAll(/(?:srcset|src|href)=\"\.\/([^\"#?]+)\"/g)].map(m=>m[1]).filter(ref=>!ref.startsWith('src/')&&!ref.endsWith('.css'));
  assert.ok(refs.length>0);
  for(const ref of new Set(refs))await access(ref);
  for(const name of FILES)await access(name);
  for(const dir of DIRS)await access(dir);
  await access('assets/noor-diwali-hero.webp');
  await access('public/assets/noor-diwali-hero.webp');
  for(const product of additions){
    await access(product.images);
    await access('public/'+product.images);
  }
});

test('Published snapshot and PIN list are complete, with no old responsive banners',async()=>{
  const snapshot=JSON.parse(await readFile('store-snapshot.json','utf8'));
  assert.equal(snapshot.products.length,expectedCount);
  assert.equal(new Set(snapshot.products.map(p=>p.id)).size,expectedCount);
  assert.equal(snapshot.catalogVersion,'noor-472-v3');
  assert.equal(snapshot.settings.hero_image,'assets/noor-diwali-hero.webp');
  assert.equal(snapshot.settings.hero_image_mobile,undefined);
  assert.equal(snapshot.settings.hero_image_tablet,undefined);
  const pins=JSON.parse(await readFile('pincode-map.json','utf8'));
  let count=0;for(const districts of Object.values(pins))for(const list of Object.values(districts))count+=list.length;
  assert.ok(count>19000,`expected a full PIN list, got ${count}`);
  for(const dir of ['assets','public/assets']){
    const names=await readdir(dir);
    assert.ok(!names.some(name=>name.startsWith('pussya-banner')),`old banner found in ${dir}`);
  }
});
