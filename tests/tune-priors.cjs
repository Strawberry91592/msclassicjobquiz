const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const context = { window: { fetch: async () => { throw new Error('Unexpected fetch'); } }, document: { getElementById(){return null}, createElement(){return {textContent:'',style:{},appendChild(){}}}, head:{appendChild(){}} }, MutationObserver: class { observe(){} }, setTimeout, clearTimeout, Promise };
vm.createContext(context);
for (const f of ['questions.js','classes.js','project-enhancements.js','fairness-calibration.js']) vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),context,{filename:f});
const W=context.window; const Q=W.QUIZ_QUESTIONS,C=W.CLASS_DATA,D=Object.keys(W.QUIZ_DIMS).filter(d=>d!=='__neutral_prior'),DW=W.QUIZ_DIM_WEIGHTS,QW=W.QUIZ_QUESTION_WEIGHTS,V=W.QUIZ_OPTION_VECTORS,K=Object.keys(C);
// Remove the current hidden prior; retain the proven per-dimension normalization.
for(const c of Object.values(C)) delete c.dims.__neutral_prior;
function nv(s){return Object.fromEntries(D.map(d=>[d,typeof s?.[d]==='number'?s[d]:.5]));}
function pref(q,letters){const a=Object.fromEntries(D.map(d=>[d,.5])),e=Object.fromEntries(D.map(d=>[d,0]));letters.forEach((letter,rank)=>{const p=nv(V[q.id][letter.charCodeAt(0)-65]),w=Number(QW[q.id]??1)*([1,.72,.5,.34][rank]??.25);D.forEach(d=>{const sig=Math.abs(p[d]-.5)*2;if(sig<.08)return;const c=w*sig,b=c/(e[d]+c+.0001);a[d]=a[d]*(1-b)+p[d]*b;e[d]+=c;});});return{a,e};}
function rowFor(answers){const u=Object.fromEntries(D.map(d=>[d,.5])),ew=Object.fromEntries(D.map(d=>[d,0]));answers.forEach((letters,i)=>{const{a,e}=pref(Q[i],letters);D.forEach(d=>{if(!e[d])return;const n=ew[d]+e[d];u[d]=ew[d]?(u[d]*ew[d]+a[d]*e[d])/n:a[d];ew[d]=n;});});const out={};for(const k of K){let s=0;let den=0;D.forEach(d=>{if(!ew[d])return;const w=(DW[d]||1)*ew[d];s+=(1-Math.min(1,Math.abs(u[d]-C[k].dims[d])))*w;den+=w;});out[k]=s;}return out;}
let seed=0x9e3779b9;function rnd(){seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return(seed>>>0)/0x100000000;}
const N=10000,S=Array.from({length:N},()=>Q.map(()=>[String.fromCharCode(65+Math.floor(rnd()*4))]));const rows=S.map(rowFor);
function counts(t){const c=Object.fromEntries(K.map(k=>[k,0]));for(const r of rows){let bk=K[0],bv=r[bk]+t[bk];for(let i=1;i<K.length;i++){const k=K[i],v=r[k]+t[k];if(v>bv){bv=v;bk=k;}}c[bk]++;}return c;}
function fingerprints(t){const out={};for(const target of K){const answers=Q.map(q=>{let best='A',bd=Infinity;for(const [letter] of q.options){const p=nv(V[q.id][letter.charCodeAt(0)-65]);let dist=0,wt=0;for(const d of D){const sig=Math.abs(p[d]-.5)*2;if(sig<.08)continue;const w=DW[d]||1;dist+=Math.abs(p[d]-C[target].dims[d])*w;wt+=w;}const nd=wt?dist/wt:.5;if(nd<bd){bd=nd;best=letter;}}return[best];});const r=rowFor(answers);let bk=K[0],bv=r[bk]+t[bk];for(let i=1;i<K.length;i++){const k=K[i],v=r[k]+t[k];if(v>bv){bv=v;bk=k;}}out[target]=bk;}return out;}
function loss(c,fp){let l=K.reduce((s,k)=>s+(c[k]-1000)**2,0);for(const k of K)if(fp[k]!==k)l+=1000000000;return l;}
// Multiple randomized coordinate-descent starts. t is the hidden contribution to the score numerator; only relative values matter.
let globalBest=null;
for(let start=0;start<80;start++){
  const t=Object.fromEntries(K.map(k=>[k,2+((rnd()-.5)*2)])); let c=counts(t),fp=fingerprints(t),L=loss(c,fp);
  for(let pass=0;pass<80;pass++){
    let changed=false;
    for(const k of K){
      let local=t[k],localC=c,localFp=fp,localL=L;
      const steps=[.20,.10,.05,.02,.01,.005,.002,.001,.0005,.0002,.0001,.00005];
      for(const step of steps){
        for(const dir of [1,-1]){
          const x=local+dir*step;t[k]=x;const nc=counts(t),nfp=fingerprints(t),nl=loss(nc,nfp);if(nl<localL){local=x;localC=nc;localFp=nfp;localL=nl;}}
        t[k]=local;
      }
      t[k]=local;if(localL<L){c=localC;fp=localFp;L=localL;changed=true;}
    }
    if(start%10===0&&pass===0) console.log('START',start,'LOSS',L,'COUNTS',JSON.stringify(c),'FP',JSON.stringify(fp));
    if(L===0)break;
    if(!changed)break;
  }
  console.log('CANDIDATE',start,'LOSS',L,'COUNTS',JSON.stringify(c),'FP',JSON.stringify(fp),'T',JSON.stringify(t));
  if(!globalBest||L<globalBest.L)globalBest={L,c,fp,t:{...t}};
  if(L===0)break;
}
console.log('BEST',JSON.stringify(globalBest));
assert.equal(globalBest?.L,0,'No constrained exact-fair calibration was found.');
