// Small, dependency-free helpers that keep the storefront healthy on real networks:
// trimmed API calls, jittered backoff, retries for idempotent reads, debounced typing
// and a cheap data signature so an unchanged Sheet never re-renders the product grid.

export function fnv1a(input){
  let hash=0x811c9dc5;
  const text=String(input);
  for(let i=0;i<text.length;i++){
    hash^=text.charCodeAt(i);
    hash=Math.imul(hash,0x01000193)>>>0;
  }
  return hash.toString(36);
}

export function dataSignature(data={}){
  return fnv1a(JSON.stringify({
    settings:data.settings||{},
    products:data.products||[],
    categories:data.categories||[],
    homeSections:data.homeSections||[],
    deliveryRules:data.deliveryRules||[],
    catalogVersion:data.catalogVersion||''
  }));
}

export function backoffDelay(attempt,{base=1500,max=60000,jitter=0.3,random=Math.random}={}){
  const safeAttempt=Math.max(0,Math.min(10,Number(attempt)||0));
  const raw=Math.min(max,base*2**safeAttempt);
  const spread=raw*jitter;
  return Math.max(0,Math.round(raw-spread+random()*spread*2));
}

export const defaultSleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));

export function createRetry({attempts=3,base=600,max=8000,random=Math.random,sleep=defaultSleep}={}){
  return async function retry(task,{onRetry}={}){
    let lastError;
    for(let attempt=0;attempt<attempts;attempt++){
      try{return await task(attempt);}
      catch(error){
        lastError=error;
        if(attempt===attempts-1)break;
        const wait=backoffDelay(attempt,{base,max,random});
        onRetry?.(error,attempt,wait);
        await sleep(wait);
      }
    }
    throw lastError;
  };
}

export function debounce(fn,wait=150){
  let timer;
  const debounced=(...args)=>{clearTimeout(timer);timer=setTimeout(()=>fn(...args),wait);};
  debounced.cancel=()=>clearTimeout(timer);
  debounced.flush=(...args)=>{debounced.cancel();fn(...args);};
  return debounced;
}

export function singleFlight(task){
  let pending;
  return (...args)=>{
    if(pending)return pending;
    pending=Promise.resolve()
      .then(()=>task(...args))
      .finally(()=>{pending=undefined;});
    return pending;
  };
}

export function shouldRefresh({online=true,hidden=false,busy=false,interactingUntil=0,now=Date.now()}={}){
  return online&&!hidden&&!busy&&now>=interactingUntil;
}
