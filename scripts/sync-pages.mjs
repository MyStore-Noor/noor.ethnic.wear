// GitHub Pages (legacy build) publishes the branch root, while Vite serves runtime
// files from public/. This mirrors the runtime files to the root so the live site
// loads exactly the same data, images and PIN list as the local preview. Stale
// root-only assets are pruned so a removed banner cannot survive a deployment.
import {createHash} from 'node:crypto';
import {cp,readdir,readFile,unlink,writeFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import path from 'node:path';

const ROOT=process.cwd();
const SOURCE=path.join(ROOT,'public');
const ROOT_ASSETS=path.join(ROOT,'assets');
const SOURCE_ASSETS=path.join(SOURCE,'assets');
export const FILES=['config.json','store-snapshot.json','pincode-map.json'];
export const DIRS=['assets'];

export async function listFiles(dir){
  if(!existsSync(dir))return [];
  const out=[];
  for(const entry of await readdir(dir,{withFileTypes:true})){
    const full=path.join(dir,entry.name);
    if(entry.isDirectory())out.push(...await listFiles(full));
    else out.push(full);
  }
  return out;
}
async function digest(file){return createHash('sha256').update(await readFile(file)).digest('hex');}

export async function compare(){
  const missing=[],different=[],extra=[];
  for(const name of FILES){
    const from=path.join(SOURCE,name),to=path.join(ROOT,name);
    if(!existsSync(to))missing.push(name);
    else if(await digest(from)!==await digest(to))different.push(name);
  }
  const sourceAssets=await listFiles(SOURCE_ASSETS);
  const sourceRelative=new Set(sourceAssets.map(file=>path.relative(SOURCE_ASSETS,file)));
  for(const file of await listFiles(ROOT_ASSETS)){
    const rel=path.relative(ROOT_ASSETS,file);
    if(!sourceRelative.has(rel))extra.push(path.join('assets',rel));
  }
  for(const file of sourceAssets){
    const rel=path.relative(SOURCE_ASSETS,file),to=path.join(ROOT_ASSETS,rel);
    if(!existsSync(to))missing.push(path.join('assets',rel));
    else if(await digest(file)!==await digest(to))different.push(path.join('assets',rel));
  }
  return {missing,different,extra};
}

export async function sync(){
  const {extra}=await compare();
  for(const relative of extra)await unlink(path.join(ROOT,relative));
  for(const name of FILES)await cp(path.join(SOURCE,name),path.join(ROOT,name));
  for(const dir of DIRS)await cp(path.join(SOURCE,dir),path.join(ROOT,dir),{recursive:true});
  await writeFile(path.join(ROOT,'.nojekyll'),'');
  return compare();
}

if(import.meta.url===`file://${process.argv[1]}`){
  if(process.argv.includes('--check')){
    const {missing,different,extra}=await compare();
    if(missing.length||different.length||extra.length){
      console.error('Pages root is out of sync with public/. Run: npm run sync:pages');
      if(missing.length)console.error('  missing:',missing.join(', '));
      if(different.length)console.error('  different:',different.join(', '));
      if(extra.length)console.error('  extra:',extra.join(', '));
      process.exit(1);
    }
    console.log('Pages root matches public/ runtime files.');
  }else{
    const {missing,different,extra}=await sync();
    if(missing.length||different.length||extra.length)throw new Error('Pages sync verification failed: '+[...missing,...different,...extra].join(', '));
    console.log(`Synced ${FILES.length} files, ${DIRS.length} folder(s), and pruned stale root assets.`);
  }
}
