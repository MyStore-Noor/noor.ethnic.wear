// Writes a small manifest inside the Vite build. The deployment verifier compares
// this manifest with the published HTML, bundle, snapshot and hero asset, so a
// workflow-built Pages site can be checked without expecting uncompiled src/ files.
import {createHash} from 'node:crypto';
import {readFile,readdir,writeFile} from 'node:fs/promises';
import path from 'node:path';

const DIST=path.resolve('dist');
const sha=value=>createHash('sha256').update(value).digest('hex');
const html=await readFile(path.join(DIST,'index.html'),'utf8');
const assets=await readdir(path.join(DIST,'assets'));
const appFiles=assets.filter(name=>/^index-.*\.js$/.test(name)).sort();
if(!appFiles.length)throw Error('Vite JavaScript bundle was not found in dist/assets');
const appAsset=`assets/${appFiles[0]}`;
const heroMatch=html.match(/(?:src|href)="\.\/([^"]*noor-diwali-hero[^"]*)"/);
const heroAsset=heroMatch?heroMatch[1]:'assets/noor-diwali-hero.webp';
const snapshotBytes=await readFile(path.join(DIST,'store-snapshot.json'));
const snapshot=JSON.parse(snapshotBytes.toString('utf8'));
const config=JSON.parse(await readFile(path.join(DIST,'config.json'),'utf8'));
const appBytes=await readFile(path.join(DIST,appAsset));
const heroBytes=await readFile(path.join(DIST,heroAsset));
const info={
  commit:process.env.GITHUB_SHA||'local',
  builtAt:new Date().toISOString(),
  catalogVersion:config.catalogVersion||'',
  savedAt:snapshot.savedAt,
  productCount:snapshot.products.length,
  photoCount:snapshot.products.reduce((sum,product)=>sum+String(product.images||'').split('|').filter(Boolean).length,0),
  heroAsset,
  appAsset,
  indexHash:sha(html),
  appHash:sha(appBytes),
  heroHash:sha(heroBytes),
  snapshotHash:sha(snapshotBytes)
};
await writeFile(path.join(DIST,'build-info.json'),JSON.stringify(info,null,2)+'\n');
console.log(`Build manifest: ${info.commit}, ${info.productCount} products, ${info.heroAsset}, ${info.appAsset}`);
