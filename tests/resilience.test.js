import test from 'node:test';
import assert from 'node:assert/strict';
import {fnv1a,dataSignature,backoffDelay,createRetry,debounce,singleFlight,shouldRefresh} from '../src/resilience.js';

const product={id:'a',title:'Anarkali',price:699,images:['x'],sizes:['M'],size_pricing:{M:{price:699}},details:[],collections:[]};

test('Data signature is stable for identical catalog data and changes with any edit',()=>{
  const base={settings:{whatsapp:'919785795831'},products:[product],categories:[],homeSections:[],deliveryRules:[],catalogVersion:'v2'};
  assert.equal(dataSignature(base),dataSignature(JSON.parse(JSON.stringify(base))));
  assert.notEqual(dataSignature(base),dataSignature({...base,products:[{...product,price:599}]}));
  assert.notEqual(dataSignature(base),dataSignature({...base,settings:{whatsapp:'910000000000'}}));
  assert.notEqual(dataSignature(base),dataSignature({...base,deliveryRules:[{pincode:'302001',serviceable:'true'}]}));
  assert.equal(dataSignature({}),dataSignature({}));
});

test('Backoff grows exponentially, stays capped and always includes jitter',()=>{
  assert.equal(backoffDelay(0,{base:1000,jitter:0,random:()=>0.5}),1000);
  assert.equal(backoffDelay(1,{base:1000,jitter:0,random:()=>0.5}),2000);
  assert.equal(backoffDelay(2,{base:1000,jitter:0,random:()=>0.5}),4000);
  assert.equal(backoffDelay(20,{base:1000,max:60000,jitter:0,random:()=>0.5}),60000);
  const low=backoffDelay(3,{base:1000,max:60000,jitter:0.3,random:()=>0});
  const high=backoffDelay(3,{base:1000,max:60000,jitter:0.3,random:()=>0.999});
  assert.ok(low>=5600&&low<8000,'low jitter bound');
  assert.ok(high>8000&&high<=10400,'high jitter bound');
  assert.equal(backoffDelay(1,{base:100,max:1000,jitter:0.3,random:()=>0.5}),200);
});

test('Retry succeeds after transient failures and rethrows the final error',async()=>{
  const waits=[];let calls=0;
  const retry=createRetry({attempts:3,sleep:async ms=>waits.push(ms),random:()=>0.5,base:100});
  const value=await retry(async()=>{calls++;if(calls<3)throw Error('flaky');return 'ok';});
  assert.equal(value,'ok');assert.equal(calls,3);assert.equal(waits.length,2);
  let attempts=0;const fail=createRetry({attempts:2,sleep:async()=>{},random:()=>0.5});
  await assert.rejects(()=>fail(async()=>{attempts++;throw Error('down');}),/down/);
  assert.equal(attempts,2);
});

test('Debounce collapses bursts and can be cancelled or flushed',async()=>{
  let calls=0;const debounced=debounce(()=>{calls++;},20);
  debounced();debounced();debounced();
  assert.equal(calls,0);
  await new Promise(r=>setTimeout(r,40));
  assert.equal(calls,1);
  debounced();debounced.cancel();
  await new Promise(r=>setTimeout(r,40));
  assert.equal(calls,1);
  debounced.flush();
  assert.equal(calls,2);
});

test('Single flight shares one in-flight request and allows a later one',async()=>{
  let runs=0;const task=singleFlight(async()=>{runs++;await new Promise(r=>setTimeout(r,10));return runs;});
  const [a,b]=await Promise.all([task(),task()]);
  assert.equal(a,1);assert.equal(b,1);assert.equal(runs,1);
  assert.equal(await task(),2);
});

test('Refresh policy respects offline, hidden tabs, busy work and recent interaction',()=>{
  assert.equal(shouldRefresh({}),true);
  assert.equal(shouldRefresh({online:false}),false);
  assert.equal(shouldRefresh({hidden:true}),false);
  assert.equal(shouldRefresh({busy:true}),false);
  assert.equal(shouldRefresh({interactingUntil:Date.now()+5000}),false);
  assert.equal(shouldRefresh({interactingUntil:Date.now()-5000}),true);
});
