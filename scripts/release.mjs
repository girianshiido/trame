import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root=new URL('../dist/',import.meta.url);
function walk(dir,prefix=''){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name),prefix+e.name+'/'):[prefix+e.name]);}
// A self-contained file is useful for direct sharing and requires no server.
let html=fs.readFileSync(new URL('index.html',root),'utf8');
const js=html.match(/<script type="module"[^>]*src="([^"]+)"[^>]*><\/script>/)?.[1],css=html.match(/<link rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/)?.[1];
if(js){const source=fs.readFileSync(new URL(js,root),'utf8').replace(/<\/script/gi,'<\\/script');html=html.replace(/<script type="module"[^>]*src="[^"]+"[^>]*><\/script>/,()=>`<script type="module">${source}</script>`);}
if(css)html=html.replace(/<link rel="stylesheet"[^>]*href="[^"]+"[^>]*>/,()=>`<style>${fs.readFileSync(new URL(css,root),'utf8')}</style>`);
// Keep the web app self-contained too: an offline navigation needs only one document.
fs.writeFileSync(new URL('index.html',root),html);
fs.rmSync(new URL('assets/',root),{recursive:true,force:true});
const files=walk(root.pathname).filter(f=>f!=='sw.js');
const hash=crypto.createHash('sha256');for(const f of files)hash.update(fs.readFileSync(new URL(f,root)));const version=hash.digest('hex').slice(0,12);
const sw=`const CACHE='trame-${version}';const BASE=new URL('./',self.location.href);const FILES=${JSON.stringify(files.map(f=>'./'+f))};
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES.map(f=>new URL(f,BASE).href)))));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('trame-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('message',e=>{if(e.data==='SKIP_WAITING')self.skipWaiting();});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==BASE.origin)return;if(e.request.mode==='navigate'){e.respondWith(caches.match(new URL('index.html',BASE).href).then(r=>r||fetch(e.request)));return;}e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));});`;
fs.writeFileSync(new URL('sw.js',root),sw);
html=html.replace(/<link[^>]*(?:rel="manifest"|rel="apple-touch-icon")[^>]*>/g,'').replace(/href="\.\/icon.svg"/g,`href="data:image/svg+xml,${encodeURIComponent(fs.readFileSync(new URL('../public/icon.svg',import.meta.url),'utf8'))}"`);
fs.mkdirSync(new URL('../release/',import.meta.url),{recursive:true});fs.writeFileSync(new URL('../release/TRAME.html',import.meta.url),html);
console.log(`Hors connexion : ${files.length} fichiers précachés, version ${version}. Fichier autonome : release/TRAME.html`);
