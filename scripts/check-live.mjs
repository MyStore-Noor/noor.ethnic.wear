// Verifies the public GitHub Pages deployment serves the exact build that was just
// committed: same snapshot, full catalog, PIN data and hero asset.
import {readFile} from 'node:fs/promises';

const BASE=(process.env.PAGES_URL||'https://mystore-noor.github.io/noor.ethnic.wear/').replace(/\/?$/,'/');
const attempts=Number(process.env.PAGES_ATTEMPTS||24);
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const local=JSON.parse(await readFile('public/store-snapshot.json','utf8'));

async function get(path,{json=true}={}){
  const url=`${BASE}${path}${path.includes('?')?'&':'?'}live=${Date.now()}`;
  const response=await fetch(url,{headers:{'cache-control':'no-cache'},signal:AbortSignal.timeout(20000)});
  if(!response.ok)throw Error(`${path} returned ${response.status}`);
  return json?response.json():response.text();
}

function assertBuild(live){
  if(live.savedAt!==local.savedAt)throw Error(`live snapshot savedAt ${live.savedAt} != committed ${local.savedAt}`);
  if(!Array.isArray(live.products)||live.products.length!==448)throw Error('live snapshot does not have 448 products');
  if(!live.settings?.whatsapp)throw Error('live snapshot is missing the WhatsApp setting');
}

let lastError;
for(let attempt=1;attempt<=attempts;attempt++){
  try{
    const live=await get('store-snapshot.json');
    assertBuild(live);
    const pins=await get('pincode-map.json');
    let count=0;for(const districts of Object.values(pins))for(const list of Object.values(districts))count+=list.length;
    if(count<19000)throw Error(`live PIN list is incomplete (${count})`);
    const html=await get('index.html',{json:false});
    for(const marker of ['wa-fab','checkout-city','pussya-banner-mobile-v4.webp'])if(!html.includes(marker))throw Error(`live index.html is missing ${marker}`);
    const committedHtml=await readFile('index.html','utf8');
    if(html.trim()!==committedHtml.trim())throw Error('live index.html is older than this commit');
    const liveApp=await get('src/app.js',{json:false});
    const committedApp=await readFile('src/app.js','utf8');
    if(liveApp.trim()!==committedApp.trim())throw Error('live app.js is older than this commit');
    const config=await get('config.json');
    if(!config.catalogVersion)throw Error('live config.json is invalid');
    const hero=await fetch(`${BASE}assets/pussya-banner-desktop-v4.webp`,{method:'HEAD',signal:AbortSignal.timeout(20000)});
    if(!hero.ok)throw Error(`hero banner returned ${hero.status}`);
    console.log(`Live deployment verified on attempt ${attempt}: ${BASE}`);
    console.log(`  snapshot savedAt ${live.savedAt}, 448 products, ${count} PINs, hero banner OK`);
    process.exit(0);
  }catch(error){
    lastError=error;
    console.log(`Attempt ${attempt}/${attempts}: ${error.message}`);
    if(attempt<attempts)await wait(15000);
  }
}
console.error(`Live deployment did not match the committed build: ${lastError?.message}`);
process.exit(1);
