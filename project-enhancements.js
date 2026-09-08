/* MapleStory Classic World • 20-question playstyle model and approved project enhancements.
   Loaded after questions.js/classes.js/config.js and before app.js. */
(() => {
  window.QUIZ_QUESTION_WEIGHTS = {"1":0.98,"2":0.92,"3":0.88,"4":1.0,"5":0.86,"6":1.04,"7":0.84,"8":1.06,"9":1.12,"10":1.12,"11":1.08,"12":1.08,"13":1.04,"14":1.04,"15":1.08,"16":1.12,"17":1.1,"18":1.08,"19":1.1,"20":1.0};
  window.QUIZ_OPTION_VECTORS = {"1":[{"single":0.96,"payoff":0.86},{"aoe":0.96},{"mobility":0.96,"attention":0.72},{"range":0.94,"position":0.92}],"2":[{"consistency":0.94},{"position":0.96,"attention":0.78},{"range":0.96},{"mobility":0.94,"attention":0.72}],"3":[{"aoe":0.94,"close":0.82},{"range":0.94,"position":0.88,"setup":0.74},{"mobility":0.95},{"versatility":0.95,"attention":0.72}],"4":[{"payoff":0.9,"risk":0.9},{"range":0.92,"risk":0.16},{"utility":0.92,"risk":0.2},{"matchup":0.92,"special":0.88}],"5":[{"payoff":0.92,"economy":0.22},{"economy":0.94,"consistency":0.86},{"economy":0.72,"consistency":0.86,"versatility":0.68},{"economy":0.5,"resource":0.82,"versatility":0.82}],"6":[{"single":0.92,"payoff":0.86},{"aoe":0.94},{"party":0.96,"utility":0.94},{"party":0.2,"consistency":0.86}],"7":[{"attention":0.94,"special":0.86},{"consistency":0.94},{"versatility":0.95},{"gear":0.92,"payoff":0.78}],"8":[{"close":0.96,"risk":0.72,"payoff":0.82},{"range":0.92,"position":0.9,"setup":0.86},{"resource":0.9,"aoe":0.88,"mobility":0.86},{"party":0.94,"utility":0.94,"consistency":0.84}],"9":[{"payoff":0.92,"economy":0.88,"consistency":0.9},{"utility":0.94,"versatility":0.92,"risk":0.4},{"range":0.28,"consistency":0.94,"close":0.94},{"mobility":0.62,"setup":0.82}],"10":[{"element":0.96,"matchup":0.96,"special":0.92,"setup":0.92},{"aoe":0.98,"mobility":0.96,"element":0.84},{"party":0.98,"utility":1.0,"versatility":0.94},{"consistency":0.9,"special":0.54}],"11":[{"aoe":0.96,"utility":0.72,"setup":0.78},{"aoe":0.9,"range":0.96,"position":0.98,"setup":0.92},{"single":0.94,"range":0.96},{"versatility":0.92,"consistency":0.74}],"12":[{"range":0.92,"mobility":0.9,"attention":0.9},{"close":0.98,"single":0.98,"risk":0.94,"payoff":0.94},{"utility":0.86,"attention":0.78,"versatility":0.76},{"economy":0.96,"resource":0.84}],"13":[{"element":0.98,"matchup":0.98,"special":0.92},{"versatility":0.94,"consistency":0.86},{"aoe":0.84,"mobility":0.9},{"party":0.92,"utility":0.9}],"14":[{"aoe":0.98,"position":0.76},{"mobility":0.98,"position":0.74},{"utility":0.84,"risk":0.18},{"single":0.94}],"15":[{"party":0.98,"utility":0.96,"matchup":0.78},{"party":0.96,"utility":0.9},{"single":0.92,"payoff":0.86,"party":0.18},{"party":0.18,"consistency":0.84}],"16":[{"aoe":0.96,"utility":0.84,"setup":0.78},{"aoe":0.9,"position":0.98,"range":0.92,"setup":0.92},{"single":0.96,"range":0.94,"payoff":0.82},{"versatility":0.94,"position":0.7}],"17":[{"range":0.9,"mobility":0.88,"risk":0.7,"attention":0.82},{"close":0.98,"single":0.98,"risk":0.94,"payoff":0.94},{"utility":0.84,"consistency":0.72,"risk":0.24},{"economy":0.92,"payoff":0.94,"risk":0.86}],"18":[{"party":0.74,"payoff":0.9,"special":0.76},{"utility":0.94,"versatility":0.92},{"range":0.28,"consistency":0.94,"close":0.94},{"versatility":0.86,"attention":0.86}],"19":[{"element":0.94,"matchup":0.94,"setup":0.92,"special":0.9},{"aoe":0.98},{"single":0.99,"payoff":0.94,"special":0.9},{"range":0.96,"mobility":0.88,"position":0.86}],"20":[{"consistency":0.94,"payoff":0.78,"special":0.68},{"versatility":0.94,"special":0.88,"attention":0.7},{"party":0.94,"utility":0.92},{"single":0.96,"payoff":0.9}]};
  window.QUIZ_JOB_GUIDES = {"fighter":[["Lv. 1–30","https://meowdb.com/msclassic/guides/warrior-class-guide"],["Lv. 30–70","https://meowdb.com/msclassic/guides/fighter-class-guide"]],"page":[["Lv. 1–30","https://meowdb.com/msclassic/guides/warrior-class-guide"],["Lv. 30–70","https://meowdb.com/msclassic/guides/page-class-guide"]],"spearman":[["Lv. 1–30","https://meowdb.com/msclassic/guides/warrior-class-guide"],["Lv. 30–70","https://meowdb.com/msclassic/guides/spearman-class-guide"]],"fp":[["Lv. 1–30","https://meowdb.com/msclassic/guides/magician-class-guide"],["Lv. 30–70","https://meowdb.com/msclassic/guides/fp-wizard-class-guide"]],"il":[["Lv. 1–30","https://meowdb.com/msclassic/guides/magician-class-guide"],["Lv. 30–70","https://meowdb.com/msclassic/guides/il-wizard-class-guide"]],"cleric":[["Lv. 1–30","https://meowdb.com/msclassic/guides/magician-class-guide"],["Lv. 30–70","https://meowdb.com/msclassic/guides/cleric-class-guide"]],"hunter":[["Lv. 1–30","https://meowdb.com/msclassic/guides/bowman-leveling-guide-1-30"],["Lv. 30–70","https://meowdb.com/msclassic/guides/hunter-class-guide"]],"crossbow":[["Lv. 1–30","https://meowdb.com/msclassic/guides/bowman-leveling-guide-1-30"],["Lv. 30–70","https://meowdb.com/msclassic/guides/crossbowman-class-guide"]],"assassin":[["Lv. 1–30","https://meowdb.com/msclassic/guides/thief-class-guide"],["Lv. 30–70","https://meowdb.com/msclassic/guides/assassin-class-guide"]],"bandit":[["Lv. 1–30","https://meowdb.com/msclassic/guides/thief-class-guide"],["Lv. 30–70","https://meowdb.com/msclassic/guides/bandit-class-guide"]]};

  const statsUrl=()=>String(window.STATS_API_URL||'').replace(/\/$/,'');
  const nativeFetch=window.fetch.bind(window);
  let acceptedSubmissionUntil=0;
  window.fetch=async(input,init={})=>{
    const url=typeof input==='string'?input:input?.url||'';
    const method=String(init.method||(typeof input!=='string'&&input?.method)||'GET').toUpperCase();
    const base=statsUrl();
    if(base&&url.startsWith(base)){
      if(url.endsWith('/result')&&method==='POST'){
        const response=await nativeFetch(input,init);
        if(response.ok)acceptedSubmissionUntil=Date.now()+15000;
        return response;
      }
      if(url.endsWith('/stats')&&method==='GET'){
        let response=await nativeFetch(input,init);
        if(response.ok&&acceptedSubmissionUntil>Date.now()){
          for(const delay of [700,1400,2800]){
            let data=null;
            try{data=await response.clone().json();}catch(_){break;}
            if(!(data?.ok&&Number(data.total||0)===0))break;
            await new Promise(resolve=>setTimeout(resolve,delay));
            response=await nativeFetch(input,init);
            if(!response.ok)break;
          }
        }
        return response;
      }
    }
    return nativeFetch(input,init);
  };

  const refreshUncountedStats=async()=>{
    const eligibility=document.getElementById('communityEligibility');
    const label=document.getElementById('sharedStatsMeta');
    const panel=document.getElementById('sharedStats');
    const base=statsUrl();
    if(!eligibility||!label||!panel||!base||!eligibility.textContent.includes('Not counted')) return;
    try{
      const response=await window.fetch(`${base}/stats`,{cache:'no-store'});
      if(!response.ok) return;
      const data=await response.json();
      if(!data?.ok) return;
      const total=Number(data.total||0);
      label.textContent=`${total} completed quizzes counted`;
      const sorted=Object.keys(window.CLASS_DATA||{}).sort((a,b)=>(data.totals?.[b]||0)-(data.totals?.[a]||0));
      panel.innerHTML=`<div class="stats-note">These are aggregate quiz completions. No quiz answers or personal details are stored.</div>`+sorted.map((key,i)=>{
        const count=Number(data.totals?.[key]||0);
        const pct=total?(count/total*100):0;
        const cls=window.CLASS_DATA[key];
        return `<div class="stats-row"><div class="stats-rank">${i+1}</div><div class="stats-job"><strong>${cls.name}</strong><span>${cls.family}</span><div class="stats-meter"><i style="width:${Math.min(100,pct)}%"></i></div></div><div class="stats-number"><b>${count}</b><span>${pct.toFixed(1)}%</span></div></div>`;
      }).join('');
    }catch(_){
      // The normal app-side stats renderer remains responsible for hard failures.
    }
  };

  const eligibility=document.getElementById('communityEligibility');
  if(eligibility){
    const observer=new MutationObserver(refreshUncountedStats);
    observer.observe(eligibility,{childList:true,subtree:true});
  }

  const style=document.createElement('style');
  style.textContent=`
    .job-match-guides{display:flex;flex-wrap:wrap;align-items:center;gap:7px;margin-top:10px}
    .job-match-guides>span{width:100%;font-size:.66rem;font-weight:800;letter-spacing:.08em;opacity:.58}
    .job-match-guides a{position:relative;display:inline-flex;align-items:center;padding:7px 10px;border:1px solid var(--line,#c8d0dc);border-radius:8px;font-size:.73rem;font-weight:700;text-decoration:none;color:inherit;background:rgba(127,143,166,.08);cursor:pointer;transition:border-color .15s ease,background .15s ease,transform .15s ease,box-shadow .15s ease}
    .job-match-guides a::after{content:"↗";margin-left:7px;font-size:.82rem;font-weight:900;line-height:1;opacity:.72;transform:translateY(-1px)}
    .job-match-guides a::before{content:"Open MeowDB guide";position:absolute;left:50%;bottom:calc(100% + 8px);z-index:10;transform:translate(-50%,4px);padding:6px 8px;border:1px solid rgba(127,143,166,.45);border-radius:6px;background:#172536;color:#fff;font-size:.67rem;font-weight:700;line-height:1.2;white-space:nowrap;opacity:0;pointer-events:none;box-shadow:0 5px 14px rgba(15,28,42,.2);transition:opacity .15s ease,transform .15s ease}
    .job-match-guides a:hover,.job-match-guides a:focus-visible{border-color:#7198b4;background:rgba(113,152,180,.14);box-shadow:0 3px 8px rgba(35,62,82,.1);transform:translateY(-1px);outline:none}
    .job-match-guides a:hover::before,.job-match-guides a:focus-visible::before{opacity:1;transform:translate(-50%,0)}
    .job-match-guides a:hover::after,.job-match-guides a:focus-visible::after{opacity:1}
    body.night-mode .job-match-guides a{border-color:#425a70;background:rgba(94,121,145,.12);color:#c4d4df}
    body.night-mode .job-match-guides a:hover,body.night-mode .job-match-guides a:focus-visible{border-color:#7198b4;background:rgba(113,152,180,.2)}
    body.night-mode .job-match-guides a::before{background:#e7eef3;color:#1c2c3d;border-color:#6d8599;box-shadow:0 6px 16px rgba(0,0,0,.35)}
    @media(max-width:650px){.job-match-guides a{padding:7px 9px}.job-match-guides a::before{display:none}}
  `;
  document.head.appendChild(style);
})();
