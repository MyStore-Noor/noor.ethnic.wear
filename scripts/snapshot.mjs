import {writeFile} from 'node:fs/promises';
const url=process.env.SHEETS_WEBAPP_URL;
if(url){const r=await fetch(`${url}?action=catalog`,{signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error('Sheet fetch failed');const d=await r.json();if(!d.ok||!Array.isArray(d.products)||!d.settings)throw Error('Invalid Sheet payload');await writeFile('public/store-snapshot.json',JSON.stringify({settings:d.settings,products:d.products,categories:d.categories,savedAt:Date.now()}));}
if(url){const {readFile}=await import('node:fs/promises');const config=JSON.parse(await readFile('public/config.json','utf8'));config.webAppUrl=url;await writeFile('public/config.json',JSON.stringify(config));}
