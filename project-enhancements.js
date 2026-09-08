/* MapleStory Classic World • approved project enhancements
   Loaded after questions.js/classes.js/config.js and before app.js. */
(() => {
  const approvedQuestions = {
    10: {
      text: 'You are fighting monsters that are giving you trouble. What would you rather have?',
      options: [
        ['A', 'A stronger attack that can bring them down faster.'],
        ['B', 'A way to attack them without getting too close.'],
        ['C', 'A skill that works especially well against those monsters.'],
        ['D', 'A way to recover and keep fighting without using as many potions.']
      ]
    },
    15: {
      text: 'You are fighting monsters that take a while to defeat. What would help you most?',
      options: [
        ['A', 'A stronger attack against one monster.'],
        ['B', 'A way to hit several monsters at once.'],
        ['C', 'A way to attack safely from farther away.'],
        ['D', 'A way to move into attack range more quickly.']
      ]
    },
    26: {
      text: 'You find a map where the monsters give good EXP. What would make you want to keep training there?',
      options: [
        ['A', 'The monsters are quick to defeat.'],
        ['B', 'I can attack without moving around much.'],
        ['C', 'I can keep my potion use low.'],
        ['D', 'The monsters are easy to hit in groups.']
      ]
    },
    32: {
      text: 'A training map starts getting crowded with monsters. What would you prefer to do?',
      options: [
        ['A', 'Keep attacking the monster I am already focused on.'],
        ['B', 'Hit several monsters around me at once.'],
        ['C', 'Move away and attack them from a safer distance.'],
        ['D', 'Move through the group and attack from a better position.']
      ]
    },
    35: {
      text: 'You enter a map with monsters spread across several platforms. What matters most?',
      options: [
        ['A', 'Being able to attack from a long distance.'],
        ['B', 'Being able to reach the monsters quickly.'],
        ['C', 'Having attacks that can cover several monsters.'],
        ['D', 'Having strong attacks when a monster is right in front of me.']
      ]
    },
    43: {
      text: 'You are fighting a monster that is stronger than the ones you normally train on. What do you do first?',
      options: [
        ['A', 'Use my strongest attack and try to finish it quickly.'],
        ['B', 'Keep my distance and attack safely.'],
        ['C', 'Look for a way to hit it while avoiding its attacks.'],
        ['D', 'Use attacks that can also deal with nearby monsters.']
      ]
    },
    46: {
      text: "You have enough SP for a skill you've been waiting to improve. What would you rather do?",
      options: [
        ['A', 'Put the SP into the skill I use most often.'],
        ['B', 'Save the SP for a skill I will need later.'],
        ['C', 'Improve a skill that makes another part of my build work better.'],
        ['D', 'Spend the SP on whichever upgrade gives me the biggest immediate improvement.']
      ]
    }
  };

  if (Array.isArray(window.QUIZ_QUESTIONS)) {
    const q9 = window.QUIZ_QUESTIONS.find(q => q.id === 9);
    if (q9?.options?.[0]) q9.options[0][1] = 'A skill that gives me a strong result when I use it.';
    Object.entries(approvedQuestions).forEach(([id, revision]) => {
      const question = window.QUIZ_QUESTIONS.find(q => q.id === Number(id));
      if (!question) return;
      question.text = revision.text;
      question.options = revision.options;
    });
    const q47 = window.QUIZ_QUESTIONS.find(q => q.id === 47);
    if (q47?.options?.[2]) q47.options[2][1] = 'I like it when grouping monsters together leads to a big payoff.';
  }

  // Revised vectors match the final approved wording. Questions 1–48 were
  // reviewed after these changes; no question-weight changes were justified.
  Object.assign(window.QUIZ_OPTION_VECTORS, {
    9: [{special:0.82,payoff:0.84},{aoe:0.96},{risk:0.16,utility:0.76},{versatility:0.90,setup:0.74}],
    10: [{single:0.96,payoff:0.86},{range:0.96,risk:0.16,position:0.76},{special:0.88,matchup:0.96,element:0.90},{resource:0.92,economy:0.82,consistency:0.82}],
    15: [{single:0.96,payoff:0.82},{aoe:0.96},{range:0.96,risk:0.18},{mobility:0.94,position:0.82}],
    26: [{single:0.92,payoff:0.78},{consistency:0.90,position:0.72},{resource:0.92,economy:0.84},{aoe:0.92,setup:0.74}],
    32: [{single:0.94},{aoe:0.96},{range:0.96,risk:0.16,position:0.76},{mobility:0.88,position:0.94}],
    35: [{range:0.98,position:0.84},{mobility:0.94},{aoe:0.96},{single:0.94,close:0.92}],
    43: [{single:0.90,payoff:0.94},{range:0.96,risk:0.18},{attention:0.96,position:0.94,risk:0.24},{aoe:0.90}],
    46: [{consistency:0.90,special:0.68},{setup:0.92,versatility:0.82},{utility:0.92,versatility:0.88},{payoff:0.96,attention:0.72}]
  });

  window.QUIZ_JOB_GUIDES = {
    fighter:[['Lv. 1–30','https://meowdb.com/msclassic/guides/warrior-class-guide'],['Lv. 30–70','https://meowdb.com/msclassic/guides/fighter-class-guide']],
    page:[['Lv. 1–30','https://meowdb.com/msclassic/guides/warrior-class-guide'],['Lv. 30–70','https://meowdb.com/msclassic/guides/page-class-guide']],
    spearman:[['Lv. 1–30','https://meowdb.com/msclassic/guides/warrior-class-guide'],['Lv. 30–70','https://meowdb.com/msclassic/guides/spearman-class-guide']],
    fp:[['Lv. 1–30','https://meowdb.com/msclassic/guides/magician-class-guide'],['Lv. 30–70','https://meowdb.com/msclassic/guides/fp-wizard-class-guide']],
    il:[['Lv. 1–30','https://meowdb.com/msclassic/guides/magician-class-guide'],['Lv. 30–70','https://meowdb.com/msclassic/guides/il-wizard-class-guide']],
    cleric:[['Lv. 1–30','https://meowdb.com/msclassic/guides/magician-class-guide'],['Lv. 30–70','https://meowdb.com/msclassic/guides/cleric-class-guide']],
    hunter:[['Lv. 1–30','https://meowdb.com/msclassic/guides/bowman-leveling-guide-1-30'],['Lv. 30–70','https://meowdb.com/msclassic/guides/hunter-class-guide']],
    crossbow:[['Lv. 1–30','https://meowdb.com/msclassic/guides/bowman-leveling-guide-1-30'],['Lv. 30–70','https://meowdb.com/msclassic/guides/crossbowman-class-guide']],
    assassin:[['Lv. 1–30','https://meowdb.com/msclassic/guides/thief-class-guide'],['Lv. 30–70','https://meowdb.com/msclassic/guides/assassin-class-guide']],
    bandit:[['Lv. 1–30','https://meowdb.com/msclassic/guides/thief-class-guide'],['Lv. 30–70','https://meowdb.com/msclassic/guides/bandit-class-guide']]
  };

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
