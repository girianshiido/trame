// Homogeneous rational coordinates. Normalization makes geometric equality exact.
export type H = readonly [bigint, bigint, bigint];
export type Key = string;
const abs = (x: bigint) => x < 0n ? -x : x;
function gcd(a: bigint,b: bigint): bigint { a=abs(a); b=abs(b); while(b){ const t=a%b; a=b;b=t; } return a; }
export function norm(a:bigint,b:bigint,c:bigint): H {
  const g=gcd(gcd(a,b),c); if(!g) throw new Error('Objet géométrique indéfini');
  const sign=(c!==0n?c:b!==0n?b:a)<0n?-1n:1n;
  return [a/g*sign,b/g*sign,c/g*sign];
}
export const p=(x:number,y:number,d=1):H=>norm(BigInt(x),BigInt(y),BigInt(d));
export const key=(h:H):Key=>h.join(',');
export function read(k:Key):H { if(!/^-?\d+,-?\d+,-?\d+$/.test(k)||k.length>700)throw new Error('Coordonnées invalides'); const v=k.split(',').map(BigInt);return norm(v[0],v[1],v[2]); }
export const cross=(a:H,b:H):H=>norm(a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]);
export const same=(a:H,b:H)=>key(a)===key(b);
export const on=(l:H,a:H)=>l[0]*a[0]+l[1]*a[1]+l[2]*a[2]===0n;
export const xy=(a:H):[number,number]=>[Number(a[0])/Number(a[2]),Number(a[1])/Number(a[2])];
export const inside=(a:H,n=8)=>a[2]>0n&&a[0]>=0n&&a[1]>=0n&&a[0]<=BigInt(n)*a[2]&&a[1]<=BigInt(n)*a[2];
export const mid=(a:H,b:H):H=>norm(a[0]*b[2]+b[0]*a[2],a[1]*b[2]+b[1]*a[2],2n*a[2]*b[2]);
export function mean(ps:H[],weights:number[]=ps.map(()=>1)):H {
  let x=0n,y=0n,d=1n,total=0n;
  ps.forEach((a,i)=>{const w=BigInt(weights[i]); x=x*a[2]+a[0]*w*d;y=y*a[2]+a[1]*w*d;d*=a[2];total+=w;const g=gcd(gcd(x,y),d);if(g){x/=g;y/=g;d/=g;}});
  return norm(x,y,d*total);
}
export function affine(a:H,b:H,c:H):H { // a + b - c
 return norm(a[0]*b[2]*c[2]+b[0]*a[2]*c[2]-c[0]*a[2]*b[2],a[1]*b[2]*c[2]+b[1]*a[2]*c[2]-c[1]*a[2]*b[2],a[2]*b[2]*c[2]);
}
export function scale(a:H,o:H,num:number,den=1):H {
 return norm(BigInt(num)*a[0]*o[2]+BigInt(den-num)*o[0]*a[2],BigInt(num)*a[1]*o[2]+BigInt(den-num)*o[1]*a[2],BigInt(den)*a[2]*o[2]);
}
export function rotate(a:H,o:H):H { const d=a[2]*o[2];return norm(o[0]*a[2]-(a[1]*o[2]-o[1]*a[2]),o[1]*a[2]+(a[0]*o[2]-o[0]*a[2]),d); }
export function reflect(a:H,l:H):H {
 const s=l[0]*a[0]+l[1]*a[1]+l[2]*a[2],d=l[0]*l[0]+l[1]*l[1];
 return norm(a[0]*d-2n*l[0]*s,a[1]*d-2n*l[1]*s,a[2]*d);
}
export function grid(n=8):H[]{ const r:H[]=[];for(let x=0;x<=n;x++)for(let y=0;y<=n;y++)r.push(p(x,y));return r; }
export function gridLines(n=8):H[]{const r:H[]=[];for(let i=0;i<=n;i++)r.push(norm(1n,0n,-BigInt(i)),norm(0n,1n,-BigInt(i)));return r;}
export function intersection(a:H,b:H):H|null {try{const q=cross(a,b);return q[2]===0n?null:q;}catch{return null;}}
export type Board = { points: Key[]; lines: Key[] };
export function onSegment(q:H,a:H,b:H):boolean {
 if(same(a,b))return same(q,a);
 if(!on(cross(a,b),q))return false;
 const dx1=q[0]*a[2]-a[0]*q[2],dx2=q[0]*b[2]-b[0]*q[2];
 const dy1=q[1]*a[2]-a[1]*q[2],dy2=q[1]*b[2]-b[1]*q[2];
 return dx1*dx2<=0n&&dy1*dy2<=0n;
}
export function candidates(board:Board,givens:Key[],n=8,segments:[Key,Key][]=[]):Map<Key,H> {
 const out=new Map<Key,H>();for(const a of [...grid(n),...givens.map(read),...board.points.map(read)])out.set(key(a),a);
 const gl=gridLines(n),ls=board.lines.map(read);
 for(let i=0;i<ls.length;i++)for(const b of [...gl,...ls.slice(i+1)]){const q=intersection(ls[i],b);if(q&&inside(q,n))out.set(key(q),q);}
 const ss=segments.filter(([a,b])=>a!==b).map(([a,b])=>({a:read(a),b:read(b),l:cross(read(a),read(b))}));
 for(let i=0;i<ss.length;i++){
  const s=ss[i];
  for(const l of [...gl,...ls]){const q=intersection(s.l,l);if(q&&inside(q,n)&&onSegment(q,s.a,s.b))out.set(key(q),q);}
  for(const t of ss.slice(i+1)){const q=intersection(s.l,t.l);if(q&&inside(q,n)&&onSegment(q,s.a,s.b)&&onSegment(q,t.a,t.b))out.set(key(q),q);}
 }
 return out;
}
export function legalPoint(k:Key,board:Board,givens:Key[],n=8,segments:[Key,Key][]=[]):boolean {return candidates(board,givens,n,segments).has(k);}
export function lineThrough(a:Key,b:Key):Key|null {try{return key(cross(read(a),read(b)));}catch{return null;}}
export function clip(l:H,n=8):[number,number][] {
 const out:[number,number][]=[];for(const e of [norm(1n,0n,0n),norm(0n,1n,0n),norm(1n,0n,-BigInt(n)),norm(0n,1n,-BigInt(n))]){const q=intersection(l,e);if(q&&inside(q,n)){const v=xy(q);if(!out.some(a=>Math.hypot(a[0]-v[0],a[1]-v[1])<1e-8))out.push(v);}}
 return out.slice(0,2);
}
