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
    var allowed=['store_name','announcement','whatsapp','support_phone','hero_eyebrow','hero_title','hero_subtitle','hero_image','logo','instagram_url','story','shipping_policy','return_policy'];
    var settings={};table_('Settings').forEach(function(r){if(allowed.indexOf(r.key)>=0)settings[r.key]=r.value;});
    return json_({ok:true,settings:settings,products:table_('Products').filter(function(p){return p.active.toLowerCase()==='true';}),categories:table_('Categories')});
  }catch(err){return json_({ok:false,error:'Store data unavailable'});}
}
function safeCell_(s){s=String(s||'');return /^[=+@\-]/.test(s)?"'"+s:s;}
function doPost(e){
 var lock=LockService.getScriptLock();
 try{
  if(!e.postData||e.postData.contents.length>16000)throw new Error('Invalid request');
  var o=JSON.parse(e.postData.contents);
  if(!o.name||String(o.name).length>100||!/[0-9]{10}/.test(String(o.phone).replace(/\D/g,''))||!/^\d{6}$/.test(o.pincode)||!o.address||String(o.address).length>500||!Array.isArray(o.items)||!o.items.length||o.items.length>30)throw new Error('Invalid customer details');
  lock.waitLock(10000);
  var products=table_('Products'), total=0;
  var items=o.items.map(function(i){
   var p=products.find(function(p){return p.id===i.id&&p.active==='true'&&p.in_stock==='true';});
   if(!p||p.sizes.split('|').indexOf(i.size)<0||!Number.isInteger(i.quantity)||i.quantity<1||i.quantity>10)throw new Error('Product unavailable');
   var price=Number(p.price);if(!isFinite(price)||price<=0)throw new Error('Invalid price');
   total+=price*i.quantity;return {id:p.id,title:p.title,size:i.size,quantity:i.quantity,price:price};
  });
  var sheet=SpreadsheetApp.getActive().getSheetByName('Orders');
  // Limit repeated submissions without exposing customer data publicly.
  var cache=CacheService.getScriptCache(), key='order_'+String(o.phone).replace(/\D/g,'');
  if(cache.get(key))throw new Error('Please wait before requesting another order');
  var id='NOOR-'+Utilities.getUuid().slice(0,8).toUpperCase();
  sheet.appendRow([id,new Date().toISOString(),safeCell_(o.name),safeCell_(o.phone),safeCell_(o.address),safeCell_(o.pincode),total,'WhatsApp request, not confirmed',JSON.stringify(items)]);
  var itemSheet=SpreadsheetApp.getActive().getSheetByName('OrderItems');
  items.forEach(function(i){itemSheet.appendRow([id,safeCell_(i.id),safeCell_(i.title),safeCell_(i.size),i.quantity,i.price]);});
  cache.put(key,'1',30);
  return json_({ok:true,order_id:id,total:total});
 }catch(err){return json_({ok:false,error:String(err.message||'Unable to save request')});}
 finally{if(lock.hasLock())lock.releaseLock();}
}
