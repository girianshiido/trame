import fs from 'node:fs';
const source=new URL('../dist/',import.meta.url),dest=new URL('../docs/',import.meta.url);
fs.mkdirSync(dest,{recursive:true});
// docs is generated output; replace stale hashed assets to keep the precache coherent.
for(const entry of fs.readdirSync(dest))fs.rmSync(new URL(entry,dest),{recursive:true,force:true});
fs.cpSync(source,dest,{recursive:true});fs.writeFileSync(new URL('.nojekyll',dest),'');
console.log('GitHub Pages prêt : main:/docs');
