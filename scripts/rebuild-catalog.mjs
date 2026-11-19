// Rebuild every catalog artifact from the 448-product reference snapshot plus the
// curated additions in docs/stock-additions.json. Keeps the Sheet migration CSV,
// seed JSON, runtime snapshot, root mirror and config version in lockstep.
import {readFile,writeFile} from 'node:fs/promises';
import {sync} from './sync-pages.mjs';

const VERSION='noor-472-v3';
const HEADERS=['id','title','price','compare_price','images','category','sizes','colour','fabric','description','active','in_stock','collections','size_pricing','colour_group','details','published_at'];
const quote=value=>'"'+String(value??'').replaceAll('"','""')+'"';
const additionsDoc=JSON.parse(await readFile('docs/stock-additions.json','utf8'));
const additions=additionsDoc.products||[];
if(additions.length!==24)throw Error(`Expected 24 curated additions, got ${additions.length}`);
for(const product of additions)if(Object.keys(product).join('|')!==HEADERS.join('|'))throw Error(`Unexpected fields on ${product.id}`);

const snapshot=JSON.parse(await readFile('public/store-snapshot.json','utf8'));
const baseProducts=snapshot.products.filter(product=>!product.id.startsWith('noor-just-in-'));
if(baseProducts.length!==448)throw Error(`Expected 448 reference products, got ${baseProducts.length}`);
const products=[...additions,...baseProducts];
if(new Set(products.map(product=>product.id)).size!==products.length)throw Error('Duplicate product IDs');

const settings={
  ...snapshot.settings,
  announcement:'Up to 75% off — the Diwali edit is here.',
  hero_eyebrow:'THE FESTIVAL OF YOU',
  hero_title:'This Diwali, wear your light.',
  hero_subtitle:'Rich colours. Beautiful details. Pieces made for your brightest moments.',
  story:'Rooted in tradition. Worn your way. Noor Ethnic Wear celebrates Indian silhouettes, thoughtful details and the joy of dressing up.',
  hero_image:'assets/noor-diwali-hero.webp',
  hero_alt:'Noor Ethnic Wear Diwali poster: a festive red outfit, up to 75% off, secure payment, easy returns and a Shop Now button.',
  show_hero_copy:'false',
  show_closing:'true'
};
delete settings.hero_image_mobile;
delete settings.hero_image_tablet;

const categories=[
  {id:'just-added',title:'Just Added',subtitle:'Fresh festive pieces, just in',image:additions[0].images,active:'true'},
  ...snapshot.categories.filter(category=>category.id!=='just-added')
];
const homeSections=[
  {id:'just-added',title:'Just Added',subtitle:'The latest festive pieces to land',collection:'just-added',active:'true',count:'8'},
  ...snapshot.homeSections.filter(section=>section.id!=='just-added')
];
const source={
  repo:'mystorebyme/tannu-product-',
  branch:'arena/269464ec-tannu-product',
  baseCount:448,
  additionsCount:additions.length,
  count:products.length,
  additionsSource:'Curated public ethnic-wear imagery; see docs/STOCK-ADDITIONS.md'
};
const updated={...snapshot,settings,products,categories,homeSections,catalogVersion:VERSION,source,savedAt:Date.now()};

await writeFile('public/store-snapshot.json',JSON.stringify(updated));
const rows=products.map(product=>HEADERS.map(key=>product[key]));
await writeFile('public/catalog-seed.json',JSON.stringify({headers:HEADERS,rows,categories,homeSections}));
await writeFile('docs/catalog-import.csv',[HEADERS,...rows].map(row=>row.map(quote).join(',')).join('\n'));

for(const file of ['public/config.json','config.json']){
  const config=JSON.parse(await readFile(file,'utf8'));
  config.catalogVersion=VERSION;
  await writeFile(file,JSON.stringify(config,null,2));
}
await sync();
const photoCount=products.reduce((sum,product)=>sum+String(product.images).split('|').filter(Boolean).length,0);
console.log(`Rebuilt ${products.length} products, ${photoCount} photos, ${categories.length} categories and ${homeSections.length} rails. Version ${VERSION}.`);
