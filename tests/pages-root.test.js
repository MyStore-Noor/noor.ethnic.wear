import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {compare,FILES,DIRS} from '../scripts/sync-pages.mjs';

test('GitHub Pages root mirrors the public runtime files byte for byte',async()=>{
  const {missing,different}=await compare();
  assert.deepEqual(missing,[],'missing at repo root: '+missing.join(', '));
  assert.deepEqual(different,[],'out of date at repo root: '+different.join(', '));
});

test('Files referenced by the published index.html exist at the Pages root',async()=>{
  const html=await readFile('index.html','utf8');
  const refs=[...html.matchAll(/(?:srcset|src|href)="\.\/([^"#?]+)"/g)].map(m=>m[1]).filter(ref=>!ref.startsWith('src/')&&!ref.endsWith('.css'));
  assert.ok(refs.length>0);
  for(const ref of new Set(refs))await access(ref);
  for(const name of FILES)await access(name);
  for(const dir of DIRS)await access(dir);
});

test('Published snapshot and PIN list are complete',async()=>{
  const snapshot=JSON.parse(await readFile('store-snapshot.json','utf8'));
  assert.equal(snapshot.products.length,448);
  assert.equal(new Set(snapshot.products.map(p=>p.id)).size,448);
  const pins=JSON.parse(await readFile('pincode-map.json','utf8'));
  let count=0;for(const districts of Object.values(pins))for(const list of Object.values(districts))count+=list.length;
  assert.ok(count>19000,`expected a full PIN list, got ${count}`);
});
