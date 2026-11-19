// Deterministic migration, run with a local checkout of the requested reference branch.
// Curated additions are preserved from docs/stock-additions.json.
import {readFile,writeFile} from 'node:fs/promises';
import {sync} from './sync-pages.mjs';
const source=process.argv[2];if(!source)throw Error('Pass path to reference catalog.json');
const VERSION='noor-472-v3';
const HEADERS=['id','title','price','compare_price','images','category','sizes','colour','fabric','description','active','in_stock','collections','size_pricing','colour_group','details','published_at'];
const quote=value=>'"'+String(value??'').replaceAll('"','""')+'"';
const catalog=JSON.parse(await readFile(source,'utf8'));
const previous=JSON.parse(await readFile('public/store-snapshot.json','utf8'));
const additions=JSON.parse(await readFile('docs/stock-additions.json','utf8')).products||[];
if(additions.length!==24)throw Error(`Expected 24 curated additions, got ${additions.length}`);
const referenceProducts=catalog.products.map(p=>({id:p.handle,title:p.title,price:p.price/100,compare_price:(p.compareAtPrice||0)/100,images:p.images.join('|'),category:p.category,sizes:p.sizes.join('|'),colour:p.colourName||p.color,fabric:p.fabric,description:p.description,active:'true',in_stock:String(p.inStock),collections:p.collections.join('|'),size_pricing:JSON.stringify(Object.fromEntries(Object.entries(p.sizePricing||{}).map(([s,v])=>[s,{price:v.price/100,compare_price:(v.compareAtPrice||0)/100,available:v.available}]))),colour_group:p.colourGroup||'',details:(p.details||[]).join('|'),published_at:p.publishedAt||''}));
if(new Set(referenceProducts.map(p=>p.id)).size!==referenceProducts.length)throw Error('Duplicate product handles');
const products=[...additions,...referenceProducts];
const categories=[
  {id:'just-added',title:'Just Added',subtitle:'Fresh festive pieces, just in',image:additions[0].images,active:'true'},
  ...catalog.collections.map(c=>({id:c.handle,title:c.handle==='likshas-choice'?"Noor's Choice":c.title,subtitle:c.subtitle,image:c.image,active:'true'}))
];
const homeSections=[
  {id:'just-added',title:'Just Added',subtitle:'The latest festive pieces to land',collection:'just-added',active:'true',count:'8'},
  ...[['trending','Trending Now',"This week's most-loved styles",'trending'],['best','Best Sellers','The curated best-seller collection','best-seller'],['new','New Arrivals','Freshly dropped, straight from the studio','new-arrivals'],['lehenga','Lehenga Choli','Our range of designer lehenga choli','lehnga-choli'],['explore','More from Noor','Discover the complete collection','all']].map(([id,title,subtitle,collection])=>({id,title,subtitle,collection,active:'true',count:'8'}))
];
const settings={...previous.settings,hero_image:'assets/noor-diwali-hero.webp',hero_alt:'Noor Ethnic Wear Diwali poster: a festive red outfit, up to 75% off, secure payment, easy returns and a Shop Now button.',announcement:'Up to 75% off — the Diwali edit is here.',show_closing:'true'};
delete settings.hero_image_mobile;delete settings.hero_image_tablet;
const data={...previous,settings,products,categories,homeSections,catalogVersion:VERSION,source:{repo:'mystorebyme/tannu-product-',branch:'arena/269464ec-tannu-product',baseCount:referenceProducts.length,additionsCount:additions.length,count:products.length,additionsSource:'Curated public ethnic-wear imagery; see docs/STOCK-ADDITIONS.md'},savedAt:Date.now()};
await writeFile('public/store-snapshot.json',JSON.stringify(data));
const rows=products.map(p=>HEADERS.map(k=>p[k]));
await writeFile('docs/catalog-import.csv',[HEADERS,...rows].map(r=>r.map(quote).join(',')).join('\n'));
await writeFile('public/catalog-seed.json',JSON.stringify({headers:HEADERS,rows,categories,homeSections}));
for(const file of ['public/config.json','config.json']){const config=JSON.parse(await readFile(file,'utf8'));config.catalogVersion=VERSION;await writeFile(file,JSON.stringify(config,null,2));}
await sync();
console.log(`Imported ${referenceProducts.length} reference products plus ${additions.length} curated additions, ${products.reduce((s,p)=>s+p.images.split('|').filter(Boolean).length,0)} images, ${categories.length} collections`);
