// Simplified app.js snippet focusing on fixes
document.addEventListener('DOMContentLoaded', ()=>{
  const calSec=document.getElementById('calendar-section');
  const statSec=document.getElementById('stats-section');
  const workSec=document.getElementById('workout-section');
  const grid=document.getElementById('calendar-grid');
  let extraWorkouts=JSON.parse(localStorage.getItem('extraWorkouts')||'{}');
  let data=JSON.parse(localStorage.getItem('fitnessData')||'{"completed":[]}');
  function save(){localStorage.setItem('fitnessData',JSON.stringify(data));localStorage.setItem('extraWorkouts',JSON.stringify(extraWorkouts));}
  function renderMonth(){
    grid.innerHTML='';
    const now=new Date(); const year=now.getFullYear(); const month=now.getMonth();
    const first=new Date(year,month,1); const last=new Date(year,month+1,0);
    for(let d=1;d<=last.getDate();d++){
      const date=new Date(year,month,d); const key=date.toISOString().slice(0,10);
      const cell=document.createElement('div'); cell.className='day'; cell.innerHTML=`<div class="date-num"><strong>${d}</strong></div>`;
      // extras badge
      if(extraWorkouts[key]&&extraWorkouts[key].length){const b=document.createElement('button');b.className='extra-badge';b.textContent='+';b.onclick=(e)=>{e.stopPropagation();alert(JSON.stringify(extraWorkouts[key]));};cell.appendChild(b);}
      // checkmark
      if(data.completed.includes(key)){const chk=document.createElement('div');chk.className='checkmark';chk.textContent='✓';cell.appendChild(chk);}
      grid.appendChild(cell);
    }
  }
  document.getElementById('view-calendar').onclick=()=>{workSec.classList.add('hidden');calSec.classList.remove('hidden');statSec.classList.add('hidden');};
  document.getElementById('view-stats').onclick=()=>{workSec.classList.add('hidden');statSec.classList.remove('hidden');calSec.classList.add('hidden');};
  document.getElementById('back-btn').onclick=()=>{workSec.classList.add('hidden');calSec.classList.remove('hidden');};
  renderMonth();
});