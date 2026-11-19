'use strict';
const reducedJournalMotion=matchMedia('(prefers-reduced-motion: reduce)');
const hoverAvailable=matchMedia('(hover: hover) and (pointer: fine)');
const fileItems=[...document.querySelectorAll('.scrap-file')];
function positionFilePreview(item){
 const preview=item.querySelector('.file-materials'),r=item.getBoundingClientRect(),h=preview.offsetHeight,top=preview.offsetTop;
 const desired=-h-top-18,minY=82-r.top-top,maxY=innerHeight-24-r.top-top-h;
 preview.style.setProperty('--preview-y',`${Math.min(maxY,Math.max(minY,desired))}px`);
}
function setFileOpen(item,open){if(open)positionFilePreview(item);item.classList.toggle('is-open',open);item.querySelector('a.folder').setAttribute('aria-expanded',String(open));item.querySelector('.file-materials').setAttribute('aria-hidden',String(!open))}
fileItems.forEach(item=>{
 const link=item.querySelector('a.folder');let pointerType='';
 item.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse'&&hoverAvailable.matches){fileItems.forEach(x=>{if(x!==item)setFileOpen(x,false)});setFileOpen(item,true)}});
 item.addEventListener('pointerleave',()=>{if(!item.contains(document.activeElement))setFileOpen(item,false)});
 link.addEventListener('focus',()=>{if(hoverAvailable.matches)setFileOpen(item,true)});
 link.addEventListener('blur',()=>setFileOpen(item,false));
 link.addEventListener('pointerdown',e=>{pointerType=e.pointerType});
 link.addEventListener('click',e=>{if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;if((pointerType==='touch'||!hoverAvailable.matches)&&!item.classList.contains('is-open')){e.preventDefault();fileItems.forEach(x=>setFileOpen(x,false));setFileOpen(item,true)}});
 link.addEventListener('keydown',e=>{pointerType='';if(e.key==='Escape'){setFileOpen(item,false);link.blur()}});
});
document.addEventListener('pointerdown',e=>{if(!e.target.closest('.scrap-file'))fileItems.forEach(x=>setFileOpen(x,false))});
// Ambient floating and pointer tilt use separate transform properties.
const journalFloaters=[...document.querySelectorAll('[data-float]')];
const journalIdleAnimations=new Map();
const journalClickAnimations=new Map();
let journalInView=true;
function syncJournalFloat(){
 for(const [el,anim] of journalIdleAnimations){
  const shouldPlay=journalInView&&!document.hidden&&!reducedJournalMotion.matches&&!journalClickAnimations.has(el);
  if(shouldPlay)anim.play();else anim.pause();
 }
}
function startJournalFloat(){
 if(reducedJournalMotion.matches)return;
 journalFloaters.forEach((el,i)=>{
  if(journalIdleAnimations.has(el))return;
  const amplitude=i<6?12:9;
  const anim=el.animate([{translate:'0px 0px 0px',rotate:'-.3deg'},{translate:`${i%2?-3:3}px -${amplitude}px 9px`,rotate:'.6deg'},{translate:'0px 0px 0px',rotate:'-.3deg'}],{duration:6200+(i%4)*900,delay:-i*570,iterations:Infinity,easing:'ease-in-out'});
  el.dataset.autoFloat='true';journalIdleAnimations.set(el,anim);
 });syncJournalFloat();
}
function bounceJournalPaper(el){
 if(reducedJournalMotion.matches)return;
 journalClickAnimations.get(el)?.cancel();
 const idle=journalIdleAnimations.get(el);idle?.pause();
 const current=getComputedStyle(el).translate;
 const start=current==='none'?'0px 0px 0px':current;
 const anim=el.animate([{translate:start,scale:'1'},{translate:'0px -34px 24px',scale:'1.022',offset:.42},{translate:start,scale:'1'}],{duration:760,easing:'cubic-bezier(.2,.7,.25,1)'});
 journalClickAnimations.set(el,anim);el.classList.add('is-bouncing');
 const finish=()=>{if(journalClickAnimations.get(el)!==anim)return;journalClickAnimations.delete(el);el.classList.remove('is-bouncing');syncJournalFloat()};
 anim.onfinish=finish;anim.oncancel=finish;
}
journalFloaters.forEach(paper=>{
 paper.addEventListener('pointermove',e=>{if(e.pointerType!=='mouse'||reducedJournalMotion.matches)return;const r=paper.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;paper.style.setProperty('--float-x',`${x*5}px`);paper.style.setProperty('--float-y',`${y*4-9}px`);paper.style.setProperty('--tilt-x',`${-y*7}deg`);paper.style.setProperty('--tilt-y',`${x*9}deg`)});
 paper.addEventListener('pointerleave',()=>['--float-x','--float-y','--tilt-x','--tilt-y'].forEach(v=>paper.style.removeProperty(v)));
 paper.addEventListener('click',e=>{if(e.target.closest('a'))return;bounceJournalPaper(paper)});
 if(paper.tagName==='ARTICLE')paper.addEventListener('keydown',e=>{if(e.target!==paper||!['Enter',' '].includes(e.key))return;e.preventDefault();bounceJournalPaper(paper)});
});
const journalCollage=document.querySelector('.journal-collage');
if(journalCollage)new IntersectionObserver(entries=>{journalInView=entries[0].isIntersecting;syncJournalFloat()},{threshold:.05}).observe(journalCollage);
document.addEventListener('visibilitychange',syncJournalFloat);
reducedJournalMotion.addEventListener('change',()=>{if(reducedJournalMotion.matches){journalIdleAnimations.forEach((a,el)=>{a.cancel();el.dataset.autoFloat='false'});journalIdleAnimations.clear();journalClickAnimations.forEach(a=>a.cancel());journalClickAnimations.clear();journalFloaters.forEach(el=>['--float-x','--float-y','--tilt-x','--tilt-y'].forEach(v=>el.style.removeProperty(v)))}else startJournalFloat()});
startJournalFloat();
let filePreviewScheduled=false;
function updateOpenPreviews(){if(filePreviewScheduled)return;filePreviewScheduled=true;requestAnimationFrame(()=>{fileItems.filter(x=>x.classList.contains('is-open')).forEach(positionFilePreview);filePreviewScheduled=false})}
addEventListener('scroll',updateOpenPreviews,{passive:true});addEventListener('resize',updateOpenPreviews);
// Keep a fixed device shell while new messages scroll inside its screen.
document.querySelectorAll('.chat-demo').forEach(chat=>{const body=chat.querySelector('.chat-body');new MutationObserver(()=>{body.scrollTo({top:body.scrollHeight,behavior:reducedJournalMotion.matches?'auto':'smooth'})}).observe(body,{attributes:true,attributeFilter:['hidden'],subtree:true})});
if(!hoverAvailable.matches){const hint=document.querySelector('.folder-instruction');if(hint)hint.textContent='轻点展开，再次点击进入项目。'}
