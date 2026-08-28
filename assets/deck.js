/* ═══════════════════════════════════════════════
   從停權到 Discord — 共用簡報引擎（沿用方舟工作坊的引擎，加上 .shot 圖片 fallback）
   每個單元 HTML 只要放 <section class="slide"> 即可，
   邊框、頁碼、導覽列、動畫都由這支檔案接手。

   單元檔的 <body> 屬性：
     data-unit      單元編號，例如 "04"
     data-unit-name 單元名稱，例如 "認識 Claude Desktop"
     data-prev      上一個單元檔名（可省略）
     data-next      下一個單元檔名（可省略）

   鍵盤：→ 下一步／← 上一步／Tab 全螢幕／R 重播／Space 回目錄
   ═══════════════════════════════════════════════ */
(function(){
'use strict';

var D = document, W = window;
var reduce = W.matchMedia('(prefers-reduced-motion: reduce)').matches;

function $(sel, root){ return (root||D).querySelector(sel); }
function $$(sel, root){ return Array.prototype.slice.call((root||D).querySelectorAll(sel)); }
function sleep(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }

/* ─── 舞台縮放 ─────────────────────────────── */
var stage = $('#stage');
function fit(){
  var s = Math.min(W.innerWidth/1280, W.innerHeight/720);
  var x = (W.innerWidth  - 1280*s)/2;
  var y = (W.innerHeight -  720*s)/2;
  stage.style.transform = 'translate('+x+'px,'+y+'px) scale('+s+')';
}
W.addEventListener('resize', fit); fit();

/* ─── 版面骨架 ─────────────────────────────── */
var B = D.body.dataset;
var UNIT = B.unit || '', UNAME = B.unitName || '';
var PREV = B.prev || '', NEXT = B.next || '', HOME = B.home || 'index.html';

var chrome = D.createElement('div');
chrome.innerHTML =
  '<div class="hull"></div>' +
  '<div class="eyebrow-slot">' +
    (UNIT ? '<span class="u">UNIT ' + UNIT + '</span><span>·</span>' : '') +
    '<span id="ebSec"></span>' +
  '</div>' +
  '<div id="pageno"><span id="pnCur">01</span> / <span id="pnAll">01</span></div>' +
  '<div id="railwrap"><div id="rail"></div></div>' +
  '<div id="nav">' +
    '<button id="btnPrev" aria-label="上一步"><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg></button>' +
    '<button id="btnNext" aria-label="下一步"><svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg></button>' +
  '</div>' +
  '<div id="help">' +
    '<button type="button" data-act="full"><kbd>Tab</kbd> 全螢幕</button>' +
    '<button type="button" data-act="home"><kbd>Space</kbd> 目錄</button>' +
  '</div>';
while(chrome.firstChild) stage.appendChild(chrome.firstChild);

/* ─── 模板展開（同一份 UI 重複用於多張投影片） ─── */
$$('[data-tpl]').forEach(function(host){
  var tpl = D.getElementById('tpl-' + host.dataset.tpl);
  if(tpl) host.appendChild(tpl.content.cloneNode(true));
});

/* ─── 實作計時器（一律手動點擊開始） ───────────── */
var TSTORE_TTL = 6*60*60*1000;
function tKey(i){ return 'ark-t-' + UNIT + '-' + i; }
function tLoad(i){
  try{
    var raw = localStorage.getItem(tKey(i));
    if(!raw) return null;
    var o = JSON.parse(raw);
    if(!o || Date.now() - o.at > TSTORE_TTL){ localStorage.removeItem(tKey(i)); return null; }
    if(o.run) o.left = Math.max(0, o.left - Math.round((Date.now() - o.at)/1000));
    return o;
  }catch(e){ return null; }
}
function tSave(i, st){
  try{ localStorage.setItem(tKey(i), JSON.stringify({left:st.left, run:st.run, at:Date.now()})); }catch(e){}
}

$$('.atimer').forEach(function(el, i){
  var mins  = +(el.dataset.min || 5);
  var label = el.dataset.label || '剩餘時間';
  var xl    = el.dataset.size === 'xl';
  var R  = xl ? 114 : 78;
  var SZ = xl ? 260 : 180;
  var C  = 2*Math.PI*R;

  el.innerHTML =
    '<div class="ring" style="width:'+SZ+'px;height:'+SZ+'px">' +
      '<svg width="'+SZ+'" height="'+SZ+'" viewBox="0 0 '+SZ+' '+SZ+'" style="transform:rotate(-90deg)">' +
        '<circle class="bg" cx="'+SZ/2+'" cy="'+SZ/2+'" r="'+R+'"/>' +
        '<circle class="fg" cx="'+SZ/2+'" cy="'+SZ/2+'" r="'+R+'" stroke-dasharray="'+C+'" stroke-dashoffset="0"/>' +
      '</svg>' +
      '<div class="face">' +
        '<div class="num" style="font-size:'+(xl?64:38)+'px">'+String(mins).padStart(2,'0')+':00</div>' +
        '<div class="cap">'+label+'</div>' +
      '</div>' +
    '</div>' +
    '<div class="ctl">' +
      '<button class="btn t-go">▶ 開始計時</button>' +
      '<button class="btn t-rst">重設</button>' +
    '</div>';

  var st = { total: mins*60, left: mins*60, run: false };
  var saved = tLoad(i);
  if(saved){ st.left = Math.min(st.total, saved.left); st.run = !!saved.run && st.left > 0; }
  el._t = st;

  var num = $('.num', el), fg = $('.fg', el);
  var go  = $('.t-go', el), rst = $('.t-rst', el);

  function paint(){
    var m = Math.floor(st.left/60), s = st.left%60;
    num.textContent = String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
    fg.style.strokeDashoffset = C * (1 - st.left/st.total);
    el.classList.toggle('done', st.left <= 0);
    go.textContent = st.left <= 0 ? '時間到' : (st.run ? '❙❙ 暫停' : '▶ 開始計時');
    go.classList.toggle('on', st.run);
  }
  st.paint = paint;

  go.addEventListener('click', function(){
    if(st.left <= 0) return;
    st.run = !st.run; paint(); tSave(i, st);
  });
  rst.addEventListener('click', function(){
    st.left = st.total; st.run = false; paint(); tSave(i, st);
  });
  setInterval(function(){
    if(st.run && st.left > 0){
      st.left--; paint();
      if(st.left % 5 === 0 || st.left <= 0) tSave(i, st);
      if(st.left <= 0) st.run = false;
    }
  }, 1000);
  paint();
});

/* ─── 圖片／影片 fallback ───────────────────── */
$$('.avatar img, .shot img, .rec video').forEach(function(m){
  m.addEventListener('error', function(){ m.classList.add('dead'); });
  if(m.tagName === 'IMG' && m.complete && !m.naturalWidth) m.classList.add('dead');
  if(m.tagName === 'VIDEO') setTimeout(function(){ if(!m.videoWidth) m.classList.add('dead'); }, 2200);
});

/* ─── 播放器尺寸：跟著影片原始比例，不裁切 ──── */
/* 預設框是 16:9，但錄的畫面常常不是 16:9（例如視窗錄影偏方），
   硬套 16:9 會把上下切掉。讀到影片實際尺寸後改寫容器比例，
   高度超過上限時改縮寬度，讓整支影片完整顯示。 */
var REC_MAX_H = 500;                     /* 1280×720 舞台內，播放器高度上限 */
function fitRec(v){
  if(!v.videoWidth || !v.videoHeight) return;
  var box = v.closest('.rec');
  if(!box) return;
  box.style.aspectRatio = v.videoWidth + '/' + v.videoHeight;
  box.style.maxWidth = '';
  var w = box.clientWidth;
  if(!w) return;                         /* 這張還沒顯示，等 enter() 再算一次 */
  if(w * v.videoHeight / v.videoWidth > REC_MAX_H){
    box.style.maxWidth = Math.round(REC_MAX_H * v.videoWidth / v.videoHeight) + 'px';
  }
}
$$('.rec video').forEach(function(v){
  v.addEventListener('loadedmetadata', function(){ fitRec(v); });
  fitRec(v);
  /* 講師自己按暫停時記住，換頁回來不要又被自動播放蓋掉 */
  v.addEventListener('pause', function(){ if(!v.ended) v.dataset.held = '1'; });
  v.addEventListener('play',  function(){ delete v.dataset.held; });
});

/* 影片用瀏覽器內建播放器（controls），暫停／進度／音量／全螢幕都在上面。
   播放中滑鼠不在影片上時 Chrome 會自動把控制列收起來，簡報畫面才乾淨。 */
function recPlay(v){ var p = v.play(); if(p && p.catch) p.catch(function(){}); }

/* ─── 對話模擬 ─────────────────────────────── */
/* <template class="seq"> 每行格式：  C| 文字   或   U| 文字
   同一個角色連續多行會合併成一則訊息；只寫 "C|" 代表空行。
   內文可用 **粗體**、`程式碼`；以 "- " 開頭是選項，"-* " 是被選中的選項。 */
function parseSeq(text){
  var out = [], cur = null;
  text.split('\n').forEach(function(raw){
    var m = raw.match(/^\s*([CUcu])\|(.*)$/);
    if(!m){
      if(raw.trim() === '') return;
      if(cur) cur.t.push(raw.trim());
      return;
    }
    var role = m[1].toUpperCase() === 'U' ? 'u' : 'c';
    var body = m[2].replace(/^ /, '');
    if(!cur || cur.r !== role){ cur = { r: role, t: [] }; out.push(cur); }
    cur.t.push(body);
  });
  return out.map(function(x){ return { r: x.r, t: x.t.join('\n') }; });
}

function esc(x){ return x.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function inlineFmt(s){
  var out = '', re = /\*\*([^*]+)\*\*|`([^`]+)`/g, m, last = 0;
  while((m = re.exec(s))){
    out += esc(s.slice(last, m.index));
    out += m[1] ? '<strong>'+esc(m[1])+'</strong>' : '<code>'+esc(m[2])+'</code>';
    last = re.lastIndex;
  }
  return out + esc(s.slice(last));
}

var chatGen = 0;
function runChat(root){
  var tpl = $('template.seq', root);
  if(!tpl) return;
  var seq = parseSeq(tpl.content.textContent || '');
  if(!seq.length) return;

  var gen = ++chatGen;
  var body = $('.chat-body', root), field = $('.field', root), send = $('.send', root);
  body.innerHTML = ''; field.innerHTML = ''; send.classList.remove('hot');
  var SPD = reduce ? 0 : 1;
  function alive(){ return gen === chatGen; }

  function bubble(role){
    var w = D.createElement('div');
    w.className = 'msg ' + (role === 'u' ? 'user' : 'claude');
    w.innerHTML = (role === 'c' ? '<div class="av">C</div>' : '') + '<div class="bub"></div>';
    body.appendChild(w);
    body.scrollTop = body.scrollHeight;
    return $('.bub', w);
  }

  async function typeField(text){
    field.innerHTML = '<span class="txt"></span><span class="caret"></span>';
    var t = $('.txt', field);
    for(var i = 0; i < text.length; i++){
      if(!alive()) return;
      t.textContent = text.slice(0, i+1);
      await sleep(36*SPD + Math.random()*26*SPD);
    }
    send.classList.add('hot');
    await sleep(420*SPD);
  }

  async function claudeMsg(text, onAllPicked){
    var bub = bubble('c');
    bub.innerHTML = '<div class="think"><span></span><span></span><span></span></div>';
    await sleep(760*SPD);
    if(!alive()) return;
    bub.innerHTML = '';

    var lines = text.split('\n'), optWrap = null;
    var totalPicks = 0, picked = 0;
    for(var pi = 0; pi < lines.length; pi++) if(lines[pi].indexOf('-* ') === 0) totalPicks++;
    for(var li = 0; li < lines.length; li++){
      if(!alive()) return;
      var raw = lines[li];

      if(raw === ''){
        var sp = D.createElement('div'); sp.className = 'ln sp'; bub.appendChild(sp);
        optWrap = null; await sleep(120*SPD); continue;
      }

      if(raw.indexOf('- ') === 0 || raw.indexOf('-* ') === 0){
        /* 先把整段連續的選項收齊 */
        var group = [];
        while(li < lines.length &&
             (lines[li].indexOf('- ') === 0 || lines[li].indexOf('-* ') === 0)){
          var isSel = lines[li].indexOf('-* ') === 0;
          group.push({ sel: isSel, txt: lines[li].slice(isSel ? 3 : 2) });
          li++;
        }
        li--;                                   /* for 迴圈還會再 ++ 一次 */

        var wrap = D.createElement('div');
        wrap.className = 'ln';
        bub.appendChild(wrap);

        /* 第一階段：所有選項先全部出現，都還沒勾 */
        var chips = [];
        for(var gi = 0; gi < group.length; gi++){
          if(!alive()) return;
          var ch = D.createElement('span');
          ch.className = 'opt';
          ch.innerHTML = '<span class="mk"></span>' + inlineFmt(group[gi].txt);
          wrap.appendChild(ch);
          chips.push(ch);
          body.scrollTop = body.scrollHeight;
          await sleep(170*SPD);
        }

        /* 第二階段：停一下，才開始打勾 */
        await sleep(560*SPD);
        for(var gj = 0; gj < group.length; gj++){
          if(!group[gj].sel) continue;
          if(!alive()) return;
          chips[gj].classList.add('sel');
          picked++;
          if(onAllPicked && picked === totalPicks) onAllPicked();
          await sleep(400*SPD);
        }
        optWrap = null;
        continue;
      }

      /* 工具動作行「· 」與完成行「✓ 」：直接跳出，不逐字打 */
      var isTool = raw.indexOf('· ') === 0, isOk = raw.indexOf('✓ ') === 0;
      if(isTool || isOk){
        optWrap = null;
        var tl = D.createElement('div');
        tl.className = 'ln ' + (isTool ? 'tool' : 'ok');
        tl.innerHTML = inlineFmt(isTool ? raw.slice(2) : raw);
        bub.appendChild(tl);
        body.scrollTop = body.scrollHeight;
        await sleep(330*SPD);
        continue;
      }

      optWrap = null;
      var quote = raw.indexOf('> ') === 0;
      if(quote) raw = raw.slice(2);
      var ln = D.createElement('div');
      ln.className = 'ln' + (quote ? ' quote' : '');
      bub.appendChild(ln);
      var plain = raw.replace(/\*\*/g, '').replace(/`/g, '');
      for(var ci = 0; ci < plain.length; ci++){
        if(!alive()) return;
        ln.textContent = plain.slice(0, ci+1);
        body.scrollTop = body.scrollHeight;
        await sleep(16*SPD);
      }
      ln.innerHTML = inlineFmt(raw);
      body.scrollTop = body.scrollHeight;
      await sleep(150*SPD);
    }
  }

  (async function(){
    await sleep(520*SPD);
    for(var i = 0; i < seq.length; i++){
      if(!alive()) return;
      var it = seq[i];
      if(it.r === 'u'){
        await typeField(it.t);
        if(!alive()) return;
        field.innerHTML = ''; send.classList.remove('hot');
        bubble('u').textContent = it.t;
        body.scrollTop = body.scrollHeight;
        await sleep(430*SPD);
      } else {
        var nxt = seq[i+1], popped = false;
        await claudeMsg(it.t, (nxt && nxt.r === 'u') ? function(){
          if(popped || !alive()) return;
          popped = true;
          var pb = bubble('u');
          pb.parentNode.classList.add('pop');
          pb.textContent = nxt.t;
          body.scrollTop = body.scrollHeight;
        } : null);
        if(!alive()) return;
        if(popped){ i++; await sleep(420*SPD); }
        else await sleep(320*SPD);
      }
    }
    if(alive()) field.innerHTML = '';
  })();
}

$$('.chat').forEach(function(c){
  if(!$('template.seq', c)) return;
  var b = D.createElement('button');
  b.className = 'replay'; b.type = 'button'; b.textContent = '↻ 重播';
  b.addEventListener('click', function(){ runChat(c); });
  c.parentNode.appendChild(b);
});

/* ─── 終端機模擬 ───────────────────────────── */
/* <template class="lines"> 每行格式： 樣式| 內容
   樣式：p（提示詞）/ cmt（步驟）/ tool（動作）/ ok / link / sp（空行） */
function runTerm(el){
  var tpl = $('template.lines', el);
  if(!tpl) return;
  var src = tpl.innerHTML.split('\n');
  el.innerHTML = '';
  el.appendChild(tpl);

  var nodes = [];
  src.forEach(function(raw){
    var m = raw.match(/^\s*([a-z]+)\|(.*)$/);
    if(!m) return;
    var d = D.createElement('div');
    if(m[1] === 'sp'){ d.className = 'l'; d.style.height = '16px'; d.innerHTML = '&nbsp;'; }
    else { d.className = 'l ' + m[1]; d.innerHTML = m[2]; }
    el.appendChild(d);
    nodes.push(d);
  });

  var i = 0;
  clearInterval(el._iv);
  if(reduce){ nodes.forEach(function(n){ n.classList.add('on'); }); return; }
  el._iv = setInterval(function(){
    if(i >= nodes.length){ clearInterval(el._iv); return; }
    nodes[i++].classList.add('on');
  }, 340);
}

/* ─── 導覽 ─────────────────────────────────── */
var slides = $$('.slide');
var cur = 0, step = 0, moving = false;
var ebSec = $('#ebSec'), pnCur = $('#pnCur'), pnAll = $('#pnAll'), rail = $('#rail');

pnAll.textContent = String(slides.length).padStart(2,'0');
slides.forEach(function(s){ s.hidden = true; });

function maxStep(s){ return +(s.dataset.steps || 0); }

function applySteps(s){
  $$('[data-step]', s).forEach(function(el){
    var n = +el.dataset.step;
    var on = el.dataset.only === '1' ? (n === step) : (n <= step && n > 0);
    el.classList.toggle('on', on);
    if(el.dataset.only === '1') el.style.pointerEvents = on ? 'auto' : 'none';
  });
}

/* Claude Desktop 聚光燈：投影片標 data-spot="元素 class" */
function applySpot(s){
  var win = $('.cd', s), spot = $('.spot', s);
  if(!win || !spot) return;
  var sel = s.dataset.spot;
  if(!sel){ spot.classList.remove('on'); return; }
  var t = $('.' + sel, win);
  if(!t){ spot.classList.remove('on'); return; }
  if(t.classList.contains('cd-item')){
    $$('.cd-item', win).forEach(function(el){ el.classList.toggle('act', el === t); });
  }
  var wr = win.getBoundingClientRect(), tr = t.getBoundingClientRect();
  var k  = wr.width / win.offsetWidth || 1;
  var pad = 7;
  spot.style.left   = ((tr.left - wr.left)/k - pad) + 'px';
  spot.style.top    = ((tr.top  - wr.top )/k - pad) + 'px';
  spot.style.width  = (tr.width/k  + pad*2) + 'px';
  spot.style.height = (tr.height/k + pad*2) + 'px';
  spot.classList.add('on');
}

function enter(s){
  ebSec.textContent = s.dataset.sec || UNAME;
  pnCur.textContent = String(cur+1).padStart(2,'0');
  rail.style.width = (slides.length > 1 ? cur/(slides.length-1)*100 : 100) + '%';

  applySteps(s);
  if(s.dataset.spot !== undefined) setTimeout(function(){ applySpot(s); }, 60);

  var chat = $('.chat', s);
  if(chat && $('template.seq', chat)) setTimeout(function(){ runChat(chat); }, 380);

  var term = $('.term', s);
  if(term && $('template.lines', term)) setTimeout(function(){ runTerm(term); }, 460);

  $$('.rec video', s).forEach(fitRec);
  $$('video', s).forEach(function(v){ if(!v.dataset.held) recPlay(v); });
}

function show(n, atEnd){
  if(moving) return;
  if(n < 0){ if(PREV) leave(PREV + '#end'); return; }
  if(n >= slides.length){ if(NEXT) leave(NEXT); return; }
  moving = true;
  chatGen++;
  var old = slides[cur];
  old.classList.remove('in'); old.classList.add('out');
  setTimeout(function(){
    old.classList.remove('out'); old.hidden = true;
    cur = n;
    var s = slides[cur];
    step = atEnd ? maxStep(s) : 0;
    s.hidden = false;
    void s.offsetWidth;
    s.classList.add('in');
    enter(s);
    moving = false;
  }, reduce ? 0 : 230);
}

function leave(href){
  moving = true;
  stage.classList.add('leaving');
  setTimeout(function(){ W.location.href = href; }, reduce ? 0 : 260);
}

function next(){
  var s = slides[cur];
  if(step < maxStep(s)){ step++; applySteps(s); if(s.dataset.spot !== undefined) applySpot(s); return; }
  show(cur+1);
}
function prev(){
  var s = slides[cur];
  if(step > 0){ step--; applySteps(s); if(s.dataset.spot !== undefined) applySpot(s); return; }
  show(cur-1, true);
}

/* 回目錄。單檔版（dist）把目錄併在同一份 document 裡，data-home 會是 "#toc"，
   這時直接同頁切換投影片；換頁會讓瀏覽器結束全螢幕，所以能不換就不換。 */
function goHome(){
  if(HOME.charAt(0) === '#'){
    var i = slides.indexOf($(HOME));
    if(i >= 0){ if(i !== cur) show(i); return; }
  }
  leave(HOME);
}

function toggleFull(){
  if(D.fullscreenElement) D.exitFullscreen();
  else if(D.documentElement.requestFullscreen) D.documentElement.requestFullscreen();
}
function replayCurrent(){
  var s = slides[cur];
  var c = $('.chat', s); if(c && $('template.seq', c)) runChat(c);
  var t = $('.term', s); if(t && $('template.lines', t)) runTerm(t);
}

/* 按完就把焦點移開，否則之後按空白鍵會再次觸發同一顆按鈕（等於跳兩步） */
function hit(fn){
  return function(e){ if(e.currentTarget.blur) e.currentTarget.blur(); fn(); };
}
$('#btnNext').addEventListener('click', hit(next));
$('#btnPrev').addEventListener('click', hit(prev));

/* 底下那排說明也是按鈕，滑鼠可以直接點 */
var ACTS = { full: toggleFull, home: goHome };

/* 單檔版目錄的單元連結（build.mjs 會把 href 換成 data-goto="全域索引"） */
stage.addEventListener('click', function(e){
  var a = e.target.closest && e.target.closest('[data-goto]');
  if(!a) return;
  e.preventDefault();
  var i = parseInt(a.dataset.goto, 10);
  if(!isNaN(i) && i !== cur) show(i);
});
$('#help').addEventListener('click', function(e){
  var b = e.target.closest('button[data-act]');
  if(!b) return;
  b.blur();
  ACTS[b.dataset.act]();
});

D.addEventListener('keydown', function(e){
  if(e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
  if(e.metaKey || e.ctrlKey || e.altKey) return;
  var k = e.key;
  if(k === 'ArrowRight' || k === 'PageDown'){ e.preventDefault(); next(); }
  else if(k === 'ArrowLeft' || k === 'PageUp'){ e.preventDefault(); prev(); }
  else if(k === 'Home'){ e.preventDefault(); show(0); }
  else if(k === 'End'){ e.preventDefault(); show(slides.length-1, true); }
  else if(k === 'Tab'){ e.preventDefault(); toggleFull(); }
  else if(k === ' '){ e.preventDefault(); goHome(); }
  else if(k === 'r' || k === 'R'){ e.preventDefault(); replayCurrent(); }
});

/* 首張（從上一單元倒退進來時直接落在最後一張） */
var startAt = (W.location.hash === '#end') ? slides.length-1 : 0;
cur = startAt;
step = (W.location.hash === '#end') ? maxStep(slides[cur]) : 0;
slides[cur].hidden = false;
void slides[cur].offsetWidth;
slides[cur].classList.add('in');
enter(slides[cur]);

})();

/* ═══════════════════════════════════════════════
   QR 產生器（Byte 模式、EC level M、版本 1–10）
   用法：<div class="qr" data-qr="https://…"></div>
   data-qr 留空會顯示佔位框。
   ═══════════════════════════════════════════════ */
(function(){
'use strict';
var D = document;

var EXP = new Array(512), LOG = new Array(256);
(function(){ var x = 1;
  for(var i = 0; i < 255; i++){ EXP[i] = x; LOG[x] = i; x <<= 1; if(x & 0x100) x ^= 0x11D; }
  for(var j = 255; j < 512; j++) EXP[j] = EXP[j-255];
})();
function mul(a, b){ return (a === 0 || b === 0) ? 0 : EXP[LOG[a] + LOG[b]]; }

function rsGen(n){
  var g = [1];
  for(var i = 0; i < n; i++){
    var ng = new Array(g.length + 1).fill(0);
    for(var j = 0; j < g.length; j++){ ng[j] ^= g[j]; ng[j+1] ^= mul(g[j], EXP[i]); }
    g = ng;
  }
  return g;
}
function rsEnc(data, n){
  var g = rsGen(n), res = new Array(n).fill(0);
  for(var i = 0; i < data.length; i++){
    var f = data[i] ^ res[0];
    res.shift(); res.push(0);
    if(f !== 0) for(var j = 0; j < n; j++) res[j] ^= mul(g[j+1], f);
  }
  return res;
}

/* [EC碼數, 群組1區塊數, 群組1資料數, 群組2區塊數, 群組2資料數] */
var ECB = {
  1:[10,1,16], 2:[16,1,28], 3:[26,1,44], 4:[18,2,32], 5:[24,2,43],
  6:[16,4,27], 7:[18,4,31], 8:[22,2,38,2,39], 9:[22,3,36,2,37], 10:[26,4,43,1,44]
};
var ALIGN = {
  1:[], 2:[6,18], 3:[6,22], 4:[6,26], 5:[6,30],
  6:[6,34], 7:[6,22,38], 8:[6,24,42], 9:[6,26,46], 10:[6,28,50]
};

function utf8(str){
  var s = unescape(encodeURIComponent(str)), out = [];
  for(var i = 0; i < s.length; i++) out.push(s.charCodeAt(i));
  return out;
}
function bitLen(x){ var n = 0; while(x){ n++; x >>>= 1; } return n; }
function bch(data, gen, len){
  var d = data;
  while(bitLen(d) >= len) d ^= gen << (bitLen(d) - len);
  return d;
}

function make(text){
  var bytes = utf8(text), v, ecb, dataCap, cc;
  for(v = 1; v <= 10; v++){
    ecb = ECB[v];
    dataCap = ecb[1]*ecb[2] + (ecb[3] ? ecb[3]*ecb[4] : 0);
    cc = v < 10 ? 8 : 16;
    if(4 + cc + 8*bytes.length <= dataCap*8) break;
  }
  if(v > 10) throw new Error('QR: 內容太長（超過版本 10 容量）');

  var bits = [];
  function put(val, len){ for(var i = len-1; i >= 0; i--) bits.push((val >>> i) & 1); }
  put(4, 4); put(bytes.length, cc);
  for(var i = 0; i < bytes.length; i++) put(bytes[i], 8);
  var cap = dataCap*8;
  for(i = 0; i < 4 && bits.length < cap; i++) bits.push(0);
  while(bits.length % 8) bits.push(0);
  var pad = [0xEC, 0x11], pi = 0;
  while(bits.length < cap) put(pad[pi++ % 2], 8);

  var dcw = [];
  for(i = 0; i < bits.length; i += 8){
    var b = 0;
    for(var j = 0; j < 8; j++) b = (b << 1) | bits[i+j];
    dcw.push(b);
  }

  var ecLen = ecb[0], blocks = [], off = 0;
  function addBlocks(count, size){
    for(var k = 0; k < count; k++){
      var d = dcw.slice(off, off + size); off += size;
      blocks.push({ d: d, e: rsEnc(d, ecLen) });
    }
  }
  addBlocks(ecb[1], ecb[2]);
  if(ecb[3]) addBlocks(ecb[3], ecb[4]);

  var out = [], maxD = 0;
  blocks.forEach(function(b){ if(b.d.length > maxD) maxD = b.d.length; });
  for(i = 0; i < maxD; i++) blocks.forEach(function(b){ if(i < b.d.length) out.push(b.d[i]); });
  for(i = 0; i < ecLen; i++) blocks.forEach(function(b){ out.push(b.e[i]); });

  var n = 17 + 4*v, m = [], res = [];
  for(i = 0; i < n; i++){ m.push(new Array(n).fill(0)); res.push(new Array(n).fill(false)); }
  function setF(r, c, val){ if(r < 0 || c < 0 || r >= n || c >= n) return; m[r][c] = val; res[r][c] = true; }

  function finder(r, c){
    for(var i = -1; i <= 7; i++) for(var j = -1; j <= 7; j++){
      var on = (i >= 0 && i <= 6 && (j === 0 || j === 6)) ||
               (j >= 0 && j <= 6 && (i === 0 || i === 6)) ||
               (i >= 2 && i <= 4 && j >= 2 && j <= 4);
      setF(r+i, c+j, on ? 1 : 0);
    }
  }
  finder(0, 0); finder(0, n-7); finder(n-7, 0);
  for(i = 8; i < n-8; i++){ setF(6, i, i % 2 === 0 ? 1 : 0); setF(i, 6, i % 2 === 0 ? 1 : 0); }

  var al = ALIGN[v];
  for(i = 0; i < al.length; i++) for(var jj = 0; jj < al.length; jj++){
    var ar = al[i], ac = al[jj];
    if((ar <= 8 && ac <= 8) || (ar <= 8 && ac >= n-9) || (ar >= n-9 && ac <= 8)) continue;
    for(var dr = -2; dr <= 2; dr++) for(var dc = -2; dc <= 2; dc++)
      setF(ar+dr, ac+dc, Math.max(Math.abs(dr), Math.abs(dc)) !== 1 ? 1 : 0);
  }

  for(i = 0; i <= 8; i++){ if(i !== 6) setF(8, i, 0); }
  for(i = 0; i <= 8; i++){ if(i !== 6) setF(i, 8, 0); }
  for(i = n-8; i < n; i++) setF(8, i, 0);
  for(i = n-7; i < n; i++) setF(i, 8, 0);
  setF(n-8, 8, 1);

  if(v >= 7){
    var vi = (v << 12) | bch(v << 12, 0x1F25, 13);
    for(i = 0; i < 18; i++){
      var vb = (vi >>> i) & 1;
      setF(Math.floor(i/3), n-11 + i%3, vb);
      setF(n-11 + i%3, Math.floor(i/3), vb);
    }
  }

  var di = 0, up = true;
  for(var col = n-1; col >= 1; col -= 2){
    if(col === 6) col = 5;
    for(i = 0; i < n; i++){
      var row = up ? n-1-i : i;
      for(var k = 0; k < 2; k++){
        var c2 = col - k;
        if(!res[row][c2]){
          m[row][c2] = di < out.length*8 ? ((out[di >> 3] >>> (7 - (di & 7))) & 1) : 0;
          di++;
        }
      }
    }
    up = !up;
  }

  function maskAt(k, r, c){
    switch(k){
      case 0: return (r+c) % 2 === 0;
      case 1: return r % 2 === 0;
      case 2: return c % 3 === 0;
      case 3: return (r+c) % 3 === 0;
      case 4: return (Math.floor(r/2) + Math.floor(c/3)) % 2 === 0;
      case 5: return (r*c) % 2 + (r*c) % 3 === 0;
      case 6: return ((r*c) % 2 + (r*c) % 3) % 2 === 0;
      default: return ((r+c) % 2 + (r*c) % 3) % 2 === 0;
    }
  }
  function putFormat(mm, mask){
    var fd = mask;                                  /* EC level M = 00 */
    var fmt = (((fd << 10) | bch(fd << 10, 0x537, 11)) ^ 0x5412);
    for(var i = 0; i < 15; i++){
      var bit = (fmt >>> (14 - i)) & 1;   /* 高位在前 */
      if(i < 6) mm[8][i] = bit;
      else if(i === 6) mm[8][7] = bit;
      else if(i === 7) mm[8][8] = bit;
      else if(i === 8) mm[7][8] = bit;
      else mm[14-i][8] = bit;
      if(i < 7) mm[n-1-i][8] = bit;      /* 第二份：垂直 7 格 */
      else mm[8][n-15+i] = bit;          /* 第二份：水平 8 格 */
    }
    mm[n-8][8] = 1;
  }
  function penalty(mm){
    var p = 0, i, j, run, dark = 0;
    for(i = 0; i < n; i++){
      run = 1;
      for(j = 1; j < n; j++){
        if(mm[i][j] === mm[i][j-1]) run++;
        else { if(run >= 5) p += 3 + run - 5; run = 1; }
      }
      if(run >= 5) p += 3 + run - 5;
      run = 1;
      for(j = 1; j < n; j++){
        if(mm[j][i] === mm[j-1][i]) run++;
        else { if(run >= 5) p += 3 + run - 5; run = 1; }
      }
      if(run >= 5) p += 3 + run - 5;
    }
    for(i = 0; i < n-1; i++) for(j = 0; j < n-1; j++){
      var s = mm[i][j] + mm[i][j+1] + mm[i+1][j] + mm[i+1][j+1];
      if(s === 0 || s === 4) p += 3;
    }
    var pat = [1,0,1,1,1,0,1,0,0,0,0], rev = [0,0,0,0,1,0,1,1,1,0,1];
    for(i = 0; i < n; i++) for(j = 0; j <= n-11; j++){
      var hf = true, hr = true, vf = true, vr = true;
      for(var t = 0; t < 11; t++){
        if(mm[i][j+t] !== pat[t]) hf = false;
        if(mm[i][j+t] !== rev[t]) hr = false;
        if(mm[j+t][i] !== pat[t]) vf = false;
        if(mm[j+t][i] !== rev[t]) vr = false;
      }
      if(hf) p += 40;
      if(hr) p += 40;
      if(vf) p += 40;
      if(vr) p += 40;
    }
    for(i = 0; i < n; i++) for(j = 0; j < n; j++) dark += mm[i][j];
    p += Math.floor(Math.abs(dark*100/(n*n) - 50) / 5) * 10;
    return p;
  }

  var best = null, bestP = Infinity;
  for(var mk = 0; mk < 8; mk++){
    var mm = m.map(function(row){ return row.slice(); });
    for(i = 0; i < n; i++) for(var jc = 0; jc < n; jc++)
      if(!res[i][jc] && maskAt(mk, i, jc)) mm[i][jc] ^= 1;
    putFormat(mm, mk);
    var pv = penalty(mm);
    if(pv < bestP){ bestP = pv; best = mm; }
  }
  return best;
}

function svg(mat, fg, bg, quiet){
  var n = mat.length, q = quiet == null ? 2 : quiet, size = n + 2*q, d = '';
  for(var r = 0; r < n; r++) for(var c = 0; c < n; c++)
    if(mat[r][c]) d += 'M' + (c+q) + ' ' + (r+q) + 'h1v1h-1z';
  return '<svg viewBox="0 0 ' + size + ' ' + size + '" width="100%" height="100%" ' +
         'shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">' +
         '<rect width="' + size + '" height="' + size + '" fill="' + (bg || '#F2F3EF') + '"/>' +
         '<path d="' + d + '" fill="' + (fg || '#0B1114') + '"/></svg>';
}

window.QR = { make: make, svg: svg };

/* 頁面上的 .qr 元素 */
Array.prototype.forEach.call(D.querySelectorAll('.qr'), function(el){
  var url = (el.dataset.qr || '').trim();
  if(!url){
    el.classList.add('empty');
    el.innerHTML = '<span>填入連結<br><code>data-qr="…"</code></span>';
    return;
  }
  try { el.innerHTML = svg(make(url), el.dataset.fg, el.dataset.bg); }
  catch(e){ el.classList.add('empty'); el.innerHTML = '<span>' + e.message + '</span>'; }
});

})();
