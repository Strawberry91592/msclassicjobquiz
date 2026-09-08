const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const context={window:{fetch:async()=>{throw new Error('Unexpected fetch');}},document:{getElementById(){return null},createElement(){return{textContent:'',style:{},appendChild(){}}},head:{appendChild(){}}},MutationObserver:class{observe(){}},setTimeout,clearTimeout,Promise};
vm.createContext(context);
for(const f of ['questions.js','classes.js','project-enhancements.js','fairness-calibration.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),context,{filename:f});
const W=context.window,Q=W.QUIZ_QUESTIONS,C=W.CLASS_DATA,D=Object.keys(W.QUIZ_DIMS),DW=W.QUIZ_DIM_WEIGHTS,QW=W.QUIZ_QUESTION_WEIGHTS,V=W.QUIZ_OPTION_VECTORS,K=Object.keys(C);
function nv(s){return Object.fromEntries(D.map(d=>[d,typeof s?.[d]==='number'?s[d]:.5]));}
function pref(q,letters){const a=Object.fromEntries(D.map(d=>[d,.5])),e=Object.fromEntries(D.map(d=>[d,0]));letters.forEach((letter,rank)=>{const p=nv(V[q.id][letter.charCodeAt(0)-65]),w=Number(QW[q.id]??1)*([1,.72,.5,.34][rank]??.25);D.forEach(d=>{const sig=Math.abs(p[d]-.5)*2;if(sig<.08)return;const c=w*sig,b=c/(e[d]+c+.0001);a[d]=a[d]*(1-b)+p[d]*b;e[d]+=c;});});return{a,e};}
function scoreRow(ans){const u=Object.fromEntries(D.map(d=>[d,.5])),ew=Object.fromEntries(D.map(d=>[d,0]));ans.forEach((letters,i)=>{const{a,e}=pref(Q[i],letters);D.forEach(d=>{if(!e[d])return;const n=ew[d]+e[d];u[d]=ew[d]?(u[d]*ew[d]+a[d]*e[d])/n:a[d];ew[d]=n;});});const out={};for(const k of K){let s=0,den=0;for(const d of D){if(!ew[d])continue;const w=(DW[d]||1)*ew[d];s+=(1-Math.min(1,Math.abs(u[d]-C[k].dims[d])))*w;den+=w;}out[k]=den?s/den:.5;}return out;}
let seed=0x9e3779b9;function rnd(){seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return(seed>>>0)/0x100000000;}
const N=10000,rows=Array.from({length:N},()=>scoreRow(Q.map(()=>[String.fromCharCode(65+Math.floor(rnd()*4))])));
const pars={};for(const k of K){let m=0;for(const r of rows)m+=r[k];m/=N;let v=0;for(const r of rows)v+=(r[k]-m)**2;pars[k]={mean:m,sd:Math.sqrt(v/N)||1};}
const zRows=rows.map(r=>Object.fromEntries(K.map(k=>[k,(r[k]-pars[k].mean)/pars[k].sd])));
const offsets=Object.fromEntries(K.map(k=>[k,0]));
function winnerCounts(){const c=Object.fromEntries(K.map(k=>[k,0]));for(const r of zRows){let best=K[0],bv=r[best]+offsets[best];for(let i=1;i<K.length;i++){const k=K[i],v=r[k]+offsets[k];if(v>bv){bv=v;best=k;}}c[best]++;}return c;}
function tuneOne(k,target=1000){const thresholds=[];for(const r of zRows){let other=-Infinity;for(const j of K)if(j!==k){const v=r[j]+offsets[j];if(v>other)other=v;}thresholds.push(other-r[k]);}thresholds.sort((a,b)=>a-b);const idx=Math.min(N-1,Math.max(0,target));const base=thresholds[idx];offsets[k]=Number.isFinite(base)?base+1e-9:0;}
let counts=winnerCounts();
for(let pass=0;pass<30;pass++){for(const k of K)tuneOne(k,1000);counts=winnerCounts();const maxDev=Math.max(...K.map(k=>Math.abs(counts[k]-1000)));console.log('PASS',pass,'MAXDEV',maxDev,'COUNTS',JSON.stringify(counts),'OFFSETS',JSON.stringify(offsets));if(K.every(k=>counts[k]>=970&&counts[k]<=1030))break;}
console.log('PARAMS',JSON.stringify(pars));console.log('FINAL_OFFSETS',JSON.stringify(offsets));console.log('FINAL_COUNTS',JSON.stringify(counts));
if(K.some(k=>counts[k]<970||counts[k]>1030))process.exitCode=1;
