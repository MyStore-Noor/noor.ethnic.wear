/** Bind this script to the private Store Control spreadsheet. Never publish Orders. */
function table_(name) {
  var sh=SpreadsheetApp.getActive().getSheetByName(name);
  if(!sh) throw new Error('Missing tab: '+name);
  var rows=sh.getDataRange().getDisplayValues(), headers=rows.shift();
  return rows.filter(function(r){return r[0];}).map(function(r){var o={};headers.forEach(function(h,i){o[h]=r[i];});return o;});
}
function json_(value){return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);}
function doGet(e){
  try {
    if(e.parameter.action!=='catalog')return json_({ok:true,service:'Noor Store Sheet Bridge'});
    var allowed=['store_name','announcement','whatsapp','support_phone','hero_eyebrow','hero_title','hero_subtitle','hero_image','logo','instagram_url','story','shipping_policy','return_policy','hero_image_mobile','hero_image_tablet','catalog_version','show_story','show_categories','show_home_rails','show_service_strip','show_closing','delivery_days','shipping_fee','blocked_pincodes','blocked_states','allowed_states'];
    var settings={};table_('Settings').forEach(function(r){if(allowed.indexOf(r.key)>=0)settings[r.key]=r.value;});
    return json_({ok:true,settings:settings,products:table_('Products').filter(function(p){return p.active.toLowerCase()==='true';}),categories:table_('Categories'),homeSections:table_('HomeSections'),deliveryRules:table_('DeliveryRules'),catalogVersion:settings.catalog_version});
  }catch(err){return json_({ok:false,error:'Store data unavailable'});}
}
function safeCell_(s){s=String(s===null||s===undefined?'':s);return /^[=+@\-]/.test(s)?"'"+s:s;}
function doPost(e){
 var lock=LockService.getScriptLock();
 try{
  if(!e.postData||e.postData.contents.length>16000)throw new Error('Invalid request');
  var o=JSON.parse(e.postData.contents);
  var phone=String(o.phone||'').replace(/\D/g,'').replace(/^(?:91|0)(?=\d{10}$)/,'');if(!o.name||String(o.name).trim().length<2||String(o.name).length>100||!/^[6-9]\d{9}$/.test(phone)||!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(String(o.email||''))||String(o.email).length>120||!/^[1-9]\d{5}$/.test(String(o.pincode||''))||!o.address||String(o.address).trim().length<10||String(o.address).length>500||!String(o.city||'').trim()||!String(o.state||'').trim()||!Array.isArray(o.items)||!o.items.length||o.items.length>30)throw new Error('Invalid customer details');
  o.phone=phone;
  lock.waitLock(10000);
  var products=table_('Products'), total=0;
  var items=o.items.map(function(i){
   var p=products.find(function(p){return p.id===i.id&&String(p.active).toLowerCase()==='true'&&String(p.in_stock).toLowerCase()==='true';});
   if(!p||p.sizes.split('|').indexOf(i.size)<0||!Number.isInteger(i.quantity)||i.quantity<1||i.quantity>10)throw new Error('Product unavailable');
   var pricing=JSON.parse(p.size_pricing||'{}'), variant=pricing[i.size];if(variant&&variant.available===false)throw new Error('Size unavailable');var price=Number(variant&&variant.price!==undefined?variant.price:p.price);if(!isFinite(price)||price<=0)throw new Error('Invalid price');
   total+=price*i.quantity;return {id:p.id,title:p.title,size:i.size,quantity:i.quantity,price:price};
  });
  var sheet=SpreadsheetApp.getActive().getSheetByName('Orders');
  // Limit repeated submissions without exposing customer data publicly.
  var cache=CacheService.getScriptCache(), key='order_'+String(o.phone).replace(/\D/g,'');
  if(cache.get(key))throw new Error('Please wait before requesting another order');
  var id='NOOR-'+Utilities.getUuid().slice(0,8).toUpperCase();
  sheet.appendRow([id,new Date().toISOString(),safeCell_(o.name),safeCell_(o.phone),safeCell_(o.address),safeCell_(o.pincode),total,'WhatsApp request, not confirmed',JSON.stringify(items),safeCell_(o.email),safeCell_(o.city||''),safeCell_(o.state||''),'PIN verified on storefront']);
  var itemSheet=SpreadsheetApp.getActive().getSheetByName('OrderItems');
  items.forEach(function(i){itemSheet.appendRow([id,safeCell_(i.id),safeCell_(i.title),safeCell_(i.size),i.quantity,i.price]);});
  cache.put(key,'1',30);
  return json_({ok:true,order_id:id,total:total,items:items});
 }catch(err){return json_({ok:false,error:String(err.message||'Unable to save request')});}
 finally{if(lock.hasLock())lock.releaseLock();}
}

/** Run only from the authorized editor or bound-sheet menu, never an anonymous HTTP action. */
function onOpen(){var orders=SpreadsheetApp.getActive().getSheetByName('Orders');if(orders&&orders.getLastColumn()<13){var headers=orders.getRange(1,1,1,orders.getLastColumn()).getValues()[0];['email','city','state','delivery_check'].forEach(function(h,i){if(headers.indexOf(h)<0)orders.getRange(1,orders.getLastColumn()+1).setValue(h);});}SpreadsheetApp.getUi().createMenu('Noor Store').addItem('Import all 448 reference products','importAllReferenceProducts').addItem('Make imported products editable','materializeProducts').addToUi();}
function importAllReferenceProducts(){
 var ui=SpreadsheetApp.getUi();
 if(ui.alert('Import all reference products?','This backs up Products and replaces the catalog with all 448 reference items. Orders are untouched.',ui.ButtonSet.YES_NO)!==ui.Button.YES)return;
 var url='https://github.com/MyStore-Noor/noor.ethnic.wear/raw/refs/heads/arena/5beb3e1b-noor-ethnic-wear/public/catalog-seed.json';
 var response=UrlFetchApp.fetch(url,{followRedirects:true});
 var data=JSON.parse(response.getContentText());
 if(data.rows.length!==448||data.headers[0]!=='id'||new Set(data.rows.map(function(r){return r[0];})).size!==448)throw new Error('Import validation failed, existing data was not changed');
 var ss=SpreadsheetApp.getActive(),p=ss.getSheetByName('Products');
 p.copyTo(ss).setName('Products backup '+Utilities.formatDate(new Date(),Session.getScriptTimeZone(),'yyyyMMdd HHmmss'));
 var rows=[data.headers].concat(data.rows).map(function(r){return r.map(safeCell_);});
 p.clearContents();p.getRange(1,1,rows.length,data.headers.length).setNumberFormat('@').setValues(rows);p.setFrozenRows(1);
 var settings=ss.getSheetByName('Settings'),values=settings.getDataRange().getValues();
 var index=values.findIndex(function(r){return r[0]==='catalog_version';});
 if(index>=0)settings.getRange(index+1,2).setValue('tannu-448-v2');else settings.appendRow(['catalog_version','tannu-448-v2']);
 ui.alert('448 products imported as editable rows. Your Orders were not changed.');
}
function materializeProducts(){
 var ss=SpreadsheetApp.getActive(),p=ss.getSheetByName('Products');
 var rows=p.getDataRange().getValues();
 if(rows.length!==449||rows[0][0]!=='id')throw new Error('First allow external access in CatalogImport A1 and wait for all 448 products');
 // Only replace the formula after verifying every imported handle and creating a backup.
 if(new Set(rows.slice(1).map(function(r){return r[0];})).size!==448)throw new Error('Import has duplicate/missing IDs');
 p.copyTo(ss).setName('Products linked backup '+Date.now());
 p.clearContents();p.getRange(1,1,rows.length,rows[0].length).setValues(rows.map(function(r){return r.map(safeCell_);}));
 var settings=ss.getSheetByName('Settings'),values=settings.getDataRange().getValues();
 var idx=values.findIndex(function(r){return r[0]==='catalog_version';});
 if(idx>=0)settings.getRange(idx+1,2).setValue('tannu-448-v2');
}
