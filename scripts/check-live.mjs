// Verifies the public GitHub Pages deployment serves the exact build that was just
// published. Works with both workflow-built Vite artifacts and legacy branch-root
// deployments by detecting dist/build-info.json on the live site.
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const BASE=(process.env.PAGES_URL||'https://mystore-noor.github.io/noor.ethnic.wear/').replace(/\/?$/,'/');
const attempts=Number(process.env.PAGES_ATTEMPTS||24);
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const sha=value=>createHash('sha256').update(value).digest('hex');
async function readText(file){return readFile(file,'utf8');}
async function localFile(primary,fallback){try{return await readText(primary);}catch{return readText(fallback);}}

const localSnapshotText=await localFile('dist/store-snapshot.json','public/store-snapshot.json');
const local=JSON.parse(localSnapshotText);
let localManifest=null;
try{localManifest=JSON.parse(await readText('dist/build-info.json'));}catch{}

async function get(path,{json=true}={}){
  const url=`${BASE}${path}${path.includes('?')?'&':'?'}live=${Date.now()}`;
  const response=await fetch(url,{headers:{'cache-control':'no-cache'},signal:AbortSignal.timeout(20000)});
  if(!response.ok)throw Error(`${path} returned ${response.status}`);
  return json?response.json():response.text();
}

let lastError;
for(let attempt=1;attempt<=attempts;attempt++){
  try{
    const liveSnapshotText=await get('store-snapshot.json',{json:false});
    const live=JSON.parse(liveSnapshotText);
    assert.equal(live.savedAt,local.savedAt,`live snapshot savedAt ${live.savedAt} != committed ${local.savedAt}`);
    assert.equal(live.products.length,local.products.length,'live snapshot product count does not match');
    assert.ok(live.settings?.whatsapp,'live snapshot is missing the WhatsApp setting');
    const pins=await get('pincode-map.json');
    let pinCount=0;for(const districts of Object.values(pins))for(const list of Object.values(districts))pinCount+=list.length;
    assert.ok(pinCount>=19000,`live PIN list is incomplete (${pinCount})`);
    const config=await get('config.json');
    assert.ok(config.catalogVersion,'live config.json is invalid');

    let manifest=null;
    try{manifest=await get('build-info.json');}catch{}
    const html=await get('index.html',{json:false});
    let heroPath;
    if(manifest){
      if(process.env.GITHUB_SHA)assert.equal(manifest.commit,process.env.GITHUB_SHA,'published build is from a different commit');
      assert.equal(manifest.savedAt,local.savedAt,'published manifest has a different snapshot');
      assert.equal(manifest.productCount,local.products.length,'published manifest has a different product count');
      assert.equal(sha(html),manifest.indexHash,'published index.html does not match the built HTML');
      assert.equal(sha(liveSnapshotText),manifest.snapshotHash,'published snapshot does not match the built snapshot');
      for(const marker of ['wa-fab','noor-diwali-hero.webp','hero-benefits'])assert.ok(html.includes(marker),`live index.html is missing ${marker}`);
      const app=await get(manifest.appAsset,{json:false});
      assert.equal(sha(app),manifest.appHash,'published JavaScript bundle does not match the build');
      assert.match(app,/noor-bag|wa-fab/,'published JavaScript bundle is not the Noor storefront');
      if(localManifest){
        for(const key of ['commit','indexHash','appHash','heroHash','snapshotHash','heroAsset','appAsset'])assert.equal(manifest[key],localManifest[key],`published manifest ${key} differs from the downloaded build`);
      }
      heroPath=manifest.heroAsset;
    }else{
      for(const marker of ['wa-fab','noor-diwali-hero.webp','app.js'])assert.ok(html.includes(marker),`live index.html is missing ${marker}`);
      const committedHtml=await readText('index.html');
      assert.equal(html.trim(),committedHtml.trim(),'live index.html is older than this commit');
      const liveApp=await get('src/app.js',{json:false});
      const committedApp=await readText('src/app.js');
      assert.equal(liveApp.trim(),committedApp.trim(),'live app.js is older than this commit');
      heroPath='assets/noor-diwali-hero.webp';
    }
    const hero=await fetch(`${BASE}${heroPath}`,{method:'HEAD',signal:AbortSignal.timeout(20000)});
    if(!hero.ok)throw Error(`hero banner ${heroPath} returned ${hero.status}`);
    console.log(`Live deployment verified on attempt ${attempt}: ${BASE}`);
    console.log(`  commit ${manifest?.commit||process.env.GITHUB_SHA||'branch root'}, snapshot ${live.savedAt}, ${live.products.length} products, ${pinCount} PINs, hero ${heroPath} OK`);
    process.exit(0);
  }catch(error){
    lastError=error;
    const line=`Attempt ${attempt}/${attempts} against ${BASE}: ${error.message}`;
    console.log(line);
    console.log(`::error::${line.replace(/[\r\n]+/g,' ').slice(0,900)}`);
    if(attempt<attempts)await wait(15000);
  }
}
console.error(`Live deployment did not match the committed build: ${lastError?.message}`);
process.exit(1);
