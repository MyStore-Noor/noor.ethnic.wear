// Deterministic migration, run with a local checkout of the requested reference branch.
import {readFile,writeFile} from 'node:fs/promises';
const source=process.argv[2];if(!source)throw Error('Pass path to reference catalog.json');
const catalog=JSON.parse(await readFile(source,'utf8'));
const previous=JSON.parse(await readFile('public/store-snapshot.json','utf8'));
const products=catalog.products.map(p=>({id:p.handle,title:p.title,price:p.price/100,compare_price:(p.compareAtPrice||0)/100,images:p.images.join('|'),category:p.category,sizes:p.sizes.join('|'),colour:p.colourName||p.color,fabric:p.fabric,description:p.description,active:'true',in_stock:String(p.inStock),collections:p.collections.join('|'),size_pricing:JSON.stringify(Object.fromEntries(Object.entries(p.sizePricing||{}).map(([s,v])=>[s,{price:v.price/100,compare_price:(v.compareAtPrice||0)/100,available:v.available}]))),colour_group:p.colourGroup||'',details:(p.details||[]).join('|'),published_at:p.publishedAt||''}));
if(new Set(products.map(p=>p.id)).size!==products.length)throw Error('Duplicate product handles');
const categories=catalog.collections.map(c=>({id:c.handle,title:c.handle==='likshas-choice'?"Noor's Choice":c.title,subtitle:c.subtitle,image:c.image,active:'true'}));
const homeSections=[['trending','Trending Now',"This week's most-loved styles",'trending'],['best','Best Sellers','The curated best-seller collection','best-seller'],['new','New Arrivals','Freshly dropped, straight from the studio','new-arrivals'],['lehenga','Lehenga Choli','Our range of designer lehenga choli','lehnga-choli'],['explore','More from Noor','Discover the complete collection','all']].map(([id,title,subtitle,collection])=>({id,title,subtitle,collection,active:'true',count:'8'}));
const data={...previous,products,categories,homeSections,catalogVersion:'tannu-448-v2',source:{repo:'mystorebyme/tannu-product-',branch:'arena/269464ec-tannu-product',count:products.length},savedAt:Date.now()};
await writeFile('public/store-snapshot.json',JSON.stringify(data));
const headers=Object.keys(products[0]);
await writeFile('docs/catalog-import.csv',[headers,...products.map(p=>headers.map(k=>p[k]))].map(r=>r.map(c=>'"'+String(c??'').replaceAll('"','""')+'"').join(',')).join('\n'));
await writeFile('public/catalog-seed.json',JSON.stringify({headers,rows:products.map(p=>headers.map(k=>p[k])),categories,homeSections}));
console.log(`Imported ${products.length} products, ${products.reduce((s,p)=>s+p.images.split('|').filter(Boolean).length,0)} images, ${categories.length} collections`);
