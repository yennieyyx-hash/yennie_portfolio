'use strict';
const motionPreference=matchMedia('(prefers-reduced-motion: reduce)');
// React Bits AnimatedContent, adapted to this buildless site with the same GSAP motion model.
function animatedContent(el,{distance=32,duration=.7,stagger=0,trigger='scroll'}={}){
 if(motionPreference.matches||!window.gsap||!window.ScrollTrigger)return;
 const targets=stagger>0?[...el.children]:[el];
 if(!targets.length)return;
 const from={y:distance,opacity:0};
 const to={y:0,opacity:1,duration,ease:'power3.out',stagger,clearProps:'transform,opacity',overwrite:'auto'};
 if(trigger==='mount')gsap.fromTo(targets,from,{...to,delay:.12});
 else gsap.fromTo(targets,from,{...to,scrollTrigger:{trigger:el,start:'top 90%',once:true}});
 el.dataset.motionReady='true';
}
if(window.gsap&&window.ScrollTrigger){
 gsap.registerPlugin(ScrollTrigger);
 document.querySelectorAll('[data-reveal]').forEach(el=>animatedContent(el));
 document.querySelectorAll('[data-reveal-group]').forEach(el=>animatedContent(el,{stagger:.08,distance:el.classList.contains('hero-collage')?24:32,trigger:el.hasAttribute('data-reveal-mount')?'mount':'scroll'}));
 addEventListener('load',()=>ScrollTrigger.refresh(),{once:true});
 motionPreference.addEventListener('change',e=>{if(e.matches){ScrollTrigger.getAll().forEach(t=>t.kill());gsap.globalTimeline.getChildren().forEach(t=>t.kill());document.querySelectorAll('[data-reveal],[data-reveal-group]>*').forEach(el=>gsap.set(el,{clearProps:'transform,opacity'}));}});
}
let pageAudio=null;let soundOn=true;
try{soundOn=localStorage.getItem('yingxi-paper-sound')!=='off'}catch{}
function syncSound(){document.querySelectorAll('[data-paper-sound]').forEach(b=>{b.textContent=`翻页声：${soundOn?'开':'关'}`;b.setAttribute('aria-pressed',String(soundOn))})}
function paperSound(){
 if(!soundOn)return;
 try{
  pageAudio??=new (window.AudioContext||window.webkitAudioContext)();
  if(pageAudio.state==='suspended')pageAudio.resume();
  const count=Math.floor(pageAudio.sampleRate*.46),buf=pageAudio.createBuffer(1,count,pageAudio.sampleRate),data=buf.getChannelData(0);let previous=0;
  for(let i=0;i<count;i++){const x=i/count,envelope=Math.sin(Math.PI*x)**1.4;previous=.68*previous+.32*(Math.random()*2-1);data[i]=previous*envelope*(.65+.35*Math.sin(x*73)**2)}
  const source=pageAudio.createBufferSource(),filter=pageAudio.createBiquadFilter(),gain=pageAudio.createGain();source.buffer=buf;filter.type='bandpass';filter.frequency.value=1400;filter.Q.value=.45;gain.gain.value=.24;source.connect(filter).connect(gain).connect(pageAudio.destination);source.start();source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect()};
 }catch{}
}
syncSound();
document.querySelectorAll('[data-paper-album]').forEach(album=>{
 const total=Number(album.dataset.pageCount),spreads=Math.ceil(total/2),slug=album.dataset.paperAlbum,top=album.querySelector('[data-paper-top]'),bottom=album.querySelector('[data-paper-bottom]'),end=album.querySelector('.paper-end'),turner=album.querySelector('.paper-turner'),front=turner.querySelector('.turn-front img'),back=turner.querySelector('.turn-back img'),prev=album.querySelector('[data-paper-prev]'),next=album.querySelector('[data-paper-next]'),position=album.querySelector('[data-paper-position]');let current=0,busy=false;
 const src=n=>`../assets/decks/${slug}/page-${n}.png`;
 const loaded=new Map();
 function preload(n){if(n>total||n<1)return Promise.resolve();if(!loaded.has(n)){loaded.set(n,new Promise(resolve=>{const i=new Image();i.onload=i.onerror=resolve;i.src=src(n)}))}return loaded.get(n)}
 function controls(){prev.disabled=busy||current===0;next.disabled=busy||current===spreads-1;album.setAttribute('aria-busy',String(busy))}
 function render(){const a=current*2+1,b=a+1;top.src=src(a);top.alt=`${slug==='hiti'?'ScalpSync':'口味合拍'}方案第${a}页`;bottom.hidden=b>total;end.hidden=b<=total;album.querySelector('[data-sheet-zoom="bottom"]').hidden=b>total;if(b<=total){bottom.src=src(b);bottom.alt=`${slug==='hiti'?'ScalpSync':'口味合拍'}方案第${b}页`};album.querySelector('[data-top-number]').textContent=String(a).padStart(2,'0');album.querySelector('[data-bottom-number]').textContent=b<=total?String(b).padStart(2,'0'):'';position.textContent=`${String(a).padStart(2,'0')}${b<=total?'—'+String(b).padStart(2,'0'):''} / ${String(total).padStart(2,'0')}`;album.dataset.spread=String(current);controls();preload(a+2);preload(a+3)}
 async function turn(direction){
  const target=current+direction;if(busy||target<0||target>=spreads)return;
  busy=true;controls();paperSound();
  if(motionPreference.matches){current=target;busy=false;render();return}
  const old=current;
  await Promise.all([preload(target*2+1),preload(target*2+2)]);
  front.src=src(direction>0?old*2+2:target*2+2);back.src=src(direction>0?target*2+1:old*2+1);
  if(direction>0){const n=target*2+2;bottom.hidden=n>total;end.hidden=n<=total;if(n<=total)bottom.src=src(n)}else{top.src=src(target*2+1)}
  turner.hidden=false;
  try{await turner.animate([{transform:`rotateX(${direction>0?0:-180}deg)`,filter:'brightness(1)'},{transform:'rotateX(-85deg) translateZ(6px)',filter:'brightness(.91)',offset:.48},{transform:`rotateX(${direction>0?-180:0}deg)`,filter:'brightness(1)'}],{duration:850,easing:'cubic-bezier(.32,.05,.24,1)',fill:'forwards'}).finished}catch{}
  current=target;busy=false;render();turner.hidden=true;turner.getAnimations().forEach(a=>a.cancel());
 }
 render();
 prev.addEventListener('click',()=>turn(-1));next.addEventListener('click',()=>turn(1));
 top.addEventListener('click',()=>turn(-1));bottom.addEventListener('click',()=>turn(1));
 album.addEventListener('keydown',e=>{if(e.target.matches('button,a'))return;if(['ArrowDown','ArrowRight','ArrowUp','ArrowLeft'].includes(e.key)){e.preventDefault();turn(['ArrowDown','ArrowRight'].includes(e.key)?1:-1)}});
 let start=null;album.querySelector('.paper-book').addEventListener('pointerdown',e=>{if(e.pointerType==='touch')start={x:e.clientX,y:e.clientY}});album.querySelector('.paper-book').addEventListener('pointerup',e=>{if(!start)return;const dy=e.clientY-start.y,dx=e.clientX-start.x;start=null;if(Math.abs(dy)>65&&Math.abs(dy)>Math.abs(dx)*1.5)turn(dy<0?1:-1)});
 album.querySelector('[data-paper-sound]').addEventListener('click',()=>{soundOn=!soundOn;try{localStorage.setItem('yingxi-paper-sound',soundOn?'on':'off')}catch{}syncSound();if(soundOn)paperSound()});
 album.querySelectorAll('[data-sheet-zoom]').forEach(button=>button.addEventListener('click',()=>{const image=button.dataset.sheetZoom==='top'?top:bottom,dialog=document.querySelector('.lightbox');if(!dialog)return;dialog.querySelector('img').src=image.src;dialog.querySelector('img').alt=image.alt;dialog.querySelector('figcaption').textContent=image.alt;dialog.addEventListener('close',()=>button.focus({preventScroll:true}),{once:true});dialog.showModal()}));
});
