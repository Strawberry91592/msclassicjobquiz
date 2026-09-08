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

  const JOB_GUIDES = {
    Fighter:[['Lv. 1–30','https://meowdb.com/msclassic/guides/warrior-class-guide'],['Lv. 30–70','https://meowdb.com/msclassic/guides/fighter-class-guide']],
    Page:[['Lv. 1–30','https://meowdb.com/msclassic/guides/warrior-class-guide'],['Lv. 30–70','https://meowdb.com/msclassic/guides/page-class-guide']],
    Spearman:[['Lv. 1–30','https://meowdb.com/msclassic/guides/warrior-class-guide'],['Lv. 30–70','https://meowdb.com/msclassic/guides/spearman-class-guide']],
    'F/P Wizard':[['Lv. 1–30','https://meowdb.com/msclassic/guides/magician-class-guide'],['Lv. 30–70','https://meowdb.com/msclassic/guides/fp-wizard-class-guide']],
    'I/L Wizard':[['Lv. 1–30','https://meowdb.com/msclassic/guides/magician-class-guide'],['Lv. 30–70','https://meowdb.com/msclassic/guides/il-wizard-class-guide']],
    Cleric:[['Lv. 1–30','https://meowdb.com/msclassic/guides/magician-class-guide'],['Lv. 30–70','https://meowdb.com/msclassic/guides/cleric-class-guide']],
    Hunter:[['Lv. 1–30','https://meowdb.com/msclassic/guides/bowman-leveling-guide-1-30'],['Lv. 30–70','https://meowdb.com/msclassic/guides/hunter-class-guide']],
    Crossbowman:[['Lv. 1–30','https://meowdb.com/msclassic/guides/bowman-leveling-guide-1-30'],['Lv. 30–70','https://meowdb.com/msclassic/guides/crossbowman-class-guide']],
    Assassin:[['Lv. 1–30','https://meowdb.com/msclassic/guides/thief-class-guide'],['Lv. 30–70','https://meowdb.com/msclassic/guides/assassin-class-guide']],
    Bandit:[['Lv. 1–30','https://meowdb.com/msclassic/guides/thief-class-guide'],['Lv. 30–70','https://meowdb.com/msclassic/guides/bandit-class-guide']]
  };
  const escapeHtml=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
  const statsUrl=()=>String(window.STATS_API_URL||'').replace(/\/$/,'');

  function addGuideLinks(){
    document.querySelectorAll('.job-match-card').forEach(card=>{
      if(card.querySelector('.job-match-guides')) return;
      const title=card.querySelector('.job-match-title h4');
      const body=card.querySelector('.job-match-body');
      if(!title||!body) return;
      const links=JOB_GUIDES[title.textContent.trim()];
      if(!links) return;
      const box=document.createElement('div');
      box.className='job-match-guides';
      box.innerHTML=`<span>MEOWDB GUIDES</span>${links.map(([label,url])=>`<a href="${url}" target="_blank" rel="noopener">${escapeHtml(label)}</a>`).join('')}`;
      body.appendChild(box);
    });
  }

  function simplifySignalCards(){
    const container=document.getElementById('profileBars');
    if(!container) return;
    const cards=[...container.querySelectorAll('.signal-card')].filter(card=>card.querySelector('.signal-marker'));
    if(!cards.length) return;

    cards.forEach(card=>{
      const label=card.querySelector('.signal-top strong')?.textContent?.trim() || 'Playstyle signal';
      const interpretation=card.querySelector('.signal-top span')?.textContent?.trim() || '';
      const userPct=card.querySelector('.signal-values b')?.textContent?.trim() || '0%';
      const jobPct=card.querySelector('.signal-values span')?.textContent?.trim() || '0%';
      const jobName=card.querySelectorAll('.signal-values em')[1]?.textContent?.trim() || 'Your job';
      const delta=Math.abs(Number.parseInt(userPct,10)||0-(Number.parseInt(jobPct,10)||0));
      const interpretationText = delta < 8 ? 'Very similar preference' :
        (Number.parseInt(userPct,10)||0) > (Number.parseInt(jobPct,10)||0 ? 'You prefer this more' : `${jobName} leans higher`);

      card.innerHTML=`
        <div class="signal-heading">
          <div>
            <strong>${label}</strong>
            <span>${interpretationText}</span>
          </div>
        </div>
        <div class="signal-compare" aria-label="${label}: you ${userPct}, ${jobName} ${jobPct}">
          <div class="signal-compare-row signal-compare-you">
            <div class="signal-compare-label"><span>YOU</span><b>${userPct}</b></div>
            <div class="signal-compare-track"><i style="width:${userPct}"></i></div>
          </div>
          <div class="signal-compare-row signal-compare-job">
            <div class="signal-compare-label"><span>${jobName}</span><b>${jobPct}</b></div>
            <div class="signal-compare-track"><i style="width:${jobPct}"></i></div>
          </div>
        </div>`;
      card.dataset.signalSimplified='true';
    });
  }

  // Analytics Engine writes are non-blocking. A just-accepted submission can be
  // temporarily absent from the read path, so retry an immediately-empty GET.
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

  const style=document.createElement('style');
  style.textContent=`
    .job-match-guides{display:flex;flex-wrap:wrap;align-items:center;gap:7px;margin-top:10px}
    .job-match-guides>span{width:100%;font-size:.66rem;font-weight:800;letter-spacing:.08em;opacity:.58}
    .job-match-guides a{display:inline-flex;padding:6px 9px;border:1px solid var(--line,#c8d0dc);border-radius:8px;font-size:.73rem;font-weight:700;text-decoration:none;color:inherit;background:rgba(127,143,166,.08)}
    .job-match-guides a:hover{text-decoration:underline}
  `;
  document.head.appendChild(style);

  function init(){
    addGuideLinks();
    simplifySignalCards();
    const leaderboard=document.getElementById('leaderboard');
    if(leaderboard)new MutationObserver(addGuideLinks).observe(leaderboard,{childList:true,subtree:true});
    const profileBars=document.getElementById('profileBars');
    if(profileBars)new MutationObserver(simplifySignalCards).observe(profileBars,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
