const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const context = { window: { fetch: async () => { throw new Error('Unexpected fetch in tuning harness'); } }, document: { getElementById(){return null}, createElement(){return {textContent:'',style:{},appendChild(){}}}, head:{appendChild(){}} }, MutationObserver: class { observe(){} }, setTimeout, clearTimeout, Promise };
vm.createContext(context);
for (const file of ['questions.js','classes.js','project-enhancements.js','fairness-calibration.js']) vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'), context, {filename:file});
const W=context.window, questions=W.QUIZ_QUESTIONS, classes=W.CLASS_DATA, dims=Object.keys(W.QUIZ_DIMS), dw=W.QUIZ_DIM_WEIGHTS, qw=W.QUIZ_QUESTION_WEIGHTS, vectors=W.QUIZ_OPTION_VECTORS, keys=Object.keys(classes);
function nv(s){return Object.fromEntries(dims.map(d=>[d,typeof s?.[d]==='number'?s[d]:0.5]));}
function pref(q,letters){const a=Object.fromEntries(dims.map(d=>[d,.5])),e=Object.fromEntries(dims.map(d=>[d,0]));letters.forEach((letter,rank)=>{const p=nv(vectors[q.id][letter.charCodeAt(0)-65]),w=Number(qw[q.id]??1)*([1,.72,.5,.34][rank]??.25);dims.forEach(d=>{const sig=Math.abs(p[d]-.5)*2;if(sig<.08)return;const c=w*sig,b=c/(e[d]+c+.0001);a[d]=a[d]*(1-b)+p[d]*b;e[d]+=c;});});return{a,e};}
function baseScore(answers,key){const u=Object.fromEntries(dims.map(d=>[d,.5])),ew=Object.fromEntries(dims.map(d=>[d,0]));answers.forEach((letters,i)=>{const{a,e}=pref(questions[i],letters);dims.forEach(d=>{if(!e[d])return;const nw=ew[d]+e[d];u[d]=ew[d]?(u[d]*ew[d]+a[d]*e[d])/nw:a[d];ew[d]=nw;});});let sum=0,den=0;dims.forEach(d=>{if(!ew[d])return;const w=(dw[d]||1)*ew[d];sum+=(1-Math.min(1,Math.abs(u[d]-classes[key].dims[d])))*w;den+=w;});return den?sum/den:.5;}
let seed=0x9e3779b9;function rnd(){seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return(seed>>>0)/0x100000000;}
const samples=Array.from({length:10000},()=>questions.map(()=>[String.fromCharCode(65+Math.floor(rnd()*4))]));
const base=samples.map(a=>Object.fromEntries(keys.map(k=>[k,baseScore(a,k)])));
function counts(bias){const c=Object.fromEntries(keys.map(k=>[k,0]));for(const row of base){let bk=keys[0],bv=row[bk]+(bias[bk]||0);for(let i=1;i<keys.length;i++){const k=keys[i],v=row[k]+(bias[k]||0);if(v>bv){bv=v;bk=k;}}c[bk]++;}return c;}
const target=1000;function loss(c){return keys.reduce((s,k)=>s+(c[k]-target)**2,0);}let bias=Object.fromEntries(keys.map(k=>[k,0])),best=counts(bias),bestLoss=loss(best);console.log('BASE_COUNTS',JSON.stringify(best),'LOSS',bestLoss);
for(let pass=0;pass<80;pass++){let changed=false;for(const k of keys){let bestK=bias[k],bestC=best,bestL=bestLoss;for(const step of [.02,.01,.005,.002,.001,.0005,.0002]){for(const dir of [1,-1]){const candidate=Math.max(-.25,Math.min(.25,bias[k]+dir*step));bias[k]=candidate;const c=counts(bias),l=loss(c);if(l<bestL){bestK=candidate;bestC=c;bestL=l;}}bias[k]=bestK;}if(bestL<bestLoss){bias[k]=bestK;best=bestC;bestLoss=bestL;changed=true;}else bias[k]=bestK;}console.log('PASS',pass,'LOSS',bestLoss,'COUNTS',JSON.stringify(best),'BIAS',JSON.stringify(bias));if(bestLoss===0)break;if(!changed)break;}
console.log('FINAL_BIAS',JSON.stringify(bias));console.log('FINAL_COUNTS',JSON.stringify(best));