import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
test('Service worker : précache complet, routes sous /trame/ et rechargement sans réseau',async()=>{
 const output=fs.existsSync(new URL('../dist/sw.js',import.meta.url))?'../dist/':'../docs/';
 const source=fs.readFileSync(new URL(output+'sw.js',import.meta.url),'utf8');
 const origin='https://example.test/trame/',events={},db=new Map();let online=true;
 const caches={open:async name=>{if(!db.has(name))db.set(name,new Map());const data=db.get(name);return {addAll:async urls=>{for(const u of urls){const file=new URL(u).pathname.replace('/trame/','');assert.ok(fs.existsSync(new URL(output+file,import.meta.url)),`Précache absent : ${file}`);data.set(u,{url:u,body:fs.readFileSync(new URL(output+file,import.meta.url),'utf8')});}}};},keys:async()=>[...db.keys()],delete:async k=>db.delete(k),match:async req=>{const url=typeof req==='string'?req:req.url;for(const c of db.values())if(c.has(url))return c.get(url);}};
 const self={location:{href:origin+'sw.js'},clients:{claim:async()=>{}},skipWaiting:()=>{},addEventListener:(name,fn)=>events[name]=fn};
 vm.runInNewContext(source,{self,caches,URL,fetch:async req=>{if(!online)throw Error('Hors connexion');return {url:typeof req==='string'?req:req.url};}});
 let installing;events.install({waitUntil:p=>installing=p});await installing;let activating;events.activate({waitUntil:p=>activating=p});await activating;
 online=false;
 const request=async(url,mode='cors')=>{let response;events.fetch({request:{url,method:'GET',mode},respondWith:p=>response=p});return await response;};
 const home=await request(origin,'navigate');assert.ok(home.body.includes('TRAME'));
 const script=home.body.match(/src="\.\/([^\"]+\.js)"/)[1];assert.ok((await request(origin+script)).body.includes('Construction juste.'));
 const css=home.body.match(/href="\.\/([^\"]+\.css)"/)[1];assert.ok((await request(origin+css)).body.includes('.workspace'));
 assert.ok(await request(origin+'icon-192.png'));assert.ok(await request(origin+'manifest.webmanifest'));
});
