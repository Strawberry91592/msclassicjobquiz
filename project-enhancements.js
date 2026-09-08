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
  const JOB_ORDER=['fighter','page','spearman','fp','il','cleric','hunter','crossbow','assassin','bandit'];
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

  function renderOpeningStats(panel,data){
    if(!data?.ok){panel.innerHTML='<div class="opening-stats-state">Community results are unavailable right now. You can still take the quiz normally.</div>';return;}
    const total=Number(data.total||0);
    const rows=JOB_ORDER.map((key,i)=>{
      const cls=window.CLASS_DATA?.[key];
      const count=Number(data.totals?.[key]||0);
      const pct=total?count/total*100:0;
      return `<div class="opening-stats-row"><div class="opening-stats-rank">#${i+1}</div><div class="opening-stats-job"><strong>${escapeHtml(cls?.name||key)}</strong><span>${escapeHtml(cls?.family||'')}</span><div class="opening-stats-meter"><i style="width:${Math.min(100,pct)}%"></i></div></div><div class="opening-stats-number"><b>${count}</b><span>${pct.toFixed(1)}%</span></div></div>`;
    }).join('');
    panel.innerHTML=`<div class="opening-stats-meta">${total} completed quizzes counted</div>${rows}`;
  }

  async function getStats(){
    const url=statsUrl();
    if(!url) throw new Error('not connected');
    const res=await fetch(`${url}/stats`,{cache:'no-store'});
    if(!res.ok) throw new Error('stats request failed');
    const data=await res.json();
    if(!data?.ok) throw new Error('stats unavailable');
    return data;
  }

  async function loadOpeningStats(){
    const panel=document.getElementById('openingCommunityStats');
    if(!panel)return;
    panel.innerHTML='<div class="opening-stats-state">Loading the latest Maple World results…</div>';
    try{renderOpeningStats(panel,await getStats());}
    catch(_){panel.innerHTML='<div class="opening-stats-state"><strong>Community results are unavailable right now.</strong><span>You can still take the quiz normally.</span></div>';}
  }

  function ensureOpeningPanel(){
    const modal=document.querySelector('#modeModal .mode-content');
    if(!modal||document.getElementById('openingCommunity'))return;
    const note=modal.querySelector('.modal-note');
    const section=document.createElement('section');
    section.id='openingCommunity';
    section.className='opening-community';
    section.innerHTML='<div class="opening-community-head"><div><div class="opening-community-kicker">MAPLE WORLD RESULTS</div><h3>Community Job Totals</h3><p>See the current result totals without taking the quiz.</p></div><span class="opening-community-mark">10 CURRENT 2ND JOBS</span></div><div id="openingCommunityStats" class="opening-community-stats"></div>';
    if(note)note.insertAdjacentElement('afterend',section);else modal.appendChild(section);
    loadOpeningStats();
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
    .opening-community{margin-top:16px;border-top:1px solid rgba(127,143,166,.22);padding-top:16px}
    .opening-community-head{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;margin-bottom:10px}
    .opening-community-head h3{margin:0}.opening-community-head p{margin:3px 0 0;opacity:.72;font-size:.86rem}
    .opening-community-kicker,.opening-community-mark{font-size:.68rem;font-weight:800;letter-spacing:.08em;opacity:.62}.opening-community-mark{white-space:nowrap}
    .opening-community-stats{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
    .opening-stats-meta{grid-column:1 / -1;font-size:.78rem;font-weight:700;opacity:.66;margin-bottom:2px}
    .opening-stats-row{display:grid;grid-template-columns:26px 1fr auto;align-items:center;gap:8px;padding:8px 9px;border:1px solid rgba(127,143,166,.18);border-radius:9px;background:rgba(127,143,166,.06)}
    .opening-stats-rank{font-weight:800;opacity:.7;text-align:center}.opening-stats-job strong{display:block;font-size:.84rem}.opening-stats-job span{display:block;font-size:.7rem;opacity:.6}
    .opening-stats-meter{height:4px;margin-top:5px;border-radius:99px;overflow:hidden;background:rgba(127,143,166,.15)}.opening-stats-meter i{display:block;height:100%;border-radius:99px;background:currentColor;opacity:.6}
    .opening-stats-number{text-align:right;font-size:.8rem}.opening-stats-number b{display:block}.opening-stats-number span{font-size:.68rem;opacity:.62}
    .opening-stats-state{grid-column:1 / -1;padding:12px;border:1px dashed rgba(127,143,166,.3);border-radius:9px;opacity:.76}.opening-stats-state span{display:block;margin-top:3px;font-size:.78rem}
    @media(max-width:700px){.opening-community-head{display:block}.opening-community-mark{display:block;margin-top:6px}.opening-community-stats{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  function init(){
    ensureOpeningPanel();
    addGuideLinks();
    const leaderboard=document.getElementById('leaderboard');
    if(leaderboard)new MutationObserver(addGuideLinks).observe(leaderboard,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
