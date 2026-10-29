// GitHub Pages (legacy build) publishes the branch root, while Vite serves runtime
// files from public/. This mirrors the runtime files to the root so the live site
// loads exactly the same data, images and PIN list as the local preview.
import {createHash} from 'node:crypto';
import {cp,mkdir,readdir,readFile,stat,writeFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import path from 'node:path';

const ROOT=process.cwd();
const SOURCE=path.join(ROOT,'public');
export const FILES=['config.json','store-snapshot.json','pincode-map.json'];
export const DIRS=['assets'];

export async function listFiles(dir){
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
  const missing=[],different=[];
  for(const name of FILES){
    const from=path.join(SOURCE,name),to=path.join(ROOT,name);
    if(!existsSync(to))missing.push(name);
    else if(await digest(from)!==await digest(to))different.push(name);
  }
  for(const dir of DIRS){
    const from=path.join(SOURCE,dir);
    for(const file of await listFiles(from)){
      const rel=path.relative(from,file),to=path.join(ROOT,dir,rel);
      if(!existsSync(to))missing.push(path.join(dir,rel));
      else if(await digest(file)!==await digest(to))different.push(path.join(dir,rel));
    }
  }
  return {missing,different};
}

export async function sync(){
  for(const name of FILES)await cp(path.join(SOURCE,name),path.join(ROOT,name));
  for(const dir of DIRS)await cp(path.join(SOURCE,dir),path.join(ROOT,dir),{recursive:true});
  await writeFile(path.join(ROOT,'.nojekyll'),'');
  return compare();
}

if(import.meta.url===`file://${process.argv[1]}`){
  if(process.argv.includes('--check')){
    const {missing,different}=await compare();
    if(missing.length||different.length){
      console.error('Pages root is out of sync with public/. Run: npm run sync:pages');
      if(missing.length)console.error('  missing:',missing.join(', '));
      if(different.length)console.error('  different:',different.join(', '));
      process.exit(1);
    }
    console.log('Pages root matches public/ runtime files.');
  }else{
    const {missing,different}=await sync();
    if(missing.length||different.length)throw new Error('Pages sync verification failed: '+[...missing,...different].join(', '));
    console.log(`Synced ${FILES.length} files and ${DIRS.length} folder(s) to the Pages root.`);
  }
}
