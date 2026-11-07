// Free sync API: Cloudflare Worker + KV, with Google sign-in.
// Flow: browser gets a Google ID token -> POST /api/auth -> Worker verifies it, issues a 30-day session token (stored in KV).
// The first Google account to sign in claims the instance; any other account is rejected.
const J={'content-type':'application/json'};
const enc=new TextEncoder(),dec=new TextDecoder();
const hex=async s=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(s)))].map(b=>b.toString(16).padStart(2,'0')).join('');
const b64u=b=>btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const unb64u=s=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));

async function verifyGoogle(cred,env){
 const [h,p,s]=String(cred).split('.');if(!s)throw new Error('malformed');
 const head=JSON.parse(dec.decode(unb64u(h)));if(head.alg!=='RS256')throw new Error('alg');
 const jwks=await(await fetch('https://www.googleapis.com/oauth2/v3/certs',{cf:{cacheTtl:3600,cacheEverything:true}})).json();
 const jwk=jwks.keys.find(k=>k.kid===head.kid);if(!jwk)throw new Error('kid');
 const key=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
 if(!await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,unb64u(s),enc.encode(h+'.'+p)))throw new Error('signature');
 const c=JSON.parse(dec.decode(unb64u(p)));
 if(!['accounts.google.com','https://accounts.google.com'].includes(c.iss)||c.aud!==env.GOOGLE_CLIENT_ID||c.exp*1000<Date.now()||!c.sub)throw new Error('claims');
 return c;
}

export default{async fetch(req,env){
 const url=new URL(req.url),seg=url.pathname.split('/').filter(Boolean);
 if(seg[0]!=='api')return env.ASSETS.fetch(req);

 if(seg[1]==='lib'&&req.method==='GET'){
  // Streams a catalog PDF from archive.org (only items listed in public/library.json), so browsers avoid CORS problems.
  const cat=await(await env.ASSETS.fetch(new Request(new URL('/library.json',req.url)))).json();
  const it=cat.items.find(i=>i.id===seg[2]&&i.pdf);if(!it)return new Response('not found',{status:404});
  if(new URL(it.pdf).hostname!=='archive.org')return new Response('blocked',{status:403});
  const r=await fetch(it.pdf);if(!r.ok)return new Response('upstream '+r.status,{status:502});
  const hd=new Headers({'content-type':'application/pdf','cache-control':'public, max-age=86400'});const cl=r.headers.get('content-length');if(cl)hd.set('content-length',cl);
  return new Response(r.body,{headers:hd});
 }

 if(seg[1]==='auth'&&req.method==='POST'){
  let c;try{c=await verifyGoogle((await req.json()).credential,env)}catch{return new Response('Invalid Google token',{status:401})}
  const owner=await env.KV.get('owner');
  if(!owner)await env.KV.put('owner',c.sub);
  else if(owner!==c.sub)return new Response('This Stitch Tally belongs to a different Google account',{status:403});
  const raw=new Uint8Array(32);crypto.getRandomValues(raw);const session=b64u(raw);
  await env.KV.put('sess:'+await hex(session),c.sub,{expirationTtl:30*86400});
  return new Response(JSON.stringify({session,email:c.email||''}),{headers:J});
 }

 const tok=(req.headers.get('authorization')||'').replace(/^Bearer /,'');
 const sub=tok.length>=32?await env.KV.get('sess:'+await hex(tok)):null;
 if(!sub)return new Response('unauthorized',{status:401});
 if(seg[1]==='logout'&&req.method==='POST'){await env.KV.delete('sess:'+await hex(tok));return new Response('ok')}

 const u=(await hex('g:'+sub)).slice(0,32),what=seg[1],id=seg[2],pre=`${u}:p:`;
 if(what==='list'&&req.method==='GET'){
  const out=[];let cursor;
  do{const r=await env.KV.list({prefix:pre,cursor});for(const k of r.keys)out.push({id:k.name.slice(pre.length),...k.metadata});cursor=r.list_complete?undefined:r.cursor}while(cursor);
  return new Response(JSON.stringify(out),{headers:J});
 }
 if(!id||!/^[\w-]{1,64}$/.test(id))return new Response('bad id',{status:400});
 const pk=pre+id,fk=`${u}:f:${id}`;
 if(what==='p'){
  if(req.method==='GET'){const v=await env.KV.get(pk);return v?new Response(v,{headers:J}):new Response('',{status:404})}
  if(req.method==='PUT'){let j;try{j=await req.json()}catch{return new Response('bad json',{status:400})}
   const meta={updated:Number(j.updated)||Date.now()};
   if(j.deleted){meta.deleted=true;await env.KV.delete(fk)}
   await env.KV.put(pk,JSON.stringify(j),{metadata:meta});return new Response('ok')}
 }
 if(what==='pdf'){
  if(req.method==='GET'){const b=await env.KV.get(fk,'arrayBuffer');return b?new Response(b,{headers:{'content-type':'application/pdf'}}):new Response('',{status:404})}
  if(req.method==='PUT'){const b=await req.arrayBuffer();if(b.byteLength>25e6)return new Response('too big',{status:413});await env.KV.put(fk,b);return new Response('ok')}
 }
 return new Response('not found',{status:404});
}};
