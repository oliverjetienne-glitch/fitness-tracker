
// ===== Fitness Tracker v3.15 =====
// Purple star overlay for extra workouts (+ click to view); full app retained from v3.14
(function(){
  const pad = n => String(n).padStart(2,'0');
  const iso = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const dow = d => d.toLocaleDateString(undefined,{weekday:'short'}).toUpperCase();
  const round5 = n => Math.round(n/5)*5;

  try{ ['firstRun','showUpdateModal','needs1RM','openExtraOnStart'].forEach(k=>localStorage.removeItem(k)); }catch(e){}

  let phase = parseInt(localStorage.getItem('phase')||'1');
  let oneRepMax = JSON.parse(localStorage.getItem('oneRepMax')||'{}');
  if(Object.keys(oneRepMax).length===0){
    oneRepMax = {"Back Squat":110,"Deadlift":180,"Front Squat":95};
    localStorage.setItem('oneRepMax', JSON.stringify(oneRepMax));
  }
  let ormHistory = JSON.parse(localStorage.getItem('ormHistory')||'{}');
  ["Back Squat","Deadlift","Front Squat"].forEach(ex=>{ if(!ormHistory[ex]) ormHistory[ex]=[oneRepMax[ex]]; });
  let data = JSON.parse(localStorage.getItem('fitnessData')||'{"completed":[],"schedule":[]}');
  let accessoryLogs = JSON.parse(localStorage.getItem('accessoryLogs')||'{}');
  let extraWorkouts = JSON.parse(localStorage.getItem('extraWorkouts')||'{}');
  let amapLogs = JSON.parse(localStorage.getItem('amapLogs')||'{}');

  function save(){
    localStorage.setItem('phase', String(phase));
    localStorage.setItem('oneRepMax', JSON.stringify(oneRepMax));
    localStorage.setItem('ormHistory', JSON.stringify(ormHistory));
    localStorage.setItem('fitnessData', JSON.stringify(data));
    localStorage.setItem('accessoryLogs', JSON.stringify(accessoryLogs));
    localStorage.setItem('extraWorkouts', JSON.stringify(extraWorkouts));
    localStorage.setItem('amapLogs', JSON.stringify(amapLogs));
  }

  const programDays = {
    1: { main: [
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
    2: { main: [
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
    3: { main: [
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

  // Schedule creation
  function* scheduleGenerator(startDate, weeks=104){
    for(let k=0;k<weeks;k++){
      const base = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + k*7); // Tue anchor
      const d1 = new Date(base); d1.setDate(base.getDate() + (k%2===0 ? 0 : -1)); // Tue or Mon
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

  // Rendering
  function updatePhaseProgress(){
    const pct = data.schedule.length ? Math.round((data.completed.length/data.schedule.length)*100) : 0;
    document.getElementById('phase-progress-bar').style.width = pct+'%';
    document.getElementById('phase-progress-text').textContent = `Completed ${data.completed.length} of ${data.schedule.length} scheduled workouts (${pct}%)`;
  }
  function renderStats(){
    const el = document.getElementById('stats-content'); if(!el) return;
    const scheduled = data.schedule.length;
    const completed = data.completed.length;
    const adherence = scheduled ? Math.round((completed/scheduled)*100) : 0;
    const extras = Object.values(extraWorkouts).reduce((sum,arr)=> sum + (arr?arr.length:0), 0);
    let html = `<ul>
      <li><strong>Scheduled days:</strong> ${scheduled}</li>
      <li><strong>Completed days:</strong> ${completed}</li>
      <li><strong>Adherence:</strong> ${adherence}%</li>
      <li><strong>Extra workouts logged:</strong> ${extras}</li>
    </ul>`;
    let last = {};
    Object.keys(accessoryLogs).sort().forEach(date=>{
      const obj = accessoryLogs[date]; Object.keys(obj).forEach(k=> last[k] = obj[k].weight);
    });
    if(Object.keys(last).length){
      html += `<h4>Last logged accessory weights</h4><ul>`;
      Object.keys(last).forEach(k=> html += `<li>${k}: ${last[k]} lbs</li>`);
      html += `</ul>`;
    }
    let amapBest = {};
    Object.keys(amapLogs).forEach(date=>{
      const obj = amapLogs[date]; Object.keys(obj).forEach(k=> amapBest[k] = Math.max(amapBest[k]||0, obj[k]||0));
    });
    if(Object.keys(amapBest).length){
      html += `<h4>Best AMAP reps</h4><ul>`;
      Object.keys(amapBest).forEach(k=> html += `<li>${k}: ${amapBest[k]} reps</li>`);
      html += `</ul>`;
    }
    el.innerHTML = html;

    const all = [];
    Object.keys(extraWorkouts).forEach(date=> (extraWorkouts[date]||[]).forEach(e=> all.push({date,...e})));
    all.sort((a,b)=> a.date<b.date ? 1 : (a.date>b.date?-1:0));
    const mini = document.getElementById('extra-mini');
    mini.innerHTML = all.length ? ('<ul>'+ all.slice(0,3).map(e=>`<li>${e.date} – ${e.type} – ${e.duration||''} min ${e.intensity?('– Int '+e.intensity):''}</li>`).join('') + '</ul>') : '<em>No extras yet.</em>';
    const hist = document.getElementById('extra-history');
    hist.innerHTML = all.length ? ('<ul>'+ all.map(e=>`<li>${e.date} – ${e.type} – ${e.duration||''} min ${e.intensity?('– Int '+e.intensity):''} ${e.notes?('– '+e.notes):''}</li>`).join('') + '</ul>') : '<em>No extra workouts logged yet.</em>';
  }
  function renderChart(){
    const canvas = document.getElementById('exercise-chart');
    if(!canvas || !window.Chart) return;
    const ctx = canvas.getContext('2d');
    const keys = ["Back Squat","Deadlift","Front Squat"];
    const maxLen = Math.max(...keys.map(k=> (ormHistory[k]||[]).length));
    const labels = Array.from({length:maxLen}, (_,i)=>`Update ${i+1}`);
    const datasets = keys.map((k,i)=>({label:k,data:ormHistory[k]||[],borderColor:`hsl(${i*70},70%,40%)`,fill:false,tension:.2}));
    if(window._chart) window._chart.destroy();
    window._chart = new Chart(ctx,{type:'line',data:{labels,datasets},options:{responsive:true,plugins:{legend:{position:'bottom'}}}});
  }
  function renderCurrentORM(dayIndex){
    const box = document.getElementById('current-orm-box');
    let html = '<strong>Current 1RM</strong><br>';
    if(dayIndex===1) html += `Back Squat: ${oneRepMax["Back Squat"]||'-'} lbs`;
    if(dayIndex===2) html += `Deadlift: ${oneRepMax["Deadlift"]||'-'} lbs`;
    if(dayIndex===3) html += `Front Squat: ${oneRepMax["Front Squat"]||'-'} lbs`;
    box.innerHTML = html;
  }
  function getWeekNumber(dateStr){
    if(!data.schedule.length) return 1;
    const firstSched = new Date(data.schedule[0].date);
    const cur = new Date(dateStr);
    const diffDays = Math.floor((cur - firstSched)/(1000*60*60*24));
    const weekIndex = Math.floor(diffDays/7);
    return (weekIndex % 4)+1;
  }
  function openWorkout(dateStr){
    document.getElementById('calendar-section').classList.add('hidden');
    document.getElementById('workout-section').classList.remove('hidden');
    document.getElementById('workout-date-title').textContent = `Workout for ${dateStr}`;
    const sched = data.schedule.find(s=>s.date===dateStr);
    const day = programDays[sched.dayIndex];
    renderCurrentORM(sched.dayIndex);

    const weekNum = getWeekNumber(dateStr);
    const mainWrap = document.getElementById('main-superset'); mainWrap.innerHTML='';
    const accWrap = document.getElementById('accessory-superset'); accWrap.innerHTML='';

    day.main.forEach(main=>{
      const block = document.createElement('div'); block.style.margin='8px 0';
      block.innerHTML = `<div><strong>${main.name}</strong></div>`;
      if(main.scheme==='percent'){
        const sets = percentSchemes[liftSchemeMap[main.key]][weekNum];
        const ul = document.createElement('ul');
        sets.forEach(s=>{
          const w = round5((oneRepMax[main.key]||100)*s.p);
          const li = document.createElement('li');
          if(String(s.r).toUpperCase()==='AMAP'){
            const v = (amapLogs[dateStr] && amapLogs[dateStr][main.key]) ? amapLogs[dateStr][main.key] : '';
            li.innerHTML = `AMAP @ ${w} lbs — Reps: <input type="number" class="amap-input" data-date="${dateStr}" data-ex="${main.key}" value="${v}" style="width:70px">`;
          } else {
            li.textContent = `${s.r} reps @ ${w} lbs`;
          }
          ul.appendChild(li);
        });
        block.appendChild(ul);
      } else {
        const wk = main.weeks[weekNum];
        block.innerHTML += `<div>${wk.sets}×${wk.reps} @ ${wk.weight} lbs</div>`;
      }
      mainWrap.appendChild(block);
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

    day.accessories.forEach(acc=>{
      const existing = (accessoryLogs[dateStr] && accessoryLogs[dateStr][acc.key]) ? accessoryLogs[dateStr][acc.key] : {};
      const div = document.createElement('div');
      div.innerHTML = `<div><strong>${acc.name}</strong> — ${acc.sets} x ${acc.reps}</div>
        <div class="input-inline">Weight used: <input type="number" class="acc-weight" data-date="${dateStr}" data-ex="${acc.key}" value="${existing.weight||''}" placeholder="lbs"></div>`;
      accWrap.appendChild(div);
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

    document.getElementById('complete-workout').onclick = ()=>{
      if(!data.completed.includes(dateStr)) data.completed.push(dateStr);
      save();
      document.getElementById('workout-section').classList.add('hidden');
      document.getElementById('calendar-section').classList.remove('hidden');
      renderMonth(); renderStats();
    };
  }

  function renderMonth(){
    if(!data.schedule.length) buildSchedule();
    const grid = document.getElementById('calendar-grid'); grid.innerHTML='';
    const first = new Date(window._viewYear, window._viewMonth, 1);
    const last = new Date(window._viewYear, window._viewMonth+1, 0);
    document.getElementById('month-title').textContent = first.toLocaleString(undefined,{month:'long',year:'numeric'});
    const startPad = first.getDay();
    for(let i=0;i<startPad;i++){ grid.appendChild(document.createElement('div')); }
    let todayCell = null;
    for(let d=1; d<=last.getDate(); d++){
      const date = new Date(window._viewYear, window._viewMonth, d);
      const key = iso(date);
      const cell = document.createElement('div'); cell.className='day'; cell.setAttribute('data-date', key);
      cell.innerHTML = `<div class="date-num"><strong>${d} ${dow(date)}</strong></div>`;
      const sched = data.schedule.find(s => s.date===key);
      if(sched){
        cell.classList.add(`day${sched.dayIndex}`);
        const tag = document.createElement('small'); tag.textContent = sched.label; cell.appendChild(tag);

        const hasExtra = Array.isArray(extraWorkouts[key]) && extraWorkouts[key].length>0;
        const isDone = data.completed.includes(key);

        // Overlays
        if(isDone){ const chk = document.createElement('div'); chk.className='checkmark'; chk.textContent='✓'; cell.appendChild(chk); }
        if(hasExtra && !isDone){
          const star = document.createElement('div'); star.className='extra-mark'; star.textContent='★';
          star.title='View extra workouts';
          star.addEventListener('click', (e)=>{ e.stopPropagation(); showExtra(key); });
          cell.appendChild(star);
        }
        if(hasExtra && isDone){
          // If both exist, show a smaller purple corner badge for extras so both are visible
          const badge = document.createElement('div'); badge.className='extra-badge-corner'; badge.textContent='★';
          badge.title='View extra workouts';
          badge.addEventListener('click', (e)=>{ e.stopPropagation(); showExtra(key); });
          cell.appendChild(badge);
        }

        cell.addEventListener('click', ()=> openWorkout(key));
      }
      if(iso(new Date())===key) todayCell = cell;
      grid.appendChild(cell);
    }
    updatePhaseProgress();
    if(todayCell) setTimeout(()=>{ todayCell.scrollIntoView({block:'center'}); }, 0);
  }

  // Modal helpers
  function modal(html){
    const m = document.createElement('div'); m.className='modal'; m.innerHTML = `<div class="modal-inner card">${html}</div>`;
    m.addEventListener('click', e=>{ if(e.target===m) m.remove(); });
    document.addEventListener('keydown', function esc(e){ if(e.key==='Escape'){ m.remove(); document.removeEventListener('keydown', esc); } });
    document.body.appendChild(m); return m;
  }
  function showExtra(date){
    const arr = extraWorkouts[date]||[];
    const list = arr.length?('<ul>'+arr.map(e=>`<li><strong>${e.type}</strong> — ${e.duration||'-'} min ${e.intensity?('— Int '+e.intensity):''}<br><small>${e.notes||''}</small></li>`).join('')+'</ul>'):'<em>No extra workouts logged.</em>';
    const m = modal(`<h3>Extra Workouts for ${date}</h3><div>${list}</div><div class="row" style="justify-content:flex-end;"><button id="close" class="primary">Close</button></div>`);
    m.querySelector('#close').onclick = ()=> m.remove();
  }
  window.showExtra = showExtra;

  // Init & UI
  document.addEventListener('DOMContentLoaded', () => {
    // default view
    document.getElementById('calendar-section').classList.remove('hidden');
    document.getElementById('stats-section').classList.add('hidden');
    document.getElementById('workout-section').classList.add('hidden');

    // schedule & initial month
    buildSchedule();
    const now = new Date();
    window._viewYear = now.getFullYear();
    window._viewMonth = now.getMonth();
    renderMonth();
    renderChart();
    renderStats();

    // navigation (force-hide workout view on tab switch)
    document.getElementById('prev-month').onclick = ()=>{ window._viewMonth--; if(window._viewMonth<0){window._viewMonth=11;window._viewYear--;} renderMonth(); };
    document.getElementById('next-month').onclick = ()=>{ window._viewMonth++; if(window._viewMonth>11){window._viewMonth=0;window._viewYear++;} renderMonth(); };
    document.getElementById('view-calendar').onclick = ()=>{
      document.getElementById('workout-section').classList.add('hidden');
      document.getElementById('calendar-section').classList.remove('hidden');
      document.getElementById('stats-section').classList.add('hidden');
    };
    document.getElementById('view-stats').onclick = ()=>{
      document.getElementById('workout-section').classList.add('hidden');
      document.getElementById('stats-section').classList.remove('hidden');
      document.getElementById('calendar-section').classList.add('hidden');
      renderStats();
    };
    document.getElementById('back-btn').onclick = ()=>{
      document.getElementById('workout-section').classList.add('hidden');
      document.getElementById('calendar-section').classList.remove('hidden');
    };

    // Update 1RMs
    document.getElementById('update-orms').onclick = ()=>{
      const m = modal(`<h3>Update 1RMs</h3>
        <form id="update-orms-form">
          <label>Back Squat: <input type="number" name="Back Squat" value="${oneRepMax["Back Squat"]||0}"></label>
          <label>Deadlift: <input type="number" name="Deadlift" value="${oneRepMax["Deadlift"]||0}"></label>
          <label>Front Squat: <input type="number" name="Front Squat" value="${oneRepMax["Front Squat"]||0}"></label>
          <div class="row" style="justify-content:flex-end;">
            <button type="button" id="cancel" class="secondary">Cancel</button>
            <button type="submit" class="primary">Save</button>
          </div>
        </form>`);
      m.querySelector('#cancel').onclick = ()=> m.remove();
      m.querySelector('#update-orms-form').onsubmit = (e)=>{
        e.preventDefault();
        const fd = new FormData(e.target);
        ["Back Squat","Deadlift","Front Squat"].forEach(k=>{
          const v = parseInt(fd.get(k)); if(!isNaN(v)&&v>0){ oneRepMax[k]=v; (ormHistory[k]||(ormHistory[k]=[])).push(v); }
        });
        save(); renderChart(); m.remove();
      };
    };

    // Log Extra Workout
    document.getElementById('log-extra-btn').onclick = ()=>{
      const today = new Date().toISOString().slice(0,10);
      const m = modal(`<h3>Log Extra Workout</h3>
        <form id="extra-form">
          <label>Date: <input type="date" id="extra-date" required value="${today}"></label>
          <label>Type:
            <select id="extra-type">
              <option>Cardio</option><option>HIIT</option><option>Yoga</option><option>Mobility</option><option>Other</option>
            </select>
          </label>
          <label>Duration (min): <input type="number" id="extra-duration" min="1"></label>
          <label>Intensity (1-10): <input type="number" id="extra-intensity" min="1" max="10"></label>
          <label>Notes:<textarea id="extra-notes"></textarea></label>
          <div class="row" style="justify-content:flex-end;">
            <button type="button" id="cancel" class="secondary">Cancel</button>
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
        save(); renderMonth(); renderStats(); m.remove();
      };
    };
  });
})();
