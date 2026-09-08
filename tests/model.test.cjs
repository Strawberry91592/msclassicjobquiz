const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const context={window:{fetch:async()=>{throw new Error('Unexpected fetch');}},document:{getElementById(){return null},createElement(){return{textContent:'',style:{},appendChild(){}}},head:{appendChild(){}}},MutationObserver:class{observe(){}},setTimeout,clearTimeout,Promise};
vm.createContext(context);
for(const f of ['questions.js','classes.js','project-enhancements.js','fairness-calibration.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),context,{filename:f});
const W=context.window,Q=W.QUIZ_QUESTIONS,C=W.CLASS_DATA,D=Object.keys(W.QUIZ_DIMS),DW=W.QUIZ_DIM_WEIGHTS,QW=W.QUIZ_QUESTION_WEIGHTS,V=W.QUIZ_OPTION_VECTORS,K=Object.keys(C);
function nv(s){return Object.fromEntries(D.map(d=>[d,typeof s?.[d]==='number'?s[d]:.5]));}
function pref(q,letters){const a=Object.fromEntries(D.map(d=>[d,.5])),e=Object.fromEntries(D.map(d=>[d,0]));letters.forEach((letter,rank)=>{const p=nv(V[q.id][letter.charCodeAt(0)-65]),w=Number(QW[q.id]??1)*([1,.72,.5,.34][rank]??.25);D.forEach(d=>{const sig=Math.abs(p[d]-.5)*2;if(sig<.08)return;const c=w*sig,b=c/(e[d]+c+.0001);a[d]=a[d]*(1-b)+p[d]*b;e[d]+=c;});});return{a,e};}
function scores(ans){const u=Object.fromEntries(D.map(d=>[d,.5])),ew=Object.fromEntries(D.map(d=>[d,0]));ans.forEach((letters,i)=>{const{a,e}=pref(Q[i],letters);D.forEach(d=>{if(!e[d])return;const n=ew[d]+e[d];u[d]=ew[d]?(u[d]*ew[d]+a[d]*e[d])/n:a[d];ew[d]=n;});});const out={};for(const k of K){let s=0,den=0;for(const d of D){if(!ew[d])continue;const w=(DW[d]||1)*ew[d];s+=(1-Math.min(1,Math.abs(u[d]-C[k].dims[d])))*w;den+=w;}out[k]=den?s/den:.5;}return out;}
let seed=0x9e3779b9;function rnd(){seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return(seed>>>0)/0x100000000;}
const N=10000,rows=Array.from({length:N},()=>scores(Q.map(()=>[String.fromCharCode(65+Math.floor(rnd()*4))])));
const pars={};for(const k of K){let m=0;for(const r of rows)m+=r[k];m/=N;let v=0;for(const r of rows)v+=(r[k]-m)**2;pars[k]={mean:m,sd:Math.sqrt(v/N)||1};}
function count(cal){const c=Object.fromEntries(K.map(k=>[k,0]));for(const r of rows){let bk=K[0],bv=r[bk]*(cal[bk]?.scale??1)+(cal[bk]?.offset??0);for(let i=1;i<K.length;i++){const k=K[i],v=r[k]*(cal[k]?.scale??1)+(cal[k]?.offset??0);if(v>bv){bv=v;bk=k;}}c[bk]++;}return c;}
const z=Object.fromEntries(K.map(k=>[k,{scale:1/pars[k].sd,offset:-pars[k].mean/pars[k].sd}]));
console.log('RAW',JSON.stringify(count({})));
console.log('PARAMS',JSON.stringify(z));
console.log('STANDARDIZED',JSON.stringify(count(z)));
