const FONTS = [
  "Adellia","Alleysha","Attractive","Beasley","Beatrica","Beatrica Regular Alt",
  "Bella Bellia","Best Love","Billastim","Bionetha","Blastine","Callistera",
  "Contributor Regular","DesertSong","EverleighMedium","EverleighScript",
  "Gloomy Saturday Script","Heart Haily","IHeartIt","Insyira","Insyria",
  "Lilypaly","Jantan","Leafing","Lucky Spark","Margenta","Marlborolah",
  "PoetryDarling","PoetryDarling Italic","Quanika","Roberts Humter",
  "Rottarity","Rusthian","Scriptys","Sweetgentle"
];

// Ancienne liste OVERSIZED archivee - remplacee par BELLA_CLUSTER
// const OVERSIZED_FONTS = ["Lilypaly","Blastine","Marlborolah","Adellia","IHeartIt","Heart Haily","Billastim","Bella Bellia","Margenta"];

// Bella Bellia fait foi - cluster naturel BIC : on repart de 0
// Mesure ressemble.js-like (PIL + SSIM) a 120px sur echantillons Bella Bellia / alphabet / Salut / ompa
// + gap x-height a 0.75cm (75px/80px, nudge 1mm) sur "e" : Bella 4.5, Jantan 5.5, Billastim 3.0, Scriptys 6.0, Roberts 5.5 (tous ~1mm flottement similaire)
// HR/WR proches de 1.0 : Jantan 0.86/1.03, Billastim 0.99/1.10, Scriptys ~0.73/0.85, Roberts ~0.88/0.95
// MSE le plus bas vs Bella : Jantan 0.0516, Billastim 0.0651, Scriptys 0.0858, Roberts 0.0875
// Selection retenue : 4 fonts extremement similaires a Bella Bellia (meme taille, sans gap, legeres imperfections)
// => raccord parfait mais lettres jamais identiques (effet BIC naturel)
const BELLA_CLUSTER = [
  "Bella Bellia",
  "Jantan",
  "Roberts Humter"
];
const OVERSIZED_FONTS = []; // desactive - on repart de 0
const FLOATING_FONTS = []; // desactive - remplace par BELLA_CLUSTER
const ENABLED_FONTS = BELLA_CLUSTER;

const root = document.documentElement.style;
const fontListEl = document.getElementById('fontList');
const fontPool = document.getElementById('fontPool');
const fontToggle = document.getElementById('fontToggle');
fontToggle.addEventListener('click', () => {
  fontPool.classList.toggle('open');
  fontToggle.classList.toggle('open');
  fontToggle.textContent = fontPool.classList.contains('open') ? '<' : '>';
});
FONTS.forEach(f => {
  const label = document.createElement('label');
  const checkedAttr = ENABLED_FONTS.includes(f) ? 'checked' : '';
  label.innerHTML = `<input type="checkbox" value="${f}" ${checkedAttr}><span style="font-family:'${f}',cursive">${f}</span>${f === "Bella Bellia" ? ' <small style="opacity:.5">(reference)</small>' : ENABLED_FONTS.includes(f) ? ' <small style="opacity:.5">(similaire)</small>' : ' <small style="opacity:.5">(ecarte)</small>'}`;
  fontListEl.appendChild(label);
});
function getActiveFonts(){
  const boxes = [...fontListEl.querySelectorAll('input[type=checkbox]')];
  const active = boxes.filter(b => b.checked).map(b => b.value);
  return active.length ? active : FONTS;
}
document.getElementById('selAll').addEventListener('click', () => {
  fontListEl.querySelectorAll('input').forEach(b => b.checked = true);
});
document.getElementById('selNone').addEventListener('click', () => {
  fontListEl.querySelectorAll('input').forEach(b => b.checked = false);
});

// ---- Generic letter-by-letter random-font editor ----
function createZoneEditor(inputEl, displayEl, placeholderEl){
  let state = [];

  function stateToText(){ return state.map(s => s.ch).join(''); }

  function render(){
    displayEl.innerHTML = '';
    const frag = document.createDocumentFragment();
    // Decoupe en lignes pour que chaque ligne (meme vide) garde var(--line-h)
    const lines = [];
    let cur = [];
    state.forEach(s => {
      if (s.ch === '\n') {
        lines.push(cur);
        cur = [];
      } else {
        cur.push(s);
      }
    });
    lines.push(cur);
    lines.forEach(lineChars => {
      const lineDiv = document.createElement('div');
      lineDiv.style.minHeight = 'var(--line-h)';
      lineDiv.style.lineHeight = 'var(--line-h)';
      lineDiv.style.whiteSpace = 'pre-wrap';
      lineDiv.style.wordBreak = 'break-word';
      if (lineChars.length === 0) {
        const filler = document.createElement('span');
        filler.textContent = '\u00A0';
        filler.style.visibility = 'hidden';
        filler.style.fontSize = 'var(--font-size)';
        filler.style.letterSpacing = 'var(--letter-spacing)';
        lineDiv.appendChild(filler);
      } else {
        lineChars.forEach(s => {
          const span = document.createElement('span');
          span.textContent = s.ch;
          span.style.fontFamily = `'${s.font}', cursive`;
          lineDiv.appendChild(span);
        });
      }
      frag.appendChild(lineDiv);
    });
    displayEl.appendChild(frag);
    if (placeholderEl) placeholderEl.style.display = state.length ? 'none' : 'block';
  }

  function applyNewValue(newValue){
    const oldValue = stateToText();
    if (newValue === oldValue) return;
    let prefix = 0;
    const maxPrefix = Math.min(oldValue.length, newValue.length);
    while (prefix < maxPrefix && oldValue[prefix] === newValue[prefix]) prefix++;
    let suffix = 0;
    const maxSuffix = Math.min(oldValue.length, newValue.length) - prefix;
    while (suffix < maxSuffix &&
           oldValue[oldValue.length - 1 - suffix] === newValue[newValue.length - 1 - suffix]) {
      suffix++;
    }
    const removedCount = oldValue.length - prefix - suffix;
    const insertedText = newValue.slice(prefix, newValue.length - suffix);
    const fonts = getActiveFonts();
    const newEntries = [...insertedText].map(ch => ({
      ch, font: fonts[Math.floor(Math.random() * fonts.length)]
    }));
    state.splice(prefix, removedCount, ...newEntries);
    render();
  }

  inputEl.addEventListener('input', () => applyNewValue(inputEl.value));
  inputEl.parentElement.addEventListener('click', () => { const sy=window.scrollY; inputEl.focus(); requestAnimationFrame(()=>window.scrollTo(0,sy)); });

  return {
    getState: () => state,
    setState: (newState) => {
      state = newState || [];
      inputEl.value = stateToText();
      render();
    },
    clear: () => { state = []; inputEl.value = ''; render(); }
  };
}

const marginEditor = createZoneEditor(
  document.getElementById('inputMargin'),
  document.getElementById('displayMargin'),
  null
);
// ---- Toolbar bindings ----
const inkColor = document.getElementById('inkColor');
const fontSize = document.getElementById('fontSize');
const fontSizeVal = document.getElementById('fontSizeVal');
const alignMain = document.getElementById('alignMain');
const vNudge = document.getElementById('vNudge');
const vNudgeVal = document.getElementById('vNudgeVal');
const letterSpacing = document.getElementById('letterSpacing');
const letterSpacingVal = document.getElementById('letterSpacingVal');
const printSeyes = document.getElementById("printSeyes");
const pageEl = document.querySelector(".page");
const lineH = document.getElementById('lineH');
const lineHVal = document.getElementById('lineHVal');
const statusEl = document.getElementById('status');

inkColor.addEventListener('input', () => root.setProperty('--ink', inkColor.value));
fontSize.addEventListener('input', () => {
  fontSizeVal.textContent = fontSize.value;
  root.setProperty('--font-size', fontSize.value + 'cm');
});
alignMain.addEventListener('change', () => root.setProperty('--align-main', alignMain.value));
vNudge.addEventListener('input', () => {
  vNudgeVal.textContent = vNudge.value;
  root.setProperty('--first-line-y', `calc(3.285cm + ${vNudge.value}mm)`);
});
letterSpacing.addEventListener('input', () => {
  letterSpacingVal.textContent = letterSpacing.value;
  root.setProperty('--letter-spacing', letterSpacing.value + 'px');
});
printSeyes.addEventListener('change', () => { document.querySelectorAll('.page').forEach(p=>p.classList.toggle('print-seyes', printSeyes.checked)); });
lineH.addEventListener('input', () => {
  lineHVal.textContent = parseFloat(lineH.value).toFixed(2);
  root.setProperty('--line-h', lineH.value + 'cm');
});
function resetBlink(){
  virtualCursor.style.animation='none';
  void virtualCursor.offsetWidth;
  virtualCursor.style.animation='blink 1s step-start infinite';
}
// Curseur virtuel qui se faufile entre les span du display
const virtualCursor = document.getElementById('virtualCursor');
function updateVirtualCursor(){
  const input = document.getElementById('inputMain');
  if(!input) return;
  if(virtualCursor.parentElement) virtualCursor.remove();
  const pos = input.selectionStart;
  const displays = [...document.querySelectorAll('.zone-stage.main .zone-display')];
  let cur=0;
  for(const display of displays){
    const lines = display.querySelectorAll(':scope > div');
    for(let li=0; li<lines.length; li++){
      const line=lines[li];
      const spans=[...line.querySelectorAll('span')].filter(s=>s.textContent!=='\u00A0');
      const lineLen = line.textContent.replace(/\u00A0/g,'').length;
      if(pos >= cur && pos <= cur+lineLen){
        const inner = pos - cur;
        if(inner < spans.length){
          line.insertBefore(virtualCursor, spans[inner]);
        } else if(spans.length){
          spans[spans.length-1].after(virtualCursor);
        } else {
          line.appendChild(virtualCursor);
        }
        virtualCursor.style.display='inline-block';
        virtualCursor.style.position='';
        virtualCursor.style.inset='';
        return;
      }
      if(pos === cur+lineLen && pos < cur+lineLen+1){
        const nextLine=lines[li+1];
        if(nextLine){
          nextLine.prepend(virtualCursor);
          virtualCursor.style.display='inline-block';
          virtualCursor.style.position='';
          virtualCursor.style.inset='';
          return;
        }
      }
      cur+=lineLen+1;
    }
  }
  // fin : superpose sur la dernière lettre de la dernière page
  const allDisplays = document.querySelectorAll('.zone-stage.main .zone-display');
  const lastDisp = allDisplays[allDisplays.length-1];
  if(lastDisp){
    const lastLine=[...lastDisp.querySelectorAll(':scope > div')].pop();
    if(lastLine){
      const lastSpans=[...lastLine.querySelectorAll('span')].filter(s=>s.textContent!=='\u00A0');
      if(lastSpans.length){
        const last=lastSpans[lastSpans.length-1];
        last.style.position='relative';
        last.appendChild(virtualCursor);
      } else {
        lastLine.appendChild(virtualCursor);
      }
      virtualCursor.style.display='block';
      virtualCursor.style.position='absolute';
      virtualCursor.style.inset='0';
      resetBlink();
    } else {
      resetBlink();
    }
  } else {
    resetBlink();
  }
}
document.getElementById('inputMain')?.addEventListener('input', ()=> setTimeout(updateVirtualCursor,0));
document.getElementById('inputMain')?.addEventListener('click', ()=> setTimeout(updateVirtualCursor,0));
document.getElementById('inputMain')?.addEventListener('keyup', ()=> setTimeout(updateVirtualCursor,0));
document.getElementById('inputMain')?.addEventListener('select', ()=> setTimeout(updateVirtualCursor,0));
document.addEventListener('selectionchange', ()=>{ if(document.activeElement===document.getElementById('inputMain')) setTimeout(updateVirtualCursor,0); });
document.getElementById('inputMain')?.addEventListener('focus', ()=>{ virtualCursor.style.display='block'; setTimeout(updateVirtualCursor,0); });
document.getElementById('inputMain')?.addEventListener('blur', ()=>{ virtualCursor.style.display='none'; });
document.getElementById('inputMain')?.addEventListener('keydown', (e)=>{
  if(e.key.startsWith('Arrow') || e.key==='Home' || e.key==='End'){
    setTimeout(()=>{ updateVirtualCursor(); resetBlink(); },0);
  }
});
// Surlignage des spans selectionnés
function updateSelectionHighlight(){
  const input=document.getElementById('inputMain');
  if(!input) return;
  const selStart=input.selectionStart;
  const selEnd=input.selectionEnd;
  const hasSel=selStart!==selEnd;
  document.querySelectorAll('.zone-display').forEach(disp=>{
    [...disp.querySelectorAll('span')].forEach(span=>{
      if(!hasSel){ span.classList.remove('span-highlight'); return; }
    });
  });
  if(!hasSel) return;
  const allSpans=[...document.querySelectorAll('.zone-stage.main .zone-display span')].filter(s=>s.textContent!=='\u00A0');
  let idx=0;
  allSpans.forEach(span=>{
    if(idx>=selStart && idx<selEnd) span.classList.add('span-highlight');
    else span.classList.remove('span-highlight');
    idx++;
  });
}
document.getElementById('inputMain')?.addEventListener('input', ()=> setTimeout(updateSelectionHighlight,0));
document.getElementById('inputMain')?.addEventListener('click', ()=> setTimeout(updateSelectionHighlight,0));
document.getElementById('inputMain')?.addEventListener('keyup', ()=> setTimeout(updateSelectionHighlight,0));
document.getElementById('inputMain')?.addEventListener('select', ()=> setTimeout(updateSelectionHighlight,0));
document.addEventListener('selectionchange', ()=>{ if(document.activeElement===document.getElementById('inputMain')) setTimeout(updateSelectionHighlight,0); });
document.getElementById('inputMain')?.addEventListener('blur', ()=>{ document.querySelectorAll('.span-highlight').forEach(s=>s.classList.remove('span-highlight')); });

// Selection de spans par clic et drag sur la zone d'affichage
(function(){
  const input=document.getElementById('inputMain');
  if(!input) return;
  let dragging=false;
  let dragStartIdx=-1;
  function getCursorPos(e){
    const el=document.elementFromPoint(e.clientX,e.clientY);
    if(!el||el.tagName!=='SPAN') return -1;
    const displays=[...document.querySelectorAll('.zone-stage.main .zone-display')];
    let globalOffset=0;
    for(const disp of displays){
      const spans=[...disp.querySelectorAll('span')].filter(s=>s.textContent!=='\u00A0');
      if(disp.contains(el)){
        const localIdx=spans.indexOf(el);
        if(localIdx<0) return -1;
        const rect=el.getBoundingClientRect();
        const midX=rect.left+rect.width/2;
        const pos=globalOffset+localIdx;
        return e.clientX < midX ? pos : pos+1;
      }
      globalOffset+=spans.length;
    }
    return -1;
  }
  function setCursorAt(idx){
    if(idx<0) return;
    const sy=window.scrollY;
    input.focus();
    requestAnimationFrame(()=>window.scrollTo(0,sy));
    input.setSelectionRange(idx,idx);
    setTimeout(()=>{ updateVirtualCursor(); updateSelectionHighlight(); resetBlink(); },0);
  }
  function setSelection(a,b){
    const start=Math.min(a,b);
    const end=Math.max(a,b);
    const sy=window.scrollY;
    input.focus();
    requestAnimationFrame(()=>window.scrollTo(0,sy));
    input.setSelectionRange(start,end);
    setTimeout(()=>{ updateVirtualCursor(); updateSelectionHighlight(); },0);
  }
  document.addEventListener('mousedown',(e)=>{
    if(!e.target.closest('.zone-stage.main')) return;
    const idx=getCursorPos(e);
    if(idx<0) return;
    e.preventDefault();
    dragging=true;
    dragStartIdx=idx;
    setCursorAt(idx);
  });
  document.addEventListener('mousemove',(e)=>{
    if(!dragging) return;
    const idx=getCursorPos(e);
    if(idx<0) return;
    setSelection(dragStartIdx,idx);
  });
  document.addEventListener('mouseup',()=>{ dragging=false; });
})();

// Zoom auto par produit en croix : .page (21cm) vs window - s'applique à toutes les pages
function updateZoom(){
  const pageWpx = 21 * 37.795;
  const availW = window.innerWidth - 40;
  let z = availW / pageWpx;
  z = Math.min(1, Math.max(0.5, z));
  document.querySelectorAll('.page').forEach(p=>{
    p.style.zoom = z;
    if(!CSS.supports || !CSS.supports('zoom','1')){
      p.style.transform = `scale(${z})`;
      p.style.transformOrigin = 'top center';
    }
  });
}
window.addEventListener('resize', updateZoom);
window.addEventListener('load', updateZoom);
updateZoom();

// Multipage pour zone principale : limite au nombre de lignes Seyes par page (haut+bas)
const pagesContainer = document.getElementById('pagesContainer');
const templatePage = document.querySelector('.page');
function getLinesPerPage(){
  const lineHcm = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--line-h')) || 0.767;
  const vNudgeEl = document.getElementById('vNudge');
  const firstLineYCm = 3.285 + (parseFloat(vNudgeEl?.value)||2.5)/10;
  const pageHcm = 29.7;
  const bottomCm = 0.4;
  const avail = pageHcm - firstLineYCm - bottomCm;
  return Math.max(1, Math.floor(avail / lineHcm));
}
function ensurePages(n){
  while(pagesContainer.querySelectorAll('.page').length < n){
    const clone = templatePage.cloneNode(true);
    clone.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));
    clone.querySelectorAll('.zone-display').forEach(d=>d.innerHTML='');
    clone.querySelectorAll('textarea').forEach(t=>t.style.display='none');
    clone.querySelectorAll('.zone-placeholder').forEach(p=>p.style.display='none');
    pagesContainer.appendChild(clone);
  }
  while(pagesContainer.querySelectorAll('.page').length > n){
    pagesContainer.removeChild(pagesContainer.lastElementChild);
  }
}
const mainDisplay0 = document.getElementById('displayMain');
const mainInput0 = document.getElementById('inputMain');
const mainPlaceholder0 = document.getElementById('placeholderMain');
let mainState = [];
let measureDiv = null;
function countVisualLines(lineChars){
  if(lineChars.length===0) return 1;
  if(!measureDiv){
    measureDiv = document.createElement('div');
    measureDiv.style.position='absolute';
    measureDiv.style.visibility='hidden';
    measureDiv.style.pointerEvents='none';
    measureDiv.style.whiteSpace='pre-wrap';
    measureDiv.style.wordBreak='break-word';
    const pageW = 21*37.795;
    const marginW = 3.403*37.795;
    measureDiv.style.width = (pageW - marginW - 0.5*37.795) + 'px';
    measureDiv.style.fontSize='var(--font-size)';
    measureDiv.style.lineHeight='var(--line-h)';
    measureDiv.style.letterSpacing='var(--letter-spacing)';
    document.body.appendChild(measureDiv);
  }
  measureDiv.style.fontSize = getComputedStyle(document.documentElement).getPropertyValue('--font-size');
  measureDiv.style.lineHeight = getComputedStyle(document.documentElement).getPropertyValue('--line-h');
  measureDiv.style.letterSpacing = getComputedStyle(document.documentElement).getPropertyValue('--letter-spacing');
  measureDiv.innerHTML='';
  lineChars.forEach(s=>{
    const span=document.createElement('span');
    span.textContent=s.ch;
    span.style.fontFamily=`'${s.font}', cursive`;
    measureDiv.appendChild(span);
  });
  const h = measureDiv.offsetHeight;
  const lineHpx = parseFloat(getComputedStyle(measureDiv).lineHeight);
  return Math.max(1, Math.ceil(h / lineHpx));
}
function renderMain(){
  const linesPerPage = getLinesPerPage();
  const rawLines = [];
  let cur = [];
  mainState.forEach(s=>{
    if(s.ch === '\n'){ rawLines.push(cur); cur=[]; } else cur.push(s);
  });
  rawLines.push(cur);
  // on sautera la premiere ligne uniquement au passage d'une nouvelle page
  const pagesLines = [];
  let currentPageLines = [];
  let curVisualCount = 0;
  for(const line of rawLines){
    const vis = countVisualLines(line);
    if(curVisualCount + vis > linesPerPage){
      pagesLines.push(currentPageLines);
      currentPageLines = [[]]; // nouvelle page commence par vide
      curVisualCount = 1;
      if(vis > linesPerPage -1){
        currentPageLines.push(line);
        curVisualCount += vis;
        if(curVisualCount >= linesPerPage){
          pagesLines.push(currentPageLines);
          currentPageLines = [[]];
          curVisualCount = 1;
        }
        continue;
      }
    }
    currentPageLines.push(line);
    curVisualCount += vis;
  }
  pagesLines.push(currentPageLines);
  const pageCount = pagesLines.length;
  ensurePages(pageCount);
  const pages = pagesContainer.querySelectorAll('.page');
  pages.forEach((pg, pi)=>{
    let targetDisp = pi===0 ? mainDisplay0 : pg.querySelector('.zone-stage.main .zone-display');
    if(!targetDisp) return;
    targetDisp.innerHTML='';
    const frag=document.createDocumentFragment();
    const slice = pagesLines[pi] || [];
    slice.forEach(lineChars=>{
      const lineDiv=document.createElement('div');
      lineDiv.style.minHeight='var(--line-h)';
      lineDiv.style.lineHeight='var(--line-h)';
      lineDiv.style.whiteSpace='pre-wrap';
      lineDiv.style.wordBreak='break-word';
      if(lineChars.length===0){
        const filler=document.createElement('span');
        filler.textContent='\u00A0';
        filler.style.visibility='hidden';
        filler.style.fontSize='var(--font-size)';
        filler.style.letterSpacing='var(--letter-spacing)';
        lineDiv.appendChild(filler);
      } else {
        lineChars.forEach(s=>{
          const span=document.createElement('span');
          span.textContent=s.ch;
          span.style.fontFamily=`'${s.font}', cursive`;
          lineDiv.appendChild(span);
        });
      }
      frag.appendChild(lineDiv);
    });
    let visualUsed = 0;
    slice.forEach(l=> visualUsed += countVisualLines(l));
    const remaining = linesPerPage - visualUsed;
    for(let r=0;r<remaining;r++){
      const lineDiv=document.createElement('div');
      lineDiv.style.minHeight='var(--line-h)';
      lineDiv.style.lineHeight='var(--line-h)';
      lineDiv.style.whiteSpace='pre-wrap';
      const filler=document.createElement('span');
      filler.textContent='\u00A0';
      filler.style.visibility='hidden';
      lineDiv.appendChild(filler);
      frag.appendChild(lineDiv);
    }
    targetDisp.appendChild(frag);
  });
  if(mainPlaceholder0) mainPlaceholder0.style.display = mainState.length ? 'none' : 'block';
  const totalVisual = pagesLines.reduce((acc, pg)=> acc + pg.reduce((a,l)=>a+countVisualLines(l),0), 0);
  document.getElementById('status').textContent = `${totalVisual} lignes visuelles (${rawLines.length} logiques) → ${pageCount} page(s) Seyes (${linesPerPage} lignes/page)`;
}
let mainEditor = {
  getState: ()=>mainState,
  setState: (ns)=>{
    mainState = ns||[];
    mainInput0.value = mainState.map(s=>s.ch).join('');
    renderMain();
    setTimeout(updateSelectionHighlight,0);
  },
  clear: ()=>{ mainState=[]; mainInput0.value=''; renderMain(); setTimeout(updateSelectionHighlight,0); }
};
mainInput0.addEventListener('input', ()=>{
  const newVal = mainInput0.value;
  const oldVal = mainState.map(s=>s.ch).join('');
  if(newVal===oldVal) return;
  let prefix=0; const maxP=Math.min(oldVal.length,newVal.length);
  while(prefix<maxP && oldVal[prefix]===newVal[prefix]) prefix++;
  let suffix=0; const maxS=Math.min(oldVal.length,newVal.length)-prefix;
  while(suffix<maxS && oldVal[oldVal.length-1-suffix]===newVal[newVal.length-1-suffix]) suffix++;
  const removed = oldVal.length - prefix - suffix;
  const inserted = newVal.slice(prefix, newVal.length - suffix);
  const fonts = getActiveFonts();
  const entries=[...inserted].map(ch=>({ch, font: fonts[Math.floor(Math.random()*fonts.length)]}));
  mainState.splice(prefix, removed, ...entries);
  renderMain();
  setTimeout(updateSelectionHighlight,0);
});
mainInput0.parentElement.addEventListener('click', ()=>{ const sy=window.scrollY; mainInput0.focus(); requestAnimationFrame(()=>window.scrollTo(0,sy)); });
lineH.addEventListener('input', ()=>{ setTimeout(()=>{ renderMain(); updateSelectionHighlight(); },0); });
vNudge.addEventListener('input', ()=>{ setTimeout(()=>{ renderMain(); updateSelectionHighlight(); },0); });

document.getElementById('clearBtn').addEventListener('click', () => {
  if ((marginEditor.getState().length || mainEditor.getState().length) && !confirm('Effacer tout le texte des deux zones ?')) return;
  marginEditor.clear();
  mainEditor.clear();
  saveAutosave();
});

const AUTO_KEY = 'calligraphia.autosave.v1';
function collectState(){
  return {
    version: 1,
    ink: inkColor.value,
    fontSize: fontSize.value,
    alignMain: alignMain.value,
    vNudge: vNudge.value,
    letterSpacing: letterSpacing.value,
    lineH: lineH.value,
    printSeyes: printSeyes.checked,
    boldExport: document.getElementById('boldExport').checked,
    activeFonts: getActiveFonts(),
    margin: marginEditor.getState(),
    main: mainEditor.getState()
  };
}
function applyState(data){
  inkColor.value = data.ink || '#1b3a6b';
  root.setProperty('--ink', inkColor.value);
  fontSize.value = (data.fontSize ?? 0.55);
  fontSizeVal.textContent = fontSize.value;
  root.setProperty('--font-size', fontSize.value + 'cm');
  alignMain.value = data.alignMain || 'left';
  root.setProperty('--align-main', alignMain.value);
  vNudge.value = (data.vNudge ?? 2.5);
  vNudgeVal.textContent = vNudge.value;
  root.setProperty('--first-line-y', `calc(3.285cm + ${vNudge.value}mm)`);
  letterSpacing.value = (data.letterSpacing ?? 0);
  letterSpacingVal.textContent = letterSpacing.value;
  root.setProperty('--letter-spacing', letterSpacing.value + 'px');
  lineH.value = (data.lineH ?? 0.767);
  lineHVal.textContent = parseFloat(lineH.value).toFixed(3);
  root.setProperty('--line-h', lineH.value + 'cm');
  printSeyes.checked = (data.printSeyes ?? false);
  document.querySelectorAll('.page').forEach(p=>p.classList.toggle('print-seyes', printSeyes.checked));
  document.getElementById('boldExport').checked = (data.boldExport ?? false);
  if (Array.isArray(data.activeFonts)) {
    fontListEl.querySelectorAll('input').forEach(b => { b.checked = data.activeFonts.includes(b.value); });
  }
  marginEditor.setState(data.margin || []);
  mainEditor.setState(data.main || []);
}
let autoTimer = null;
function saveAutosave(){
  try{ localStorage.setItem(AUTO_KEY, JSON.stringify(collectState())); }catch(e){}
}
function scheduleAutosave(){
  if(autoTimer) clearTimeout(autoTimer);
  autoTimer = setTimeout(saveAutosave, 800);
}
function restoreAutosave(){
  let data = null;
  try{
    const raw = localStorage.getItem(AUTO_KEY);
    if(raw) data = JSON.parse(raw);
  }catch(e){}
  if(!data) return;
  applyState(data);
  statusEl.textContent = 'Brouillon restauré';
}
document.addEventListener('input', scheduleAutosave);
document.addEventListener('change', scheduleAutosave);

document.getElementById('saveBtn').addEventListener('click', () => {
  const payload = collectState();
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'feuille-seyes-manuscrite.json';
  a.click();
  statusEl.textContent = 'Enregistré : feuille-seyes-manuscrite.json';
});

const loadInput = document.getElementById('loadInput');
document.getElementById('loadBtn').addEventListener('click', () => loadInput.click());
loadInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    applyState(data);
    statusEl.textContent = `Chargé : ${file.name}`;
  } catch (err) {
    statusEl.textContent = 'Erreur : fichier invalide.';
    console.error(err);
  }
  loadInput.value = '';
});

document.getElementById('demoBtn').addEventListener('click', async () => {
  try {
    const resp = await fetch('data/demo.json');
    const data = await resp.json();
    applyState(data);
    statusEl.textContent = 'Démo chargée';
  } catch (err) {
    statusEl.textContent = 'Erreur démo : ' + err.message;
    console.error(err);
  }
});

document.getElementById('printBtn').addEventListener('click', () => window.print());
// Export PDF via html2canvas + JPEG
document.getElementById('screenshotBtn').addEventListener('click', async () => {
  const pages = document.querySelectorAll('.page');
  const includeSeyes = document.getElementById('printSeyes').checked;
  const boldExport = document.getElementById('boldExport').checked;

  // Pré-charger les polices actives
  const activeFonts = getActiveFonts();
  const preload = document.createElement('div');
  preload.style.cssText = 'position:absolute;left:-9999px;top:0;white-space:nowrap;';
  activeFonts.forEach(f => {
    const span = document.createElement('span');
    span.style.fontFamily = `'${f}', cursive`;
    span.textContent = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789éèêëàâäùûüîïôöçœæÉÈÊËÀÂÄÙÛÜÎÏÔÖÇŒÆ';
    preload.appendChild(span);
  });
  document.body.appendChild(preload);
  await document.fonts.ready;
  preload.remove();

  try{
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' });
    const capStyle = document.createElement('style');
    capStyle.id = 'export-capture';
    capStyle.textContent = '.page .virtual-cursor{display:none !important;}.span-highlight{background:transparent !important;box-shadow:none !important;}.page .zone-display{font-kerning:none !important;font-variant-ligatures:none !important;}' + (boldExport ? '.page .zone-display{font-weight:700 !important;}' : '');
    document.head.appendChild(capStyle);
    for(let pi=0; pi<pages.length; pi++){
      const pg = pages[pi];
      const prevZoom = pg.style.zoom;
      const prevTransform = pg.style.transform;
      const prevTransformOrigin = pg.style.transformOrigin;
      const prevBg = pg.style.backgroundImage;
      const prevBgColor = pg.style.backgroundColor;
      pg.style.zoom='1';
      pg.style.transform='none';
      pg.style.transformOrigin='top center';
      if(!includeSeyes){
        pg.style.backgroundImage='none';
        pg.style.backgroundColor='#fff';
      }
      let canvas;
      try{
        canvas = await html2canvas(pg, { scale: 4, useCORS:true, allowTaint:false, backgroundColor:'#fff', logging:false, letterRendering:false });
      }finally{
        pg.style.zoom = prevZoom;
        pg.style.transform = prevTransform;
        pg.style.transformOrigin = prevTransformOrigin;
        pg.style.backgroundImage = prevBg;
        pg.style.backgroundColor = prevBgColor;
      }
      const imgData = canvas.toDataURL('image/jpeg', 0.85);
      if(pi>0) pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
    }
    const doneStyle = document.getElementById('export-capture');
    if(doneStyle && doneStyle.parentNode) doneStyle.parentNode.removeChild(doneStyle);
    pdf.save('feuille-seyes-manuscrite.pdf');
    statusEl.textContent=`PDF exporté ${pages.length} page(s)`;
  }catch(err){
    const errStyle = document.getElementById('export-capture');
    if(errStyle && errStyle.parentNode) errStyle.parentNode.removeChild(errStyle);
    console.error(err);
    statusEl.textContent='Erreur export: '+err.message;
    alert('Erreur export: '+err.message);
  }
});

mainEditor.setState([]);
marginEditor.setState([]);
document.getElementById('inputMain').focus();
restoreAutosave();
