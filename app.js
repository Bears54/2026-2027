(()=>{
'use strict';
/* ---------- storage ---------- */
const S={
  get(k){try{return localStorage.getItem('pl:'+k)}catch(e){return null}},
  set(k,v){try{(v===''||v===false||v==null)?localStorage.removeItem('pl:'+k):localStorage.setItem('pl:'+k,String(v))}catch(e){}}
};
const cfg={ws:S.get('cfg.ws')===null?1:+S.get('cfg.ws'),theme:S.get('cfg.theme')||'rose'};
if(cfg.theme==='teal')document.body.classList.add('teal');

/* ---------- dates ---------- */
const MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
const MS=MONTHS.map(m=>m.slice(0,3));
const WDN=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const dayOrder=()=>cfg.ws===1?[1,2,3,4,5,6,0]:[0,1,2,3,4,5,6];
const pad=n=>String(n).padStart(2,'0');
const ymd=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const pd=s=>{const [y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)};
const addD=(d,n)=>{const x=new Date(d.getFullYear(),d.getMonth(),d.getDate());x.setDate(x.getDate()+n);return x};
const sow=d=>addD(d,-((d.getDay()-cfg.ws+7)%7));
const fmt=d=>`${MS[d.getMonth()]} ${d.getDate()}`;
const today=()=>new Date();
const sameDay=(a,b)=>ymd(a)===ymd(b);
const slug=s=>s.toLowerCase().replace(/&/g,'and').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');

/* ---------- html helpers ---------- */
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
const inp=(k,ph='',def='')=>`<input class="ln" data-k="${k}" placeholder="${esc(ph)}" data-def="${esc(def)}" autocomplete="off" autocapitalize="sentences">`;
const chk=k=>`<input type="checkbox" data-k="${k}">`;
const area=(k,rows=5,ph='')=>`<textarea data-k="${k}" rows="${rows}" placeholder="${esc(ph)}"></textarea>`;
const todo=(p,n)=>Array.from({length:n},(_,i)=>`<div class="row">${chk(p+'.c'+i)}${inp(p+'.t'+i)}</div>`).join('');
const lines=(p,n,ph='')=>Array.from({length:n},(_,i)=>`<div class="row">${inp(p+'.l'+i,ph)}</div>`).join('');
const nums=(p,n)=>Array.from({length:n},(_,i)=>`<div class="row"><label class="t">${i+1}</label>${inp(p+'.n'+i)}</div>`).join('');
const sec=(t,b,cls='')=>`<section class="card ${cls}"><h3>${t}</h3><div class="b">${b}</div></section>`;
const pill=(href,txt,cls='')=>`<a class="pill ${cls}" href="${href}">${txt}</a>`;
const head=(title,acts='')=>`<div class="ph"><h1>${title}</h1><div class="acts">${acts}</div></div>`;

function table(p,cols,n=14){
  let h='<div class="scroll"><table class="tb"><tr>'+cols.map(c=>`<th>${c}</th>`).join('')+'</tr>';
  for(let r=0;r<n;r++){
    h+='<tr>'+cols.map((c,i)=>c==='Done'?`<td style="text-align:center">${chk(`${p}.${r}.${i}`)}</td>`:`<td>${inp(`${p}.${r}.${i}`)}</td>`).join('')+'</tr>';
  }
  return h+'</table></div>';
}
function grid(p,n,days,mode,names){
  let h='<div class="scroll"><table class="gr"><tr><th></th>';
  for(let d=1;d<=days;d++)h+=`<th>${d}</th>`;
  h+='</tr>';
  for(let i=0;i<n;i++){
    h+=`<tr><td>${inp(`${p}.n${i}`,'',(names&&names[i])||'')}</td>`;
    for(let d=1;d<=days;d++){
      const k=`${p}.${i}.${d}`;
      if(mode==='num')h+=`<td><input class="nm" inputmode="decimal" data-k="${k}"></td>`;
      else if(mode==='mood')h+=`<td><button class="cyc" data-cy="${k}" data-opts="😞|😕|😐|🙂|😄">·</button></td>`;
      else h+=`<td>${chk(k)}</td>`;
    }
    h+='</tr>';
  }
  return h+'</table></div>';
}
const dayPills=(cur)=>{
  const s=sow(cur);
  return dayOrder().map((_,i)=>{const d=addD(s,i);return pill('#/day/'+ymd(d),WDN[d.getDay()].slice(0,3)+' '+d.getDate(),sameDay(d,cur)?'on':'')}).join('');
};
const monthTabs=(y,cur)=>`<div class="tabs">${pill('#/year/'+y,y,'t')}${MS.map((m,i)=>pill(`#/month/${y}-${pad(i+1)}`,m,(cur===i)?'on':'')).join('')}</div>`;

function weeksOf(y,m){
  const f=new Date(y,m,1),n=new Date(y,m+1,0).getDate();
  const lead=(f.getDay()-cfg.ws+7)%7;
  const cells=[...Array(lead).fill(null),...Array.from({length:n},(_,i)=>new Date(y,m,i+1))];
  while(cells.length%7)cells.push(null);
  const w=[];for(let i=0;i<cells.length;i+=7)w.push(cells.slice(i,i+7));
  return w;
}

/* ---------- template catalog ---------- */
const CATS=[
['Productivity','productivity',[
 ['To-Do List','list'],['Project Idea Board','board'],
 ['Project Planning','plan',['Milestone','Owner','Due','Done']],
 ['Project Notes','notes'],
 ['Project Analysis','prompts',['Objective','What is going well','Risks & blockers','Resources needed','Next steps']],
 ['Goals','table',['Goal','Why it matters','Deadline','Status']],
 ['Goal Planner','plan',['Step','Resources','Due','Done']],
 ['Goal Progress','table',['Goal','Milestone','% Complete','Date']],
 ['Task Tracker','table',['Task','Priority','Due','Done']],
 ['Idea Sketch','sketch'],
 ['Semester Overview','table',['Course','Instructor','Credits','Days / Time','Room']],
 ['Class Overview','prompts',['Class name','Instructor & contact','Meeting times','Grading breakdown','Required materials','Important dates']],
 ['Grade Tracker','table',['Course','Assignment / Exam','Weight %','Score','Grade']],
 ['Assignment Tracker','table',['Course','Assignment','Due','Done']],
 ['Important Concepts','table',['Concept','Definition','Example / Notes']],
 ['Meeting Planner','prompts',['Date & time','Attendees','Agenda','Notes','Action items','Follow-up date']]
]],
['Lifestyle','lifestyle',[
 ['Cleaning Schedule','table',['Task','Daily','Weekly','Monthly','Last done']],
 ['Meal Planner','table',['Day','Breakfast','Lunch','Dinner','Snacks'],7],
 ['Grocery List','list'],
 ['Meal Ideas','table',['Meal','Ingredients','Prep time','Notes']],
 ['Kitchen Inventory','table',['Item','Qty','Location','Expires']],
 ['Password Tracker','table',['Website / App','Username','Hint (not the password!)','Updated'],'pw'],
 ['Brain Dump','notes'],
 ['Travel Research','table',['Place','Things to do','Cost','Notes']],
 ['Trip Information','prompts',['Destination','Dates','Flights / transport','Where I am staying','Confirmation numbers','Budget','Packing notes']],
 ['Travel Vision Board','board'],
 ['Itinerary','table',['Day / Date','Time','Activity','Address','Booked']],
 ['Movies/Shows To Watch','list'],
 ['Movie/Show Review','prompts',['Title','Where I watched it','Rating (1-5)','What I loved','What I did not love','Favorite moment']],
 ['Books To Read','list'],
 ['Book Log','table',['Title','Author','Started','Finished','Rating']],
 ['Book Review','prompts',['Title & author','Rating (1-5)','Summary','Favorite quotes (your own notes)','Would I recommend it?']]
]],
['Health & Wellness','health-wellness',[
 ['Fitness Goals','table',['Goal','Target','Deadline','Status']],
 ['Fitness Goal Review','prompts',['What I achieved','What got in the way','What I will change','Next goal']],
 ['Daily Fitness','plan',['Exercise','Sets / Reps','Time','Done']],
 ['Weekly Fitness','table',['Day','Workout','Duration','Notes','Done'],7],
 ['Workout Log','table',['Date','Exercise','Sets x Reps','Weight','Notes']],
 ['Running Log','table',['Date','Distance','Time','Pace','Feel']],
 ['Weight Tracker','table',['Date','Weight','Notes']],
 ['Transformation','prompts',['Start date','Starting point','Measurements (optional)','Progress notes','Where I am now']],
 ['Water Tracker','month',['Cups'],'num',1],
 ['Step Tracker','month',['Steps'],'num',1],
 ['Health Log','table',['Date','How I felt','Symptoms / notes','Follow-up']],
 ['Nutrition Log','table',['Date','Meal','What I ate','Notes']],
 ['Vitamin/Supplement Tracker','month',['Vitamin 1','Vitamin 2','Vitamin 3','Vitamin 4'],'check'],
 ['Medication Tracker','month',['Medication 1','Medication 2','Medication 3'],'check'],
 ['Calorie Tracker','table',['Date','Meal','Item','Calories']],
 ['Doctor Visits','table',['Date','Doctor / clinic','Reason','Notes','Next visit']]
]],
['Self-Care','self-care',[
 ['Habit Tracker','month',['Habit 1','Habit 2','Habit 3','Habit 4','Habit 5','Habit 6','Habit 7','Habit 8'],'check'],
 ['Mood Tracker','month',['Mood'],'mood',1],
 ['Period Tracker','month',['Flow','Symptoms'],'check'],
 ['Sleep Tracker','table',['Date','Bedtime','Wake up','Hours','Quality (1-5)']],
 ['Vision Board','board'],
 ['Skin Care Routine','table',['Step','AM','PM','Product']],
 ['Self Care Goals','table',['Goal','Why','Deadline','Status']],
 ['Self Care Routine','prompts',['Morning routine','Midday reset','Evening routine','Weekly treat','Monthly treat']],
 ['Gratitude Journal','prompts',['Date','I am grateful for...','Something that made me smile','A small win']],
 ['Mental Health Journal','prompts',['Date','How am I feeling right now?','What is on my mind?','What do I need today?','One kind thing I can do for myself']],
 ['Daily Routines','table',['Time','Routine','Done'],'done'],
 ['Growth Assessment','prompts',['Where I am now','Where I want to be','What is holding me back','What is helping me grow','Next small step']],
 ['Mental Health Goals','table',['Goal','Why','Support / tools','Status']],
 ['Therapy Notes','prompts',['Date','What we talked about','What stuck with me','Things to try','Questions for next time']],
 ['Meltdown Triggers','table',['Date','Trigger','What happened','What helped']],
 ['Wheel of Life','wheel']
]]
];
const TPL={};
CATS.forEach(([cn,cs,items])=>items.forEach(it=>{TPL[slug(it[0])]={name:it[0],type:it[1],a:it[2],b:it[3],c:it[4],cat:cn,cs}}));

/* ---------- pages ---------- */
const R={};

R.home=()=>{
  const t=today(),ts=ymd(t);
  const ym=`${t.getFullYear()}-${pad(t.getMonth()+1)}`;
  const mlist=y=>MS.map((m,i)=>pill(`#/month/${y}-${pad(i+1)}`,m)).join('');
  return head('2026-2027 Planner')+
  `<div class="qlinks">
    <a class="q" href="#/day/${ts}"><b>☀</b>Today</a>
    <a class="q" href="#/week/${ymd(sow(t))}"><b>▦</b>This Week</a>
    <a class="q" href="#/month/${ym}"><b>▤</b>This Month</a>
    <a class="q" href="#/year/2026"><b>2026</b>Year</a>
    <a class="q" href="#/year/2027"><b>2027</b>Year</a>
    <a class="q" href="#/notes"><b>✎</b>Notes</a>
  </div>
  <div class="grid g2">
   ${sec('2026 Months',`<div class="acts" style="padding:6px">${mlist(2026)}</div><div class="acts" style="padding:0 6px 8px">${pill('#/weeks/2026','All 2026 weeks','t')}</div>`)}
   ${sec('2027 Months',`<div class="acts" style="padding:6px">${mlist(2027)}</div><div class="acts" style="padding:0 6px 8px">${pill('#/weeks/2027','All 2027 weeks','t')}</div>`)}
  </div><br>
  <div class="grid g4">${CATS.map(([n,s,items])=>sec(n,`<ul class="tlist">${items.slice(0,6).map(i=>`<li><a href="#/t/${slug(i[0])}">${i[0]}</a></li>`).join('')}<li><a href="#/cat/${s}"><b>See all ${items.length} →</b></a></li></ul>`)).join('')}</div>`;
};

R.cat=(s)=>{
  const c=CATS.find(x=>x[1]===s)||CATS[0];
  return head(c[0],pill('#/templates','All templates','t'))+
  `<div class="grid g3">${c[2].map(i=>`<a class="q" href="#/t/${slug(i[0])}">${i[0]}</a>`).join('')}</div>`;
};
R.templates=()=>head('Templates',`<span class="note">${Object.keys(TPL).length} pages</span>`)+
  `<div class="grid g4">${CATS.map(([n,s,items])=>sec(`${n} (${items.length})`,`<ul class="tlist">${items.map(i=>`<li><a href="#/t/${slug(i[0])}">${i[0]}</a></li>`).join('')}</ul>`)).join('')}</div>`;

R.notes=()=>head('Notes',pill('#/templates','Templates','t'))+
  `<div class="grid g4">${Array.from({length:30},(_,i)=>`<a class="q" href="#/note/${i+1}"><b>${i+1}</b>Note page</a>`).join('')}</div>`;
R.note=(n)=>{
  n=+n||1;
  return head('Note '+n,pill('#/note/'+Math.max(1,n-1),'‹ Prev')+pill('#/note/'+Math.min(30,n+1),'Next ›')+pill('#/notes','All notes','t'))+
  sec('Title',inp('note.'+n+'.title','Title'))+sec('Notes',area('note.'+n+'.body',24));
};

R.year=(y)=>{
  y=+y||2026;
  const t=today();
  const minis=Array.from({length:12},(_,m)=>{
    const ws=weeksOf(y,m);
    return `<div class="card" style="padding:8px"><a class="mt" href="#/month/${y}-${pad(m+1)}">${MONTHS[m]}</a><table class="mini"><tr>${dayOrder().map(d=>`<th>${WDN[d][0]}</th>`).join('')}</tr>${ws.map(w=>'<tr>'+w.map(d=>d?`<td class="${sameDay(d,t)?'today':''}"><a href="#/day/${ymd(d)}">${d.getDate()}</a></td>`:'<td></td>').join('')+'</tr>').join('')}</table></div>`;
  }).join('');
  const q=[1,2,3,4].map(i=>sec('Quarter '+i,lines(`y.${y}.q${i}`,4,'Goal / focus')+`<div class="acts" style="padding:6px 0">${[0,1,2].map(j=>pill(`#/month/${y}-${pad((i-1)*3+j+1)}`,MS[(i-1)*3+j])).join('')}</div>`)).join('');
  return head('Year '+y,pill('#/year/2026','2026',y===2026?'on':'')+pill('#/year/2027','2027',y===2027?'on':'')+pill('#/weeks/'+y,'Weeks','t'))+
  `<div class="grid g4">${minis}</div><br>
  <div class="grid g2">
   ${sec('Yearly Goals',todo(`y.${y}.goal`,8))}
   ${sec('Key Dates',table(`y.${y}.key`,['Date','Event'],8))}
  </div><br><div class="grid g4">${q}</div><br>
  <div class="grid g2">${sec('Yearly Reflection',['Biggest wins','What I learned','What I want more of','What I want less of'].map((p,i)=>`<label class="note">${p}</label>`+area(`y.${y}.ref${i}`,3)).join(''))}
  ${sec('Yearly Finance Overview',table(`y.${y}.fin`,['Category','Goal','Actual'],8))}</div>`;
};

R.month=(ym)=>{
  const [y,m0]=(ym||'2026-10').split('-').map(Number);const m=m0-1;
  const t=today();const days=new Date(y,m+1,0).getDate();
  const prev=new Date(y,m-1,1),next=new Date(y,m+1,1);
  const ws=weeksOf(y,m);
  const cal=`<div class="scroll"><table class="cal"><tr><th></th>${dayOrder().map(d=>`<th>${WDN[d].slice(0,3)}</th>`).join('')}</tr>${ws.map(w=>{
    const first=w.find(d=>d);
    return `<tr><td class="wk"><a href="#/week/${ymd(sow(first))}">W</a></td>`+w.map(d=>d?`<td class="${sameDay(d,t)?'today':''}"><a class="dn" href="#/day/${ymd(d)}">${d.getDate()}</a>${inp('m.'+ymd(d))}</td>`:'<td class="off"></td>').join('')+'</tr>';
  }).join('')}</table></div>`;
  const p='m.'+ym;
  return head(MONTHS[m]+' '+y,pill(`#/month/${prev.getFullYear()}-${pad(prev.getMonth()+1)}`,'‹ Prev')+pill(`#/month/${next.getFullYear()}-${pad(next.getMonth()+1)}`,'Next ›')+pill('#/year/'+y,'Year','t'))+
  monthTabs(y,m)+
  `<section class="card"><h3>${MONTHS[m]} ${y}</h3>${cal}</section>
  <div class="grid g3">
   ${sec('Month Focus',area(p+'.focus',3,'What matters most this month?'))}
   ${sec('Priorities',nums(p+'.pri',3))}
   ${sec('To Do',todo(p+'.todo',8))}
  </div><br>
  <section class="card"><h3>Habit Tracker</h3>${grid(p+'.hab',6,days,'check',['Move','Read','Water','Sleep 8h','Journal','Self-care'])}</section>
  <div class="grid g3">
   ${sec('Monthly Reflection',['Wins','Challenges','Lessons'].map((x,i)=>`<label class="note">${x}</label>`+area(`${p}.ref${i}`,2)).join(''))}
   ${sec('Monthly Finance',table(p+'.fin',['Item','Planned','Actual'],6))}
   ${sec('Notes',area(p+'.notes',9))}
  </div>`;
};

R.weeks=(y)=>{
  y=+y||2026;
  let d=sow(new Date(y,0,1));const out=[];
  while(d.getFullYear()<=y){
    if(addD(d,6).getFullYear()>=y)out.push(pill('#/week/'+ymd(d),`${fmt(d)} – ${fmt(addD(d,6))}`));
    d=addD(d,7);
  }
  return head('Weeks '+y,pill('#/weeks/2026','2026',y===2026?'on':'')+pill('#/weeks/2027','2027',y===2027?'on':'')+pill('#/year/'+y,'Year','t'))+
  `<div class="acts">${out.join('')}</div>`;
};

R.week=(s)=>{
  const st=sow(s?pd(s):today());const ss=ymd(st);const en=addD(st,6);
  const p='w.'+ss;
  const boxes=dayOrder().map((_,i)=>{
    const d=addD(st,i);
    return sec(`<a style="color:#fff" href="#/day/${ymd(d)}">${WDN[d.getDay()]} ${d.getDate()}</a>`,chk('w.'+ymd(d)+'.done')+lines('w.'+ymd(d),4));
  }).join('');
  return head(`Week · ${fmt(st)} – ${fmt(en)}`,pill('#/week/'+ymd(addD(st,-7)),'‹ Prev')+pill('#/week/'+ymd(addD(st,7)),'Next ›')+pill('#/weeks/'+st.getFullYear(),'All weeks','t')+pill(`#/month/${en.getFullYear()}-${pad(en.getMonth()+1)}`,'Monthly','t'))+
  monthTabs(st.getFullYear(),st.getMonth())+
  `<div class="grid g3" style="align-items:start">
   <div>${boxes.split('</section>').slice(0,-1).filter((_,i)=>i%2===0).map(x=>x+'</section>').join('<div style="height:12px"></div>')}</div>
   <div>${boxes.split('</section>').slice(0,-1).filter((_,i)=>i%2===1).map(x=>x+'</section>').join('<div style="height:12px"></div>')}</div>
   <div>
    ${sec('This Week’s Focus',area(p+'.focus',3))}
    <div style="height:12px"></div>${sec('Weekly Priorities',nums(p+'.pri',3))}
    <div style="height:12px"></div>${sec('To Do',todo(p+'.todo',7))}
   </div>
  </div><br>
  <section class="card"><h3>Habit Tracker</h3><div class="scroll"><table class="gr"><tr><th></th>${dayOrder().map(d=>`<th>${WDN[d][0]}</th>`).join('')}</tr>${['Workout','Read 20 min','Water 8 cups','Sleep 8 hrs','Journal'].map((h,i)=>`<tr><td>${inp(`${p}.hn${i}`,'',h)}</td>${dayOrder().map((_,j)=>`<td>${chk(`${p}.h${i}.${j}`)}</td>`).join('')}</tr>`).join('')}</table></div></section>
  <div class="grid g2">${sec('Notes',area(p+'.notes',6))}${sec('Wins This Week',lines(p+'.wins',3))}</div>`;
};

R.day=(s)=>{
  const d=s?pd(s):today();const ds=ymd(d);const p='d.'+ds;
  const sch=Array.from({length:19},(_,i)=>{const h=i+5;const lab=(h%12||12)+(h<12?' AM':' PM');return `<div class="row"><span class="h">${lab}</span>${inp(`${p}.s${h}`)}</div>`}).join('');
  const moods=[['😞','Low'],['😕','Meh'],['😐','Okay'],['🙂','Good'],['😄','Great']].map(([e,l])=>`<label><span class="e">${e}</span><input type="radio" name="${p}.mood" data-k="${p}.mood" value="${l}">${l}</label>`).join('');
  const hyd=Array.from({length:8},(_,i)=>chk(`${p}.hy${i}`)).join('');
  return head(`${WDN[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`,
    pill('#/day/'+ymd(addD(d,-1)),'‹ Prev')+pill('#/day/'+ymd(addD(d,1)),'Next ›')+pill('#/week/'+ymd(sow(d)),'Weekly','t')+pill(`#/month/${d.getFullYear()}-${pad(d.getMonth()+1)}`,'Monthly','t'))+
  `<div class="tabs">${dayPills(d)}</div>
  <div class="grid g3" style="align-items:start">
   <div>${sec('Schedule',sch,'sch')}</div>
   <div>
    ${sec('Today’s Focus',area(p+'.focus',3))}<div style="height:12px"></div>
    ${sec('Priorities',nums(p+'.pri',3))}<div style="height:12px"></div>
    ${sec('To Do',todo(p+'.todo',9))}<div style="height:12px"></div>
    ${sec('Top 3 Wins',nums(p+'.win',3))}
   </div>
   <div>
    ${sec('Meals',['B','L','D','S'].map((x,i)=>`<div class="row"><label class="t">${['Breakfast','Lunch','Dinner','Snack'][i]}</label>${inp(`${p}.meal${i}`)}</div>`).join(''))}<div style="height:12px"></div>
    ${sec('Hydration',`<div class="hyd">${hyd}</div>`)}<div style="height:12px"></div>
    ${sec('Sleep',`<div class="row"><label class="t">Woke</label><input class="ln" type="time" data-k="${p}.wake"></div><div class="row"><label class="t">Hours</label><input class="nm" inputmode="decimal" data-k="${p}.hrs"></div>`)}<div style="height:12px"></div>
    ${sec('Mood',`<div class="mood">${moods}</div>`)}<div style="height:12px"></div>
    ${sec('Grateful For',nums(p+'.grat',3))}<div style="height:12px"></div>
    ${sec('Notes',area(p+'.notes',6))}
   </div>
  </div>`;
};

/* template pages */
R.t=(s)=>{
  const T=TPL[s];if(!T)return head('Not found')+'<p>That page does not exist.</p>';
  const p='t.'+s;
  const nav=pill('#/cat/'+T.cs,T.cat,'t')+pill('#/templates','All templates');
  let body='';
  switch(T.type){
   case 'list':body=`<div class="grid g2">${sec('Date / List name',inp(p+'.title','Name or date'))}${sec('Notes',area(p+'.notes',3))}</div><br>`+sec(T.name,todo(p,24));break;
   case 'notes':body=sec('Date / Title',inp(p+'.title','Title'))+sec('Notes',area(p+'.body',26));break;
   case 'board':body=`<div class="grid g3">${Array.from({length:6},(_,i)=>sec('Idea '+(i+1),inp(p+'.h'+i,'Title')+area(p+'.b'+i,6))).join('')}</div>`;break;
   case 'plan':body=`<div class="grid g2">${sec('Focus',area(p+'.focus',2))}${sec('Priorities',nums(p+'.pri',3))}</div><br>`+sec(T.name,table(p,T.a,12))+sec('Notes',area(p+'.notes',5));break;
   case 'table':
     body=(T.b==='pw'?'<div class="warn"><b>Heads up:</b> this planner saves on your device and is not encrypted. Write reminders or hints only, never real passwords.</div>':'')+
          sec(T.name,table(p,T.a,typeof T.b==='number'?T.b:(T.b==='done'?14:16)))+sec('Notes',area(p+'.notes',4));break;
   case 'prompts':body=`<div class="grid g2">${T.a.map((x,i)=>sec(x,area(`${p}.${i}`,x.length<24?2:5))).join('')}</div>`;break;
   case 'sketch':body=`<div class="tools"><span class="sw on" data-c="#3A2A31" style="background:#3A2A31"></span><span class="sw" data-c="#B4536F" style="background:#B4536F"></span><span class="sw" data-c="#177A7C" style="background:#177A7C"></span><button class="btn g" data-eraser>Eraser</button><button class="btn p" data-clear>Clear</button></div><canvas class="sk" width="1100" height="720" data-sketch="${p}"></canvas><p class="note">Draw with your finger or Apple Pencil. It saves automatically on this device.</p>`;break;
   case 'wheel':body=`<div class="wheelwrap"><svg viewBox="0 0 360 360" data-wheel="${p}"></svg><div>${['Career','Finances','Health','Family','Friends','Fun','Growth','Environment'].map((n,i)=>`<div class="sl"><span>${inp(p+'.n'+i,'',n)}</span><input type="range" min="1" max="10" value="5" data-k="${p}.v${i}" data-w="${i}"><b>5</b></div>`).join('')}<p class="note">Rate each area 1–10 and watch your wheel take shape.</p></div></div>`;break;
   case 'month':{
     const cur=S.get(p+'.sel')||(()=>{const t=today();return `${t.getFullYear()}-${pad(t.getMonth()+1)}`})();
     const opts=[];for(const y of [2026,2027])for(let m=0;m<12;m++){const v=`${y}-${pad(m+1)}`;opts.push(`<option value="${v}" ${v===cur?'selected':''}>${MONTHS[m]} ${y}</option>`)}
     const [cy,cm]=cur.split('-').map(Number);
     const days=new Date(cy,cm,0).getDate();
     body=`<div class="tools"><select data-mt="${p}.sel">${opts.join('')}</select></div>`+sec(T.name,grid(`${p}.${cur}`,T.a.length,days,T.b,T.a))+(T.b==='mood'?'<p class="note">Tap a day to cycle through moods: 😞 😕 😐 🙂 😄</p>':'');
     break;}
  }
  return head(T.name,nav)+body;
};

R.settings=()=>head('Settings')+
 `<div class="grid g2">
  ${sec('Look',`<div class="tools"><button class="btn ${cfg.theme==='rose'?'p':'g'}" data-theme="rose">Rose first</button><button class="btn ${cfg.theme==='teal'?'':'g'}" data-theme="teal">Teal first</button></div><p class="note">Both themes use rose pink and teal, just with a different lead color.</p>`)}
  ${sec('Week starts on',`<div class="tools"><button class="btn ${cfg.ws===1?'p':'g'}" data-ws="1">Monday</button><button class="btn ${cfg.ws===0?'p':'g'}" data-ws="0">Sunday</button></div>`)}
  ${sec('Backup & move devices',`<p class="note">Your entries live on this device. To move them to your iPhone (or back up), export a file here and import it on the other device.</p><div class="tools"><button class="btn" data-export>Export backup</button><label class="btn g" style="cursor:pointer">Import backup<input type="file" accept="application/json" data-import hidden></label></div>`)}
  ${sec('Install like an app',`<p class="note"><b>iPhone:</b> open the link in Safari → Share → Add to Home Screen.<br><b>Mac:</b> Safari → File → Add to Dock, or Chrome/Edge → Install icon in the address bar.<br><b>Windows:</b> Edge/Chrome → Install icon in the address bar.</p>`)}
  ${sec('Danger zone',`<button class="btn p" data-reset>Erase everything on this device</button>`)}
 </div>`;

/* ---------- binding ---------- */
function bind(root){
  root.querySelectorAll('[data-k]').forEach(el=>{
    const k=el.dataset.k;const v=S.get(k);
    if(el.type==='checkbox'){el.checked=v==='1';el.onchange=()=>S.set(k,el.checked?'1':'')}
    else if(el.type==='radio'){el.checked=v===el.value;el.onclick=()=>{if(S.get(k)===el.value){el.checked=false;S.set(k,'')}else S.set(k,el.value)}}
    else{
      if(v!==null)el.value=v;else if(el.dataset.def)el.value=el.dataset.def;
      el.oninput=()=>S.set(k,el.value);
    }
  });
  root.querySelectorAll('[data-cy]').forEach(b=>{
    const k=b.dataset.cy,o=b.dataset.opts.split('|');
    const show=()=>{b.textContent=S.get(k)||'·'};show();
    b.onclick=()=>{const c=S.get(k);const i=o.indexOf(c);const n=i+1>=o.length?'':o[i+1];S.set(k,n);show()};
  });
  root.querySelectorAll('select[data-mt]').forEach(s=>s.onchange=()=>{S.set(s.dataset.mt,s.value);route()});
  root.querySelectorAll('[data-theme]').forEach(b=>b.onclick=()=>{S.set('cfg.theme',b.dataset.theme);location.reload()});
  root.querySelectorAll('[data-ws]').forEach(b=>b.onclick=()=>{S.set('cfg.ws',b.dataset.ws);location.reload()});
  root.querySelectorAll('[data-export]').forEach(b=>b.onclick=()=>{
    const o={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k.startsWith('pl:'))o[k]=localStorage.getItem(k)}
    const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(o)],{type:'application/json'}));a.download='planner-backup-'+ymd(today())+'.json';a.click();
  });
  root.querySelectorAll('[data-import]').forEach(f=>f.onchange=()=>{
    const r=new FileReader();r.onload=()=>{try{const o=JSON.parse(r.result);Object.keys(o).forEach(k=>k.startsWith('pl:')&&localStorage.setItem(k,o[k]));alert('Backup imported.');location.reload()}catch(e){alert('That file could not be read.')}};
    r.readAsText(f.files[0]);
  });
  root.querySelectorAll('[data-reset]').forEach(b=>b.onclick=()=>{if(confirm('Erase all planner entries on this device? This cannot be undone.')){Object.keys(localStorage).filter(k=>k.startsWith('pl:')).forEach(k=>localStorage.removeItem(k));location.reload()}});
  root.querySelectorAll('canvas[data-sketch]').forEach(sketch);
  root.querySelectorAll('svg[data-wheel]').forEach(wheel);
}

function sketch(cv){
  const key=cv.dataset.sketch+'.img',ctx=cv.getContext('2d');
  ctx.fillStyle='#fff';ctx.fillRect(0,0,cv.width,cv.height);
  const saved=S.get(key);if(saved){const im=new Image();im.onload=()=>ctx.drawImage(im,0,0);im.src=saved}
  let color='#3A2A31',erase=false,down=false,last=null;
  const pos=e=>{const r=cv.getBoundingClientRect();return [(e.clientX-r.left)*cv.width/r.width,(e.clientY-r.top)*cv.height/r.height]};
  cv.onpointerdown=e=>{down=true;last=pos(e);cv.setPointerCapture(e.pointerId);e.preventDefault()};
  cv.onpointermove=e=>{if(!down)return;const p=pos(e);ctx.strokeStyle=erase?'#fff':color;ctx.lineWidth=erase?26:(e.pointerType==='pen'?1+e.pressure*5:3);ctx.lineCap='round';ctx.beginPath();ctx.moveTo(...last);ctx.lineTo(...p);ctx.stroke();last=p};
  const up=()=>{if(!down)return;down=false;try{S.set(key,cv.toDataURL('image/png'))}catch(e){}};
  cv.onpointerup=up;cv.onpointercancel=up;
  const root=cv.parentElement;
  root.querySelectorAll('.sw').forEach(s=>s.onclick=()=>{color=s.dataset.c;erase=false;root.querySelectorAll('.sw').forEach(x=>x.classList.remove('on'));s.classList.add('on')});
  root.querySelector('[data-eraser]').onclick=()=>{erase=!erase};
  root.querySelector('[data-clear]').onclick=()=>{if(confirm('Clear this sketch?')){ctx.fillStyle='#fff';ctx.fillRect(0,0,cv.width,cv.height);S.set(key,'')}};
}

function wheel(svg){
  const p=svg.dataset.wheel;const root=svg.parentElement;
  const sl=[...root.querySelectorAll('input[data-w]')];
  const names=()=>sl.map((_,i)=>S.get(`${p}.n${i}`)||['Career','Finances','Health','Family','Friends','Fun','Growth','Environment'][i]);
  const draw=()=>{
    const n=sl.length,c=180,R0=120;const nm=names();
    let h='';
    for(let r=2;r<=10;r+=2){h+=`<polygon points="${sl.map((_,i)=>{const a=-Math.PI/2+i*2*Math.PI/n;return `${c+Math.cos(a)*R0*r/10},${c+Math.sin(a)*R0*r/10}`}).join(' ')}" fill="none" stroke="#EBD9DF"/>`}
    sl.forEach((_,i)=>{const a=-Math.PI/2+i*2*Math.PI/n;h+=`<line x1="${c}" y1="${c}" x2="${c+Math.cos(a)*R0}" y2="${c+Math.sin(a)*R0}" stroke="#EBD9DF"/><text x="${c+Math.cos(a)*(R0+22)}" y="${c+Math.sin(a)*(R0+22)+4}" font-size="11" text-anchor="middle" fill="#8F3B55" font-family="sans-serif">${esc(nm[i])}</text>`});
    h+=`<polygon points="${sl.map((s,i)=>{const a=-Math.PI/2+i*2*Math.PI/n;const v=+s.value;return `${c+Math.cos(a)*R0*v/10},${c+Math.sin(a)*R0*v/10}`}).join(' ')}" fill="#B4536F55" stroke="#B4536F" stroke-width="2"/>`;
    sl.forEach((s,i)=>{const a=-Math.PI/2+i*2*Math.PI/n;const v=+s.value;h+=`<circle cx="${c+Math.cos(a)*R0*v/10}" cy="${c+Math.sin(a)*R0*v/10}" r="4" fill="#177A7C"/>`});
    svg.innerHTML=h;
    sl.forEach(s=>s.nextElementSibling.textContent=s.value);
  };
  sl.forEach(s=>s.addEventListener('input',draw));
  root.querySelectorAll('input.ln').forEach(i=>i.addEventListener('input',draw));
  draw();
}

/* ---------- router ---------- */
function route(){
  const h=location.hash.replace(/^#\/?/,'')||'home';
  const [a,...rest]=h.split('/');const b=rest.join('/');
  const app=document.getElementById('app');
  let html;
  try{html=(R[a]||R.home)(b)}catch(e){html=head('Oops')+`<p>Something went wrong: ${esc(e.message)}</p><p><a href="#/home">Back home</a></p>`}
  app.innerHTML=html;
  bind(app);
  const nav=a==='cat'?b:(a==='t'&&TPL[b]?TPL[b].cs:(a==='note'?'notes':a));
  document.querySelectorAll('#nav a[data-n]').forEach(x=>x.classList.toggle('on',x.dataset.n===nav||(a==='home'&&x.dataset.n==='home')));
  window.scrollTo(0,0);
}
document.getElementById('todayBtn').onclick=e=>{e.preventDefault();location.hash='#/day/'+ymd(today())};
window.addEventListener('hashchange',route);
route();
if('serviceWorker' in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('sw.js').catch(()=>{});
})();
