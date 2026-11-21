import * as THREE from 'three';
import { OrbitControls } from './lib/OrbitControls.js';

/* ============ DURUM ============ */
const KEY='cisimAtolyesi_v1';
const ST=Object.assign({pi:3,hq:true,snd:true,bg:true},(()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){return {}}})());
ST.level=9;
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(ST))}catch(e){}};
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
function el(t,c,h){const e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e}
const nf=x=>{const r=Math.round(x*100)/100;return String(r).replace('.',',')};
const PIV=()=>ST.pi===3?3:3.14, PIS=()=>ST.pi===3?'3':'3,14';
const LV={7:'7. Sınıf',8:'8. Sınıf',9:'İleri'};
const lvChip=()=>'';
const V3=(x,y,z)=>new THREE.Vector3(x,y,z);

/* ============ RENKLER ============ */
const C={taban:0x0D9488,ust:0x2DD4BF,yan:[0xF9735B,0xF59E0B,0x8B5CF6,0x3B82F6,0xEC4899,0x22C55E,0xEAB308,0x06B6D4],ink:0x1E293B,hl:0xFACC15,diag:0x4F46E5,cut:[0xE11D48,0x2563EB,0x16A34A,0xD97706,0x9333EA,0x0891B2,0xDB2777,0x65A30D,0x7C3AED,0xEA580C,0x0D9488,0x4338CA]};
const hex=c=>'#'+c.toString(16).padStart(6,'0');

/* ============ ÇOKYÜZLÜLER ============ */
const rect=(a,b)=>[[-a/2,-b/2],[a/2,-b/2],[a/2,b/2],[-a/2,b/2]];
const regPoly=(n,s)=>{const R=s/(2*Math.sin(Math.PI/n));return Array.from({length:n},(_,i)=>{const t=Math.PI/2+Math.PI/n+2*Math.PI*i/n;return [R*Math.cos(t),R*Math.sin(t)]})};
const rightTri=(a,b)=>{const cx=a/3,cz=b/3;return [[0-cx,0-cz],[a-cx,0-cz],[0-cx,b-cz]]};
const LET='ABCDEFGHIJKLMNOPRSTUVYZ';
function newell(P){const n=V3(0,0,0);for(let i=0;i<P.length;i++){const a=P[i],b=P[(i+1)%P.length];n.x+=(a.y-b.y)*(a.z+b.z);n.y+=(a.z-b.z)*(a.x+b.x);n.z+=(a.x-b.x)*(a.y+b.y)}return n}
function finishPoly(V,F,fname,vname,meta){const c=V.reduce((s,v)=>s.add(v),V3(0,0,0)).multiplyScalar(1/V.length);
 F=F.map(f=>{const P=f.map(i=>V[i]),n=newell(P),fc=P.reduce((s,v)=>s.add(v.clone()),V3(0,0,0)).multiplyScalar(1/P.length);return n.dot(fc.sub(c))<0?[...f].reverse():f});
 return {kind:'poly',V,F,fname,vname,center:c,meta}}
function prismPoly(pts,h,meta){const n=pts.length,V=[];pts.forEach(([x,z])=>V.push(V3(x,0,z)));pts.forEach(([x,z])=>V.push(V3(x,h,z)));
 const F=[[...Array(n).keys()],[...Array(n).keys()].map(i=>n+i)],fname=['Alt taban','Üst taban'];for(let i=0;i<n;i++){const j=(i+1)%n;F.push([i,j,n+j,n+i]);fname.push('Yan yüz '+(i+1))}
 const vname=[...Array(2*n).keys()].map(i=>LET[i]);return finishPoly(V,F,fname,vname,Object.assign({type:'prism',n,h},meta))}
function pyrPoly(pts,h,meta){const n=pts.length,V=pts.map(([x,z])=>V3(x,0,z));V.push(V3(0,h,0));
 const F=[[...Array(n).keys()]],fname=['Taban'];for(let i=0;i<n;i++)F.push([i,(i+1)%n,n]),fname.push('Yan yüz '+(i+1));
 const vname=[...Array(n).keys()].map(i=>LET[i]).concat(['T']);return finishPoly(V,F,fname,vname,Object.assign({type:'pyr',n,h},meta))}
const faceNormal=(P,f)=>newell(f.map(i=>P.V[i])).normalize();
const faceCenter=(P,f)=>f.reduce((s,i)=>s.add(P.V[i].clone()),V3(0,0,0)).multiplyScalar(1/f.length);
function polyEdges(P){const m=new Map();P.F.forEach((f,fi)=>f.forEach((a,k)=>{const b=f[(k+1)%f.length],key=a<b?a+'-'+b:b+'-'+a;if(!m.has(key))m.set(key,{a:Math.min(a,b),b:Math.max(a,b),faces:[]});m.get(key).faces.push(fi)}));return [...m.values()]}
function faceAdj(P){const A=new Map();polyEdges(P).forEach(e=>{if(e.faces.length===2){const[i,j]=e.faces;A.set(Math.min(i,j)+'-'+Math.max(i,j),[e.a,e.b])}});return A}
function faceDesc(P,fi){const f=P.F[fi],pts=f.map(i=>P.V[i]),n=f.length,L=pts.map((p,k)=>p.distanceTo(pts[(k+1)%n])),area=newell(pts).length()/2;
 const eq=(x,y)=>Math.abs(x-y)<1e-6;let ad;
 if(n===3){ad=eq(L[0],L[1])&&eq(L[1],L[2])?'eşkenar üçgen':(eq(L[0],L[1])||eq(L[1],L[2])||eq(L[0],L[2]))?'ikizkenar üçgen':'üçgen';
  const s=[...L].sort((a,b)=>a-b);if(Math.abs(s[0]**2+s[1]**2-s[2]**2)<1e-6)ad=ad==='ikizkenar üçgen'?'ikizkenar dik üçgen':'dik üçgen'}
 else if(n===4){const sq=eq(L[0],L[1]);ad=sq?'kare':'dikdörtgen'}else ad=({5:'beşgen',6:'altıgen',8:'sekizgen'}[n]||n+'gen');
 if(n>4&&L.every(x=>eq(x,L[0])))ad='düzgün '+ad;
 const uniq=[...new Set(L.map(x=>nf(x)))];return {ad,L,area,n,dims:n===4?`${nf(L[0])} cm × ${nf(L[1])} cm`:uniq.map(x=>x+' cm').join(', ')}}

/* ============ CİSİMLER ============ */
const DEF={
 'Dik prizma':'Alt ve üst tabanları birbirine eş ve paralel çokgen, yan yüzleri tabanlara dik dikdörtgen olan cisim.',
 'Piramit':'Tabanı bir çokgen, yan yüzleri ortak bir tepe noktasında birleşen üçgenler olan cisim. Dik piramitte tepe noktası tabanın merkezinin tam üstündedir.'};
const SOLIDS={
 kup:{ad:'Küp',lv:7,grp:'Prizmalar',def:'Bütün yüzleri birbirine eş kare olan dikdörtgenler prizması. 6 yüz, 12 ayrıt, 8 köşe.',dims:[['a','Ayrıt (a)',1,10,4]],make:d=>prismPoly(rect(d.a,d.a),d.a,{box:[d.a,d.a,d.a]})},
 dprizma:{ad:'Dikdörtgenler prizması',lv:7,grp:'Prizmalar',def:DEF['Dik prizma']+' Tabanı dikdörtgendir; karşılıklı yüzleri eştir.',dims:[['a','En (a)',1,10,6],['b','Boy (b)',1,10,4],['c','Yükseklik (c)',1,10,3]],make:d=>prismPoly(rect(d.a,d.b),d.c,{box:[d.a,d.b,d.c]})},
 kprizma:{ad:'Kare prizma',lv:7,grp:'Prizmalar',def:'Tabanları kare olan dik prizma. Yan yüzleri birbirine eş dikdörtgenlerdir.',dims:[['a','Taban ayrıtı (a)',1,10,3],['h','Yükseklik (h)',1,10,6]],make:d=>prismPoly(rect(d.a,d.a),d.h,{box:[d.a,d.a,d.h]})},
 uprizma:{ad:'Üçgen dik prizma',lv:8,grp:'Prizmalar',def:DEF['Dik prizma']+' Burada tabanlar dik üçgendir.',dims:[['a','Dik kenar (a)',1,10,3],['b','Dik kenar (b)',1,10,4],['h','Yükseklik (h)',1,10,6]],make:d=>prismPoly(rightTri(d.a,d.b),d.h,{})},
 aprizma:{ad:'Altıgen dik prizma',lv:8,grp:'Prizmalar',def:DEF['Dik prizma']+' Tabanları düzgün altıgendir.',dims:[['a','Taban ayrıtı (a)',1,6,2],['h','Yükseklik (h)',1,10,5]],make:d=>prismPoly(regPoly(6,d.a),d.h,{})},
 dpiramit:{ad:'Dikdörtgen dik piramit',lv:8,grp:'Piramitler',def:DEF['Piramit']+' Tabanı dikdörtgendir.',dims:[['a','Taban eni (a)',1,10,6],['b','Taban boyu (b)',1,10,4],['h','Yükseklik (h)',1,10,5]],make:d=>pyrPoly(rect(d.a,d.b),d.h,{ab:[d.a,d.b]})},
 kpiramit:{ad:'Kare dik piramit',lv:8,grp:'Piramitler',def:DEF['Piramit']+' Tabanı karedir; dört yan yüzü birbirine eş ikizkenar üçgendir.',dims:[['a','Taban ayrıtı (a)',1,10,5],['h','Yükseklik (h)',1,10,6]],make:d=>pyrPoly(rect(d.a,d.a),d.h,{ab:[d.a,d.a]})},
 silindir:{ad:'Dik dairesel silindir',lv:8,grp:'Eğri yüzeyli',def:'Tabanları birbirine eş ve paralel iki daire, yanal yüzü tabanlara dik olan cisim. Köşesi yoktur.',dims:[['r','Yarıçap (r)',1,6,3],['h','Yükseklik (h)',1,10,6]],make:d=>({kind:'cyl',r:d.r,h:d.h})},
 koni:{ad:'Dik dairesel koni',lv:8,grp:'Eğri yüzeyli',def:'Tabanı daire olan, yanal yüzü tepe noktasında birleşen cisim. Tepe noktasını taban çemberine birleştiren doğru parçalarına ana doğru denir.',dims:[['r','Yarıçap (r)',1,6,3],['h','Yükseklik (h)',1,10,6]],make:d=>({kind:'cone',r:d.r,h:d.h})},
 kure:{ad:'Küre',lv:9,grp:'Eğri yüzeyli',def:'Uzayda bir noktaya (merkez) eşit uzaklıktaki noktaların oluşturduğu yüzey.',dims:[['r','Yarıçap (r)',1,6,4]],make:d=>({kind:'sphere',r:d.r})}};
const SORDER=['kup','dprizma','kprizma','uprizma','aprizma','dpiramit','kpiramit','silindir','koni','kure'];
const visibleSolids=()=>SORDER.filter(k=>SOLIDS[k].lv<=ST.level);
function icon(k){const s={
 kup:'<path d="M20 22 L40 12 L60 22 L60 46 L40 56 L20 46 Z" fill="#CCFBF1" stroke="#0F172A" stroke-width="2.4" stroke-linejoin="round"/><path d="M20 22 L40 32 L60 22 M40 32 V56" fill="none" stroke="#0F172A" stroke-width="2.4"/>',
 dprizma:'<path d="M10 26 L34 16 L70 24 L70 44 L46 54 L10 46 Z" fill="#FFEDD5" stroke="#0F172A" stroke-width="2.4" stroke-linejoin="round"/><path d="M10 26 L46 34 L70 24 M46 34 V54" fill="none" stroke="#0F172A" stroke-width="2.4"/>',
 kprizma:'<path d="M26 14 L40 8 L54 14 L54 52 L40 58 L26 52 Z" fill="#EDE9FE" stroke="#0F172A" stroke-width="2.4" stroke-linejoin="round"/><path d="M26 14 L40 20 L54 14 M40 20 V58" fill="none" stroke="#0F172A" stroke-width="2.4"/>',
 uprizma:'<path d="M14 48 L34 56 L34 26 Z M34 26 L64 18 L64 48 L34 56" fill="#FEF3C7" stroke="#0F172A" stroke-width="2.4" stroke-linejoin="round"/><path d="M14 48 L14 48" stroke="#0F172A"/>',
 aprizma:'<path d="M22 20 L34 14 L48 14 L58 20 L58 46 L48 52 L34 52 L22 46 Z" fill="#DBEAFE" stroke="#0F172A" stroke-width="2.4" stroke-linejoin="round"/><path d="M22 20 L34 26 L48 26 L58 20 M34 26 V52 M48 26 V52" fill="none" stroke="#0F172A" stroke-width="2.2"/>',
 dpiramit:'<path d="M40 8 L12 48 L46 56 L70 42 Z" fill="#FCE7F3" stroke="#0F172A" stroke-width="2.4" stroke-linejoin="round"/><path d="M40 8 L46 56" fill="none" stroke="#0F172A" stroke-width="2.4"/>',
 kpiramit:'<path d="M40 8 L18 46 L40 56 L62 46 Z" fill="#FFE4E6" stroke="#0F172A" stroke-width="2.4" stroke-linejoin="round"/><path d="M40 8 L40 56" fill="none" stroke="#0F172A" stroke-width="2.4"/>',
 silindir:'<ellipse cx="40" cy="16" rx="18" ry="6" fill="#CCFBF1" stroke="#0F172A" stroke-width="2.4"/><path d="M22 16 V50 A18 6 0 0 0 58 50 V16" fill="#99F6E4" stroke="#0F172A" stroke-width="2.4"/>',
 koni:'<path d="M40 8 L22 50 A18 6 0 0 0 58 50 Z" fill="#FED7AA" stroke="#0F172A" stroke-width="2.4" stroke-linejoin="round"/>',
 kure:'<circle cx="40" cy="32" r="22" fill="#E0E7FF" stroke="#0F172A" stroke-width="2.4"/><ellipse cx="40" cy="32" rx="22" ry="7" fill="none" stroke="#0F172A" stroke-width="1.6" stroke-dasharray="4 3"/>'}[k];return `<svg viewBox="0 0 80 64" aria-hidden="true">${s}</svg>`}

/* ============ ÖLÇÜMLER ============ */
function measures(k,d){const p=PIV(),ps=PIS(),R=[];const add=(lv,ad,form,sub,val,unit)=>R.push({lv,ad,form,sub,val,unit});
 if(['kup','dprizma','kprizma'].includes(k)){const a=d.a,b=k==='kup'?d.a:k==='kprizma'?d.a:d.b,c=k==='kup'?d.a:k==='kprizma'?d.h:d.c;
  add(7,'Taban alanı','a × b',`${a} × ${b}`,a*b,'cm²');
  if(k==='kup'){add(7,'Yüzey alanı','6 × a × a',`6 × ${a} × ${a}`,6*a*a,'cm²');add(7,'Hacim','a × a × a',`${a} × ${a} × ${a}`,a**3,'cm³')}
  else{add(7,'Yüzey alanı','2 × (a·b + a·c + b·c)',`2 × (${a}·${b} + ${a}·${c} + ${b}·${c})`,2*(a*b+a*c+b*c),'cm²');add(7,'Hacim','taban alanı × yükseklik',`${a*b} × ${c}`,a*b*c,'cm³')}
  add(7,'Hacim (litre)','1 dm³ = 1 L = 1000 cm³',`${a*b*c} cm³ ÷ 1000`,a*b*c/1000,'L');
  add(9,'Yüzey köşegeni (a×b yüzü)','√(a² + b²)',`√(${a*a} + ${b*b})`,Math.hypot(a,b),'cm');
  add(9,'Cisim köşegeni','√(a² + b² + c²)',`√(${a*a} + ${b*b} + ${c*c})`,Math.hypot(a,b,c),'cm')}
 else if(k==='uprizma'){const{a,b,h}=d,hy=Math.hypot(a,b),B=a*b/2;add(8,'Taban alanı (dik üçgen)','a × b ÷ 2',`${a} × ${b} ÷ 2`,B,'cm²');add(8,'Hacim','taban alanı × yükseklik',`${nf(B)} × ${h}`,B*h,'cm³');
  add(9,'Hipotenüs','√(a² + b²)',`√(${a*a} + ${b*b})`,hy,'cm');add(9,'Yüzey alanı','2 × taban + (a + b + hipotenüs) × h',`2 × ${nf(B)} + (${a} + ${b} + ${nf(hy)}) × ${h}`,2*B+(a+b+hy)*h,'cm²')}
 else if(k==='aprizma'){const{a,h}=d,B=6*Math.sqrt(3)/4*a*a;add(9,'Taban alanı (düzgün altıgen)','6 × (√3 ÷ 4) × a²',`6 × 0,433 × ${a*a}`,B,'cm²');add(8,'Yanal alan','6 × a × h',`6 × ${a} × ${h}`,6*a*h,'cm²');add(9,'Hacim','taban alanı × yükseklik',`${nf(B)} × ${h}`,B*h,'cm³')}
 else if(k==='dpiramit'||k==='kpiramit'){const a=d.a,b=k==='kpiramit'?d.a:d.b,h=d.h,ha=Math.hypot(h,b/2),hb=Math.hypot(h,a/2),ya=Math.hypot(h,a/2,b/2);
  add(8,'Taban alanı','a × b',`${a} × ${b}`,a*b,'cm²');add(9,'Yan ayrıt uzunluğu','√(h² + (a/2)² + (b/2)²)',`√(${h*h} + ${nf(a*a/4)} + ${nf(b*b/4)})`,ya,'cm');
  add(9,'Yan yüz yüksekliği (a kenarlı yüz)','√(h² + (b/2)²)',`√(${h*h} + ${nf(b*b/4)})`,ha,'cm');if(k==='dpiramit')add(9,'Yan yüz yüksekliği (b kenarlı yüz)','√(h² + (a/2)²)',`√(${h*h} + ${nf(a*a/4)})`,hb,'cm');
  add(9,'Yüzey alanı','a·b + a·hₐ + b·h_b',`${a*b} + ${a}·${nf(ha)} + ${b}·${nf(hb)}`,a*b+a*ha+b*hb,'cm²');add(9,'Hacim','taban alanı × h ÷ 3',`${a*b} × ${h} ÷ 3`,a*b*h/3,'cm³')}
 else if(k==='silindir'){const{r,h}=d;add(8,'Taban alanı','π × r²',`${ps} × ${r*r}`,p*r*r,'cm²');add(8,'Taban çevresi','2 × π × r',`2 × ${ps} × ${r}`,2*p*r,'cm');add(8,'Yanal alan','2 × π × r × h',`2 × ${ps} × ${r} × ${h}`,2*p*r*h,'cm²');
  add(8,'Yüzey alanı','2·π·r² + 2·π·r·h',`2·${ps}·${r*r} + 2·${ps}·${r}·${h}`,2*p*r*r+2*p*r*h,'cm²');add(8,'Hacim','taban alanı × yükseklik',`${ps} × ${r*r} × ${h}`,p*r*r*h,'cm³')}
 else if(k==='koni'){const{r,h}=d,L=Math.hypot(r,h);add(8,'Taban alanı','π × r²',`${ps} × ${r*r}`,p*r*r,'cm²');add(9,'Ana doğru (l)','√(r² + h²)',`√(${r*r} + ${h*h})`,L,'cm');add(9,'Yanal alan','π × r × l',`${ps} × ${r} × ${nf(L)}`,p*r*L,'cm²');
  add(9,'Yüzey alanı','π·r² + π·r·l',`${ps}·${r*r} + ${ps}·${r}·${nf(L)}`,p*r*r+p*r*L,'cm²');add(9,'Hacim','π × r² × h ÷ 3',`${ps} × ${r*r} × ${h} ÷ 3`,p*r*r*h/3,'cm³')}
 else if(k==='kure'){const{r}=d;add(9,'Çap','2 × r',`2 × ${r}`,2*r,'cm');add(9,'Yüzey alanı','4 × π × r²',`4 × ${ps} × ${r*r}`,4*p*r*r,'cm²');add(9,'Hacim','4 ÷ 3 × π × r³',`4 ÷ 3 × ${ps} × ${r**3}`,4/3*p*r**3,'cm³')}
 return R}
function counts(k,S){if(S.kind==='poly'){const E=polyEdges(S).length;return {kose:S.V.length,ayrit:E,yuz:S.F.length}}return null}

/* ============ 3D GÖRÜNTÜLEYİCİ ============ */
class View3D{
 constructor(host){this.host=host;this.active=false;this.pick=[];this.labels=[];this.insets=false;this.onPick=null;this.onFrame=null;
  const r=this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});r.setPixelRatio(Math.min(devicePixelRatio,ST.hq?2:1));r.setClearColor(0,0);host.append(r.domElement);
  this.scene=new THREE.Scene();this.cam=new THREE.PerspectiveCamera(38,1,.05,500);this.cam.position.set(9,7,11);this.cam.layers.enable(1);
  this.ctl=new OrbitControls(this.cam,r.domElement);this.ctl.enableDamping=true;this.ctl.dampingFactor=.08;this.ctl.rotateSpeed=.8;this.ctl.screenSpacePanning=true;
  this.scene.add(new THREE.HemisphereLight(0xffffff,0xCBD5E1,1.6));const dl=this.sun=new THREE.DirectionalLight(0xffffff,1.6);dl.position.set(6,14,8);dl.castShadow=true;dl.shadow.mapSize.set(1024,1024);dl.shadow.radius=6;dl.shadow.bias=-.0005;this.scene.add(dl);this.scene.add(dl.target);r.shadowMap.enabled=true;r.shadowMap.type=THREE.PCFSoftShadowMap;
  this.floor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.ShadowMaterial({opacity:.16}));this.floor.rotation.x=-Math.PI/2;this.floor.receiveShadow=true;this.floor.layers.set(1);this.scene.add(this.floor);const dl2=new THREE.DirectionalLight(0xffffff,.5);dl2.position.set(-8,4,-6);this.scene.add(dl2);
  this.grid=new THREE.GridHelper(40,40,0x94A3B8,0xD5DEEA);this.grid.material.transparent=true;this.grid.material.opacity=.42;this.grid.position.y=-.002;this.grid.layers.set(1);this.scene.add(this.grid);
  this.root=new THREE.Group();this.scene.add(this.root);
  this.lab=el('div','labels');host.append(this.lab);
  this.ins=[{n:'Ön',d:V3(0,0,1),u:V3(0,1,0)},{n:'Sağ yan',d:V3(1,0,0),u:V3(0,1,0)},{n:'Üst',d:V3(0,1,0),u:V3(0,0,-1)}].map(o=>({...o,cam:new THREE.OrthographicCamera(-1,1,1,-1,.1,200),tag:host.appendChild(el('div','instag hidden',o.n))}));
  this.ray=new THREE.Raycaster();let down=null;
  r.domElement.addEventListener('pointerdown',e=>{down=[e.clientX,e.clientY]});
  r.domElement.addEventListener('pointerup',e=>{if(!down)return;const m=Math.hypot(e.clientX-down[0],e.clientY-down[1]);down=null;if(m<7&&this.onPick)this.doPick(e)});
  new ResizeObserver(()=>this.resize()).observe(host);this.resize();this.R=5;this.anim=null;
  const loop=()=>{requestAnimationFrame(loop);if(!this.active)return;this.tick()};loop()}
 resize(){const w=this.host.clientWidth,h=this.host.clientHeight;if(!w||!h)return;this.renderer.setSize(w,h,false);this.renderer.domElement.style.width=w+'px';this.renderer.domElement.style.height=h+'px';this.cam.aspect=w/h;this.cam.updateProjectionMatrix();this.w=w;this.h=h}
 setQuality(){this.renderer.setPixelRatio(Math.min(devicePixelRatio,ST.hq?2:1));this.resize()}
 clear(){this._sh=false;while(this.root.children.length){const o=this.root.children.pop();o.traverse(x=>{x.geometry&&x.geometry.dispose();x.material&&(Array.isArray(x.material)?x.material:[x.material]).forEach(m=>m.dispose())})}this.pick=[];this.lab.innerHTML='';this.labels=[]}
 label(text,pos,cls='lbl'){const e=el('div',cls,text);this.lab.append(e);const L={e,pos:pos.clone(),obj:null,show:true};this.labels.push(L);return L}
 fit(R,keepDir){this.R=R;const dir=keepDir?this.cam.position.clone().sub(this.ctl.target).normalize():V3(1,.75,1.25).normalize();const dist=R/Math.sin(THREE.MathUtils.degToRad(this.cam.fov/2))*1.22*(this.cam.aspect<1?1/Math.max(.55,this.cam.aspect):1);
  this.ctl.target.set(0,this.cy||0,0);this.cam.position.copy(this.ctl.target).add(dir.multiplyScalar(dist));const sc=this.sun.shadow.camera,E=R*1.6;sc.left=-E;sc.right=E;sc.top=E;sc.bottom=-E;sc.near=.5;sc.far=R*8+40;this.sun.position.set(R*.9,R*2.6,R*1.2);sc.updateProjectionMatrix();this.ctl.minDistance=R*.8;this.ctl.maxDistance=dist*4;this.ctl.update()}
 view(dir){const d=dir.clone().normalize();if(Math.abs(d.y)>.99)d.z+=.001;const dist=this.cam.position.distanceTo(this.ctl.target);const from=this.cam.position.clone(),to=this.ctl.target.clone().add(d.normalize().multiplyScalar(dist));const t0=performance.now();
  this.anim=()=>{const k=Math.min(1,(performance.now()-t0)/650),e=1-Math.pow(1-k,3);const v=from.clone().sub(this.ctl.target).lerp(to.clone().sub(this.ctl.target),e).setLength(dist);this.cam.position.copy(this.ctl.target).add(v);if(k>=1)this.anim=null}}
 doPick(e){const b=this.renderer.domElement.getBoundingClientRect(),m=new THREE.Vector2((e.clientX-b.left)/b.width*2-1,-(e.clientY-b.top)/b.height*2+1);this.ray.setFromCamera(m,this.cam);
  const hits=this.ray.intersectObjects(this.pick.filter(o=>o.visible&&(o.parent?o.parent.visible:true)),false);
  const pr={vert:0,edge:1,face:2,part:2};hits.sort((a,b)=>(a.distance-b.distance)-(pr[a.object.userData.type]<pr[b.object.userData.type]&&Math.abs(a.distance-b.distance)<this.R*.08?1e3:0));
  this.onPick(hits.length?hits[0]:null,e)}
 tick(){if(this.anim)this.anim();this.ctl.update();if(this.onFrame)this.onFrame();if(!this._sh){this.root.traverse(o=>{if(o.isMesh&&!o.isInstancedMesh){o.castShadow=true}else if(o.isInstancedMesh)o.castShadow=true});this._sh=true}
  const r=this.renderer;r.setScissorTest(false);r.setViewport(0,0,this.w,this.h);r.render(this.scene,this.cam);
  const v=V3(0,0,0);for(const L of this.labels){if(!L.show){L.e.style.display='none';continue}v.copy(L.pos);if(L.obj)L.obj.localToWorld(v);v.project(this.cam);if(v.z>1){L.e.style.display='none';continue}L.e.style.display='';L.e.style.transform=`translate(${(v.x*.5+.5)*this.w}px,${(-v.y*.5+.5)*this.h}px) translate(-50%,-50%)`}
  if(this.insets){const s=Math.min(160,Math.floor(Math.min(this.w*.9,this.h)/3.8)),pad=10,top=this.h-s-62;r.setScissorTest(true);
   this.ins.forEach((o,i)=>{const x=this.w-(3-i)*(s+pad),y=top;r.setViewport(x,y,s,s);r.setScissor(x,y,s,s);r.setClearColor(0xFFFFFF,1);r.clear();const c=o.cam,R=this.R*1.15;c.left=-R;c.right=R;c.top=R;c.bottom=-R;c.updateProjectionMatrix();
    c.position.copy(V3(0,this.cy||0,0)).add(o.d.clone().multiplyScalar(60));c.up.copy(o.u);c.lookAt(0,this.cy||0,0);r.render(this.scene,c);o.tag.style.left=(x+6)+'px';o.tag.style.bottom=(y+s-24)+'px';o.tag.classList.remove('hidden')});
   r.setScissorTest(false);r.setClearColor(0,0)}else this.ins.forEach(o=>o.tag.classList.add('hidden'))}}

/* ============ GEOMETRİ YARDIMCILARI ============ */
const MAT=(c,o={})=>new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.55,metalness:.02,side:THREE.DoubleSide,transparent:true,opacity:.9,polygonOffset:true,polygonOffsetFactor:1,polygonOffsetUnits:1},o));
function rod(a,b,r,mat){const d=b.clone().sub(a),L=d.length();const g=new THREE.CylinderGeometry(r,r,L,10);const m=new THREE.Mesh(g,mat);m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(V3(0,1,0),d.normalize());return m}
function dashed(a,b,r,mat,n){const g=new THREE.Group(),d=b.clone().sub(a);n=n||Math.max(4,Math.round(d.length()/(r*9)));for(let i=0;i<n;i++){const p=a.clone().add(d.clone().multiplyScalar(i/n)),q=a.clone().add(d.clone().multiplyScalar((i+.55)/n));g.add(rod(p,q,r,mat))}return g}
function fanGeo(pts){const pos=[];for(let i=1;i<pts.length-1;i++)[pts[0],pts[i],pts[i+1]].forEach(p=>pos.push(p.x,p.y,p.z));const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.computeVertexNormals();return g}
const ring=(c,r,axisUp,tube,mat)=>{const t=new THREE.Mesh(new THREE.TorusGeometry(r,tube,8,96),mat);t.position.copy(c);if(axisUp)t.rotation.x=Math.PI/2;return t};
function faceColor(S,fi){if(S.meta.type==='prism')return fi===0?C.taban:fi===1?C.ust:C.yan[(fi-2)%C.yan.length];return fi===0?C.taban:C.yan[(fi-1)%C.yan.length]}

/* ============ LABORATUVAR ============ */
const LAB={k:'dprizma',d:{},tg:{yuz:1,ayrit:1,kose:1,adlar:1,olcu:1,yuk:0,seffaf:0,birim:0,yk:0,ck:0,ana:1,yyy:0,yc:1}};
let lv3;
function labInit(){lv3=new View3D($('#labVp'));lv3.onPick=labPick;
 $$('#labCam [data-cam]').forEach(b=>b.onclick=()=>{sfx('whoosh');const m={iso:V3(1,.75,1.25),on:V3(0,.0001,1),sag:V3(1,.0001,0),ust:V3(0,1,0)};lv3.view(m[b.dataset.cam])});
 $('#labIns').onclick=()=>{sfx('ui');lv3.insets=!lv3.insets;$('#labIns').classList.toggle('on',lv3.insets)};
 $('#labToNet').onclick=()=>{if(SOLIDS[LAB.k].lv<=ST.level){NET.k=LAB.k;NET.d={...LAB.d};go('acinim-'+LAB.k)}}}
function solidList(host,cur,onSel){host.innerHTML='';let g='';visibleSolids().forEach(k=>{const s=SOLIDS[k];if(s.grp!==g){g=s.grp;host.append(el('div','sgrp',g))}
 const b=el('button','sitem'+(k===cur?' on':''),`<i class="sic">${icon(k)}</i><span><b>${s.ad}</b></span>`);b.onclick=()=>{sfx('ui');onSel(k)};host.append(b)})}
function defaults(k){const d={};SOLIDS[k].dims.forEach(([key,,, ,v])=>d[key]=v);return d}
function labOpen(k){if(!SOLIDS[k]||SOLIDS[k].lv>ST.level)k='dprizma';const changed=LAB.k!==k||!Object.keys(LAB.d).length;LAB.k=k;if(changed)LAB.d=defaults(k);solidList($('#labSolids'),k,x=>go('lab-'+x));labPanel();labBuild(!changed)}
function labPanel(){const s=SOLIDS[LAB.k],P=$('#labPanel');P.innerHTML='';
 P.append(el('div','pcard',`<div class="ph"><div class="pic">${icon(LAB.k)}</div><div><h2>${s.ad}</h2>${lvChip(s.lv)}</div></div><p class="def">${s.def}</p>`));
 const dm=el('div','pcard','<h3>Ölçüler</h3>');s.dims.forEach(([key,ad,mn,mx])=>{const r=el('label','slider',`<span>${ad}<b>${LAB.d[key]} cm</b></span>`);const i=el('input');i.type='range';i.min=mn;i.max=mx;i.step=1;i.value=LAB.d[key];i.setAttribute('aria-label',ad);
  i.oninput=()=>{LAB.d[key]=+i.value;r.querySelector('b').textContent=i.value+' cm';sfx('tick');labBuild(true);labMeasures()};r.append(i);dm.append(r)});P.append(dm);
 const S=s.make(LAB.d),poly=S.kind==='poly',isBox=!!(poly&&S.meta.box),isPyr=poly&&S.meta.type==='pyr';
 const T=[['yuz','Yüzler',1],['ayrit',poly?'Ayrıtlar':'Taban çemberleri',1],['kose',poly?'Köşeler':(LAB.k==='koni'?'Tepe noktası':null),1],['adlar',poly?'Köşe adları':null,1],['olcu','Ölçü etiketleri',1],['yuk',LAB.k==='kure'?null:'Yükseklik',1],
  ['yc',['silindir','koni','kure'].includes(LAB.k)?'Yarıçap':null,1],['ana',LAB.k==='koni'?'Ana doğru':null,1],['birim',isBox?'Birim küplerle doldur':null,1],['seffaf','Saydam görünüm',1],
  ['yyy',isPyr?'Yan yüz yüksekliği':null,9],['yk',poly?'Yüzey köşegenleri':null,9],['ck',poly&&S.meta.type==='prism'?'Cisim köşegenleri':null,9]].filter(t=>t[1]&&t[2]<=ST.level);
 const tg=el('div','pcard','<h3>Göster</h3>'),w=el('div','tgl');T.forEach(([key,ad,l])=>{const b=el('button','tg'+(LAB.tg[key]?' on':''),ad);b.onclick=()=>{LAB.tg[key]=LAB.tg[key]?0:1;b.classList.toggle('on');sfx('ui');labBuild(true)};w.append(b)});tg.append(w);P.append(tg);
 P.append(el('div','pcard',`<h3>Özellikler</h3><div id="labCounts"></div>`));P.append(el('div','pcard',`<h3>Hesaplar <span class="pis">π ≈ ${PIS()}</span></h3><div id="labMeas"></div>`));labMeasures()}
function labMeasures(){const s=SOLIDS[LAB.k],S=s.make(LAB.d),cc=counts(LAB.k,S);
 $('#labCounts').innerHTML=cc?`<div class="cnt"><div><b>${cc.kose}</b>köşe</div><div><b>${cc.ayrit}</b>ayrıt</div><div><b>${cc.yuz}</b>yüz</div></div><p class="note">Keşif: köşe − ayrıt + yüz = ${cc.kose} − ${cc.ayrit} + ${cc.yuz} = <b>${cc.kose-cc.ayrit+cc.yuz}</b>. Başka cisimlerde de dene!</p>`
  :{silindir:'<ul class="ul"><li><b>2</b> taban (eş ve paralel daire)</li><li><b>1</b> yanal yüz (eğri yüzey; açınımı dikdörtgen)</li><li>Köşesi yoktur.</li></ul>',koni:'<ul class="ul"><li><b>1</b> taban (daire)</li><li><b>1</b> yanal yüz (eğri yüzey; açınımı daire dilimi)</li><li><b>1</b> tepe noktası</li><li>Tepe noktasını taban çemberine birleştiren her doğru parçası bir <b>ana doğru</b>dur.</li></ul>',kure:'<ul class="ul"><li>Köşesi, ayrıtı ve düz yüzü yoktur.</li><li>Yüzeydeki her nokta merkeze eşit uzaklıktadır (yarıçap).</li></ul>'}[LAB.k];
 const R=measures(LAB.k,LAB.d).filter(r=>r.lv<=ST.level);
 $('#labMeas').innerHTML=R.length?R.map(r=>`<div class="mrow"><div class="mh"><span>${r.ad}</span>${lvChip(r.lv)}</div><div class="mf">${r.form}</div><div class="ms">= ${r.sub} = <b>${nf(r.val)} ${r.unit}</b></div></div>`).join(''):''}
function labBuild(keep){const s=SOLIDS[LAB.k],S=s.make(LAB.d),t=LAB.tg,v=lv3;v.clear();const G=new THREE.Group();v.root.add(G);
 const op=t.seffaf||t.birim||t.ck?.28:.9;let R,H;
 if(S.kind==='poly'){const bb=new THREE.Box3().setFromPoints(S.V);R=bb.getBoundingSphere(new THREE.Sphere()).radius;H=bb.max.y;const er=Math.max(.025,R*.016),vr=er*2.6;
  const em=new THREE.MeshStandardMaterial({color:C.ink,roughness:.4}),vm=new THREE.MeshStandardMaterial({color:C.ink,roughness:.3});
  S.F.forEach((f,fi)=>{const m=new THREE.Mesh(fanGeo(f.map(i=>S.V[i])),MAT(faceColor(S,fi),{opacity:op}));m.userData={type:'face',fi};m.visible=!!t.yuz;G.add(m);v.pick.push(m)});
  polyEdges(S).forEach(e=>{const m=rod(S.V[e.a],S.V[e.b],er,em.clone());m.userData={type:'edge',a:e.a,b:e.b};m.visible=!!t.ayrit;G.add(m);v.pick.push(m)});
  S.V.forEach((p,i)=>{const m=new THREE.Mesh(new THREE.SphereGeometry(vr,16,12),vm.clone());m.position.copy(p);m.userData={type:'vert',vi:i};m.visible=!!t.kose;G.add(m);v.pick.push(m);
   if(t.adlar){const dir=p.clone().sub(S.center).normalize();v.label(S.vname[i],p.clone().add(dir.multiplyScalar(R*.11)),'lbl vlb')}});
  if(t.olcu){const ed=polyEdges(S),seen=new Set();const want=S.meta.type==='prism'?[[0,1],[1,2],[0,S.meta.n]]:[[0,1],[1,2]];
   want.forEach(([a,b])=>{if(!S.V[b])return;const L=nf(S.V[a].distanceTo(S.V[b]));if(seen.has(L+':'+(a===0&&b===S.meta.n)))return;seen.add(L+':'+(a===0&&b===S.meta.n));const mid=S.V[a].clone().add(S.V[b]).multiplyScalar(.5),dir=mid.clone().sub(S.center).setY(b===S.meta.n?0:mid.y-S.center.y).normalize();v.label(L+' cm',mid.add(dir.multiplyScalar(R*.13)),'lbl dlb')})}
  if(t.yuk){const top=S.meta.type==='prism'?V3(...faceCenterArr(S,1)):S.V[S.V.length-1].clone(),bot=V3(top.x,0,top.z);const hm=new THREE.MeshStandardMaterial({color:0xE11D48});G.add(dashed(bot,top,er*1.1,hm));
   const sq=R*.07;G.add(rod(bot.clone().add(V3(sq,0,0)),bot.clone().add(V3(sq,sq,0)),er*.7,hm));G.add(rod(bot.clone().add(V3(0,sq,0)),bot.clone().add(V3(sq,sq,0)),er*.7,hm));
   v.label('h = '+nf(top.y)+' cm',bot.clone().lerp(top,.5).add(V3(R*.14,0,0)),'lbl hlb')}
  if(t.yyy&&S.meta.type==='pyr'){const ap=S.V[S.V.length-1],m=S.V[0].clone().add(S.V[1]).multiplyScalar(.5),mm=new THREE.MeshStandardMaterial({color:0x7C3AED});G.add(dashed(ap,m,er*1.1,mm));v.label('yan yüz yüksekliği',ap.clone().lerp(m,.55).add(V3(0,0,-R*.12)),'lbl plb')}
  if(t.yk){const dm=new THREE.MeshStandardMaterial({color:C.diag,transparent:true,opacity:.85});let c=0;S.F.forEach(f=>{const n=f.length;for(let i=0;i<n;i++)for(let j=i+2;j<n;j++){if(i===0&&j===n-1)continue;G.add(rod(S.V[f[i]],S.V[f[j]],er*.6,dm));c++}});v.label(`Yüzey köşegeni: ${c}`,V3(0,H+R*.35,0),'lbl klb')}
  if(t.ck&&S.meta.type==='prism'){const share=(i,j)=>S.F.some(f=>f.includes(i)&&f.includes(j));const cm=new THREE.MeshStandardMaterial({color:0xDB2777});let c=0;
   for(let i=0;i<S.V.length;i++)for(let j=i+1;j<S.V.length;j++)if(!share(i,j)){G.add(rod(S.V[i],S.V[j],er*1.1,cm));c++}v.label(`Cisim köşegeni: ${c}`,V3(0,H+R*.2,0),'lbl clb')}
  if(t.birim&&S.meta.box){const[a,b,c]=S.meta.box;v._lastL=0;const N=a*b*c,ig=new THREE.BoxGeometry(.92,.92,.92),im=new THREE.MeshStandardMaterial({color:0x60A5FA,roughness:.5,transparent:true,opacity:.95});const I=new THREE.InstancedMesh(ig,im,N);let k=0;const M=new THREE.Matrix4();
   for(let y=0;y<c;y++)for(let z=0;z<b;z++)for(let x=0;x<a;x++){M.makeTranslation(-a/2+.5+x,.5+y,-b/2+.5+z);I.setMatrixAt(k++,M)}I.count=0;G.add(I);const t0=performance.now(),per=Math.max(220,1600/c);
   const info=el('div','fillinfo');$('#labVp').append(info);v.onFrame=()=>{const L=Math.min(c,Math.floor((performance.now()-t0)/per)+1);if(L!==v._lastL){v._lastL=L;sfx('pop',L/c);if(L===c)setTimeout(()=>sfx('chime'),140)}I.count=L*a*b;I.instanceMatrix.needsUpdate=true;info.innerHTML=`Taban: ${a} × ${b} = <b>${a*b}</b> birim küp • Katman: <b>${L}</b> / ${c} → <b>${L*a*b}</b> birim küp`+(L===c?` = <b>${N} cm³</b>`:'');if(L===c)v.onFrame=null}}
  else{v.onFrame=null;$$('#labVp .fillinfo').forEach(x=>x.remove())}}
 else{const r=S.r,h=S.h||0,er=Math.max(.03,r*.02),em=new THREE.MeshStandardMaterial({color:C.ink});
  if(S.kind==='cyl'){R=Math.hypot(r,h/2);H=h;const side=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,72,1,true),MAT(C.yan[0],{opacity:op}));side.position.y=h/2;side.userData={type:'part',p:'yan'};
   const b1=new THREE.Mesh(new THREE.CircleGeometry(r,72),MAT(C.taban,{opacity:op}));b1.rotation.x=Math.PI/2;b1.userData={type:'part',p:'alt'};const b2=new THREE.Mesh(new THREE.CircleGeometry(r,72),MAT(C.ust,{opacity:op}));b2.rotation.x=-Math.PI/2;b2.position.y=h;b2.userData={type:'part',p:'ust'};
   [side,b1,b2].forEach(m=>{m.visible=!!t.yuz;G.add(m);v.pick.push(m)});if(t.ayrit){G.add(ring(V3(0,0,0),r,1,er,em));G.add(ring(V3(0,h,0),r,1,er,em))}
   if(t.yuk){const hm=new THREE.MeshStandardMaterial({color:0xE11D48});G.add(dashed(V3(0,0,0),V3(0,h,0),er,hm));v.label('h = '+h+' cm',V3(0,h/2,0),'lbl hlb')}
   if(t.yc){const rm=new THREE.MeshStandardMaterial({color:0x0369A1});G.add(rod(V3(0,h,0),V3(r,h,0),er,rm));v.label('r = '+r+' cm',V3(r/2,h+r*.18,0),'lbl dlb')}}
  else if(S.kind==='cone'){const L=Math.hypot(r,h);R=Math.hypot(r,h/2);H=h;const side=new THREE.Mesh(new THREE.ConeGeometry(r,h,72,1,true),MAT(C.yan[1],{opacity:op}));side.position.y=h/2;side.userData={type:'part',p:'yan'};
   const b1=new THREE.Mesh(new THREE.CircleGeometry(r,72),MAT(C.taban,{opacity:op}));b1.rotation.x=Math.PI/2;b1.userData={type:'part',p:'alt'};[side,b1].forEach(m=>{m.visible=!!t.yuz;G.add(m);v.pick.push(m)});
   if(t.ayrit)G.add(ring(V3(0,0,0),r,1,er,em));if(t.kose){const ap=new THREE.Mesh(new THREE.SphereGeometry(er*2.6,16,12),em);ap.position.y=h;G.add(ap);v.label('Tepe noktası',V3(0,h+r*.25,0),'lbl vlb')}
   if(t.yuk){const hm=new THREE.MeshStandardMaterial({color:0xE11D48});G.add(dashed(V3(0,0,0),V3(0,h,0),er,hm));v.label('h = '+h+' cm',V3(-r*.25,h/2,0),'lbl hlb')}
   if(t.yc){const rm=new THREE.MeshStandardMaterial({color:0x0369A1});G.add(rod(V3(0,0,0),V3(0,0,r),er,rm));v.label('r = '+r+' cm',V3(0,-r*.12,r/2),'lbl dlb')}
   if(t.ana){const am=new THREE.MeshStandardMaterial({color:0xF97316});G.add(rod(V3(0,h,0),V3(r,0,0),er*1.3,am));v.label(ST.level>=9?'ana doğru l = '+nf(L)+' cm':'ana doğru',V3(r*.62,h*.45,0),'lbl plb')}}
  else{R=r;H=2*r;const sp=new THREE.Mesh(new THREE.SphereGeometry(r,64,40),MAT(0x818CF8,{opacity:t.seffaf?.3:.75}));sp.position.y=r;sp.userData={type:'part',p:'kure'};sp.visible=!!t.yuz;G.add(sp);v.pick.push(sp);
   G.add(ring(V3(0,r,0),r,1,er*.7,new THREE.MeshStandardMaterial({color:0x312E81})));const cm=new THREE.Mesh(new THREE.SphereGeometry(er*2.4,16,12),em);cm.position.y=r;G.add(cm);v.label('Merkez',V3(0,r-r*.14,0),'lbl vlb');
   if(t.yc){const rm=new THREE.MeshStandardMaterial({color:0x0369A1});G.add(rod(V3(0,r,0),V3(r,r,0),er,rm));v.label('r = '+r+' cm',V3(r/2,r+r*.14,0),'lbl dlb');G.add(dashed(V3(-r,r,0),V3(0,r,0),er*.8,rm));v.label('çap = '+2*r+' cm',V3(-r/2,r-r*.16,0),'lbl dlb')}}
  v.onFrame=null;$$('#labVp .fillinfo').forEach(x=>x.remove())}
 v.cy=H/2;if(!keep||!v._fitted){v.fit(R+.6);v._fitted=true}else{v.R=R+.6;v.ctl.target.set(0,v.cy,0)}
 tip('#labTip','Cismi parmağınla ya da fareyle döndür, iki parmakla yakınlaştır. Bir yüze, ayrıta ya da köşeye dokun.')}
function faceCenterArr(S,fi){const c=faceCenter(S,S.F[fi]);return [c.x,c.y,c.z]}
let hlObj=null;
function labPick(hit){const S=SOLIDS[LAB.k].make(LAB.d);if(hlObj){hlObj.material.emissive&&hlObj.material.emissive.setHex(0);hlObj=null}if(!hit){tip('#labTip','Boşluğa dokundun. Bir yüze, ayrıta ya da köşeye dokun.');return}
 const o=hit.object,u=o.userData;sfx('pick',u.type);if(o.material.emissive){o.material.emissive.setHex(0x665500);hlObj=o}
 if(u.type==='face'){const fd=faceDesc(S,u.fi);tip('#labTip',`<b>${S.fname[u.fi]}</b>: ${fd.ad} • ${fd.dims}`+(ST.level>=7?` • alan = <b>${nf(fd.area)} cm²</b>`:''))}
 else if(u.type==='edge')tip('#labTip',`<b>Ayrıt ${S.vname[u.a]}${S.vname[u.b]}</b> • uzunluk = <b>${nf(S.V[u.a].distanceTo(S.V[u.b]))} cm</b><br>İki yüzün kesiştiği doğru parçası.`);
 else if(u.type==='vert'){const k=polyEdges(S).filter(e=>e.a===u.vi||e.b===u.vi).length;tip('#labTip',`<b>Köşe ${S.vname[u.vi]}</b> • Bu köşede <b>${k}</b> ayrıt ve <b>${S.F.filter(f=>f.includes(u.vi)).length}</b> yüz birleşir.`)}
 else if(u.type==='part'){const p=PIS(),d=LAB.d;tip('#labTip',{yan:LAB.k==='silindir'?`<b>Yanal yüz</b> (eğri yüzey). Açınımı bir dikdörtgendir: ${2}·π·r × h = ${2}·${p}·${d.r} × ${d.h}`:`<b>Yanal yüz</b> (eğri yüzey). Açınımı bir daire dilimidir.`,alt:'<b>Alt taban</b>: daire, r = '+d.r+' cm',ust:'<b>Üst taban</b>: daire, r = '+d.r+' cm',kure:'<b>Küre yüzeyi</b>: her noktası merkeze '+d.r+' cm uzaklıkta.'}[u.p])}}
function tip(sel,h){const e=$(sel);if(e){e.innerHTML=h;e.classList.remove('pop');void e.offsetWidth;e.classList.add('pop')}}

/* ============ AÇINIM ============ */
function netPlan(P,treeEdges,root=0){const A=faceAdj(P),adj=new Map();treeEdges.forEach(([i,j])=>{(adj.get(i)||adj.set(i,[]).get(i)).push(j);(adj.get(j)||adj.set(j,[]).get(j)).push(i)});
 const order=[root],parent={[root]:-1},hinge={};for(let q=0;q<order.length;q++){const p=order[q];for(const c of adj.get(p)||[]){if(c in parent)continue;parent[c]=p;order.push(c);
  const sh=A.get(Math.min(p,c)+'-'+Math.max(p,c));if(!sh)throw new Error('komşu değil '+p+'-'+c);const p0=P.V[sh[0]].clone(),u=P.V[sh[1]].clone().sub(p0).normalize(),nP=faceNormal(P,P.F[p]),nC=faceNormal(P,P.F[c]);
  hinge[c]={p0,u,phi:Math.atan2(new THREE.Vector3().crossVectors(nC,nP).dot(u),nC.dot(nP))}}}
 return {order,parent,hinge,root}}
function netMatrices(plan,t){const M={};M[plan.root]=new THREE.Matrix4();const T1=new THREE.Matrix4(),R1=new THREE.Matrix4(),T2=new THREE.Matrix4();
 for(const c of plan.order){if(c===plan.root)continue;const h=plan.hinge[c];T1.makeTranslation(h.p0.x,h.p0.y,h.p0.z);R1.makeRotationAxis(h.u,h.phi*(1-t));T2.makeTranslation(-h.p0.x,-h.p0.y,-h.p0.z);M[c]=M[plan.parent[c]].clone().multiply(T1).multiply(R1).multiply(T2)}return M}
let BOXNETS=null;
function boxNets(){if(BOXNETS)return BOXNETS;const P=prismPoly(rect(1,1),1,{}),E=[...faceAdj(P).keys()].map(k=>k.split('-').map(Number)),m=E.length,cls=new Map();
 const sym=[(x,y)=>[x,y],(x,y)=>[-x,y],(x,y)=>[x,-y],(x,y)=>[-x,-y],(x,y)=>[y,x],(x,y)=>[-y,x],(x,y)=>[y,-x],(x,y)=>[-y,-x]];
 for(let mask=0;mask<(1<<m);mask++){let pc=0;for(let i=0;i<m;i++)if(mask>>i&1)pc++;if(pc!==5)continue;const tr=E.filter((_,i)=>mask>>i&1);
  const pa=[0,1,2,3,4,5];const f=x=>pa[x]===x?x:(pa[x]=f(pa[x]));let ok=true;for(const[a,b]of tr){const ra=f(a),rb=f(b);if(ra===rb){ok=false;break}pa[ra]=rb}if(!ok)continue;
  const plan=netPlan(P,tr,0),M=netMatrices(plan,0),cells=P.F.map((fc,fi)=>{const c=faceCenter(P,fc).applyMatrix4(M[fi]);return [Math.round(c.x),Math.round(c.z)]});
  let best=null;for(const s of sym){const pts=cells.map(([x,y])=>s(x,y)),mx=Math.min(...pts.map(p=>p[0])),my=Math.min(...pts.map(p=>p[1]));const key=pts.map(([x,y])=>(x-mx)+','+(y-my)).sort().join(';');if(!best||key<best)best=key}
  if(!cls.has(best))cls.set(best,{tree:tr,cells})}
 BOXNETS=[...cls.entries()].sort((a,b)=>a[0]<b[0]?-1:1).map(([key,v],i)=>({ad:'Açınım '+(i+1),tree:v.tree,cells:v.cells}));return BOXNETS}
function netThumb(cells){const xs=cells.map(c=>c[0]),ys=cells.map(c=>c[1]),mx=Math.min(...xs),my=Math.min(...ys),W=Math.max(...xs)-mx+1,H=Math.max(...ys)-my+1;
 return `<svg viewBox="-0.2 -0.2 ${W+.4} ${H+.4}" aria-hidden="true">${cells.map(([x,y],i)=>`<rect x="${x-mx}" y="${y-my}" width=".94" height=".94" rx=".08" fill="${i===0?'#0D9488':i===1?'#2DD4BF':'#FDBA74'}" stroke="#0F172A" stroke-width=".05"/>`).join('')}</svg>`}
function prismTrees(n){const S=i=>2+i,chain=[];for(let i=0;i<n-1;i++)chain.push([S(i),S(i+1)]);
 return [{ad:'Şerit',tree:[[0,S(0)],[1,S(0)],...chain]},{ad:'Çiçek',tree:[...Array(n).keys()].map(i=>[0,S(i)]).concat([[1,S(0)]])},{ad:'Zikzak',tree:[[0,S(0)],...chain,[1,S(Math.floor(n/2))]]}]}
function pyrTrees(n){const T=i=>1+i,chain=[];for(let i=0;i<n-1;i++)chain.push([T(i),T(i+1)]);const mix=[];for(let i=0;i<n;i+=2){mix.push([0,T(i)]);if(i+1<n)mix.push([T(i),T(i+1)])}
 return [{ad:'Yıldız',tree:[...Array(n).keys()].map(i=>[0,T(i)])},{ad:'Zincir',tree:[[0,T(0)],...chain]},{ad:'Karma',tree:mix}]}

const NET={k:'kup',d:{},ni:0,t:0,mode:'rot',tg:{adlar:1,es:1,olcu:0},obj:null,play:0};
let nv3;
function netInit(){nv3=new View3D($('#netVp'));nv3.onPick=netPick;
 const sl=$('#netT');sl.oninput=()=>{NET.play=0;setT(+sl.value/100)};
 $('#netPlay').onclick=()=>{sfx('ui');NET.play=NET.play?0:(NET.t>.5?-1:1);$('#netPlay').textContent=NET.play?'⏸':'▶'};
 $$('#netMode [data-m]').forEach(b=>b.onclick=()=>{sfx('ui');NET.mode=b.dataset.m;$$('#netMode [data-m]').forEach(x=>x.classList.toggle('on',x===b));nv3.ctl.enabled=NET.mode==='rot';tip('#netTip',NET.mode==='rot'?'Döndürme modu: cismi parmağınla döndür.':'Katlama modu: ekranda parmağını ya da fareyi <b>sağa</b> sürükle kapansın, <b>sola</b> sürükle açılsın.')});
 let drag=null;const cv=nv3.renderer.domElement;cv.addEventListener('pointerdown',e=>{if(NET.mode!=='fold')return;drag={x:e.clientX,t:NET.t};cv.setPointerCapture(e.pointerId)});
 cv.addEventListener('pointermove',e=>{if(!drag)return;NET.play=0;setT(Math.max(0,Math.min(1,drag.t+(e.clientX-drag.x)/Math.max(220,nv3.w*.6))))});cv.addEventListener('pointerup',()=>drag=null);cv.addEventListener('pointercancel',()=>drag=null);
 $$('#netCam [data-cam]').forEach(b=>b.onclick=()=>{sfx('whoosh');const m={iso:V3(1,.9,1.25),ust:V3(0,1,0),on:V3(0,.25,1)};nv3.view(m[b.dataset.cam])});
 nv3.onFrame=()=>{if(NET.play){let t=NET.t+NET.play*.008;if(t>=1){t=1;NET.play=0}if(t<=0){t=0;NET.play=0}setT(t);if(!NET.play)$('#netPlay').textContent='▶'}}}
function netOpen(k){if(!SOLIDS[k]||SOLIDS[k].lv>ST.level)k='kup';const changed=NET.k!==k||!Object.keys(NET.d).length;NET.k=k;if(changed){NET.d=defaults(k);NET.ni=0}solidList($('#netSolids'),k,x=>go('acinim-'+x));netPanel();netBuild()}
function netVariants(){const S=SOLIDS[NET.k].make(NET.d);if(S.kind!=='poly')return [];if(S.meta.box)return boxNets();return S.meta.type==='prism'?prismTrees(S.meta.n):pyrTrees(S.meta.n)}
function netPanel(){const s=SOLIDS[NET.k],P=$('#netPanel');P.innerHTML='';
 P.append(el('div','pcard',`<div class="ph"><div class="pic">${icon(NET.k)}</div><div><h2>${s.ad}</h2>${lvChip(s.lv)}</div></div>`));
 const dm=el('div','pcard','<h3>Ölçüler</h3>');s.dims.forEach(([key,ad,mn,mx])=>{const r=el('label','slider',`<span>${ad}<b>${NET.d[key]} cm</b></span>`);const i=el('input');i.type='range';i.min=mn;i.max=mx;i.step=1;i.value=NET.d[key];
  i.oninput=()=>{NET.d[key]=+i.value;r.querySelector('b').textContent=i.value+' cm';sfx('tick');netBuild(true);netFaces()};r.append(i);dm.append(r)});P.append(dm);
 const V=netVariants();if(V.length){const c=el('div','pcard',`<h3>Açınım seç <span class="pis">${V.length} farklı</span></h3>`),g=el('div','nets'+(V[0].cells?' cube':''));
  V.forEach((n,i)=>{const b=el('button','nvar'+(i===NET.ni?' on':''),(n.cells?netThumb(n.cells):'')+`<span>${n.ad}</span>`);b.onclick=()=>{sfx('ui');NET.ni=i;g.querySelectorAll('.nvar').forEach(x=>x.classList.toggle('on',x===b));netBuild(false,true);netFaces()};g.append(b)});c.append(g);
  if(V[0].cells)c.append(el('p','note','Bir küpün birbirinden farklı tam <b>11</b> açınımı vardır. Hepsini katlayıp dene!'));P.append(c)}
 const tg=el('div','pcard','<h3>Göster</h3>'),w=el('div','tgl');[['adlar','Yüz adları'],['es',S_isPoly()?'Birleşen ayrıtlar':null],['olcu','Ölçüler']].filter(x=>x[1]).forEach(([key,ad])=>{const b=el('button','tg'+(NET.tg[key]?' on':''),ad);b.onclick=()=>{NET.tg[key]=NET.tg[key]?0:1;b.classList.toggle('on');sfx('ui');netBuild(true)};w.append(b)});tg.append(w);P.append(tg);
 P.append(el('div','pcard','<h3>Açınımdaki şekiller</h3><div id="netFaces"></div>'));netFaces()}
const S_isPoly=()=>SOLIDS[NET.k].make(NET.d).kind==='poly';
function netFaces(){const k=NET.k,S=SOLIDS[k].make(NET.d),d=NET.d,p=PIV(),ps=PIS();let rows=[],tot=null,totLv=9;
 if(S.kind==='poly'){const lvA=S.meta.box?7:S.meta.type==='prism'?8:9;rows=S.F.map((f,fi)=>{const fd=faceDesc(S,fi);return {c:hex(faceColor(S,fi)),ad:S.fname[fi],sh:fd.ad,dm:fd.dims,ar:fd.area}});tot=rows.reduce((s,r)=>s+r.ar,0);totLv=lvA;
  rows.forEach(r=>r.lv=lvA)}
 else if(S.kind==='cyl'){rows=[{c:hex(C.taban),ad:'Alt taban',sh:'daire',dm:`r = ${d.r} cm`,ar:p*d.r*d.r,lv:8,f:`${ps} × ${d.r}²`},{c:hex(C.ust),ad:'Üst taban',sh:'daire',dm:`r = ${d.r} cm`,ar:p*d.r*d.r,lv:8,f:`${ps} × ${d.r}²`},{c:hex(C.yan[0]),ad:'Yanal yüz',sh:'dikdörtgen',dm:`(2·π·r) × h = ${nf(2*p*d.r)} cm × ${d.h} cm`,ar:2*p*d.r*d.h,lv:8,f:`2 × ${ps} × ${d.r} × ${d.h}`}];tot=rows.reduce((s,r)=>s+r.ar,0);totLv=8}
 else if(S.kind==='cone'){const L=Math.hypot(d.r,d.h);rows=[{c:hex(C.taban),ad:'Taban',sh:'daire',dm:`r = ${d.r} cm`,ar:p*d.r*d.r,lv:8},{c:hex(C.yan[1]),ad:'Yanal yüz',sh:'daire dilimi',dm:ST.level>=9?`yarıçapı ana doğru l = ${nf(L)} cm, yay uzunluğu 2·π·r`:'yarıçapı ana doğru, yay uzunluğu taban çevresine eşit',ar:p*d.r*L,lv:9}];tot=rows.reduce((s,r)=>s+r.ar,0);totLv=9}
 else{$('#netFaces').innerHTML='<p class="note">Kürenin düzlemde tam bir açınımı <b>yoktur</b>: küre yüzeyi yırtılmadan ya da esnetilmeden düz bir kâğıda serilemez. Haritalardaki bozulmaların sebebi de budur.</p>';return}
 $('#netFaces').innerHTML=rows.map(r=>`<div class="frow"><i style="background:${r.c}"></i><div><b>${r.ad}</b> • ${r.sh}<br><span>${r.dm}</span></div><div class="fa">${r.lv<=ST.level?nf(r.ar)+' cm²':lvChip(r.lv)}</div></div>`).join('')+
  (tot!=null?`<div class="ftot"><span>Yüzey alanı = açınımdaki şekillerin alanları toplamı</span><b>${totLv<=ST.level?nf(tot)+' cm²':lvChip(totLv)}</b></div>`:'')}
function netBuild(keepCam,newNet){const v=nv3,S=SOLIDS[NET.k].make(NET.d);v.clear();$('#netMsg').classList.add('hidden');const outer=new THREE.Group();v.root.add(outer);NET.obj={outer,S};
 if(S.kind==='poly'){const V=netVariants(),tree=V[Math.min(NET.ni,V.length-1)].tree,plan=netPlan(S,tree,0),R=new THREE.Box3().setFromPoints(S.V).getBoundingSphere(new THREE.Sphere()).radius,er=Math.max(.02,R*.012);
  const groups=S.F.map((f,fi)=>{const g=new THREE.Group();g.matrixAutoUpdate=false;outer.add(g);const m=new THREE.Mesh(fanGeo(f.map(i=>S.V[i])),MAT(faceColor(S,fi),{opacity:.93}));m.userData={type:'face',fi};g.add(m);v.pick.push(m);
   const em=new THREE.MeshStandardMaterial({color:C.ink});f.forEach((a,k)=>g.add(rod(S.V[a],S.V[f[(k+1)%f.length]],er,em)));return g});
  const inTree=new Set(tree.map(([i,j])=>Math.min(i,j)+'-'+Math.max(i,j)));
  if(NET.tg.es){let ci=0;faceAdj(S).forEach((sh,key)=>{if(inTree.has(key))return;const[i,j]=key.split('-').map(Number),col=C.cut[ci%C.cut.length],mt=new THREE.MeshStandardMaterial({color:col,emissive:col,emissiveIntensity:.25});ci++;
   [i,j].forEach(fi=>{const a=S.V[sh[0]],b=S.V[sh[1]],c=faceCenter(S,S.F[fi]),off=a.clone().add(b).multiplyScalar(.5).sub(c).multiplyScalar(-.06);groups[fi].add(rod(a.clone().add(off),b.clone().add(off),er*2.4,mt))})})}
  const L=[];if(NET.tg.adlar)S.F.forEach((f,fi)=>{const l=v.label(S.fname[fi].replace('Yan yüz ','Yan '),faceCenter(S,f),'lbl flb');l.obj=groups[fi];L.push(l)});
  if(NET.tg.olcu)S.F.forEach((f,fi)=>{const fd=faceDesc(S,fi),l=v.label(fd.n===4?`${nf(fd.L[0])}×${nf(fd.L[1])}`:fd.L.map(nf).join('-'),faceCenter(S,f).add(V3(0,0,0)),'lbl mlb');l.obj=groups[fi]});
  NET.obj.update=t=>{const M=netMatrices(plan,t);groups.forEach((g,fi)=>{g.matrix.copy(M[fi]);g.matrixWorldNeedsUpdate=true})};NET.obj.R=R}
 else if(S.kind==='cyl'||S.kind==='cone'){buildCurvedNet(S,outer);v.pick.push(...NET.obj.pickables)}
 else{$('#netMsg').classList.remove('hidden');const sp=new THREE.Mesh(new THREE.SphereGeometry(S.r,48,32),MAT(0x818CF8,{opacity:.85}));sp.position.y=S.r;outer.add(sp);NET.obj.update=()=>{};NET.obj.R=S.r}
 // çerçeve: düz ve kapalı hâllerin kapsayıcı kutusu
 const bx=t=>{NET.obj.update(t);outer.position.set(0,0,0);outer.updateMatrixWorld(true);return new THREE.Box3().setFromObject(outer)};const b0=bx(0),b1=bx(1);NET.obj.b0=b0;NET.obj.b1=b1;
 const Rfit=Math.max(b0.getBoundingSphere(new THREE.Sphere()).radius,b1.getBoundingSphere(new THREE.Sphere()).radius);v.cy=0;
 if(!keepCam||newNet){v.fit(Rfit*.95);v.ctl.target.set(0,0,0);v.ctl.update()}else v.R=Rfit;
 setT(NET.t,true);
 tip('#netTip',S.kind==='sphere'?'Küre açılamaz. Neden? Sağdaki açıklamayı oku.':'Alttaki sürgüyü kaydır ya da <b>✋ Katla</b> modunda ekranda parmağını sağa-sola sürükle.')}
function setT(t,force){const prev=NET.t;NET.t=t;if(!force)foldSfx(prev,t);$('#netT').value=Math.round(t*100);$('#netPct').textContent=t<.02?'Açık (açınım)':t>.98?'Kapalı (cisim)':'%'+Math.round(t*100)+' katlandı';
 const o=NET.obj;if(!o)return;o.update(t);o.outer.position.set(0,0,0);o.outer.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(o.outer),c=b.getCenter(V3(0,0,0));o.outer.position.set(-c.x,-b.min.y,-c.z)}
function buildCurvedNet(S,outer){const r=S.r,h=S.h,frame=new THREE.Group(),align=new THREE.Group();frame.rotation.x=-Math.PI/2;align.add(frame);outer.add(align);const pk=[];
 const em=new THREE.MeshStandardMaterial({color:C.ink});
 if(S.kind==='cyl'){const W=2*Math.PI*r,seg=96,geo=new THREE.PlaneGeometry(W,h,seg,1);const base=geo.attributes.position.array.slice();const side=new THREE.Mesh(geo,MAT(C.yan[0],{opacity:.93}));side.userData={type:'part',p:'yan'};frame.add(side);pk.push(side);
  const lid=(y0,sgn,col,p)=>{const piv=new THREE.Group();piv.position.set(0,y0,0);frame.add(piv);const m=new THREE.Mesh(new THREE.CircleGeometry(r,72),MAT(col,{opacity:.93}));m.position.set(0,sgn*r,0);m.userData={type:'part',p};piv.add(m);pk.push(m);const rg=new THREE.Mesh(new THREE.TorusGeometry(r,Math.max(.02,r*.012),6,72),em);rg.position.copy(m.position);piv.add(rg);return piv};
  const lb=lid(0,-1,C.taban,'alt'),lt=lid(h,1,C.ust,'ust');const Q1=new THREE.Quaternion().setFromUnitVectors(V3(0,0,-1),V3(0,1,0)),I=new THREE.Quaternion();
  NET.obj.update=t=>{const a=geo.attributes.position;for(let i=0;i<a.count;i++){const s=base[i*3],y=base[i*3+1]+h/2;if(t<.001)a.setXYZ(i,s,y,0);else{const R=r/t,an=s/R;a.setXYZ(i,R*Math.sin(an),y,R*(1-Math.cos(an)))}}a.needsUpdate=true;geo.computeVertexNormals();geo.computeBoundingBox();geo.computeBoundingSphere();
   lb.rotation.x=-Math.PI/2*t;lt.rotation.x=Math.PI/2*t;align.quaternion.copy(I).slerp(Q1,Math.max(0,(t-.55)/.45))}}
 else{const L=Math.hypot(r,h),Phi=2*Math.PI*r/L,sr=48,sa=96,geo=new THREE.BufferGeometry(),pos=new Float32Array((sr+1)*(sa+1)*3),idx=[];
  for(let i=0;i<sr;i++)for(let j=0;j<sa;j++){const a=i*(sa+1)+j,b=a+1,c=a+sa+1,d=c+1;idx.push(a,c,b,b,c,d)}geo.setIndex(idx);geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
  const side=new THREE.Mesh(geo,MAT(C.yan[1],{opacity:.93}));side.userData={type:'part',p:'yan'};frame.add(side);pk.push(side);
  const A=V3(L,0,0),piv=new THREE.Group();piv.position.copy(A);frame.add(piv);const lidm=new THREE.Mesh(new THREE.CircleGeometry(r,72),MAT(C.taban,{opacity:.93}));lidm.position.set(r,0,0);lidm.userData={type:'part',p:'alt'};piv.add(lidm);pk.push(lidm);
  const rg=new THREE.Mesh(new THREE.TorusGeometry(r,Math.max(.02,r*.012),6,72),em);rg.position.set(r,0,0);piv.add(rg);
  const g=V3(1,0,0),n=V3(0,0,1),sa1=r/L,ca1=Math.sqrt(1-sa1*sa1),beta=Math.atan2(-ca1,-sa1);
  const a1=g.clone().multiplyScalar(ca1).add(n.clone().multiplyScalar(sa1)),a1w=a1.clone().applyAxisAngle(V3(1,0,0),-Math.PI/2),Q1=new THREE.Quaternion().setFromUnitVectors(a1w.normalize(),V3(0,-1,0)),I=new THREE.Quaternion();
  NET.obj.update=t=>{const k=1+t*(L/r-1),sa=1/k,ca=Math.sqrt(Math.max(0,1-sa*sa)),ax=g.clone().multiplyScalar(ca).add(n.clone().multiplyScalar(sa)),bx=g.clone().sub(ax.clone().multiplyScalar(ca)).multiplyScalar(1/sa),cx=new THREE.Vector3().crossVectors(ax,bx);
   let q=0;for(let i=0;i<=sr;i++){const rho=L*i/sr;for(let j=0;j<=sa_;j++){const ph=-Phi/2+Phi*j/sa_,ps=ph*k,v=ax.clone().multiplyScalar(ca).add(bx.clone().multiplyScalar(sa*Math.cos(ps))).add(cx.clone().multiplyScalar(sa*Math.sin(ps))).multiplyScalar(rho);pos[q++]=v.x;pos[q++]=v.y;pos[q++]=v.z}}
   geo.attributes.position.needsUpdate=true;geo.computeVertexNormals();geo.computeBoundingBox();geo.computeBoundingSphere();piv.rotation.y=beta*t;align.quaternion.copy(I).slerp(Q1,Math.max(0,(t-.55)/.45))};const sa_=sa}
 NET.obj.pickables=pk;NET.obj.R=Math.max(r,h)}
function netPick(hit){if(hit)sfx('pick',hit.object.userData.type);if(!hit){tip('#netTip','Bir yüze dokun: hangi yüz olduğunu söyleyeyim.');return}const S=SOLIDS[NET.k].make(NET.d),u=hit.object.userData;
 if(u.type==='face'){const fd=faceDesc(S,u.fi);tip('#netTip',`<b>${S.fname[u.fi]}</b>: ${fd.ad} • ${fd.dims}`+(ST.level>=(S.meta.box?7:S.meta.type==='prism'?8:9)?` • alan ${nf(fd.area)} cm²`:''))}
 else if(u.type==='part')tip('#netTip',{yan:NET.k==='silindir'?'<b>Yanal yüz</b>: açınımda dikdörtgen. Bir kenarı taban çevresine (2·π·r), diğeri yüksekliğe eşit.':'<b>Yanal yüz</b>: açınımda daire dilimi. Yarıçapı ana doğruya, yay uzunluğu taban çevresine eşit.',alt:'<b>Alt taban</b>: daire',ust:'<b>Üst taban</b>: daire'}[u.p])}


/* ============ SES EFEKTLERİ (Web Audio, dosyasız) ============ */
let AC=null,lastTick=0,lastFold=0,noiseBuf=null;
function ac(){if(!AC){try{AC=new (window.AudioContext||window.webkitAudioContext)();const n=AC.sampleRate,b=AC.createBuffer(1,n,n),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;noiseBuf=b}catch(e){AC=null}}if(AC&&AC.state==='suspended')AC.resume();return AC}
function tone(f,dur,{type='sine',vol=.12,delay=0,glide=0}={}){const a=ac();if(!a)return;const t=a.currentTime+delay,o=a.createOscillator(),g=a.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(glide)o.frequency.exponentialRampToValueAtTime(Math.max(40,f*glide),t+dur);
 g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g).connect(a.destination);o.start(t);o.stop(t+dur+.02)}
function noise(dur,{f=1200,q=1.2,vol=.09,delay=0,sweep=0}={}){const a=ac();if(!a||!noiseBuf)return;const t=a.currentTime+delay,s=a.createBufferSource(),bp=a.createBiquadFilter(),g=a.createGain();s.buffer=noiseBuf;bp.type='bandpass';bp.frequency.setValueAtTime(f,t);if(sweep)bp.frequency.exponentialRampToValueAtTime(f*sweep,t+dur);bp.Q.value=q;
 g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+dur*.25);g.gain.exponentialRampToValueAtTime(.0001,t+dur);s.connect(bp).connect(g).connect(a.destination);s.start(t,Math.random()*.5);s.stop(t+dur+.02)}
function sfx(k,x){if(!ST.snd)return;const now=performance.now();
 if(k==='ui'){tone(880,.07,{type:'triangle',vol:.07});tone(1320,.06,{type:'sine',vol:.04,delay:.03})}
 else if(k==='tick'){if(now-lastTick<45)return;lastTick=now;tone(1900,.025,{type:'square',vol:.025})}
 else if(k==='pick'){const f={vert:1180,edge:880,face:620,part:620}[x]||700;tone(f,.12,{type:'triangle',vol:.1});tone(f*1.5,.1,{vol:.05,delay:.05})}
 else if(k==='whoosh')noise(.38,{f:500,sweep:4,q:.8,vol:.07});
 else if(k==='pop')tone(380+x*700,.09,{type:'sine',vol:.11,glide:1.6});
 else if(k==='chime'){[784,988,1319].forEach((f,i)=>tone(f,.45,{type:'sine',vol:.08,delay:i*.09}))}
 else if(k==='snap'){noise(.06,{f:2500,q:2,vol:.14});tone(140,.16,{type:'sine',vol:.16,glide:.6,delay:.01});tone(1046,.25,{vol:.05,delay:.08})}
 else if(k==='flat'){noise(.2,{f:400,q:.7,vol:.08});tone(220,.18,{type:'sine',vol:.06,glide:.7})}}
function foldSfx(p,t){if(!ST.snd||p==null)return;const now=performance.now();
 if(t>=.999&&p<.999)return sfx('snap');if(t<=.001&&p>.001)return sfx('flat');
 if(Math.abs(t-p)>.001&&now-lastFold>85){lastFold=now;noise(.12,{f:500+t*1400,q:1.6,vol:.045})}}

/* ============ TEKNİK ÇİZİM ARKA PLANI ============ */
const BG={c:null,x:null,w:0,h:0,items:[],grid:null,raf:0,last:0};
const WF={
 kup:{v:[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]],e:[[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]]},
 dort:{v:[[1,1,1],[-1,-1,1],[-1,1,-1],[1,-1,-1]],e:[[0,1],[0,2],[0,3],[1,2],[1,3],[2,3]]},
 sekiz:{v:[[1.3,0,0],[-1.3,0,0],[0,1.3,0],[0,-1.3,0],[0,0,1.3],[0,0,-1.3]],e:[[0,2],[0,3],[0,4],[0,5],[1,2],[1,3],[1,4],[1,5],[2,4],[4,3],[3,5],[5,2]]},
 piramit:{v:[[-1,-1,-1],[1,-1,-1],[1,-1,1],[-1,-1,1],[0,1.3,0]],e:[[0,1],[1,2],[2,3],[3,0],[0,4],[1,4],[2,4],[3,4]]}};
(function(){const n=6,v=[],e=[];for(let i=0;i<n;i++){const a=i/n*Math.PI*2;v.push([Math.cos(a),-1,Math.sin(a)]);v.push([Math.cos(a),1,Math.sin(a)])}for(let i=0;i<n;i++){const j=(i+1)%n;e.push([2*i,2*j],[2*i+1,2*j+1],[2*i,2*i+1])}WF.altigen={v,e};
 const m=20,cv=[],ce=[];for(let i=0;i<m;i++){const a=i/m*Math.PI*2;cv.push([Math.cos(a),-1,Math.sin(a)],[Math.cos(a),1,Math.sin(a)])}for(let i=0;i<m;i++){const j=(i+1)%m;ce.push([2*i,2*j],[2*i+1,2*j+1]);if(i%5===0)ce.push([2*i,2*i+1])}WF.silindir={v:cv,e:ce}})();
function bgInit(){const c=$('#bg');if(!c)return;BG.c=c;BG.x=c.getContext('2d');bgResize();const keys=Object.keys(WF),N=Math.max(6,Math.min(12,Math.round(BG.w*BG.h/150000)));
 BG.items=Array.from({length:N},(_,i)=>({k:keys[i%keys.length],x:Math.random()*BG.w,y:Math.random()*BG.h,s:22+Math.random()*48,ax:Math.random()*6,ay:Math.random()*6,vx:(Math.random()-.5)*.00025,vy:.00012+Math.random()*.00025,dy:-.006-Math.random()*.012,col:Math.random()<.7?'125,211,252':'251,191,36',lab:['a','h','r','b','c'][i%5]}));
 addEventListener('resize',()=>{clearTimeout(BG.rt);BG.rt=setTimeout(bgResize,200)});bgLoop()}
function bgResize(){const c=BG.c,dpr=Math.min(devicePixelRatio||1,1.5);BG.w=innerWidth;BG.h=innerHeight;c.width=BG.w*dpr;c.height=BG.h*dpr;BG.x.setTransform(dpr,0,0,dpr,0,0);
 const g=document.createElement('canvas');g.width=c.width;g.height=c.height;const x=g.getContext('2d');x.setTransform(dpr,0,0,dpr,0,0);
 const grd=x.createRadialGradient(BG.w*.7,BG.h*.1,0,BG.w*.7,BG.h*.1,Math.max(BG.w,BG.h)*.9);grd.addColorStop(0,'#16306A');grd.addColorStop(.55,'#0C1C42');grd.addColorStop(1,'#071229');x.fillStyle=grd;x.fillRect(0,0,BG.w,BG.h);
 for(let X=0;X<BG.w;X+=24){x.strokeStyle=X%120===0?'rgba(125,211,252,.11)':'rgba(125,211,252,.045)';x.lineWidth=1;x.beginPath();x.moveTo(X+.5,0);x.lineTo(X+.5,BG.h);x.stroke()}
 for(let Y=0;Y<BG.h;Y+=24){x.strokeStyle=Y%120===0?'rgba(125,211,252,.11)':'rgba(125,211,252,.045)';x.beginPath();x.moveTo(0,Y+.5);x.lineTo(BG.w,Y+.5);x.stroke()}
 x.fillStyle='rgba(125,211,252,.22)';x.font='600 10px Lexend,sans-serif';for(let X=120;X<BG.w;X+=240)x.fillText(String(X/24|0),X+3,12);
 BG.grid=g;bgDraw(performance.now())}
function bgDraw(t){const x=BG.x;if(!x)return;x.setTransform(1,0,0,1,0,0);x.drawImage(BG.grid,0,0);const dpr=BG.c.width/BG.w;x.setTransform(dpr,0,0,dpr,0,0);
 for(const it of BG.items){const W=WF[it.k],ax=it.ax+t*it.vx*1000*0+t*it.vy,ay=it.ay+t*it.vx*3+t*.00015,ca=Math.cos(ax),sa=Math.sin(ax),cb=Math.cos(ay),sb=Math.sin(ay);
  if(ST.bg){it.y+=it.dy;if(it.y<-90){it.y=BG.h+90;it.x=Math.random()*BG.w}}
  const P=W.v.map(([a,b,c])=>{let y1=b*ca-c*sa,z1=b*sa+c*ca,x1=a*cb+z1*sb,z2=-a*sb+z1*cb;const k=1/(1+z2*.12);return [it.x+x1*it.s*k,it.y+y1*it.s*k,z2]});
  x.lineWidth=1.3;x.strokeStyle=`rgba(${it.col},.26)`;x.beginPath();for(const[a,b]of W.e){x.moveTo(P[a][0],P[a][1]);x.lineTo(P[b][0],P[b][1])}x.stroke();
  x.fillStyle=`rgba(${it.col},.45)`;for(const p of P){x.beginPath();x.arc(p[0],p[1],1.6,0,6.3);x.fill()}
  const xs=P.map(p=>p[0]),ys=P.map(p=>p[1]),l=Math.min(...xs),r=Math.max(...xs),bt=Math.max(...ys)+14;x.strokeStyle=`rgba(${it.col},.2)`;x.beginPath();x.moveTo(l,bt);x.lineTo(r,bt);x.moveTo(l,bt-4);x.lineTo(l,bt+4);x.moveTo(r,bt-4);x.lineTo(r,bt+4);x.stroke();
  x.fillStyle=`rgba(${it.col},.35)`;x.font='italic 600 11px Lexend,sans-serif';x.fillText(it.lab,(l+r)/2-3,bt+14)}}
function bgLoop(){const f=t=>{BG.raf=requestAnimationFrame(f);if(!ST.bg||document.hidden)return;if(t-BG.last<33)return;BG.last=t;bgDraw(t)};BG.raf=requestAnimationFrame(f)}


/* ============ GÖRÜNÜM ATÖLYESİ (eş küplerle yapılar) ============ */
const GN=4,GH=4;
const GV={h:[],mode:'add',hl:null,task:null,v3:null};
const PRESETS=[
 {ad:'Örnek yapı',h:[[0,3,2,0],[0,1,1,1],[0,0,0,0],[0,0,0,0]]},
 {ad:'Merdiven',h:[[1,2,3,4],[0,0,0,0],[0,0,0,0],[0,0,0,0]]},
 {ad:'Kule',h:[[0,0,0,0],[0,4,0,0],[0,2,1,0],[0,0,0,0]]},
 {ad:'L yapısı',h:[[3,0,0,0],[2,0,0,0],[1,1,1,0],[0,0,0,0]]},
 {ad:'Köprü',h:[[2,1,1,2],[0,0,0,0],[0,0,0,0],[0,0,0,0]]},
 {ad:'Piramit',h:[[1,1,1,0],[1,2,1,0],[1,1,1,0],[0,0,0,0]]}];
const cloneH=h=>h.map(r=>[...r]);
// h[z][x] : z=0 arka sıra, z=GN-1 ön sıra
function views(h){const V={};const mk=(cols,rows)=>Array.from({length:rows},()=>Array(cols).fill(0));
 V.on=mk(GN,GH);V.arka=mk(GN,GH);V.sag=mk(GN,GH);V.sol=mk(GN,GH);V.ust=mk(GN,GN);V.alt=mk(GN,GN);
 for(let x=0;x<GN;x++){let m=0;for(let z=0;z<GN;z++)m=Math.max(m,h[z][x]);for(let y=0;y<m;y++){V.on[y][x]=1;V.arka[y][GN-1-x]=1}}
 for(let z=0;z<GN;z++){let m=0;for(let x=0;x<GN;x++)m=Math.max(m,h[z][x]);for(let y=0;y<m;y++){V.sag[y][GN-1-z]=1;V.sol[y][z]=1}}
 for(let z=0;z<GN;z++)for(let x=0;x<GN;x++)if(h[z][x]){V.ust[z][x]=1;V.alt[GN-1-z][x]=1}
 return V}
const VN=[['on','Önden'],['arka','Arkadan'],['sag','Sağdan'],['sol','Soldan'],['ust','Üstten'],['alt','Alttan']];
const VDIR={on:[0,.0001,1],arka:[0,.0001,-1],sag:[1,.0001,0],sol:[-1,.0001,0],ust:[0,1,0],alt:[0,-1,0],iso:[1,.8,1.2]};
function viewSVG(M,vert,cls=''){const rows=M.length,cols=M[0].length,s=22,W=cols*s,H=rows*s;let g='';
 for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){const y=vert?(rows-1-r)*s:r*s;g+=`<rect x="${c*s+1}" y="${y+1}" width="${s-2}" height="${s-2}" rx="3" fill="${M[r][c]?'#0EA5E9':'#fff'}" stroke="${M[r][c]?'#0369A1':'#CBD5E1'}" stroke-width="1.5"/>`}
 return `<svg class="vsvg ${cls}" viewBox="0 0 ${W} ${H}" aria-hidden="true">${g}</svg>`}
const countM=M=>M.flat().reduce((a,b)=>a+b,0);
const sameM=(A,B)=>A.every((r,i)=>r.every((v,j)=>v===B[i][j]));
function gvInit(){const v=GV.v3=new View3D($('#gvVp'));v.onPick=gvPick;GV.h=cloneH(PRESETS[0].h);
 $$('#gvCam [data-cam]').forEach(b=>b.onclick=()=>{sfx('whoosh');gvLook(b.dataset.cam)});
 $$('#gvMode [data-m]').forEach(b=>b.onclick=()=>{sfx('ui');GV.mode=b.dataset.m;$$('#gvMode [data-m]').forEach(x=>x.classList.toggle('on',x===b));
  tip('#gvTip',{add:'<b>Küp ekle:</b> zemindeki bir kareye ya da bir küpe dokun; o sütuna küp eklenir.',del:'<b>Küp çıkar:</b> bir küpe dokun; o sütunun en üstteki küpü çıkar.',rot:'<b>Döndür:</b> yapıyı parmağınla çevir, iki parmakla yakınlaştır.'}[GV.mode])});
 const pr=$('#gvPresets');PRESETS.forEach((p,i)=>{const b=el('button','tg',p.ad);b.onclick=()=>{sfx('ui');GV.task=null;GV.h=cloneH(p.h);gvBuild();gvPanel()};pr.append(b)});
 $('#gvRnd').onclick=()=>{sfx('ui');GV.task=null;GV.h=randStruct();gvBuild();gvPanel()};
 $('#gvClr').onclick=()=>{sfx('flat');GV.h=Array.from({length:GN},()=>Array(GN).fill(0));gvBuild();gvPanel()};
 $('#gvTask').onclick=()=>{sfx('ui');GV.task={h:randStruct(),done:false};GV.h=Array.from({length:GN},()=>Array(GN).fill(0));GV.mode='add';$$('#gvMode [data-m]').forEach(x=>x.classList.toggle('on',x.dataset.m==='add'));gvBuild();gvPanel();
  tip('#gvTip','<b>Görev:</b> Sağdaki <b>hedef</b> görünümlere uyan yapıyı küp ekleyerek kur. Önden, sağdan ve üstten görünümler eşleşince görev tamamlanır.')};
 gvBuild(true);gvPanel()}
function randStruct(){let h;do{h=Array.from({length:GN},()=>Array(GN).fill(0));const n=rnd(4,7);let x=rnd(0,GN-1),z=rnd(0,GN-1);for(let i=0;i<n;i++){h[z][x]=Math.min(GH-1,(h[z][x]||0)+rnd(1,2));const d=[[1,0],[-1,0],[0,1],[0,-1]][rnd(0,3)];x=Math.max(0,Math.min(GN-1,x+d[0]));z=Math.max(0,Math.min(GN-1,z+d[1]))}}while(h.flat().filter(Boolean).length<3);return h}
const rnd=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
function gvLook(k){const d=VDIR[k];GV.v3.view(V3(...d));$$('.vcard').forEach(c=>c.classList.toggle('on',c.dataset.v===k))}
function gvBuild(fit){const v=GV.v3;v.clear();const G=new THREE.Group();v.root.add(G);const off=-(GN-1)/2;
 const mats=[0x9D174D,0x9D174D,0xFBBF24,0xFBBF24,0x0EA5E9,0x0EA5E9].map(c=>new THREE.MeshStandardMaterial({color:c,roughness:.55}));
 const geo=new THREE.BoxGeometry(1,1,1),eg=new THREE.EdgesGeometry(geo),em=new THREE.LineBasicMaterial({color:0x0F172A});
 for(let z=0;z<GN;z++)for(let x=0;x<GN;x++){
  const cell=new THREE.Mesh(new THREE.PlaneGeometry(.96,.96),new THREE.MeshBasicMaterial({color:0x0D9488,transparent:true,opacity:GV.mode==='add'?.10:.04,side:THREE.DoubleSide}));cell.rotation.x=-Math.PI/2;cell.position.set(x+off,.005,z+off);cell.userData={type:'cell',x,z};G.add(cell);v.pick.push(cell);
  for(let y=0;y<GV.h[z][x];y++){const m=new THREE.Mesh(geo,mats);m.position.set(x+off,y+.5,z+off);m.userData={type:'cube',x,z};G.add(m);v.pick.push(m);const l=new THREE.LineSegments(eg,em);l.position.copy(m.position);G.add(l)}}
 const fr=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(GN,.02,GN)),new THREE.LineBasicMaterial({color:0x0D9488}));G.add(fr);
 v.label('ÖN',V3(0,.02,GN/2+.55),'lbl dlb');v.label('ARKA',V3(0,.02,-GN/2-.55),'lbl dlb');v.label('SAĞ',V3(GN/2+.6,.02,0),'lbl dlb');v.label('SOL',V3(-GN/2-.6,.02,0),'lbl dlb');
 v.cy=1.2;if(fit||!v._fitted){v.fit(4.2);v._fitted=true}}
function gvPick(hit){if(!hit||GV.mode==='rot')return;const u=hit.object.userData,h=GV.h;
 if(GV.mode==='add'){if(h[u.z][u.x]>=GH){sfx('flat');tip('#gvTip',`Bir sütunda en fazla <b>${GH}</b> küp olabilir.`);return}h[u.z][u.x]++;sfx('pop',h[u.z][u.x]/GH)}
 else{if(u.type!=='cube'||!h[u.z][u.x])return;h[u.z][u.x]--;sfx('pick','vert')}
 gvBuild();gvPanel()}
function gvPanel(){const V=views(GV.h),n=GV.h.flat().reduce((a,b)=>a+b,0);
 $('#gvCount').innerHTML=`<div><b>${n}</b>birim küp</div><div><b>${n}</b>cm³ hacim<br><small>(1 küp = 1 cm³ ise)</small></div>`;
 $('#gvViews').innerHTML=VN.map(([k,ad])=>`<button class="vcard" data-v="${k}"><span>${ad}</span>${viewSVG(V[k],!['ust','alt'].includes(k))}<em>${countM(V[k])} kare</em></button>`).join('');
 $$('#gvViews .vcard').forEach(b=>b.onclick=()=>{sfx('whoosh');gvLook(b.dataset.v)});
 const T=$('#gvTaskBox');if(!GV.task){T.innerHTML='<p class="note">Rastgele bir hedef yapı oluşturulur; sen yalnızca görünümlerini görürsün. Aynı görünümleri veren yapıyı kurmaya çalış!</p>';return}
 const TV=views(GV.task.h),ok=['on','sag','ust'].map(k=>sameM(TV[k],V[k]));
 T.innerHTML=`<div class="tviews">${[['on','Önden'],['sag','Sağdan'],['ust','Üstten']].map(([k,ad],i)=>`<div class="tv ${ok[i]?'ok':''}"><span>${ad} ${ok[i]?'✔':''}</span>${viewSVG(TV[k],k!=='ust','hedef')}</div>`).join('')}</div>`+
  (ok.every(Boolean)?`<div class="tdone">🎉 Harika! Görünümler eşleşti. Kullandığın küp: <b>${n}</b>. Aynı görünümleri daha az ya da daha çok küple veren başka yapılar da kurulabilir. Dene!</div>`:'<p class="note">Yeşil işaret alan görünüm hedefle aynı demektir.</p>');
 if(ok.every(Boolean)&&!GV.task.done){GV.task.done=true;sfx('chime')}}

/* ============ GENEL ============ */
function setLevel(l){ST.level=l;save();$$('#lvSeg [data-l]').forEach(b=>b.classList.toggle('on',+b.dataset.l===l));route()}
function go(h){if(location.hash!=='#'+h)location.hash=h;else route()}
let CUR='';
function route(){const h=(location.hash||'#lab').slice(1),[v,k]=h.split('-');const view=v==='acinim'?'net':v==='gorunum'?'gv':v==='oyun'?'games':'lab';
 $$('.tab').forEach(t=>t.classList.toggle('on',t.dataset.v===view));['lab','net','gv','games'].forEach(x=>$('#v-'+x).classList.toggle('hidden',x!==view));
 lv3.active=view==='lab';nv3.active=view==='net';GV.v3.active=view==='gv';
 if(view==='lab')labOpen(k||LAB.k);else if(view==='net')netOpen(k||NET.k);CUR=view;requestAnimationFrame(()=>{lv3.resize();nv3.resize();GV.v3.resize()})}
function init(){labInit();netInit();gvInit();
 $$('.tab').forEach(t=>t.onclick=()=>{if(t.disabled)return;sfx('ui');go(t.dataset.v==='lab'?'lab-'+LAB.k:t.dataset.v==='net'?'acinim-'+NET.k:t.dataset.v==='gv'?'gorunum':'oyun')});
 
 const piB=$('#piBtn'),pu=()=>piB.textContent='π ≈ '+PIS();pu();piB.onclick=()=>{sfx('ui');ST.pi=ST.pi===3?3.14:3;save();pu();route()};
 const sB=$('#sndBtn'),su=()=>sB.textContent=ST.snd?'🔊 Ses açık':'🔇 Ses kapalı';su();sB.onclick=()=>{ST.snd=!ST.snd;save();su();sfx('ui')};
 const bB=$('#bgBtn'),bu=()=>bB.textContent=ST.bg?'✨ Animasyon açık':'✨ Animasyon kapalı';bu();bB.onclick=()=>{ST.bg=!ST.bg;save();bu();sfx('ui');bgDraw(performance.now())};
 bgInit();
 const qB=$('#qBtn'),qu=()=>qB.textContent=ST.hq?'✨ Yüksek kalite':'⚡ Hızlı mod';qu();qB.onclick=()=>{ST.hq=!ST.hq;save();qu();lv3.setQuality();nv3.setQuality();GV.v3.setQuality()};
 $('#fsBtn').onclick=()=>{try{document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen()}catch(e){}};
 addEventListener('hashchange',route);route()}
try{init()}catch(e){document.body.insertAdjacentHTML('afterbegin',`<div style="background:#FEE2E2;padding:12px;font-weight:700">Hata: ${e.message}</div>`);console.error(e)}
window.__trees=S=>(S.meta.type==='prism'?prismTrees(S.meta.n):pyrTrees(S.meta.n)).map(x=>x.tree);
window.__CA={GV,views,gvBuild,gvPanel,ST,LAB,NET,boxNets,setT,go,netPlan,netMatrices,SOLIDS,prismPoly,rect,measures};
