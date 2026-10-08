/* Träning — Starting Strength-logg.
   Används som flik i Systemet (index.html) och som egen sida (trana.html).
   Sidan som laddar filen anropar Trana.mount({rot, las, skriv}).
   Reglerna ligger överst så att de är lätta att hitta och ändra. */
(function(){
'use strict';

/* ---------- regler ---------- */
const STANG=20;                                  // kg
const SKIVOR=[25,20,15,10,5,2.5,1.25];           // skivor som finns, per styck
const LYFT={
  squat:   {namn:'Knäböj',    set:3, amrap:true},
  bench:   {namn:'Bänkpress', set:3, amrap:true},
  press:   {namn:'Axelpress', set:3, amrap:true},
  deadlift:{namn:'Marklyft',  set:1, amrap:false}
};
const PASS={A:['squat','press','deadlift'], B:['squat','bench','deadlift']};

const r25=x=>Math.round(x/2.5)*2.5;
const golv25=x=>Math.floor(x/2.5+1e-9)*2.5;
const fmt=n=>(Math.round(n*100)/100).toString().replace('.',',');
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

// Skivor på en sida av stången, tyngst först (så få skivor som möjligt).
function skivorPerSida(w){
  const lista=[];let kvar=(w-STANG)/2;
  if(kvar<=1e-9)return {lista,exakt:Math.abs(kvar)<1e-9};
  for(const p of SKIVOR){while(kvar>=p-1e-9){lista.push(p);kvar-=p;}}
  return {lista,exakt:kvar<1e-6};
}

// Uppvärmning: tom stång först, sedan färre reps ju närmare arbetsvikten.
// Marklyft hoppar över tom stång när det finns skivor att värma upp med.
function uppvarmning(id,w){
  if(w==null||w<=STANG)return [];
  let set;
  if(id==='deadlift'){
    if(w<50)set=[{w:STANG,r:5}];
    else{set=[{w:r25(w*.5),r:5},{w:r25(w*.75),r:3}];if(w>=100)set.push({w:r25(w*.9),r:2});}
  }else{
    const gap=w-STANG, tom=[{w:STANG,r:5},{w:STANG,r:5}];
    if(gap<10)set=tom;
    else if(gap<25)set=tom.concat([{w:STANG+r25(gap*.6),r:3}]);
    else if(gap<60)set=tom.concat([{w:STANG+r25(gap*.45),r:5},{w:STANG+r25(gap*.8),r:3}]);
    else set=tom.concat([{w:STANG+r25(gap*.35),r:5},{w:STANG+r25(gap*.6),r:3},{w:STANG+r25(gap*.85),r:2}]);
  }
  const ut=[];
  for(const s of set){
    const sw=Math.max(STANG,s.w);
    if(sw>=w)continue;
    const f=ut[ut.length-1];
    if(f&&f.w===sw&&sw!==STANG)continue;
    ut.push({w:sw,r:s.r});
  }
  return ut;
}

// Nästa vikt för ett lyft efter ett pass.
function nastaVikt(id,w,reps,fails){
  if(reps.some(x=>x<5)){
    const f=(fails||0)+1;
    if(f>=3)return {w:Math.max(STANG,golv25(w*.9)),fails:0,note:'−10 % efter 3 fail i rad'};
    return {w,fails:f,note:'Samma vikt, fail '+f+' av 3'};
  }
  const sista=reps[reps.length-1];
  if(LYFT[id].amrap&&sista>=10)return {w:w+5,fails:0,note:'+5 kg, '+sista+' reps på sista setet'};
  return {w:w+2.5,fails:0,note:'+2,5 kg'};
}

// Vilomål i sekunder. Vilan behöver växa när vikterna gör det.
function vilaMal(antalPass,typ,fail){
  if(typ==='uppv')return 60;
  const bas=antalPass<6?120:antalPass<18?180:300;
  return bas+(fail?60:0);
}

/* ---------- datum ---------- */
const pad=n=>String(n).padStart(2,'0');
const idagISO=()=>{const d=new Date();return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());};
const VD=['sön','mån','tis','ons','tor','fre','lör'];
const MN=['januari','februari','mars','april','maj','juni','juli','augusti','september','oktober','november','december'];

/* ---------- data ---------- */
// Allt som läses in (lagring, backup, länk) går genom normalisera, så trasig eller
// främmande data aldrig når skärmen.
const DATUM=/^\d{4}-\d{2}-\d{2}$/;
const tal=x=>(typeof x==='number'&&isFinite(x))?x:null;
const klamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function normalisera(s){
  if(!s||typeof s!=='object'||!s.lifts||typeof s.lifts!=='object')return null;
  const ut={v:1,updatedAt:tal(s.updatedAt)||0,nextPass:s.nextPass==='B'?'B':'A',lifts:{},history:[],current:null,summary:null};
  for(const id in LYFT){
    const l=s.lifts[id]||{},w=tal(l.w);
    ut.lifts[id]={w:(w!=null&&w>=STANG&&w<1000)?golv25(w+1e-9):null,fails:klamp(Math.floor(tal(l.fails)||0),0,2)};
  }
  if(Array.isArray(s.history))for(const e of s.history){
    if(!e||!PASS[e.pass]||!DATUM.test(e.date)||!Array.isArray(e.lifts))continue;
    ut.history.push({date:e.date,pass:e.pass,lifts:e.lifts
      .filter(l=>l&&LYFT[l.id]&&tal(l.w)!=null&&Array.isArray(l.reps))
      .map(l=>({id:l.id,w:l.w,reps:l.reps.map(r=>klamp(Math.floor(tal(r)||0),0,99))}))});
  }
  const c=s.current;
  if(c&&PASS[c.pass]&&DATUM.test(c.date)){
    const sets={};
    for(const id of PASS[c.pass]){
      const k=(c.sets&&c.sets[id])||{};
      sets[id]={warm:Array.isArray(k.warm)?k.warm.slice(0,8).map(Boolean):[],
        work:Array.from({length:LYFT[id].set},(_,i)=>{const v=tal(k.work&&k.work[i]);return v==null?null:klamp(Math.floor(v),0,99);})};
    }
    const t=c.timer;
    ut.current={date:c.date,pass:c.pass,sets,
      timer:(t&&tal(t.start))?{start:t.start,target:klamp(tal(t.target)||120,30,1800),label:typeof t.label==='string'?t.label.slice(0,80):'Vila'}:null};
  }
  const sm=s.summary;
  if(sm&&PASS[sm.pass]&&Array.isArray(sm.items)){
    ut.summary={pass:sm.pass,items:sm.items
      .filter(it=>it&&LYFT[it.id]&&tal(it.from)!=null&&tal(it.to)!=null)
      .map(it=>({id:it.id,from:it.from,to:it.to,note:typeof it.note==='string'?it.note.slice(0,80):''}))};
  }
  return ut;
}
const harLoggat=c=>Object.values(c.sets).some(s=>s.warm.some(Boolean)||s.work.some(v=>v!=null));

let opt=null,rot=null,state=null,utkast={},startPass='A',beepad=null,wake=null,actx=null,timerEl=null,meddelande='';

function lasLagrat(){try{const t=opt.las();return t?normalisera(JSON.parse(t)):null;}catch(e){return null;}}
function spara(){state.updatedAt=Date.now();try{opt.skriv(JSON.stringify(state));}catch(e){}}

/* ---------- vyer ---------- */
// Skivorna ritas i tävlingsfärger: 25 röd, 20 blå, 15 gul, 10 grön, 5 vit.
const PL={25:[10,54,'--tr-p25'],20:[9,54,'--tr-p20'],15:[8,48,'--tr-p15'],10:[7,42,'--tr-p10'],5:[6,32,'--tr-p5'],2.5:[5,26,'--tr-p2'],1.25:[4,22,'--tr-p1']};
function stangSvg(lista){
  const cy=30;let x=41,s='';
  for(const p of lista){
    const d=PL[p];
    s+='<rect x="'+x+'" y="'+(cy-d[1]/2)+'" width="'+d[0]+'" height="'+d[1]+'" rx="1.5" style="fill:var('+d[2]+');stroke:var(--tr-plate-edge);stroke-width:1"/>';
    x+=d[0]+1.5;
  }
  const lbl=lista.length?'Skivor per sida: '+lista.map(fmt).join(', ')+' kg':'Tom stång';
  return '<svg class="tr-bar" viewBox="26 0 112 60" role="img" aria-label="'+lbl+'">'+
    '<rect x="26" y="'+(cy-2)+'" width="9" height="4" rx="1" style="fill:var(--tr-steel)"/>'+
    '<rect x="35" y="'+(cy-9)+'" width="5" height="18" rx="1" style="fill:var(--tr-steel)"/>'+
    '<rect x="40" y="'+(cy-4)+'" width="108" height="8" rx="2" style="fill:var(--tr-steel)"/>'+s+'</svg>';
}
const skivText=l=>l.map(fmt).join(' + ');
const VDL=['söndag','måndag','tisdag','onsdag','torsdag','fredag','lördag'];
function langtDatum(iso){
  const d=new Date(iso+'T12:00:00');if(isNaN(d))return '';
  const t=VDL[d.getDay()]+' '+d.getDate()+' '+MN[d.getMonth()];
  return t[0].toUpperCase()+t.slice(1);
}

function vyStart(){
  const f=id=>'<label class="tr-field" for="tr-s-'+id+'"><span>'+LYFT[id].namn+'</span>'+
    '<input id="tr-s-'+id+'" type="text" inputmode="decimal" placeholder="kg" autocomplete="off"><small>kg</small></label>';
  return '<header class="tr-top"><div class="tr-eyebrow"><span>Starting Strength</span></div>'+
      '<h2 class="tr-h">Kom igång</h2>'+
      '<p class="tr-sub">Ange dina arbetsvikter. Lämna tomt där du inte vet, så hittar du vikten under första passet.</p></header>'+
    '<form id="tr-start" class="tr-setup">'+
      ['squat','press','bench','deadlift'].map(f).join('')+
      '<div class="tr-pairrow"><span>Första pass</span><div class="tr-pair">'+
        '<button type="button" data-tr="np" data-v="A" aria-pressed="'+(startPass==='A')+'">A</button>'+
        '<button type="button" data-tr="np" data-v="B" aria-pressed="'+(startPass==='B')+'">B</button></div></div>'+
      '<button class="tr-btn primary" type="submit">Spara och börja</button>'+
    '</form>'+(opt.backup?vyBackup():'');
}

function kvarSet(pass){
  let kvar=0;
  for(const id of PASS[pass]){
    if(state.lifts[id].w==null){kvar+=LYFT[id].set;continue;}
    const s=state.current&&state.current.sets[id];
    kvar+=s?s.work.filter(v=>v==null).length:LYFT[id].set;
  }
  return kvar;
}

function vyPass(){
  const c=state.current,pass=c?c.pass:state.nextPass,ids=PASS[pass],annan=pass==='A'?'B':'A';
  const datum=c?c.date:idagISO(),gammalt=c&&c.date!==idagISO();
  const kvar=kvarSet(pass);
  let h='<header class="tr-top"><div class="tr-eyebrow"><span>Starting Strength</span><span>'+(gammalt?'Ej avslutat pass':'')+'</span></div>'+
    '<h2 class="tr-h">Pass '+pass+'</h2>'+
    '<p class="tr-sub">'+langtDatum(datum)+' · '+ids.map(i=>LYFT[i].namn.toLowerCase()).join(', ')+'</p>'+
    (c?'':'<button class="tr-link" type="button" data-tr="byt">Kör pass '+annan+' istället</button>')+'</header>';
  if(state.summary)h+=vySammanfattning();
  for(const id of ids)h+=vyLyft(id);
  h+='<div class="tr-finish"><button class="tr-btn primary" type="button" data-tr="avsluta"'+(kvar?' disabled':'')+'>Avsluta pass '+pass+'</button>'+
    '<p class="tr-hint">'+(kvar?kvar+' arbetsset kvar att logga. Tryck ✓ när setet är klart, eller sänk antalet reps först om det blev färre.'
      :'Alla arbetsset är loggade. Nya vikter räknas ut när du avslutar.')+'</p>'+
    (c?'<button class="tr-link" type="button" data-tr="nollstall">Nollställ passet</button>':'')+'</div>';
  h+=vyHistorik()+vyRegler()+(opt.backup?vyBackup():'');
  return h;
}

function vySammanfattning(){
  const s=state.summary;
  return '<div class="tr-summary" role="status"><h3>Pass '+s.pass+' klart</h3><ul>'+s.items.map(it=>
    '<li><span>'+LYFT[it.id].namn+'</span><b>'+fmt(it.from)+' → '+fmt(it.to)+' kg</b><small>'+esc(it.note)+'</small></li>').join('')+
    '</ul><button class="tr-link" type="button" data-tr="stang">Stäng</button></div>';
}

function vyLyft(id){
  const L=LYFT[id],w=state.lifts[id].w,c=state.current;
  const s=c&&c.sets[id]?c.sets[id]:{warm:[],work:Array(L.set).fill(null)};
  let h='<section class="tr-lift" id="tr-'+id+'"><div class="tr-lift-head"><h2>'+L.namn+'</h2>'+
    '<span class="tr-scheme">'+(L.amrap?'3 × 5, sista setet 5+':'1 × 5, alltid 5 reps')+'</span></div>';
  if(w==null){
    return h+'<div class="tr-nostart"><p><b>Startvikt saknas.</b> Kör tom stång × 5 och öka cirka 5 kg per set tills stången går tydligt långsammare. Den vikten blir din arbetsvikt.</p>'+
      '<button class="tr-btn" type="button" data-tr="startvikt" data-id="'+id+'">Sätt startvikt</button></div></section>';
  }
  const sk=skivorPerSida(w),last=s.work.some(v=>v!=null),namn=L.namn.toLowerCase();
  h+='<div class="tr-load"><div class="tr-weight">'+
      '<button class="tr-adj" type="button" data-tr="vned" data-id="'+id+'"'+(last?' disabled':'')+' aria-label="Sänk '+namn+' 2,5 kg">−</button>'+
      '<span class="tr-kg">'+fmt(w)+'<small>kg</small></span>'+
      '<button class="tr-adj" type="button" data-tr="vupp" data-id="'+id+'"'+(last?' disabled':'')+' aria-label="Höj '+namn+' 2,5 kg">+</button></div>'+
    stangSvg(sk.lista)+
    '<p class="tr-perside">'+(sk.lista.length?'Per sida: <b>'+skivText(sk.lista)+'</b>':'Tom stång, inga skivor')+(sk.exakt?'':' (går inte att lasta exakt)')+'</p>'+
    '</div><ol class="tr-sets">';
  uppvarmning(id,w).forEach((x,i)=>{
    const gj=!!s.warm[i],pl=skivorPerSida(x.w).lista;
    h+='<li class="tr-set warm'+(gj?' done':'')+'"><span class="tr-tag">Uppv</span>'+
      '<span class="tr-sw"><b>'+fmt(x.w)+' kg</b><small>'+(pl.length?skivText(pl)+' per sida':'tom stång')+'</small></span>'+
      '<span class="tr-rp">× '+x.r+'</span>'+
      '<button class="tr-chk" type="button" data-tr="uppv" data-id="'+id+'" data-i="'+i+'" aria-pressed="'+gj+'" aria-label="Uppvärmning '+(i+1)+', '+fmt(x.w)+' kg, klar">✓</button></li>';
  });
  for(let i=0;i<L.set;i++){
    const v=s.work[i],loggad=v!=null,amrap=L.amrap&&i===L.set-1,k=id+':'+i;
    const d=utkast[k]!=null?utkast[k]:5,lbl=L.set===1?'Set':'Set '+(i+1);
    const klass=loggad?(v>=5?' ok':' fail'):'';
    const under=amrap?'så många du säkert klarar':(L.amrap?'5 reps':'exakt 5 reps');
    const mitt=loggad
      ?'<span class="tr-rp tr-res">'+v+' reps'+(v<5?' · fail':'')+'</span>'
      :'<span class="tr-step"><button type="button" data-tr="minus" data-k="'+k+'" aria-label="Färre reps">−</button>'+
        '<output aria-live="polite">'+d+'</output><button type="button" data-tr="plus" data-k="'+k+'" aria-label="Fler reps">+</button></span>';
    const knapp=loggad
      ?'<button class="tr-chk undo" type="button" data-tr="logga" data-id="'+id+'" data-i="'+i+'" aria-label="Ångra '+lbl.toLowerCase()+'">↺</button>'
      :'<button class="tr-chk" type="button" data-tr="logga" data-id="'+id+'" data-i="'+i+'" aria-label="Spara '+lbl.toLowerCase()+'">✓</button>';
    h+='<li class="tr-set work'+klass+'"><span class="tr-tag">'+lbl+(amrap?'<em>5+</em>':'')+'</span>'+
      '<span class="tr-sw"><b>'+fmt(w)+' kg</b><small>'+under+'</small></span>'+mitt+knapp+'</li>';
  }
  return h+'</ol></section>';
}

function vyHistorik(){
  const n=state.history.length;
  const rader=state.history.slice().reverse().map(e=>'<li><span class="h-date">'+esc(langtDatum(e.date))+' · Pass '+e.pass+'</span>'+
    e.lifts.map(l=>'<span class="h-line">'+LYFT[l.id].namn+' '+fmt(l.w)+' kg × '+l.reps.map(r=>r<5?'<span class="f">'+r+'</span>':r).join(', ')+'</span>').join('')+'</li>').join('');
  return '<details class="tr-drawer" data-f="hist"><summary>Historik <small>'+n+' pass</small></summary>'+
    '<div class="tr-drawer-body">'+(n?'<ol class="tr-hist">'+rader+'</ol>':'<p class="tr-hint">Inga avslutade pass än.</p>')+'</div></details>';
}

function vyRegler(){
  return '<details class="tr-drawer" data-f="regler"><summary>Regler</summary><div class="tr-drawer-body"><ul class="tr-rules">'+
    '<li>Tre pass i veckan, mån, ons och fre. Vecka 1 blir A B A och vecka 2 B A B.</li>'+
    '<li>A: knäböj 3 × 5, axelpress 3 × 5, marklyft 1 × 5. B: knäböj 3 × 5, bänkpress 3 × 5, marklyft 1 × 5.</li>'+
    '<li>Sista setet i knäböj, bänk och axelpress är 5+. Klarar du alla set blir det +2,5 kg nästa pass. 10 eller fler reps på sista setet ger +5 kg.</li>'+
    '<li>Marklyft är alltid exakt 5 reps och ökar 2,5 kg.</li>'+
    '<li>Under 5 reps i något set är fail och ger samma vikt nästa gång. Tre fail i rad ger −10 %, avrundat nedåt till närmaste 2,5 kg.</li>'+
    '<li>Vilotimern startar när du loggar ett set. Målet är 2 min de första sex passen, 3 min till och med pass 18 och sedan 5 min. Efter ett fail läggs 1 min till, efter uppvärmning gäller 1 min. Timern räknar vidare, så vila längre om du behöver.</li>'+
    '<li>Stången väger 20 kg. Skivor: 25, 20, 15, 10, 5, 2,5 och 1,25 kg.</li>'+
  '</ul></div></details>';
}

function vyBackup(){
  return '<details class="tr-drawer" data-f="backup"><summary>Backup</summary><div class="tr-drawer-body">'+
    '<p class="tr-hint">Datan finns bara i den här telefonen. Kopiera den som text ibland och spara den, till exempel i Anteckningar. Klistra in texten här för att återställa eller flytta till en ny telefon.</p>'+
    '<button class="tr-btn" type="button" data-tr="kopiera">Kopiera backup</button>'+
    '<textarea id="tr-backup" placeholder="Klistra in backup här" aria-label="Backup-text"></textarea>'+
    '<button class="tr-btn" type="button" data-tr="aterstall">Återställ från backup</button>'+
    '<p class="tr-saved" id="tr-saved">'+esc(meddelande)+'</p></div></details>';
}

function rita(){
  if(!rot)return;
  const oppna=[...rot.querySelectorAll('details[open]')].map(d=>d.dataset.f);
  const ta=rot.querySelector('#tr-backup'),taV=ta?ta.value:'';
  rot.innerHTML='<div class="tr">'+(state?vyPass():vyStart())+'</div>';
  oppna.forEach(f=>{const d=rot.querySelector('details[data-f="'+f+'"]');if(d)d.open=true;});
  const ta2=rot.querySelector('#tr-backup');if(ta2&&taV)ta2.value=taV;
  tick();
}

/* ---------- timer, ljud, skärm ---------- */
function skapaTimer(){
  timerEl=document.createElement('div');
  timerEl.className='tr-timer';timerEl.hidden=true;
  timerEl.innerHTML='<div class="tr-t-track"><div class="tr-t-fill"></div></div><div class="tr-t-row">'+
    '<div class="tr-t-label"><span class="tr-t-text">Vila</span><small class="tr-t-mal"></small></div>'+
    '<div class="tr-t-time" role="timer">0:00</div><button class="tr-t-stop" type="button">Stopp</button></div>';
  document.body.appendChild(timerEl);
  timerEl.querySelector('.tr-t-stop').onclick=()=>{if(state&&state.current){state.current.timer=null;spara();}tick();};
}
function startaTimer(mal,text){state.current.timer={start:Date.now(),target:mal,label:text};beepad=null;}
const mmss=s=>Math.floor(s/60)+':'+pad(s%60);
function tick(){
  if(!timerEl)return;
  const t=state&&state.current&&state.current.timer;
  timerEl.hidden=!t;document.body.classList.toggle('tr-timer-pa',!!t);
  if(!t)return;
  const gatt=Math.max(0,Math.floor((Date.now()-t.start)/1000)),redo=gatt>=t.target;
  timerEl.classList.toggle('redo',redo);
  timerEl.querySelector('.tr-t-fill').style.width=Math.min(100,gatt/t.target*100)+'%';
  // varje siffra får en fast bredd, så att tiden inte hoppar i sidled
  timerEl.querySelector('.tr-t-time').innerHTML=mmss(gatt).split('').map(c=>c===':'?'<i class="c">:</i>':'<i>'+c+'</i>').join('');
  timerEl.querySelector('.tr-t-text').textContent=redo?'Redo för nästa set':t.label;
  timerEl.querySelector('.tr-t-mal').textContent='Mål '+mmss(t.target);
  if(redo&&beepad!==t.start){if(gatt-t.target<3&&!document.hidden)signal();beepad=t.start;}
}
function lasUppLjud(){
  try{const AC=window.AudioContext||window.webkitAudioContext;
    if(!actx&&AC)actx=new AC();if(actx&&actx.state==='suspended')actx.resume();}catch(e){}
}
function signal(){
  try{if(navigator.vibrate)navigator.vibrate([200,100,200]);}catch(e){}
  try{if(!actx)return;const nu=actx.currentTime;
    [0,.22,.44].forEach(o=>{const osc=actx.createOscillator(),g=actx.createGain();
      osc.type='sine';osc.frequency.value=880;
      g.gain.setValueAtTime(.0001,nu+o);g.gain.exponentialRampToValueAtTime(.25,nu+o+.02);g.gain.exponentialRampToValueAtTime(.0001,nu+o+.16);
      osc.connect(g);g.connect(actx.destination);osc.start(nu+o);osc.stop(nu+o+.18);});
  }catch(e){}
}
async function hallVaken(){
  try{if('wakeLock' in navigator&&!wake){wake=await navigator.wakeLock.request('screen');wake.addEventListener('release',()=>{wake=null;});}}catch(e){wake=null;}
}
function slappSkarm(){try{if(wake)wake.release();}catch(e){}wake=null;}

/* ---------- handlingar ---------- */
function sakraPass(){
  if(state.current)return;
  const pass=state.nextPass,sets={};
  for(const id of PASS[pass])sets[id]={warm:[],work:Array(LYFT[id].set).fill(null)};
  state.current={date:idagISO(),pass,sets,timer:null};
}
function avsluta(){
  const c=state.current;if(!c)return;
  const ids=PASS[c.pass];
  for(const id of ids)if(state.lifts[id].w==null||c.sets[id].work.some(v=>v==null))return;
  const post={date:c.date,pass:c.pass,lifts:[]},items=[];
  for(const id of ids){
    const w=state.lifts[id].w,reps=c.sets[id].work.slice(),n=nastaVikt(id,w,reps,state.lifts[id].fails);
    post.lifts.push({id,w,reps});items.push({id,from:w,to:n.w,note:n.note});
    state.lifts[id]={w:n.w,fails:n.fails};
  }
  state.history.push(post);
  state.summary={pass:c.pass,items};
  state.nextPass=c.pass==='A'?'B':'A';
  state.current=null;utkast={};
  slappSkarm();spara();rita();
  const topp=rot.getBoundingClientRect().top+window.scrollY-10;
  window.scrollTo({top:Math.max(0,topp),behavior:'smooth'});
}
function kvittera(t){meddelande=t;const e=rot.querySelector('#tr-saved');if(e)e.textContent=t;}

function vidKlick(e){
  const b=e.target.closest('[data-tr]');
  if(!b||b.disabled||!rot.contains(b))return;
  lasUppLjud();
  const a=b.dataset.tr,id=b.dataset.id,i=Number(b.dataset.i),k=b.dataset.k;

  if(a==='np'){startPass=b.dataset.v;rita();return;}
  if(a==='kopiera'){
    const txt=JSON.stringify(state||{}),ta=rot.querySelector('#tr-backup');
    const reserv=()=>{if(ta){ta.value=txt;ta.focus();ta.select();}kvittera('Markerad — kopiera manuellt');};
    try{if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(txt).then(()=>kvittera('Kopierad'),reserv);else reserv();}catch(err){reserv();}
    return;
  }
  if(a==='aterstall'){
    const ta=rot.querySelector('#tr-backup');let s=null;
    try{s=normalisera(JSON.parse((ta&&ta.value)||''));}catch(err){}
    if(!s){kvittera('Texten är ingen träningsbackup');return;}
    if(state&&!confirm('Ersätta träningsdatan på den här enheten med backupen?'))return;
    state=s;utkast={};spara();meddelande='Återställd';rita();return;
  }
  if(!state)return;

  switch(a){
    case 'byt':state.nextPass=state.nextPass==='A'?'B':'A';spara();rita();break;
    case 'startvikt':state.lifts[id].w=STANG;spara();rita();break;
    case 'vupp':case 'vned':{
      const w=state.lifts[id].w;state.lifts[id].w=a==='vupp'?w+2.5:Math.max(STANG,w-2.5);spara();rita();break;}
    case 'uppv':{
      sakraPass();const arr=state.current.sets[id].warm;arr[i]=!arr[i];
      if(arr[i])startaTimer(vilaMal(state.history.length,'uppv',false),'Vila efter uppvärmning, '+LYFT[id].namn.toLowerCase());
      state.summary=null;hallVaken();spara();rita();break;}
    case 'minus':case 'plus':{
      const [lid,si]=k.split(':'),L=LYFT[lid];
      const max=(L.amrap&&Number(si)===L.set-1)?50:5,nu=utkast[k]!=null?utkast[k]:5;
      utkast[k]=klamp(nu+(a==='plus'?1:-1),0,max);
      const o=b.parentElement.querySelector('output');if(o)o.textContent=utkast[k];break;}
    case 'logga':{
      sakraPass();const work=state.current.sets[id].work;
      if(work[i]!=null){work[i]=null;spara();rita();break;}   // tryck igen = ångra
      const reps=utkast[id+':'+i]!=null?utkast[id+':'+i]:5;work[i]=reps;
      const L=LYFT[id];
      startaTimer(vilaMal(state.history.length,'arb',reps<5),'Vila efter '+(L.set===1?'set':'set '+(i+1))+', '+L.namn.toLowerCase());
      state.summary=null;hallVaken();spara();rita();break;}
    case 'avsluta':avsluta();break;
    case 'nollstall':
      if(!confirm('Nollställa passet? Det du loggat idag försvinner.'))break;
      state.current=null;utkast={};slappSkarm();spara();rita();break;
    case 'stang':state.summary=null;spara();rita();break;
  }
}
function vidSkicka(e){
  if(e.target.id!=='tr-start')return;
  e.preventDefault();
  const lifts={};
  for(const id in LYFT){
    const el=rot.querySelector('#tr-s-'+id),v=parseFloat(String((el&&el.value)||'').replace(',','.'));
    lifts[id]={w:(isFinite(v)&&v>0)?Math.max(STANG,r25(v)):null,fails:0};
  }
  state={v:1,updatedAt:0,nextPass:startPass,lifts,history:[],current:null,summary:null};
  spara();rita();
}

// En länk som slutar på #trana=… lägger in träningsdata (används för att flytta data hit).
// Returnerar true om sidan öppnades med en sådan länk.
function importFranLank(){
  const m=(location.hash||'').match(/trana=([A-Za-z0-9_\-]+=*)/);
  if(!m)return false;
  history.replaceState(null,'',location.pathname+location.search);
  let s=null;
  try{const bin=atob(m[1].replace(/-/g,'+').replace(/_/g,'/'));
    s=normalisera(JSON.parse(new TextDecoder().decode(Uint8Array.from(bin,c=>c.charCodeAt(0)))));}catch(e){}
  if(!s){meddelande='Länken gick inte att läsa';return true;}
  if(state&&state.history.length&&!confirm('Ersätta träningsdatan på den här enheten med den från länken?'))return true;
  state=s;utkast={};spara();
  return true;
}

/* ---------- utåt ---------- */
window.Trana={
  mount(o){
    opt=Object.assign({backup:false},o);rot=opt.rot;
    state=lasLagrat();
    // Ett pass från en tidigare dag där inget loggades räknas inte.
    if(state&&state.current&&state.current.date!==idagISO()&&!harLoggat(state.current))state.current=null;
    const importerat=importFranLank();
    skapaTimer();
    rot.addEventListener('click',vidKlick);
    rot.addEventListener('submit',vidSkicka);
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){if(state&&state.current)hallVaken();tick();}});
    // Länken kan öppnas i en flik där sidan redan är laddad — då ändras bara #-delen.
    window.addEventListener('hashchange',()=>{if(importFranLank()){rita();if(opt.vidImport)opt.vidImport();}});
    setInterval(tick,250);
    rita();
    if(importerat&&opt.vidImport)opt.vidImport();
  },
  rita(){if(rot){const s=lasLagrat();if(s&&(!state||s.updatedAt>state.updatedAt))state=s;rita();}},
  // Läs om från lagringen, t.ex. när synken hämtat en nyare version från en annan enhet.
  lasOm(){if(rot){const s=lasLagrat();if(s){state=s;rita();}}},
  // 'A', 'B' eller null — vilket pass som avslutades ett visst datum (för Vecka-fliken).
  passPa(datum){
    const s=state||(opt?lasLagrat():null);if(!s)return null;
    const p=s.history.filter(e=>e.date===datum).map(e=>e.pass);
    return p.length?p.join('+'):null;
  },
  // Synk: av två lagrade versioner, behåll den som ändrades senast.
  valjNyast(a,b){
    let pa=null,pb=null;
    try{pa=a?normalisera(JSON.parse(a)):null;}catch(e){}
    try{pb=b?normalisera(JSON.parse(b)):null;}catch(e){}
    if(!pa)return pb?b:a;if(!pb)return a;
    return pb.updatedAt>pa.updatedAt?b:a;
  },
  _test:{skivorPerSida,uppvarmning,nastaVikt,vilaMal,normalisera}
};
})();
