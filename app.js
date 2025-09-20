// Fitness Tracker v15.7 — Day3 yellow, anchored phase weeks, mini celebrations
(function(){
  const VERSION = '15.7';
  const pad = n => String(n).padStart(2,'0');
  const iso = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const round5 = n => Math.round(n/5)*5;
  const fmtDow = d => d.toLocaleDateString(undefined,{weekday:'short'}).toUpperCase();

  if(localStorage.getItem('appVersion') !== VERSION){
    localStorage.setItem('appVersion', VERSION);
  }

  // ------- State -------
  let phase = parseInt(localStorage.getItem('phase')||'1');
  let oneRepMax = JSON.parse(localStorage.getItem('oneRepMax')||'{"Back Squat":110,"Deadlift":180,"Front Squat":95}');
  let ormHistory = JSON.parse(localStorage.getItem('ormHistory')||'{}');
  ["Back Squat","Deadlift","Front Squat"].forEach(ex=>{ if(!ormHistory[ex]) ormHistory[ex]=[oneRepMax[ex]]; });
  let data = JSON.parse(localStorage.getItem('fitnessData')||'{"completed":[],"schedule":[]}');
  let accessoryLogs = JSON.parse(localStorage.getItem('accessoryLogs')||'{}');
  let extraWorkouts = JSON.parse(localStorage.getItem('extraWorkouts')||'{}');
  let amapLogs = JSON.parse(localStorage.getItem('amapLogs')||'{}');
  let moodLogs = JSON.parse(localStorage.getItem('moodLogs')||'{}');
  let goals = JSON.parse(localStorage.getItem('goals')||'[]');

  function save(){
    localStorage.setItem('phase', String(phase));
    localStorage.setItem('oneRepMax', JSON.stringify(oneRepMax));
    localStorage.setItem('ormHistory', JSON.stringify(ormHistory));
    localStorage.setItem('fitnessData', JSON.stringify(data));
    localStorage.setItem('accessoryLogs', JSON.stringify(accessoryLogs));
    localStorage.setItem('extraWorkouts', JSON.stringify(extraWorkouts));
    localStorage.setItem('amapLogs', JSON.stringify(amapLogs));
    localStorage.setItem('moodLogs', JSON.stringify(moodLogs));
    localStorage.setItem('goals', JSON.stringify(goals));
    localStorage.setItem('appVersion', VERSION);
  }

  // ------- Program -------
  const programDays = {
    1: {
      main: [
        { name: "Back Squat", key: "Back Squat", scheme: "percent" },
        { name: "RDL", key: "RDL", scheme: "fixed", weeks: {
          1: {weight:"60", reps:5, sets:4},
          2: {weight:"60", reps:8, sets:4},
          3: {weight:"60", reps:10, sets:4},
          4: {weight:"60", reps:10, sets:4}
        }}
      ],
      accessories: [
        { name: "KB Single-Arm Row", key: "KB SA Row", sets: 3, reps: 8 },
        { name: "Skull Crushers", key: "Skull Crushers", sets: 3, reps: 10 },
        { name: "Single-Arm Overhead Press", key: "SA Overhead Press", sets: 3, reps: 10 }
      ]
    },
    2: {
      main: [
        { name: "Deadlift", key: "Deadlift", scheme: "percent" },
        { name: "Goblet Squat", key: "Goblet Squat", scheme: "fixed", weeks: {
          1: {weight:"40", reps:6, sets:4},
          2: {weight:"40", reps:8, sets:4},
          3: {weight:"40", reps:10, sets:4},
          4: {weight:"30-40", reps:10, sets:4}
        }}
      ],
      accessories: [
        { name: "Rows", key: "Rows", sets: 3, reps: 10 },
        { name: "Hammer Curls", key: "Hammer Curls", sets: 3, reps: 10 },
        { name: "Barbell Overhead Press", key: "Barbell Overhead Press", sets: 3, reps: 8 },
        { name: "Side Lunges (Weighted)", key: "Side Lunges", sets: 3, reps: 10 }
      ]
    },
    3: {
      main: [
        { name: "Front Squat", key: "Front Squat", scheme: "percent" },
        { name: "BFESS", key: "BFESS", scheme: "fixed", weeks: {
          1: {weight:"30", reps:5, sets:4},
          2: {weight:"30", reps:5, sets:4},
          3: {weight:"30", reps:8, sets:4},
          4: {weight:"30", reps:8, sets:4}
        }}
      ],
      accessories: [
        { name: "3-Way Flys", key: "3-Way Flys", sets: 3, reps: 10 },
        { name: "Hammer Curls", key: "Hammer Curls", sets: 3, reps: 10 },
        { name: "Single-Leg RDL", key: "SL RDL", sets: 3, reps: 5 },
        { name: "French Press", key: "French Press", sets: 3, reps: 10 }
      ]
    }
  };
  const percentSchemes = {
    "531": {
      1: [ {p:0.55,r:5}, {p:0.60,r:3}, {p:0.65,r:5}, {p:0.70,r:5}, {p:0.75,r:5}, {p:0.80,r:"AMAP"} ],
      2: [ {p:0.60,r:5}, {p:0.65,r:3}, {p:0.70,r:3}, {p:0.75,r:3}, {p:0.80,r:3}, {p:0.85,r:"AMAP"} ],
      3: [ {p:0.65,r:5}, {p:0.70,r:3}, {p:0.75,r:7}, {p:0.80,r:5}, {p:0.85,r:3}, {p:0.90,r:"AMAP"} ],
      4: [ {p:0.55,r:5}, {p:0.65,r:5}, {p:0.75,r:5} ]
    }
  };
  const liftSchemeMap = { "Back Squat":"531", "Deadlift":"531", "Front Squat":"531" };

  // ------- Schedule -------
  function* scheduleGenerator(startDate, weeks=104){
    for(let k=0;k<weeks;k++){
      const base = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + k*7);
      const d1 = new Date(base); d1.setDate(base.getDate() + (k%2===0 ? 0 : -1)); // Tue then Mon from 2025-09-23
      yield { date: iso(d1), dayIndex: 1, label: "Day 1" };
      const d2 = new Date(base); d2.setDate(base.getDate()+1); // Wed
      yield { date: iso(d2), dayIndex: 2, label: "Day 2" };
      const d3 = new Date(base); d3.setDate(base.getDate()+5); // Sun
      yield { date: iso(d3), dayIndex: 3, label: "Day 3" };
    }
  }
  function buildSchedule(){
    const anchor = new Date(2025,8,23); // Tue 2025-09-23
    const list = [];
    for(const s of scheduleGenerator(anchor, 104)){ list.push(s); }
    data.schedule = list.sort((a,b)=> new Date(a.date)-new Date(b.date));
    save();
  }

  // ------- Phase helpers -------
  function phaseRange(){
    if(!data.schedule.length) buildSchedule();
    const first = new Date(data.schedule[0].date); // Tue 2025-09-23
    const start = new Date(first); start.setDate(start.getDate() + (phase-1)*28); // Tue-based windows
    const end = new Date(start); end.setDate(end.getDate()+27); // inclusive Tue..Mon
    return {start, end};
  }
  function inCurrentPhase(dateStr){
    const d = new Date(dateStr);
    const {start, end} = phaseRange();
    return d>=start && d<=end;
  }
  function phaseWeekIndex(dateStr){
    const {start} = phaseRange();
    const d = new Date(dateStr);
    const diff = Math.floor((d - start)/(1000*60*60*24));
    return Math.max(0, Math.floor(diff/7)); // 0..3 within phase
  }
  function isPhaseWeekComplete(idx){
    const {start} = phaseRange();
    const wkStart = new Date(start); wkStart.setDate(start.getDate() + idx*7);
    const wkEnd = new Date(wkStart); wkEnd.setDate(wkStart.getDate()+6);
    const inside = s=>{ const d=new Date(s.date); return d>=wkStart && d<=wkEnd; };
    const d1 = data.schedule.find(s=> s.label==='Day 1' && inside(s));
    const d2 = data.schedule.find(s=> s.label==='Day 2' && inside(s));
    const d3 = data.schedule.find(s=> s.label==='Day 3' && inside(s));
    return (!!d1 && data.completed.includes(d1.date)) &&
           (!!d2 && data.completed.includes(d2.date)) &&
           (!!d3 && data.completed.includes(d3.date));
  }

  // ------- UI helpers -------
  const $ = sel => document.querySelector(sel);
  function hideAll(){
    ['#calendar-view','#workout-view','#stats-view','#goals-view'].forEach(id=> $(id).classList.add('hidden'));
  }
  function toCalendar(){ hideAll(); $('#calendar-view').classList.remove('hidden'); document.body.classList.remove('theme-d1','theme-d2','theme-d3','theme-extra'); }
  function toWorkout(){ hideAll(); $('#workout-view').classList.remove('hidden'); }
  function toStats(){ hideAll(); $('#stats-view').classList.remove('hidden'); document.body.classList.remove('theme-d1','theme-d2','theme-d3','theme-extra'); renderStats(); }
  function toGoals(){ hideAll(); $('#goals-view').classList.remove('hidden'); document.body.classList.remove('theme-d1','theme-d2','theme-d3','theme-extra'); renderGoals(); }

  function updatePhaseProgress(){
    $('#phase-num').textContent = String(phase);
    const inPhaseDays = data.schedule.filter(s=>inCurrentPhase(s.date)).length;
    const done = data.completed.filter(inCurrentPhase).length;
    const pct = inPhaseDays ? Math.round((done/inPhaseDays)*100) : 0;
    $('#phase-progress-bar').style.width = pct+'%';
  }

  // ------- Mini Celebrations -------
  function celebrateMini(theme='default'){
    const layer = document.getElementById('celebration-layer');
    layer.classList.remove('hidden');
    const palette = theme==='extra' ? ['💜','✨','⭐'] :
                    theme==='d1' ? ['💙','✨','⭐'] :
                    theme==='d2' ? ['💚','✨','⭐'] :
                    theme==='d3' ? ['💛','✨','⭐'] : ['🎉','✨','⭐'];
    for(let i=0;i<18;i++){
      const el = document.createElement('div');
      el.className = 'confetti';
      el.textContent = palette[i%palette.length];
      el.style.left = Math.random()*100 + 'vw';
      el.style.top = (Math.random()*10) + 'vh';
      el.style.transform = `translateY(0) rotate(${Math.random()*40-20}deg)`;
      el.style.animationDelay = (Math.random()*0.3)+'s';
      layer.appendChild(el);
      setTimeout(()=> el.remove(), 1400);
    }
    setTimeout(()=> layer.classList.add('hidden'), 1400);
  }

  // ------- Workout -------
  function getWeekNumber(dateStr){ return phaseWeekIndex(dateStr)+1; }
  function renderCurrentORM(dayIndex){
    const box = $('#day-hero');
    let ref = '';
    if(dayIndex===1) ref = `Back Squat 1RM: <strong>${oneRepMax["Back Squat"]||'-'} lbs</strong>`;
    if(dayIndex===2) ref = `Deadlift 1RM: <strong>${oneRepMax["Deadlift"]||'-'} lbs</strong>`;
    if(dayIndex===3) ref = `Front Squat 1RM: <strong>${oneRepMax["Front Squat"]||'-'} lbs</strong>`;
    box.querySelector('.hero-orm').innerHTML = ref;
  }
  function openWorkout(dateStr){
    toWorkout();
    const sched = data.schedule.find(s=>s.date===dateStr);
    document.body.classList.remove('theme-d1','theme-d2','theme-d3','theme-extra');
    if(sched.dayIndex===1) document.body.classList.add('theme-d1');
    if(sched.dayIndex===2) document.body.classList.add('theme-d2');
    if(sched.dayIndex===3) document.body.classList.add('theme-d3');

    const weekNum = getWeekNumber(dateStr);
    const header = `Week ${weekNum} • ${sched.label} • ${dateStr}`;
    $('#workout-date-title').textContent = header;
    renderCurrentORM(sched.dayIndex);

    const mainWrap = $('#main-superset'); mainWrap.innerHTML='';
    const accWrap = $('#accessory-superset'); accWrap.innerHTML='';

    programDays[sched.dayIndex].main.forEach(main=>{
      const card = document.createElement('div'); card.className='exercise-card';
      const title = `<div class="exercise-title">${main.name}</div>`;
      let body = '';
      if(main.scheme==='percent'){
        const scheme = percentSchemes[liftSchemeMap[main.key]][weekNum];
        body += `<div class="exercise-rows">`;
        scheme.forEach(s=>{
          const w = round5((oneRepMax[main.key]||100)*s.p);
          if(String(s.r).toUpperCase()==='AMAP'){
            const v = (amapLogs[dateStr] && amapLogs[dateStr][main.key]) ? amapLogs[dateStr][main.key] : '';
            body += `<div>AMAP @ <strong>${w} lbs</strong> — Reps: <input type="tel" inputmode="numeric" pattern="[0-9]*" class="amap-input" data-date="${dateStr}" data-ex="${main.key}" value="${v}" style="width:100px"></div>`;
          } else {
            body += `<div>${s.r} reps @ <strong>${w} lbs</strong></div>`;
          }
        });
        body += `</div>`;
      } else {
        const wk = main.weeks[weekNum];
        body += `<div class="exercise-rows">${wk.sets}×${wk.reps} @ <strong>${wk.weight} lbs</strong></div>`;
      }
      card.innerHTML = title + body;
      mainWrap.appendChild(card);
    });
    mainWrap.querySelectorAll('.amap-input').forEach(inp=>{
      inp.addEventListener('change', ()=>{
        const date = inp.getAttribute('data-date');
        const ex = inp.getAttribute('data-ex');
        const reps = parseInt(inp.value)||0;
        (amapLogs[date]||(amapLogs[date]={}))[ex] = reps;
        save();
      });
    });

    programDays[sched.dayIndex].accessories.forEach(acc=>{
      const existing = (accessoryLogs[dateStr] && accessoryLogs[dateStr][acc.key]) ? accessoryLogs[dateStr][acc.key] : {};
      const card = document.createElement('div'); card.className='exercise-card';
      card.innerHTML = `<div class="exercise-title">${acc.name}</div>
        <div class="exercise-rows">${acc.sets}×${acc.reps}</div>
        <div class="input-inline">Weight used: <input type="tel" inputmode="numeric" pattern="[0-9]*" class="acc-weight" data-date="${dateStr}" data-ex="${acc.key}" value="${existing.weight||''}" placeholder="lbs"></div>`;
      accWrap.appendChild(card);
    });
    accWrap.querySelectorAll('.acc-weight').forEach(inp=>{
      inp.addEventListener('change', ()=>{
        const date = inp.getAttribute('data-date');
        const ex = inp.getAttribute('data-ex');
        const weight = parseInt(inp.value)||0;
        (accessoryLogs[date]||(accessoryLogs[date]={}))[ex] = {weight};
        save();
      });
    });

    const btn = document.getElementById('complete-workout');
    btn.classList.add('themed-btn');
    btn.onclick = ()=>{
      if(!data.completed.includes(dateStr)) data.completed.push(dateStr);
      save();
      const m = modal(`<h3>How did today feel?</h3>
        <div class="row" style="justify-content:space-around">
          <button class="primary" data-mood="4">😀 Great</button>
          <button class="primary" data-mood="3">🙂 Okay</button>
          <button class="primary" data-mood="2">😐 Tired</button>
          <button class="primary" data-mood="1">😫 Struggled</button>
        </div>`);
      m.querySelectorAll('button.primary').forEach(b=>{
        b.onclick = ()=>{
          const score = parseInt(b.getAttribute('data-mood'));
          ensureMoodArray(dateStr); moodLogs[dateStr].push(score); save(); m.remove();
          // Mini celebration per day theme
          const theme = (sched.dayIndex===1?'d1':sched.dayIndex===2?'d2':'d3');
          celebrateMini(theme);
          toCalendar(); renderMonth(); updateStats(); checkPhaseComplete();
        };
      });
    };
  }

  // ------- Toast & Modal -------
  function toast(msg){ const t=document.createElement('div'); t.className='toast'; t.textContent=msg; document.body.appendChild(t); setTimeout(()=>t.remove(), 1800); }
  function modal(html){
    const m = document.createElement('div'); m.className='modal'; m.innerHTML = `<div class="modal-inner card">${html}</div>`;
    m.addEventListener('click', e=>{ if(e.target===m) m.remove(); });
    document.addEventListener('keydown', function esc(e){ if(e.key==='Escape'){ m.remove(); document.removeEventListener('keydown', esc); } });
    document.body.appendChild(m); return m;
  }

  // ------- Stats helpers -------
  function ensureMoodArray(date){
    const v = moodLogs[date];
    if(v==null){ moodLogs[date] = []; }
    else if(typeof v === 'number'){ moodLogs[date] = [v]; }
    else if(Array.isArray(v)){ /* ok */ }
    else { moodLogs[date] = []; }
  }
  function updateStats(){ try{ renderGlance(); renderStreaks(); renderExtraLists(); renderMoodChart(); renderORMChart(); }catch(e){} }

  // ------- Goals (same as v15.6 full) -------
  function uid(){ return Math.random().toString(36).slice(2); }
  function computeGoalProgress(g){
    if(g.completed) return 1;
    if(g.type==='manual'){ return Math.min(1, (g.progress||0) / Math.max(1,g.target||1)); }
    if(g.type==='1rm'){
      const ex = g.link?.exercise; if(!ex) return 0;
      const current = oneRepMax[ex]||0;
      return Math.min(1, current / Math.max(1,g.target||1));
    }
    if(g.type==='extras_week'){
      const today = iso(new Date());
      const idx = phaseWeekIndex(today);
      const {start} = phaseRange();
      const wkStart = new Date(start); wkStart.setDate(start.getDate() + idx*7);
      const wkEnd = new Date(wkStart); wkEnd.setDate(wkStart.getDate()+6);
      const count = Object.keys(extraWorkouts).filter(date=>{
        const d=new Date(date); return d>=wkStart && d<=wkEnd && inCurrentPhase(date) && (extraWorkouts[date]||[]).length>0;
      }).length;
      return Math.min(1, count / Math.max(1,g.target||1));
    }
    return 0;
  }
  function renderGoals(){
    const list = document.getElementById('goals-list');
    const comp = document.getElementById('goals-completed-list');
    if(!list||!comp) return;
    list.innerHTML=''; comp.innerHTML='';
    goals.forEach(g=>{
      const value = computeGoalProgress(g);
      const deadline = g.deadline ? new Date(g.deadline) : null;
      const daysLeft = deadline ? Math.ceil((deadline - new Date())/(1000*60*60*24)) : null;
      const status = g.completed ? 'Completed' : (daysLeft!=null && daysLeft<0 ? 'Missed' : (value>=1 ? 'Ready to complete' : 'On Track'));
      const card = document.createElement('div'); card.className='goal-card';
      card.innerHTML = `
        <div class="goal-title">${g.title}</div>
        <div class="goal-meta">${g.category}${g.deadline?` • ${daysLeft>=0?daysLeft+" days left":"past due"}`:""} <span class="badge">${status}</span></div>
        <div class="goal-progress"><div style="width:${Math.min(100,Math.round(value*100))}%"></div></div>
        <div class="goal-actions">
          ${g.type==='manual' ? '<button class="primary" data-act="inc">+ Progress</button>' : ''}
          <button class="primary" data-act="edit" style="background:#555">Edit</button>
          <button class="primary" data-act="complete" style="background:#2e7d32">Complete</button>
          <button class="primary" data-act="delete" style="background:#b71c1c">Delete</button>
        </div>`;
      card.querySelectorAll('button').forEach(btn=>{
        btn.onclick = ()=>{
          const act = btn.getAttribute('data-act');
          if(act==='inc'){ g.progress = (g.progress||0)+1; save(); renderGoals(); }
          if(act==='edit'){ showGoalForm(g); }
          if(act==='complete'){ g.completed=true; save(); toast("Goal completed! ✅"); renderGoals(); }
          if(act==='delete'){ goals = goals.filter(x=>x.id!==g.id); save(); renderGoals(); }
        };
      });
      if(g.completed) comp.appendChild(card); else list.appendChild(card);
    });
    if(!list.children.length) list.innerHTML = '<em>No active goals yet.</em>';
    if(!comp.children.length) comp.innerHTML = '<em>No completed goals yet.</em>';
  }
  function showGoalForm(existing){
    const g = existing || {id:uid(), title:'', category:'Strength', type:'manual', target:1, progress:0, deadline:'', createdPhase:phase, completed:false, link:{} };
    const m = modal(`<h3>${existing?'Edit Goal':'Add Goal'}</h3>
      <form id="goal-form">
        <label>Title <input name="title" value="${g.title||''}" required></label>
        <label>Category
          <select name="category">
            ${["Strength","Conditioning","Mobility","Lifestyle","Other"].map(c=>`<option ${g.category===c?'selected':''}>${c}</option>`).join('')}
          </select>
        </label>
        <label>Type
          <select name="type" id="goal-type">
            <option value="manual" ${g.type==='manual'?'selected':''}>Manual (count to target)</option>
            <option value="1rm" ${g.type==='1rm'?'selected':''}>1RM target (auto)</option>
            <option value="extras_week" ${g.type==='extras_week'?'selected':''}>Extras per week (auto)</option>
          </select>
        </label>
        <div id="goal-type-extra"></div>
        <label>Target (number) <input name="target" type="tel" inputmode="numeric" pattern="[0-9]*" value="${g.target||1}"></label>
        <label>Deadline (optional) <input name="deadline" type="date" value="${g.deadline||''}"></label>
        <div class="row right">
          <button type="button" id="cancel" class="primary" style="background:#888">Cancel</button>
          <button type="submit" class="primary">Save</button>
        </div>
      </form>`);
    const extra = m.querySelector('#goal-type-extra');
    function renderExtraFields(){
      const val = m.querySelector('#goal-type').value;
      if(val==='1rm'){
        const ex = g.link?.exercise || 'Deadlift';
        extra.innerHTML = `<label>Exercise
          <select name="exercise">
            ${["Back Squat","Deadlift","Front Squat"].map(k=>`<option ${ex===k?'selected':''}>${k}</option>`).join('')}
          </select>
        </label>`;
      } else if(val==='extras_week'){
        extra.innerHTML = `<p class="goal-meta">Counts extra workouts logged in the current phase week.</p>`;
      } else { extra.innerHTML=''; }
    }
    m.querySelector('#goal-type').onchange = renderExtraFields; renderExtraFields();
    m.querySelector('#cancel').onclick = ()=> m.remove();
    m.querySelector('#goal-form').onsubmit = (e)=>{
      e.preventDefault();
      const fd = new FormData(e.target);
      g.title = fd.get('title'); g.category=fd.get('category'); g.type=fd.get('type');
      g.target = parseInt(fd.get('target'))||1; g.deadline = fd.get('deadline')||''; g.createdPhase = phase;
      if(g.type==='1rm'){ g.link={exercise: fd.get('exercise')}; }
      if(!existing) goals.push(g);
      save(); m.remove(); renderGoals();
    };
  }

  // ------- Stats -------
  function renderGlance(){
    const el = document.getElementById('glance-content'); if(!el) return;
    const today = iso(new Date());
    const idx = phaseWeekIndex(today);
    const {start} = phaseRange();
    const wkStart = new Date(start); wkStart.setDate(start.getDate()+idx*7);
    const wkEnd = new Date(wkStart); wkEnd.setDate(wkStart.getDate()+6);
    const schedThisWeek = data.schedule.filter(x=>{
      const d=new Date(x.date); return d>=wkStart && d<=wkEnd && inCurrentPhase(x.date);
    });
    const completedThisWeek = schedThisWeek.filter(x=> data.completed.includes(x.date)).length;
    const extrasCount = Object.keys(extraWorkouts).filter(date=>{
      const d=new Date(date); return d>=wkStart && d<=wkEnd && inCurrentPhase(date) && (extraWorkouts[date]||[]).length>0;
    }).length;
    el.innerHTML = `<ul>
      <li><strong>Workouts:</strong> ${completedThisWeek}/3</li>
      <li><strong>Extras:</strong> ${extrasCount}</li>
    </ul>`;
  }
  function renderStreaks(){
    const el = document.getElementById('streaks-content'); if(!el) return;
    const weeks = [0,1,2,3].map(idx=>{
      const full = isPhaseWeekComplete(idx);
      const {start} = phaseRange();
      const ws = new Date(start); ws.setDate(start.getDate()+idx*7);
      const we = new Date(ws); we.setDate(ws.getDate()+6);
      const extras = Object.keys(extraWorkouts).some(date=>{
        const d=new Date(date); return d>=ws && d<=we && inCurrentPhase(date) && (extraWorkouts[date]||[]).length>0;
      });
      return {idx, full, extras, key: iso(ws)};
    });
    let best=0,current=0, perfectPlus=0;
    weeks.forEach(w=>{ if(w.full){ current++; best=Math.max(best,current); if(w.extras) perfectPlus++; } else { current=0; } });
    const recent = weeks.map(w=>{
      const label = new Date(w.key).toLocaleDateString(undefined,{month:'short',day:'numeric'});
      const status = w.full ? (w.extras? "Perfect+ ✅" : "Complete ✅") : "Incomplete";
      return `<li>Week of ${label}: ${status}</li>`;
    }).join("");
    el.innerHTML = `<ul>
      <li><strong>🔥 Current Streak (this phase):</strong> ${current} week(s)</li>
      <li><strong>🏁 Best Streak (this phase):</strong> ${best} week(s)</li>
      <li><strong>⭐ Perfect+ Weeks (this phase):</strong> ${perfectPlus}</li>
    </ul>
    <h4>Recent Weeks</h4>
    <ul>${recent || "<li>No data yet.</li>"}</ul>`;
  }
  function renderExtraLists(){
    const all = [];
    Object.keys(extraWorkouts).filter(inCurrentPhase).forEach(date=> (extraWorkouts[date]||[]).forEach(e=> all.push({date,...e})));
    all.sort((a,b)=> a.date<b.date ? 1 : (a.date>b.date?-1:0));
    const mini = document.getElementById('extra-mini');
    mini.innerHTML = all.length ? ('<ul>'+ all.slice(0,3).map(e=>`<li>${e.date} – ${e.type} – ${e.duration||''} min ${e.intensity?('– Int '+e.intensity):''}</li>`).join('') + '</ul>') : '<em>No extras yet.</em>';
    const hist = document.getElementById('extra-history');
    hist.innerHTML = all.length ? ('<ul>'+ all.map(e=>`<li>${e.date} – ${e.type} – ${e.duration||''} min ${e.intensity?('– Int '+e.intensity):''} ${e.notes?('– '+e.notes):''}</li>`).join('') + '</ul>') : '<em>No extra workouts logged yet.</em>';
  }
  function renderORMChart(){
    const canvas = document.getElementById('exercise-chart'); if(!canvas || !window.Chart) return;
    const ctx = canvas.getContext('2d');
    const keys = ["Back Squat","Deadlift","Front Squat"];
    const maxLen = Math.max(...keys.map(k=> (ormHistory[k]||[]).length));
    const labels = Array.from({length:maxLen}, (_,i)=>`Update ${i+1}`);
    const datasets = keys.map((k,i)=>({label:k,data:ormHistory[k]||[],borderColor:`hsl(${i*70},70%,40%)`,fill:false,tension:.2}));
    if(window._chart) window._chart.destroy();
    window._chart = new Chart(ctx,{type:'line',data:{labels,datasets},options:{responsive:true,plugins:{legend:{position:'bottom'}}}});
  }
  function renderMoodChart(){
    const canvas = document.getElementById('mood-chart'); if(!canvas || !window.Chart) return;
    const ctx = canvas.getContext('2d');
    const entries = Object.keys(moodLogs).filter(inCurrentPhase).sort().map(date=>({date,vals:Array.isArray(moodLogs[date])?moodLogs[date]:[moodLogs[date]]}));
    const labels = entries.map(e=> e.date);
    const dataPoints = entries.map(e=> (e.vals.reduce((a,b)=>a+b,0)/e.vals.length));
    const avg = [];
    for(let i=0;i<dataPoints.length;i++){
      let sum=0,count=0;
      for(let j=Math.max(0,i-6); j<=i; j++){ sum+=dataPoints[j]; count++; }
      avg.push(count? (sum/count) : null);
    }
    if(window._moodChart) window._moodChart.destroy();
    window._moodChart = new Chart(ctx,{
      type:'line',
      data:{
        labels,
        datasets:[
          {label:'Mood (4 Great → 1 Struggled)', data:dataPoints, borderColor:'rgba(0,0,0,0.6)', fill:false, tension:.15, pointRadius:3},
          {label:'7-day Rolling Avg', data:avg, borderColor:'rgba(33,150,243,0.8)', fill:false, tension:.2, pointRadius:0}
        ]
      },
      options:{responsive:true, plugins:{legend:{position:'bottom'}}, scales:{y:{min:1,max:4,ticks:{stepSize:1}}}}
    });
  }
  function renderStats(){ renderGlance(); renderStreaks(); renderExtraLists(); renderORMChart(); renderMoodChart(); }

  // ------- Extras modal -------
  function showExtra(date){
    const arr = extraWorkouts[date]||[];
    const list = arr.length?('<ul>'+arr.map(e=>`<li><strong>${e.type}</strong> — ${e.duration||'-'} min ${e.intensity?('— Int '+e.intensity):''}<br><small>${e.notes||''}</small></li>`).join('')+'</ul>'):'<em>No extra workouts logged.</em>';
    const m = modal(`<h3>Extra Workouts for ${date}</h3><div>${list}</div><div class="row right"><button id="close" class="primary">Close</button></div>`);
    m.querySelector('#close').onclick = ()=> m.remove();
  }

  // ------- Calendar -------
  function renderMonth(){
    if(!data.schedule.length) buildSchedule();
    const grid = document.getElementById('calendar-grid'); if(!grid) return;
    grid.innerHTML='';
    const first = new Date(window._viewYear, window._viewMonth, 1);
    const last = new Date(window._viewYear, window._viewMonth+1, 0);
    document.getElementById('month-title').textContent = first.toLocaleString(undefined,{month:'long',year:'numeric'});
    const padStart = first.getDay();
    for(let i=0;i<padStart;i++){ grid.appendChild(document.createElement('div')); }
    let todayCell = null;
    for(let d=1; d<=last.getDate(); d++){
      const date = new Date(window._viewYear, window._viewMonth, d);
      const key = iso(date);
      const cell = document.createElement('div'); cell.className='day'; cell.setAttribute('data-date', key);
      cell.innerHTML = `<div class="date-num">${d} ${fmtDow(date)}</div>`;
      const sched = data.schedule.find(s => s.date===key);
      if(sched){
        cell.classList.add(`day${sched.dayIndex}`);
        const tag = document.createElement('small'); tag.textContent = sched.label; cell.appendChild(tag);
        const hasExtra = Array.isArray(extraWorkouts[key]) && extraWorkouts[key].length>0;
        const isDone = data.completed.includes(key);
        if(isDone){ const chk = document.createElement('div'); chk.className='checkmark'; chk.textContent='✓'; cell.appendChild(chk); }
        if(hasExtra){
          const badge = document.createElement('div'); badge.className='extra-badge-corner'; badge.textContent='★';
          badge.title='View extra workouts';
          badge.addEventListener('click', (e)=>{ e.stopPropagation(); showExtra(key); });
          cell.appendChild(badge);
        }
        cell.addEventListener('click', ()=> openWorkout(key));
      } else {
        const hasExtra = Array.isArray(extraWorkouts[key]) && extraWorkouts[key].length>0;
        if(hasExtra){
          const badge = document.createElement('div'); badge.className='extra-badge-corner'; badge.textContent='★';
          badge.title='View extra workouts';
          badge.addEventListener('click', (e)=>{ e.stopPropagation(); showExtra(key); });
          cell.appendChild(badge);
        }
      }
      if(iso(new Date())===key) todayCell = cell;
      grid.appendChild(cell);
    }
    updatePhaseProgress();
    if(todayCell) setTimeout(()=>{ todayCell.scrollIntoView({block:'center'}); }, 0);
  }
  function enableSwipe(){
    const el = document.getElementById('calendar-grid'); if(!el) return;
    let startX = 0, endX = 0;
    el.addEventListener('touchstart', (e)=>{ startX = e.changedTouches[0].screenX; }, {passive:true});
    el.addEventListener('touchend', (e)=>{
      endX = e.changedTouches[0].screenX;
      const dx = endX - startX;
      if(Math.abs(dx) > 50){
        if(dx < 0){ window._viewMonth++; if(window._viewMonth>11){window._viewMonth=0;window._viewYear++;} }
        else { window._viewMonth--; if(window._viewMonth<0){window._viewMonth=11;window._viewYear--;} }
        renderMonth();
      }
    }, {passive:true});
  }

  // ------- Init -------
  document.addEventListener('DOMContentLoaded', () => {
    if(!data.schedule || !data.schedule.length){ buildSchedule(); }
    const now = new Date(); window._viewYear = now.getFullYear(); window._viewMonth = now.getMonth();
    toCalendar(); renderMonth(); renderStats();
    document.getElementById('prev-month').onclick = ()=>{ window._viewMonth--; if(window._viewMonth<0){window._viewMonth=11;window._viewYear--;} renderMonth(); };
    document.getElementById('next-month').onclick = ()=>{ window._viewMonth++; if(window._viewMonth>11){window._viewMonth=0;window._viewYear++;} renderMonth(); };
    enableSwipe();

    document.getElementById('nav-calendar').onclick = ()=> toCalendar();
    document.getElementById('nav-stats').onclick    = ()=> toStats();
    document.getElementById('nav-goals').onclick    = ()=> toGoals();
    document.getElementById('back-btn').onclick     = ()=> toCalendar();

    // Add Goal
    const addGoalBtn = document.getElementById('add-goal');
    if(addGoalBtn){ addGoalBtn.onclick = ()=> showGoalForm(); }

    // Update 1RMs
    document.getElementById('nav-orms').onclick = ()=>{
      const m = modal(`<h3>Update 1RMs</h3>
        <form id="update-orms-form">
          <label>Back Squat: <input type="tel" inputmode="numeric" pattern="[0-9]*" name="Back Squat" value="${oneRepMax["Back Squat"]||0}"></label>
          <label>Deadlift: <input type="tel" inputmode="numeric" pattern="[0-9]*" name="Deadlift" value="${oneRepMax["Deadlift"]||0}"></label>
          <label>Front Squat: <input type="tel" inputmode="numeric" pattern="[0-9]*" name="Front Squat" value="${oneRepMax["Front Squat"]||0}"></label>
          <div class="row right">
            <button type="button" id="cancel" class="primary" style="background:#888">Cancel</button>
            <button type="submit" class="primary">Save</button>
          </div>
        </form>`);
      m.querySelector('#cancel').onclick = ()=> m.remove();
      m.querySelector('#update-orms-form').onsubmit = (e)=>{
        e.preventDefault();
        const fd = new FormData(e.target);
        ["Back Squat","Deadlift","Front Squat"].forEach(k=>{
          const v = parseInt(fd.get(k));
          if(!isNaN(v) && v>0){ oneRepMax[k]=v; (ormHistory[k]||(ormHistory[k]=[])).push(v); }
        });
        save(); m.remove(); toast("1RMs updated ✅"); renderORMChart();
      };
    };

    // Log Extra (with mood + mini celebration)
    document.getElementById('nav-extra').onclick = ()=>{
      const today = new Date().toISOString().slice(0,10);
      const m = modal(`<h3>Log Extra Workout</h3>
        <form id="extra-form">
          <label>Date: <input type="date" id="extra-date" required value="${today}"></label>
          <label>Type:
            <select id="extra-type">
              <option>Cardio</option><option>HIIT</option><option>Yoga</option><option>Mobility</option><option>Other</option>
            </select>
          </label>
          <label>Duration (min): <input type="tel" inputmode="numeric" pattern="[0-9]*" id="extra-duration" min="1"></label>
          <label>Intensity (1-10): <input type="tel" inputmode="numeric" pattern="[0-9]*" id="extra-intensity" min="1" max="10"></label>
          <label>Notes:<textarea id="extra-notes"></textarea></label>
          <div class="row right">
            <button type="button" id="cancel" class="primary" style="background:#888">Cancel</button>
            <button type="submit" class="primary">Save</button>
          </div>
        </form>`);
      m.querySelector('#cancel').onclick = ()=> m.remove();
      m.querySelector('#extra-form').onsubmit = (e)=>{
        e.preventDefault();
        const date = m.querySelector('#extra-date').value;
        const type = m.querySelector('#extra-type').value;
        const duration = parseInt(m.querySelector('#extra-duration').value)||null;
        const intensity = parseInt(m.querySelector('#extra-intensity').value)||null;
        const notes = m.querySelector('#extra-notes').value||'';
        (extraWorkouts[date]||(extraWorkouts[date]=[])).push({type,duration,intensity,notes});
        save(); renderMonth(); m.remove();
        const mm = modal(`<h3>How did that extra feel?</h3>
          <div class="row" style="justify-content:space-around">
            <button class="primary" data-mood="4">😀 Great</button>
            <button class="primary" data-mood="3">🙂 Okay</button>
            <button class="primary" data-mood="2">😐 Tired</button>
            <button class="primary" data-mood="1">😫 Struggled</button>
          </div>`);
        mm.querySelectorAll('button.primary').forEach(b=>{
          b.onclick = ()=>{
            const score=parseInt(b.getAttribute('data-mood'));
            if(!Array.isArray(moodLogs[date])) moodLogs[date]= (moodLogs[date]==null?[]:[moodLogs[date]].flat());
            moodLogs[date].push(score); save(); mm.remove();
            celebrateMini('extra');
            updateStats();
          };
        });
      };
    };

  });
})();