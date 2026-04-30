const COLORS = ['#ff6b6b','#ffd93d','#6bcb77','#4d96ff','#c77dff','#ff9f43','#48dbfb','#ff6b9d'];
export function launchFireworks(container) {
  [[0.25,0.22],[0.72,0.18],[0.48,0.45],[0.15,0.40],[0.80,0.36],[0.40,0.28],[0.62,0.50]].forEach(([rx,ry],i) => setTimeout(() => burst(container,rx,ry), i*80));
}
function burst(container,rx,ry) {
  const W=container.offsetWidth, H=container.offsetHeight, cx=W*rx, cy=H*ry;
  for (let i=0;i<22;i++) {
    const el=document.createElement('div'); el.className='spark';
    const angle=(i/22)*2*Math.PI+Math.random()*0.3, dist=45+Math.random()*55;
    const color=COLORS[Math.floor(Math.random()*COLORS.length)], size=4+Math.random()*6;
    el.style.cssText=`left:${cx}px;top:${cy}px;width:${size}px;height:${size}px;background:${color};box-shadow:0 0 6px ${color};--tx:${Math.cos(angle)*dist}px;--ty:${Math.sin(angle)*dist}px;`;
    container.appendChild(el); el.addEventListener('animationend',()=>el.remove());
  }
}
export function showUwai(container) {
  const el=document.createElement('div'); el.className='uwai'; el.textContent='うえーーーい！'; container.appendChild(el);
  const W=container.offsetWidth, H=container.offsetHeight;
  const wp=[[W*0.15,H*0.38,-12],[W*0.62,H*0.22,10],[W*0.10,H*0.18,-8],[W*0.70,H*0.33,14],[W*0.35,H*0.26,-5]];
  el.style.left=`${W*0.4}px`; el.style.top=`${H*0.5}px`; el.style.transform='translate(-50%,-50%) scale(0)';
  let step=0;
  function next() {
    if (step>=wp.length) { el.style.transition='transform 0.25s ease-in,opacity 0.25s'; el.style.transform='translate(-50%,-50%) scale(0)'; el.style.opacity='0'; setTimeout(()=>el.remove(),300); return; }
    const [lx,ly,deg]=wp[step++]; el.style.transition='all 0.35s ease-in-out'; el.style.left=`${lx}px`; el.style.top=`${ly}px`; el.style.transform=`translate(-50%,-50%) rotate(${deg}deg) scale(${0.95+Math.random()*0.2})`; setTimeout(next,400);
  }
  requestAnimationFrame(()=>{ el.style.transition='transform 0.2s cubic-bezier(0.34,1.56,0.64,1)'; el.style.transform='translate(-50%,-50%) scale(1.3)'; setTimeout(next,250); });
}
export function startRain(container) {
  const drops=[];
  for (let i=0;i<90;i++) {
    const el=document.createElement('div'); el.className='raindrop'; const h=40+Math.random()*80;
    el.style.cssText=`left:${Math.random()*100}%;height:${h}px;width:${1+Math.random()*2}px;opacity:${0.35+Math.random()*0.5};animation-duration:${0.45+Math.random()*0.6}s;animation-delay:${Math.random()*0.8}s;`;
    container.appendChild(el); drops.push(el);
  }
  return ()=>drops.forEach(d=>d.remove());
}
export function showZannen(container) {
  const el=document.createElement('div'); el.className='zannen'; el.textContent='残念'; container.appendChild(el); requestAnimationFrame(()=>el.classList.add('show')); return el;
}