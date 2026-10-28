import {writeFile,readFile} from 'node:fs/promises';
const url=process.env.SHEETS_WEBAPP_URL;
if(url){
 const config=JSON.parse(await readFile('public/config.json','utf8'));
 const r=await fetch(`${url}?action=catalog`,{signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error('Sheet fetch failed');
 const d=await r.json();if(!d.ok||!Array.isArray(d.products)||!d.settings)throw Error('Invalid Sheet payload');
 if(d.settings.catalog_version===config.catalogVersion){await writeFile('public/store-snapshot.json',JSON.stringify({settings:d.settings,products:d.products,categories:d.categories,homeSections:d.homeSections||[],deliveryRules:d.deliveryRules||[],catalogVersion:config.catalogVersion,savedAt:Date.now()}));}
 else console.warn('Sheet migration is pending; keeping the complete reference snapshot, not truncating to starter products.');
 config.webAppUrl=url;await writeFile('public/config.json',JSON.stringify(config));
}
