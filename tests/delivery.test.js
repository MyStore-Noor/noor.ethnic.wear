import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validPin,indianPhone,validateCustomer,validateBag,pinIndex,checkDelivery} from '../src/delivery.js';

const map=JSON.parse(await readFile('public/pincode-map.json','utf8'));
const index=pinIndex(map);
const product={active:true,in_stock:true,sizes:['S [36]','M [38]'],size_pricing:{'S [36]':{available:true},'M [38]':{available:false}},price:699};

test('PIN shape and Indian mobile validation reject lookalike input',()=>{
  assert.equal(validPin('302001'),true);assert.equal(validPin('020001'),false);assert.equal(validPin('30200'),false);assert.equal(validPin('3020011'),false);
  assert.equal(indianPhone('+91 97857 95831'),'9785795831');assert.equal(indianPhone('09785795831'),'9785795831');assert.equal(indianPhone('12345'),'');
});
test('Customer details are fully validated before checkout',()=>{
  const good={name:'Noor Customer',phone:'9785795831',address:'12 Johari Bazaar, Jaipur',pincode:'302001'};
  assert.equal(validateCustomer(good),'');
  assert.match(validateCustomer({...good,name:''}),/full name/);
  assert.match(validateCustomer({...good,phone:'1234567890'}),/mobile/);
  assert.match(validateCustomer({...good,address:'short'}),/address/);
  assert.match(validateCustomer({...good,pincode:'012345'}),/PIN/);
});
test('Bag verification blocks missing, sold-out and invalid quantities',()=>{
  assert.equal(validateBag([{product,size:'S [36]',quantity:1}]),'');
  assert.match(validateBag([]),/empty/);
  assert.match(validateBag([{product,size:'M [38]',quantity:1}]),/size is no longer available/);
  assert.match(validateBag([{product,size:'S [36]',quantity:0}]),/quantity/);
  assert.match(validateBag([{product:{...product,in_stock:false},size:'S [36]',quantity:1}]),/no longer available/);
});
test('Real delivery PIN resolves to its district and state',()=>{
  const result=checkDelivery('302001',index,{},[]);
  assert.equal(result.eligible,true);assert.equal(result.state,'Rajasthan');assert.equal(result.district,'Jaipur');assert.equal(result.reason,'ok');assert.equal(result.confirmed,false);
  assert.match(result.message,/PIN verified: Jaipur, Rajasthan/);assert.equal(result.shippingFee,null);
});
test('Unknown, invalid and blocked PINs never pass checkout',()=>{
  assert.equal(checkDelivery('999999',index,{},[]).eligible,false);
  assert.equal(checkDelivery('302001',index,{blocked_pincodes:'302001'},[]).reason,'blocked');
  assert.equal(checkDelivery('302001',index,{blocked_states:'Rajasthan'},[]).reason,'blocked');
  assert.equal(checkDelivery('302001',index,{allowed_states:'Gujarat'},[]).eligible,false);
  assert.equal(checkDelivery('302001',index,{allowed_states:'rajasthan'},[]).eligible,true);
});
test('Owner delivery rules override the default with days, fee and serviceability',()=>{
  const rule={pincode:'302001',state:'',district:'',serviceable:'true',delivery_days:'3-5 business days',shipping_fee:'79',active:'true'};
  const result=checkDelivery('302001',index,{},[rule]);
  assert.equal(result.eligible,true);assert.equal(result.confirmed,true);assert.equal(result.deliveryDays,'3-5 business days');assert.equal(result.shippingFee,79);
  assert.match(result.message,/Delivery available in Jaipur, Rajasthan/);
  assert.equal(checkDelivery('302001',index,{},[{...rule,serviceable:'false'}]).reason,'blocked');
  assert.equal(checkDelivery('302001',index,{},[{...rule,active:'false'}]).confirmed,false);
});
