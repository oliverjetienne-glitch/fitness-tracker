// Fitness Tracker v15.11 (rebuilt from scratch) — full features + simplified week completion
(function(){
  const PROGRAM_START_DATE = "2026-02-11";

  const VERSION = '15.11';
  const pad = n => String(n).padStart(2,'0');
  const iso = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const round5 = n => Math.round(n/5)*5;
  const fmtDow = d => d.toLocaleDateString(undefined,{weekday:'short'}).toUpperCase();

  // Motivations
  const MOTIVATION_MESSAGES = [
    "🔥 Crushing it!",
    "💪 That’s how progress is made.",
    "⚡ Energy well spent!",
    "✨ Keep building momentum.",
    "👏 Another win in the books!",
    "🚀 Stronger every session.",
    "🌟 Great consistency!",
    "🏋️ Gains unlocked."
  ];
  const randomMotivation = () => MOTIVATION_MESSAGES[Math.floor(Math.random()*MOTIVATION_MESSAGES.length)];

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

  // ------- Schedule (anchored to 2025-09-23 Tue) -------
  function* scheduleGenerator(startDate, weeks=104){
    for(let k=0;k<weeks;k++){
      const base = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + k*7);
      const d1 = new Date(base); d1.setDate(base.getDate() + (k%2===0 ? 0 : -1)); // Tue then Mon
      yield { date: iso(d1), dayIndex: 1, label: "Day 1" };
      const d2 = new Date(base); d2.setDate(base.getDate()+1); // Wed
      yield { date: iso(d2), dayIndex: 2, label: "Day 2" };
      const d3 = new Date(base); d3.setDate(base.getDate()+5); // Sun
      yield { date: iso(d3), dayIndex: 3, label: "Day 3" };
    }
  }
  function buildSchedule(){
  data.schedule = [];
  const start = new Date(PROGRAM_START_DATE);
  const labels = ["Day A","Day B","Day C"];
  let current = new Date(start);

  for(let i=0;i<12;i++){
    const week = Math.floor(i/3);
    const dayIndex = i % 3;
    data.schedule.push({
      date: iso(current),
      label: labels[dayIndex],
      dayIndex,
      weekIndex: week
    });
    current.setDate(current.getDate()+2);
  }
  save();
})();