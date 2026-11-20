var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/index.ts
import { EmailMessage } from "cloudflare:email";
import { connect as tcpConnect } from "cloudflare:sockets";

// src/field_page.ts
var FIELD_PAGE_HTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<title>XYONG \xB7 \u5B9E\u5730\u91C7\u96C6</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}
:root{--g:#1f3b2c;--g2:#2e5c46;--gold:#c9a227;--bg:#f6f3ee;--card:#fff;--line:#e5e0d6;--txt:#2b2620;--muted:#8a857e;--req:#c0392b;--ok:#2e7d4f}
body{font-family:-apple-system,'PingFang SC','Microsoft YaHei',system-ui,sans-serif;background:var(--bg);color:var(--txt);font-size:15px;line-height:1.55;padding-bottom:90px}
header{position:sticky;top:0;z-index:30;background:linear-gradient(120deg,var(--g),var(--g2));color:#fff;padding:14px 16px;display:flex;align-items:center;gap:12px}
header .lg{font-size:18px;font-weight:800;letter-spacing:.14em}
header .sub{font-size:11px;color:#c9d6cd;letter-spacing:.22em;margin-top:2px}
header .out{margin-left:auto;font-size:12px;background:rgba(255,255,255,.14);color:#fff;border:none;border-radius:16px;padding:6px 12px}
main{padding:14px 14px 20px;max-width:560px;margin:0 auto}
.card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:14px;margin-bottom:14px;box-shadow:0 2px 10px rgba(31,59,44,.06)}
.card h2{font-size:14px;color:var(--g);font-weight:700;margin-bottom:4px;display:flex;align-items:center;gap:8px}
.card h2 .n{width:22px;height:22px;border-radius:7px;background:var(--g2);color:#fff;display:grid;place-items:center;font-size:12px;flex-shrink:0}
.card h2 .tag{margin-left:auto;font-size:11px;color:var(--muted);font-weight:400}
.tip{font-size:12px;color:var(--muted);line-height:1.6;margin-bottom:10px}
.cats{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.cat{border:1.5px solid var(--line);border-radius:12px;padding:12px;text-align:center;font-size:14px;font-weight:600;color:var(--txt);background:#fff}
.cat .e{font-size:22px;display:block;margin-bottom:4px}
.cat.on{border-color:var(--gold);background:#fdf8ea;box-shadow:0 0 0 2px rgba(201,162,39,.25)}
.fld{margin-bottom:12px}
.fld label{display:block;font-size:12.5px;font-weight:700;color:var(--g);margin-bottom:5px}
.fld label .rq{color:var(--req)}
.fld input,.fld select,.fld textarea{width:100%;padding:10px 12px;border:1.5px solid var(--line);border-radius:9px;background:#fbfaf7;font-size:14px;font-family:inherit;color:var(--txt);outline:none}
.fld input:focus,.fld textarea:focus,.fld select:focus{border-color:var(--gold);background:#fff}
.fld textarea{min-height:64px;resize:vertical}
.fld .hint{font-size:11px;color:var(--muted);margin-top:4px}
.row2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.slots{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.slot{border:1.5px dashed var(--line);border-radius:12px;background:#fbfaf7;padding:10px;text-align:center}
.slot.full{border-style:solid;border-color:#cfe3d4;background:#f4faf5}
.slot .st{font-size:12.5px;font-weight:700;color:var(--g)}
.slot .sh{font-size:11px;color:var(--muted);margin:2px 0 8px}
.slot input[type=file]{display:none}
.slot .pick{display:inline-block;background:var(--g2);color:#fff;font-size:12.5px;font-weight:600;border-radius:8px;padding:7px 14px}
.thumbs{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px;justify-content:center}
.thumbs .th{position:relative;width:52px;height:52px}
.thumbs img{width:52px;height:52px;object-fit:cover;border-radius:7px;border:1px solid var(--line)}
.thumbs .x{position:absolute;top:-6px;right:-6px;width:18px;height:18px;border-radius:50%;background:var(--req);color:#fff;border:none;font-size:11px;line-height:1;display:grid;place-items:center}
.doc{border:1px solid var(--line);border-radius:12px;padding:12px;margin-bottom:10px;background:#fbfaf7}
.doc .dh{display:flex;align-items:center;gap:8px;margin-bottom:8px}
.doc .dh b{font-size:13px;color:var(--g)}
.doc .dh button{margin-left:auto;background:none;border:none;color:var(--req);font-size:12px}
.doc .ffiles{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}
.doc .ff{display:inline-flex;align-items:center;gap:6px;background:#eef3fa;border-radius:8px;padding:4px 8px;font-size:11px;color:#33507a;max-width:100%}
.doc .ff img{width:26px;height:26px;object-fit:cover;border-radius:4px}
.btn-add-doc{width:100%;border:1.5px dashed var(--gold);background:#fdf8ea;color:#8a6d1a;font-size:13px;font-weight:600;border-radius:10px;padding:10px}
.actbar{position:fixed;bottom:0;left:0;right:0;background:rgba(255,255,255,.96);backdrop-filter:blur(8px);border-top:1px solid var(--line);padding:12px 14px;display:flex;gap:10px;z-index:40}
.actbar .save{flex:1;background:#fff;color:var(--muted);border:1px solid var(--line);border-radius:11px;font-size:14px;font-weight:600;padding:13px}
.actbar .go{flex:2;background:linear-gradient(120deg,var(--g),var(--g2));color:#fff;border:none;border-radius:11px;font-size:15px;font-weight:700;padding:13px}
.actbar button:disabled{opacity:.5}
.toast{position:fixed;bottom:88px;left:50%;transform:translateX(-50%) translateY(16px);background:var(--g);color:#fff;font-size:13px;font-weight:600;padding:10px 20px;border-radius:22px;opacity:0;pointer-events:none;transition:.25s;z-index:60;max-width:86vw;text-align:center}
.toast.show{opacity:1;transform:translateX(-50%) translateY(0)}
.toast.err{background:var(--req)}
.mask{position:fixed;inset:0;background:rgba(20,28,24,.55);z-index:80;display:none;align-items:center;justify-content:center;padding:24px}
.mask.show{display:flex}
.modal{background:#fff;border-radius:14px;padding:22px;max-width:340px;width:100%}
.modal h3{color:var(--g);font-size:16px;margin-bottom:8px}
.modal p{font-size:13px;color:var(--muted);line-height:1.7;margin-bottom:14px;word-break:break-all}
.modal .ok{width:100%;background:var(--g);color:#fff;border:none;border-radius:9px;padding:11px;font-size:14px;font-weight:700}
.gate{max-width:340px;margin:18vh auto 0;padding:0 16px}
.gate .card{text-align:center;padding:26px 20px}
.gate input{width:100%;text-align:center;font-size:15px;letter-spacing:1px}
.gate .go{width:100%;margin-top:12px;background:var(--g);color:#fff;border:none;border-radius:9px;padding:12px;font-size:14px;font-weight:700}
.hide{display:none}
.hist{font-size:12px;color:var(--muted)}
.hist li{margin:4px 0 4px 16px}
.pct{margin-left:auto;font-size:11px;background:rgba(255,255,255,.16);border-radius:12px;padding:4px 10px}
</style>
</head>
<body>

<div id="gate" class="gate hide">
  <div class="card">
    <div style="font-size:30px;margin-bottom:8px">\u{1F33F}</div>
    <h3 style="color:var(--g);margin-bottom:6px">XYONG \u5B9E\u5730\u91C7\u96C6</h3>
    <p style="font-size:13px;color:var(--muted);margin-bottom:14px">\u8BF7\u8F93\u5165\u8FD0\u8425\u8BBF\u95EE\u7801\uFF08\u4E2D\u53F0\u5BC6\u94A5\uFF09</p>
    <input id="gateToken" type="password" placeholder="\u8BBF\u95EE\u7801">
    <button class="go" id="gateGo">\u8FDB\u5165\u91C7\u96C6</button>
    <p id="gateErr" style="color:var(--req);font-size:12px;margin-top:10px"></p>
  </div>
</div>

<div id="app" class="hide">
<header>
  <div>
    <div class="lg">XYONG</div>
    <div class="sub">FIELD COLLECTION</div>
  </div>
  <div class="pct" id="pct">0%</div>
  <button class="out" id="btnLogout">\u9000\u51FA</button>
</header>
<main>

<div class="card">
  <h2><span class="n">1</span>\u9009\u62E9\u4EA7\u54C1\u7C7B\u522B</h2>
  <div class="cats" id="cats"></div>
</div>

<div class="card">
  <h2><span class="n">2</span>\u57FA\u672C\u4FE1\u606F</h2>
  <div class="fld"><label>\u4EA7\u54C1\u540D\u79F0\uFF08\u4E2D\u6587\uFF09<span class="rq">*</span></label><input id="f_name_zh" placeholder="\u5982\uFF1A\u4FDD\u5C71\u9AD8\u9ECE\u8D21\u5C71\u7CBE\u54C1\u963F\u62C9\u6BD4\u5361"></div>
  <div class="fld"><label>Product Name\uFF08\u82F1\u6587\uFF09</label><input id="f_name_en" placeholder="GaoLiGong Mountain Arabica"></div>
  <div class="fld"><label>\u91C7\u96C6\u5730\u70B9\uFF08\u7701/\u5E02/\u53BF/\u5E84\u56ED\uFF09<span class="rq">*</span></label><input id="f_origin" placeholder="\u4E91\u5357\u7701\u4FDD\u5C71\u5E02\u9686\u9633\u533A\u6F5E\u6C5F\u9547\xD7\xD7\u5E84\u56ED"></div>
  <div class="row2">
    <div class="fld"><label>\u6D77\u62D4\uFF08\u7C73\uFF09</label><input id="f_altitude" inputmode="numeric" placeholder="1500-1800"></div>
    <div class="fld"><label>\u91C7\u6536\u5B63\u8282 / \u65E5\u671F</label><input id="f_season" placeholder="2026\u5E7411\u6708 / 11\u6708\u4E0A\u65EC"></div>
  </div>
  <div class="row2">
    <div class="fld"><label>\u6279\u53F7</label><input id="f_batch" placeholder="XY20261101"></div>
    <div class="fld"><label>\u53EF\u4F9B\u8D27\u91CF</label><input id="f_qty" inputmode="decimal" placeholder="500"></div>
  </div>
  <div class="row2">
    <div class="fld"><label>\u8BA1\u91CF\u5355\u4F4D</label><input id="f_unit" placeholder="kg / \u888B / \u74F6"></div>
    <div class="fld"><label>\u53C2\u8003\u5355\u4EF7\uFF08\u7F8E\u5143\uFF09</label><input id="f_price_usd" inputmode="decimal" placeholder="69"></div>
  </div>
  <div class="row2">
    <div class="fld"><label>\u4FDD\u8D28\u671F</label><input id="f_shelf_life" placeholder="12\u4E2A\u6708"></div>
    <div class="fld"><label>\u50A8\u5B58\u6761\u4EF6</label><input id="f_storage" placeholder="\u9634\u51C9\u5E72\u71E5\u3001\u907F\u5149\u5BC6\u5C01"></div>
  </div>
</div>

<div class="card">
  <h2><span class="n">3</span><span id="specTitle">\u7C7B\u522B\u53C2\u6570</span></h2>
  <div id="specFields"></div>
</div>

<div class="card">
  <h2><span class="n">4</span>\u73B0\u573A\u7167\u7247 <span class="tag">\u624B\u673A\u62CD\u7167\u81EA\u52A8\u538B\u7F29\u4E0A\u4F20</span></h2>
  <div class="tip">\u56DB\u7C7B\u69FD\u4F4D\u90FD\u53EF\u62CD\u591A\u5F20\uFF1B\u73B0\u573A\u5149\u7EBF\u590D\u6742\u65F6\u5C3D\u91CF\u5BF9\u51C6\u4E3B\u4F53\u3001\u907F\u514D\u9006\u5149\u3002</div>
  <div class="slots" id="slots"></div>
</div>

<div class="card">
  <h2><span class="n">5</span>\u5408\u89C4\u4E0E\u68C0\u6D4B\u6587\u4EF6 <span class="tag">\u68C0\u6D4B\u62A5\u544A / \u8BA4\u8BC1\u8BC1\u4E66</span></h2>
  <div class="tip">\u5EFA\u8BAE\u6BCF\u6B3E\u4EA7\u54C1\u81F3\u5C11\u4E0A\u4F20\u3010\u4EA7\u54C1\u68C0\u6D4B\u62A5\u544A\u3011\u4E0E\u3010\u6709\u673A\u8BA4\u8BC1\u3011\uFF1B\u53EF\u62CD\u7167\u8BC1\u4E66\u539F\u4EF6\u6216\u626B\u63CF\u4EF6\u3002</div>
  <div id="docs"></div>
  <button class="btn-add-doc" id="btnAddDoc">\uFF0B \u6DFB\u52A0\u4E00\u4EFD\u5408\u89C4\u6587\u4EF6</button>
</div>

<div class="card">
  <h2><span class="n">6</span>\u54C1\u724C\u6545\u4E8B / \u73B0\u573A\u5907\u6CE8</h2>
  <div class="fld"><textarea id="f_story" placeholder="\u4EA7\u5730\u6545\u4E8B\u3001\u519C\u6237\u4FE1\u606F\u3001\u52A0\u5DE5\u7EC6\u8282\u3001\u60F3\u8981\u7A81\u51FA\u7ED9\u56FD\u9645\u4E70\u5BB6\u7684\u5356\u70B9\u2026"></textarea></div>
</div>

<div class="card">
  <h2><span class="n">7</span>\u672C\u6B21\u91C7\u96C6\u8BB0\u5F55</h2>
  <ul class="hist" id="hist"><li>\u6682\u65E0</li></ul>
</div>

</main>
<div class="actbar">
  <button class="save" id="btnSave">\u5B58\u8349\u7A3F</button>
  <button class="go" id="btnSubmit">\u63D0\u4EA4\u91C7\u96C6\u62A5\u544A</button>
</div>
</div>

<div class="toast" id="toast"></div>
<div class="mask" id="doneMask"><div class="modal">
  <h3>\u2705 \u63D0\u4EA4\u6210\u529F</h3>
  <p id="doneText"></p>
  <button class="ok" id="doneOk">\u7EE7\u7EED\u91C7\u96C6\u4E0B\u4E00\u4E2A</button>
</div></div>

<script>
(function(){
'use strict';
var API = 'https://apixyong.ccwu.cc';
var SLOT_DEFS = [
  ['featured','\u4EA7\u54C1\u7279\u5199','\u5355\u54C1\u8FD1\u62CD\uFF0C\u767D/\u7D20\u8272\u80CC\u666F'],
  ['environment','\u4EA7\u5730\u73AF\u5883','\u679C\u56ED/\u8336\u5C71/\u83CC\u5858\u5168\u666F'],
  ['process','\u91C7\u6458\xB7\u52A0\u5DE5','\u91C7\u6458\u3001\u5904\u7406\u3001\u70D8\u7119\u73B0\u573A'],
  ['packaging','\u5305\u88C5\u89C4\u683C','\u5305\u88C5\u3001\u6807\u7B7E\u3001\u6574\u7BB1'],
  ['extra','\u66F4\u591A\u7167\u7247','\u8BC1\u4E66\u4E4B\u5916\u7684\u8865\u5145\u7167\u7247']
];
var DOC_TYPES = ['\u4EA7\u54C1\u68C0\u6D4B\u62A5\u544A','\u6709\u673A\u8BA4\u8BC1','\u690D\u7269\u68C0\u75AB\u8BC1\u4E66','\u539F\u4EA7\u5730\u8BC1','\u6E05\u771F\u8BA4\u8BC1','HACCP / ISO22000','\u5176\u4ED6\u8BA4\u8BC1'];
var CATS = {
  coffee:{label:'\u7CBE\u54C1\u5496\u5561',icon:'\u2615',fields:[
    ['variety','\u54C1\u79CD','\u94C1\u76AE\u5361 Typica / \u5361\u8482\u59C6 Catimor'],
    ['process','\u5904\u7406\u6CD5','\u6C34\u6D17 / \u65E5\u6652 / \u871C\u5904\u7406 / \u538C\u6C27'],
    ['roast','\u70D8\u7119\u5EA6','\u751F\u8C46 / \u6D45\u70D8 / \u4E2D\u70D8 / \u6DF1\u70D8'],
    ['cup_score','\u676F\u6D4B\u8BC4\u5206\uFF08SCA \u6EE1\u5206100\uFF09','85+'],
    ['flavor','\u98CE\u5473\u63CF\u8FF0','\u67D1\u6A58\u3001\u8309\u8389\u82B1\u9999\u3001\u8702\u871C\u751C\u611F'],
    ['moisture','\u542B\u6C34\u7387\uFF08%\uFF09','10-12'],
    ['screen_size','\u7B5B\u7F51\u5C3A\u5BF8','15\u76EE\u4EE5\u4E0A\uFF08AA\u7EA7\uFF09'],
    ['defect_rate','\u7455\u75B5\u7387\uFF08%\uFF09','\u5C0F\u4E8E5']
  ]},
  tea:{label:'\u7279\u7EA7\u8336\u53F6',icon:'\u{1F375}',fields:[
    ['tea_type','\u8336\u7C7B','\u666E\u6D31 / \u6EC7\u7EA2 / \u767D\u8336'],
    ['tree_age','\u6811\u9F84','\u53E4\u6811300\u5E74 / \u5927\u6811 / \u53F0\u5730'],
    ['grade','\u7B49\u7EA7','\u7279\u7EA7 / \u4E00\u7EA7'],
    ['craft','\u5236\u4F5C\u5DE5\u827A','\u624B\u5DE5\u63C9\u637B\u3001\u65E5\u5149\u6652\u5E72'],
    ['leaf','\u5E72\u8336\u5916\u5F62','\u6761\u7D22\u7D27\u7ED3\u3001\u91D1\u6BEB\u663E\u9732'],
    ['liquor','\u6C64\u8272','\u91D1\u9EC4\u900F\u4EAE'],
    ['taste','\u53E3\u611F\u63CF\u8FF0','\u56DE\u7518\u751F\u6D25\u3001\u871C\u9999\u660E\u663E'],
    ['brewing','\u51B2\u6CE1\u6307\u5357','95\xB0C\uFF0C5g / 110ml']
  ]},
  truffle:{label:'\u9ED1\u677E\u9732',icon:'\u{1F344}',fields:[
    ['scientific','\u5B66\u540D','Tuber indicum\uFF08\u4E2D\u534E\u9ED1\u677E\u9732\uFF09'],
    ['harvest_method','\u91C7\u6536\u65B9\u5F0F','\u4EBA\u5DE5\u91C7\u6316\u3001\u677E\u9732\u72AC\u5BFB\u83B7'],
    ['grade','\u7B49\u7EA7','\u4E00\u7EA7\uFF08\u5355\u989750g\u4EE5\u4E0A\uFF09'],
    ['appearance','\u5916\u89C2\u63CF\u8FF0','\u8868\u76AE\u9ED1\u8910\u8272\u3001\u9CDE\u7EB9\u6E05\u6670'],
    ['aroma','\u9999\u6C14\u63CF\u8FF0','\u6D53\u90C1\u83CC\u9999\u3001\u5FAE\u575A\u679C\u9999'],
    ['firmness','\u786C\u5EA6','\u575A\u5B9E\u6709\u5F39\u6027'],
    ['truffle_moisture','\u542B\u6C34\u72B6\u6001','\u8868\u9762\u5FAE\u6DA6\u65E0\u6CE5']
  ]},
  oil:{label:'\u9AD8\u6863\u7CBE\u6CB9',icon:'\u{1F4A7}',fields:[
    ['botanical','\u690D\u7269\u6765\u6E90','\u6FB3\u6D32\u8336\u6811 / \u6849\u6811 / \u73AB\u7470'],
    ['plant_part','\u4F7F\u7528\u90E8\u4F4D','\u53F6\u7247 / \u82B1 / \u679C\u76AE'],
    ['extraction','\u63D0\u53D6\u65B9\u5F0F','\u6C34\u84B8\u6C14\u84B8\u998F\u6CD5'],
    ['yield_rate','\u51FA\u6CB9\u7387\uFF08%\uFF09','1.5'],
    ['oil_appearance','\u5916\u89C2','\u65E0\u8272\u81F3\u6DE1\u9EC4\u8272\u6F84\u6E05\u6DB2\u4F53'],
    ['oil_aroma','\u9999\u6C14\u63CF\u8FF0','\u6E05\u65B0\u8349\u672C\u9999'],
    ['components','\u4E3B\u8981\u6210\u5206',''],
    ['purity','\u7EAF\u5EA6\uFF08%\uFF09','100']
  ]}
};
var state = { category:'', data:{}, photos:{}, docs:[] };

function $(id){ return document.getElementById(id); }
function toast(msg, err){ var t=$('toast'); t.textContent=msg; t.className='toast show'+(err?' err':''); setTimeout(function(){t.className='toast';},2400); }
function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

/* ---------- \u8BBF\u95EE\u7801 ---------- */
var token = localStorage.getItem('xyong_field_token') || '';
function showGate(){ $('gate').classList.remove('hide'); $('app').classList.add('hide'); }
function showApp(){ $('gate').classList.add('hide'); $('app').classList.remove('hide'); }
$('gateGo').onclick = function(){
  var v = $('gateToken').value.trim();
  if(!v){ $('gateErr').textContent='\u8BF7\u8F93\u5165\u8BBF\u95EE\u7801'; return; }
  fetch(API+'/api/field/ping',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:v})})
    .then(function(r){ return r.json(); })
    .then(function(d){
      if(d.ok){ token=v; localStorage.setItem('xyong_field_token',v); showApp(); init(); }
      else { $('gateErr').textContent='\u8BBF\u95EE\u7801\u4E0D\u6B63\u786E'; }
    })
    .catch(function(){ $('gateErr').textContent='\u7F51\u7EDC\u4E0D\u901A\uFF0C\u8BF7\u786E\u8BA4\u624B\u673A\u6709\u7F51'; });
};
$('btnLogout').onclick = function(){ localStorage.removeItem('xyong_field_token'); token=''; showGate(); };

/* ---------- \u7C7B\u522B ---------- */
function renderCats(){
  var html = '';
  for (var k in CATS) {
    html += '<button class="cat'+(state.category===k?' on':'')+'" data-c="'+k+'"><span class="e">'+CATS[k].icon+'</span>'+CATS[k].label+'</button>';
  }
  $('cats').innerHTML = html;
  var btns = $('cats').querySelectorAll('.cat');
  for (var i=0;i<btns.length;i++) {
    btns[i].onclick = function(){ state.category=this.getAttribute('data-c'); renderCats(); renderSpecs(); save(); };
  }
}
function renderSpecs(){
  var cat = CATS[state.category];
  $('specTitle').textContent = cat ? cat.label+' \xB7 \u4E13\u4E1A\u53C2\u6570' : '\u7C7B\u522B\u53C2\u6570';
  var html = '';
  if (!cat) { $('specFields').innerHTML='<div class="tip">\u8BF7\u5148\u5728\u4E0A\u65B9\u9009\u62E9\u4EA7\u54C1\u7C7B\u522B</div>'; return; }
  for (var i=0;i<cat.fields.length;i++){
    var f = cat.fields[i];
    html += '<div class="fld"><label>'+esc(f[1])+'</label><input data-fk="'+f[0]+'" value="'+esc(state.data[f[0]]||'')+'" placeholder="'+esc(f[2])+'"></div>';
  }
  $('specFields').innerHTML = html;
  var inputs = $('specFields').querySelectorAll('input');
  for (var j=0;j<inputs.length;j++){
    inputs[j].oninput = function(){ state.data[this.getAttribute('data-fk')]=this.value; save(); updatePct(); };
  }
}

/* ---------- \u57FA\u672C\u4FE1\u606F ---------- */
function bindBasic(){
  var ids = ['name_zh','name_en','origin','altitude','season','batch','qty','unit','price_usd','shelf_life','storage','story'];
  for (var i=0;i<ids.length;i++){
    (function(k){
      var el = $('f_'+k);
      el.value = state.data[k]||'';
      el.oninput = function(){ state.data[k]=this.value; save(); updatePct(); };
    })(ids[i]);
  }
}

/* ---------- \u7167\u7247 ---------- */
function renderSlots(){
  var html = '';
  for (var i=0;i<SLOT_DEFS.length;i++){
    var s = SLOT_DEFS[i];
    var arr = state.photos[s[0]]||[];
    var th = '';
    for (var j=0;j<arr.length;j++){
      th += '<span class="th"><img src="'+arr[j].b64+'"><button class="x" data-sl="'+s[0]+'" data-i="'+j+'">\u2715</button></span>';
    }
    html += '<div class="slot'+(arr.length?' full':'')+'">'
      + '<div class="st">'+s[1]+(arr.length?' \xB7 '+arr.length:'')+'</div>'
      + '<div class="sh">'+s[2]+'</div>'
      + '<label class="pick">\u{1F4F7} \u62CD\u7167/\u76F8\u518C<input type="file" accept="image/*" capture="environment" multiple data-slot="'+s[0]+'"></label>'
      + '<div class="thumbs">'+th+'</div>'
      + '</div>';
  }
  $('slots').innerHTML = html;
  var files = $('slots').querySelectorAll('input[type=file]');
  for (var a=0;a<files.length;a++){
    files[a].onchange = function(){ addPhotos(this.getAttribute('data-slot'), this.files); this.value=''; };
  }
  var dels = $('slots').querySelectorAll('.x');
  for (var b=0;b<dels.length;b++){
    dels[b].onclick = function(){ var sl=this.getAttribute('data-sl'); state.photos[sl].splice(Number(this.getAttribute('data-i')),1); renderSlots(); save(); };
  }
}
function addPhotos(slot, fileList){
  var arr = state.photos[slot] = state.photos[slot]||[];
  var todo = 0, done = 0;
  for (var i=0;i<fileList.length;i++){
    var file = fileList[i];
    if (!file.type || file.type.indexOf('image')!==0) continue;
    todo++;
    compress(file, 1280, 0.82, function(b64){
      arr.push({ b64:b64 });
      done++;
      if (done===todo){ renderSlots(); save(); updatePct(); toast('\u7167\u7247\u5DF2\u6DFB\u52A0\uFF0C\u5171 '+arr.length+' \u5F20'); }
    });
  }
  if (todo===0) toast('\u8BF7\u9009\u62E9\u56FE\u7247\u6587\u4EF6', true);
}
function compress(file, maxSide, quality, cb){
  var reader = new FileReader();
  reader.onload = function(){
    var img = new Image();
    img.onload = function(){
      var w = img.width, h = img.height;
      var scale = Math.min(1, maxSide/Math.max(w,h));
      var c = document.createElement('canvas');
      c.width = Math.round(w*scale); c.height = Math.round(h*scale);
      c.getContext('2d').drawImage(img,0,0,c.width,c.height);
      cb(c.toDataURL('image/jpeg', quality).split(',')[1]);
    };
    img.onerror = function(){ toast('\u6709\u56FE\u7247\u8BFB\u53D6\u5931\u8D25', true); };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
}

/* ---------- \u5408\u89C4\u6587\u4EF6 ---------- */
function renderDocs(){
  var html = '';
  for (var i=0;i<state.docs.length;i++){
    var d = state.docs[i];
    var files = '';
    for (var j=0;j<d.files.length;j++){
      var f = d.files[j];
      var inner = f.mime && f.mime.indexOf('image')===0
        ? '<img src="data:'+f.mime+';base64,'+f.b64+'">'
        : '<span style="font-size:16px">\u{1F4C4}</span>';
      files += '<span class="ff">'+inner+' '+esc(f.name||'\u6587\u4EF6')+'<button data-di="'+i+'" data-fi="'+j+'" style="border:none;background:none;color:var(--req);font-size:12px">\u2715</button></span>';
    }
    html += '<div class="doc">'
      + '<div class="dh"><b>\u6587\u4EF6 '+(i+1)+'</b><button data-del="'+i+'">\u5220\u9664</button></div>'
      + '<div class="row2">'
      + '<div class="fld"><label>\u7C7B\u578B</label><select data-df="'+i+'-type">'
      + (function(){ var o=''; for(var t=0;t<DOC_TYPES.length;t++){ o+='<option'+(d.type===DOC_TYPES[t]?' selected':'')+'>'+DOC_TYPES[t]+'</option>'; } return o; })()
      + '</select></div>'
      + '<div class="fld"><label>\u7F16\u53F7 / \u540D\u79F0</label><input data-df="'+i+'-no" value="'+esc(d.no)+'" placeholder="\u62A5\u544A\u7F16\u53F7"></div>'
      + '</div>'
      + '<div class="row2">'
      + '<div class="fld"><label>\u7B7E\u53D1\u673A\u6784</label><input data-df="'+i+'-issuer" value="'+esc(d.issuer)+'" placeholder="SGS / \u8BA4\u8BC1\u4E2D\u5FC3"></div>'
      + '<div class="fld"><label>\u6709\u6548\u671F\u81F3</label><input data-df="'+i+'-expiry" value="'+esc(d.expiry)+'" placeholder="2027-11-30"></div>'
      + '</div>'
      + '<label class="pick" style="display:inline-block;background:var(--g2);color:#fff;font-size:12.5px;font-weight:600;border-radius:8px;padding:7px 14px">\u{1F4F7} \u4E0A\u4F20\u8BC1\u4E66\u7167\u7247/PDF<input type="file" accept="image/*,.pdf" capture="environment" multiple data-df="'+i+'-files"></label>'
      + '<div class="ffiles">'+files+'</div>'
      + '</div>';
  }
  $('docs').innerHTML = html || '<div class="tip" style="color:#b0a99f">\u8FD8\u6CA1\u6709\u6DFB\u52A0\u6587\u4EF6</div>';
  var sels = $('docs').querySelectorAll('select');
  for (var a=0;a<sels.length;a++){
    sels[a].onchange = function(){ var p=this.getAttribute('data-df').split('-'); state.docs[Number(p[0])].type=this.value; save(); };
  }
  var inputs = $('docs').querySelectorAll('input');
  for (var b=0;b<inputs.length;b++){
    inputs[b].oninput = function(){
      var p=this.getAttribute('data-df').split('-');
      var key=p[1]; if(key==='files')return;
      state.docs[Number(p[0])][key]=this.value; save();
    };
    if (inputs[b].type==='file'){
      inputs[b].onchange = function(){
        var idx=Number(this.getAttribute('data-df').split('-')[0]);
        addDocFiles(idx, this.files); this.value='';
      };
    }
  }
  var delBtns = $('docs').querySelectorAll('[data-del]');
  for (var c=0;c<delBtns.length;c++){
    delBtns[c].onclick = function(){ state.docs.splice(Number(this.getAttribute('data-del')),1); renderDocs(); save(); };
  }
  var delFiles = $('docs').querySelectorAll('[data-di]');
  for (var d=0;d<delFiles.length;d++){
    delFiles[d].onclick = function(){
      var di=Number(this.getAttribute('data-di')), fi=Number(this.getAttribute('data-fi'));
      state.docs[di].files.splice(fi,1); renderDocs(); save();
    };
  }
}
function addDocFiles(idx, fileList){
  var arr = state.docs[idx].files;
  var todo=0, done=0, failed=false;
  for (var i=0;i<fileList.length;i++){
    var file=fileList[i];
    var isPdf = file.type==='application/pdf';
    var isImg = file.type && file.type.indexOf('image')===0;
    if (!isPdf && !isImg) continue;
    todo++;
    if (isImg){
      compress(file, 1600, 0.85, function(b64){
        arr.push({ name:'\u8BC1\u4E66\u7167\u7247', mime:'image/jpeg', b64:b64 });
        done++; if(done===todo){ renderDocs(); save(); }
      });
    } else {
      if (file.size > 8*1024*1024){ failed=true; continue; }
      (function(file){
        var r=new FileReader();
        r.onload=function(){
          arr.push({ name:file.name, mime:'application/pdf', b64:r.result.split(',')[1] });
          done++; if(done===todo){ renderDocs(); save(); }
        };
        r.readAsDataURL(file);
      })(file);
    }
  }
  if (todo===0) toast('\u8BF7\u9009\u62E9\u56FE\u7247\u6216 PDF \u6587\u4EF6', true);
  else if (failed) toast('\u6709 PDF \u8D85\u8FC7 8MB\uFF0C\u672A\u52A0\u5165', true);
}
$('btnAddDoc').onclick = function(){
  state.docs.push({ type:DOC_TYPES[0], no:'', issuer:'', expiry:'', files:[] });
  renderDocs(); save();
};

/* ---------- \u8FDB\u5EA6 ---------- */
function updatePct(){
  var need = ['name_zh','origin'];
  var done = 0, total = need.length + 1; /* \u57FA\u7840\u5FC5\u586B + \u81F3\u5C11\u4E00\u5F20\u7167\u7247 */
  for (var i=0;i<need.length;i++){ if ((state.data[need[i]]||'').trim()) done++; }
  var photoCount = 0;
  for (var k in state.photos){ photoCount += state.photos[k].length; }
  if (photoCount>0) done++;
  var pct = Math.round(done*100/total);
  $('pct').textContent = pct+'%';
}

/* ---------- \u8349\u7A3F ---------- */
function save(){ try{ localStorage.setItem('xyong_field_draft', JSON.stringify(state)); }catch(e){} }
function restore(){
  try{
    var raw = localStorage.getItem('xyong_field_draft');
    if (!raw) return;
    var s = JSON.parse(raw);
    if (s && s.data){ state.category=s.category||''; state.data=s.data||{}; state.photos=s.photos||{}; state.docs=s.docs||[]; }
  }catch(e){}
}

/* ---------- \u5386\u53F2 ---------- */
function loadHistory(){
  fetch(API+'/api/field/reports',{headers:{'Authorization':'Bearer '+token}})
    .then(function(r){ return r.json(); })
    .then(function(d){
      var list = (d && d.reports)||[];
      if (!list.length){ $('hist').innerHTML='<li>\u6682\u65E0</li>'; return; }
      var html='';
      for (var i=0;i<list.length && i<8;i++){
        html+='<li>'+esc(list[i].created_at||'')+' \xB7 '+esc(list[i].category)+' \xB7 '+esc(list[i].product_name)+'\uFF08'+(list[i].status==='published'?'\u5DF2\u8F6C\u5546\u54C1':'\u5F85\u5BA1\u6838')+'\uFF09</li>';
      }
      $('hist').innerHTML=html;
    })
    .catch(function(){});
}

/* ---------- \u63D0\u4EA4 ---------- */
$('btnSubmit').onclick = function(){
  if (!state.category){ toast('\u8BF7\u5148\u9009\u62E9\u4EA7\u54C1\u7C7B\u522B', true); return; }
  if (!(state.data.name_zh||'').trim()){ toast('\u8BF7\u586B\u5199\u4EA7\u54C1\u540D\u79F0', true); return; }
  if (!(state.data.origin||'').trim()){ toast('\u8BF7\u586B\u5199\u91C7\u96C6\u5730\u70B9', true); return; }
  var photoCount=0; for (var k in state.photos){ photoCount+=state.photos[k].length; }
  if (photoCount===0){ toast('\u8BF7\u81F3\u5C11\u62CD\u6444\u4E00\u5F20\u73B0\u573A\u7167\u7247', true); return; }
  var btn=this; btn.disabled=true; btn.textContent='\u63D0\u4EA4\u4E2D\u2026';
  var payload = { category:state.category, data:state.data, photos:[], docs:state.docs };
  for (var s in state.photos){
    for (var i=0;i<state.photos[s].length;i++){
      payload.photos.push({ slot:s, b64:state.photos[s][i].b64, mime:'image/jpeg' });
    }
  }
  fetch(API+'/api/field/reports',{
    method:'POST',
    headers:{ 'Content-Type':'application/json', 'Authorization':'Bearer '+token },
    body: JSON.stringify(payload)
  }).then(function(r){ return r.json().then(function(d){ return { ok:r.ok, d:d }; }); })
    .then(function(res){
      btn.disabled=false; btn.textContent='\u63D0\u4EA4\u91C7\u96C6\u62A5\u544A';
      if (res.ok){
        $('doneText').textContent = '\u62A5\u544A\u7F16\u53F7 '+res.d.id+'\uFF0C\u5DF2\u540C\u6B65\u5230\u8FD0\u8425\u4E2D\u53F0\u300C\u5B9E\u5730\u91C7\u96C6\u300D\u3002\u7167\u7247 '+res.d.photos+' \u5F20\u3001\u5408\u89C4\u6587\u4EF6 '+res.d.docs+' \u4EFD\u3002';
        $('doneMask').classList.add('show');
        state.category=''; state.data={}; state.photos={}; state.docs=[];
        localStorage.removeItem('xyong_field_draft');
        renderCats(); renderSpecs(); bindBasic(); renderSlots(); renderDocs(); updatePct(); loadHistory();
      } else {
        toast(res.d.error||'\u63D0\u4EA4\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5', true);
      }
    })
    .catch(function(){
      btn.disabled=false; btn.textContent='\u63D0\u4EA4\u91C7\u96C6\u62A5\u544A';
      toast('\u7F51\u7EDC\u4E0D\u901A\uFF0C\u8349\u7A3F\u5DF2\u4FDD\u5B58\uFF0C\u6062\u590D\u7F51\u7EDC\u540E\u518D\u8BD5', true);
    });
};
$('doneOk').onclick = function(){ $('doneMask').classList.remove('show'); };
$('btnSave').onclick = function(){ save(); toast('\u8349\u7A3F\u5DF2\u4FDD\u5B58\u5230\u672C\u673A'); };

/* ---------- \u521D\u59CB\u5316 ---------- */
function init(){
  restore();
  renderCats(); renderSpecs(); bindBasic(); renderSlots(); renderDocs(); updatePct(); loadHistory();
}
if (token) { showApp(); init(); } else { showGate(); }
})();
<\/script>
</body>
</html>`;

// src/index.ts
function mimeHeader(value) {
  return /[^\x20-\x7E]/.test(value) ? `=?UTF-8?B?${btoa(String.fromCharCode(...new TextEncoder().encode(value)))}?=` : value;
}
__name(mimeHeader, "mimeHeader");
function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
__name(escapeHtml, "escapeHtml");
function brandHtml(title, lines) {
  const body2 = lines.map((l) => `<p style="margin:0 0 10px;line-height:1.7;color:#33302c;font-size:14px">${escapeHtml(l)}</p>`).join("");
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:24px 12px;background:#f6f3ee;font-family:-apple-system,'Segoe UI','Microsoft YaHei',sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#fff;border-radius:10px;overflow:hidden">
<tr><td style="background:#1f3b2c;padding:20px 24px">
<div style="color:#f6f3ee;font-size:17px;letter-spacing:.14em;font-weight:600">XYONG</div>
<div style="color:#c9d6cd;font-size:11px;letter-spacing:.28em;margin-top:4px">YUNNAN SELECT</div>
</td></tr>
<tr><td style="padding:26px 24px">
<h2 style="margin:0 0 16px;font-size:18px;color:#1f3b2c;font-weight:600">${escapeHtml(title)}</h2>
${body2}
</td></tr>
<tr><td style="padding:16px 24px;border-top:1px solid #ece7df;color:#8a857e;font-size:11px;line-height:1.7">
XYONG \u4E91\u5357\u7CBE\u54C1\u56ED \xB7 Yunnan Select<br>
\u5BA2\u670D\u90AE\u7BB1 xyong@xyong.ccwu.cc \xB7 https://xyong.ccwu.cc
</td></tr></table></body></html>`;
}
__name(brandHtml, "brandHtml");
function b64utf8(s) {
  return btoa(String.fromCharCode(...new TextEncoder().encode(s)));
}
__name(b64utf8, "b64utf8");
async function getSettingValue(env, key) {
  try {
    const row = await env.DB.prepare(`SELECT value FROM settings WHERE key=? LIMIT 1`).bind(key).first();
    return row?.value ? String(row.value) : "";
  } catch {
    return "";
  }
}
__name(getSettingValue, "getSettingValue");
async function smtpSend(env, to, subject, lines, opts = {}) {
  const user = await getSettingValue(env, "smtp_user");
  const pass = await getSettingValue(env, "smtp_pass");
  if (!user || !pass)
    return { ok: false, error: "SMTP \u672A\u914D\u7F6E" };
  const host = await getSettingValue(env, "smtp_host") || "smtp.zoho.com";
  const port = Number(await getSettingValue(env, "smtp_port") || 465);
  const from = env.MAIL_FROM || "xyong@xyong.ccwu.cc";
  try {
    const socket = tcpConnect(`${host}:${port}`, { secureTransport: "on", allowHalfOpen: false });
    const writer = socket.writable.getWriter();
    const reader = socket.readable.getReader();
    const enc = new TextEncoder();
    const dec = new TextDecoder();
    let buffer = "";
    const readReply = /* @__PURE__ */ __name(async (timeoutMs = 2e4) => {
      const deadline = Date.now() + timeoutMs;
      let timer;
      try {
        while (Date.now() < deadline) {
          const idx = buffer.indexOf("\r\n");
          if (idx >= 0) {
            const line = buffer.slice(0, idx);
            buffer = buffer.slice(idx + 2);
            if (/^\d{3}[ -]/.test(line))
              return line;
            continue;
          }
          timer = setTimeout(() => {
            try {
              reader.cancel();
            } catch {
            }
          }, deadline - Date.now());
          const { value, done } = await reader.read();
          if (done)
            throw new Error("\u8FDE\u63A5\u88AB\u670D\u52A1\u5668\u5173\u95ED");
          clearTimeout(timer);
          timer = void 0;
          buffer += dec.decode(value, { stream: true });
        }
        throw new Error("\u7B49\u5F85\u670D\u52A1\u5668\u54CD\u5E94\u8D85\u65F6");
      } finally {
        if (timer)
          clearTimeout(timer);
      }
    }, "readReply");
    const cmd = /* @__PURE__ */ __name(async (line, expect) => {
      await writer.write(enc.encode(line + "\r\n"));
      const reply2 = await readReply();
      const code = parseInt(reply2.slice(0, 3), 10);
      if (expect && code !== expect)
        throw new Error(`\u670D\u52A1\u5668\u8FD4\u56DE ${reply2}`);
      return code;
    }, "cmd");
    await readReply();
    await cmd(`EHLO xyong.ccwu.cc`, 250);
    await cmd("AUTH LOGIN", 334);
    await cmd(b64utf8(user), 334);
    await cmd(b64utf8(pass), 235);
    await cmd(`MAIL FROM:<${from}>`, 250);
    await cmd(`RCPT TO:<${to}>`, 250);
    await cmd("DATA", 354);
    const text = [...lines, "", `\u2014 ${env.MAIL_BOX || "xyong@xyong.ccwu.cc"} \xB7 XYONG \u4E91\u5357\u7CBE\u54C1\u56ED`].join("\r\n");
    const head = [
      `From: XYONG \u4E91\u5357\u7CBE\u54C1\u56ED <${from}>`,
      `To: ${to}`,
      `Subject: ${mimeHeader(subject)}`,
      `Date: ${(/* @__PURE__ */ new Date()).toUTCString()}`,
      `Message-ID: <${crypto.randomUUID().replace(/-/g, "")}@xyong.ccwu.cc>`,
      "MIME-Version: 1.0",
      `Reply-To: ${env.MAIL_BOX || from}`
    ];
    let raw;
    if (opts.html === false) {
      raw = [...head, "Content-Type: text/plain; charset=utf-8", "Content-Transfer-Encoding: 8bit", "", text].join("\r\n");
    } else {
      const boundary = `xyong-${crypto.randomUUID().slice(0, 8)}`;
      raw = [
        ...head,
        `Content-Type: multipart/alternative; boundary="${boundary}"`,
        "",
        `--${boundary}`,
        "Content-Type: text/plain; charset=utf-8",
        "Content-Transfer-Encoding: 8bit",
        "",
        text,
        `--${boundary}`,
        "Content-Type: text/html; charset=utf-8",
        "Content-Transfer-Encoding: 8bit",
        "",
        brandHtml(subject, lines),
        `--${boundary}--`
      ].join("\r\n");
    }
    await writer.write(enc.encode(raw.replace(/^\./gm, "..") + "\r\n.\r\n"));
    const reply = await readReply();
    if (parseInt(reply.slice(0, 3), 10) !== 250)
      throw new Error(`\u6295\u9012\u88AB\u62D2\u7EDD\uFF1A${reply}`);
    await cmd("QUIT", 221).catch(() => {
    });
    try {
      writer.releaseLock();
      reader.releaseLock();
    } catch {
    }
    socket.close();
    return { ok: true };
  } catch (e) {
    console.log("smtp_send_fail", to, String(e));
    return { ok: false, error: String(e).replace(/^Error: /, "") };
  }
}
__name(smtpSend, "smtpSend");
async function sendMail(env, to, subject, lines, opts = {}) {
  const body2 = [...lines, "", `\u2014 ${env.MAIL_BOX || "xyong@xyong.ccwu.cc"} \xB7 XYONG \u4E91\u5357\u7CBE\u54C1\u56ED`].join("\r\n");
  const smtpUser = await getSettingValue(env, "smtp_user");
  const smtpPass = await getSettingValue(env, "smtp_pass");
  if (smtpUser && smtpPass) {
    const r = await smtpSend(env, to, subject, lines, opts);
    if (r.ok)
      return true;
    console.log("smtp_channel_fail", to, r.error);
  }
  if (env.SENDGRID_API_KEY) {
    try {
      const resp = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: { Authorization: `Bearer ${env.SENDGRID_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: env.MAIL_FROM || "xyong@xyong.ccwu.cc", name: "XYONG \u4E91\u5357\u7CBE\u54C1\u56ED" },
          reply_to: { email: env.MAIL_BOX || "xyong@xyong.ccwu.cc", name: "XYONG \u4E91\u5357\u7CBE\u54C1\u56ED" },
          subject,
          content: opts.html === false ? [{ type: "text/plain", value: body2 }] : [
            { type: "text/plain", value: body2 },
            { type: "text/html", value: brandHtml(subject, lines) }
          ]
        })
      });
      if (resp.ok)
        return true;
      console.log("sendgrid_fail", resp.status, (await resp.text()).slice(0, 300));
    } catch (e) {
      console.log("sendgrid_exc", String(e));
    }
  }
  if (env.RESEND_API_KEY) {
    const from2 = env.RESEND_FROM || `XYONG \u4E91\u5357\u7CBE\u54C1\u56ED <${env.MAIL_FROM || "xyong@xyong.ccwu.cc"}>`;
    const text2 = [...lines, "", `\u2014 ${env.MAIL_BOX || "xyong@xyong.ccwu.cc"} \xB7 XYONG \u4E91\u5357\u7CBE\u54C1\u56ED`].join("\r\n");
    try {
      const resp = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: from2,
          to: [to],
          subject,
          text: text2,
          html: opts.html === false ? void 0 : brandHtml(subject, lines),
          reply_to: env.MAIL_BOX || "xyong@xyong.ccwu.cc"
        })
      });
      if (resp.ok)
        return true;
      console.log("resend_fail", resp.status, (await resp.text()).slice(0, 300));
    } catch (e) {
      console.log("resend_exc", String(e));
    }
  }
  if (!env.NOTIFY_MAIL)
    return false;
  const from = env.MAIL_FROM || "orders@xyong.ccwu.cc";
  const text = [...lines, "", `\u2014 ${env.MAIL_BOX || "xyong@xyong.ccwu.cc"} \xB7 XYONG \u4E91\u5357\u7CBE\u54C1\u56ED`].join("\r\n");
  const head = [
    `From: XYONG \u4E91\u5357\u7CBE\u54C1\u56ED <${from}>`,
    `To: ${to}`,
    `Subject: ${mimeHeader(subject)}`,
    `Date: ${(/* @__PURE__ */ new Date()).toUTCString()}`,
    `Message-ID: <${crypto.randomUUID()}@xyong.ccwu.cc>`,
    "MIME-Version: 1.0",
    "Reply-To: xyong@xyong.ccwu.cc"
  ];
  let raw;
  if (opts.html) {
    const boundary = `xyong-${crypto.randomUUID().slice(0, 8)}`;
    raw = [
      ...head,
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      "",
      `--${boundary}`,
      "Content-Type: text/plain; charset=utf-8",
      "Content-Transfer-Encoding: 8bit",
      "",
      text,
      `--${boundary}`,
      "Content-Type: text/html; charset=utf-8",
      "Content-Transfer-Encoding: 8bit",
      "",
      brandHtml(subject, lines),
      `--${boundary}--`
    ].join("\r\n");
  } else {
    raw = [
      ...head,
      "Content-Type: text/plain; charset=utf-8",
      "Content-Transfer-Encoding: 8bit",
      "",
      text
    ].join("\r\n");
  }
  try {
    await env.NOTIFY_MAIL.send(new EmailMessage(from, to, raw));
    return true;
  } catch (e) {
    console.log("mail_fail", to, String(e));
    return false;
  }
}
__name(sendMail, "sendMail");
async function notifyOwner(env, subject, lines) {
  const to = env.MAIL_TO || "xynong@gmail.com";
  const sent = await sendMail(env, to, subject, lines);
  if (sent)
    return true;
  if (env.RESEND_API_KEY) {
    try {
      const resp = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "XYONG \u4E91\u5357\u7CBE\u54C1\u56ED <onboarding@resend.dev>",
          to: [to],
          subject,
          text: [...lines, "", "\u2014 XYONG \u4E91\u5357\u7CBE\u54C1\u56ED\uFF08\u4FDD\u5E95\u901A\u77E5\u901A\u9053\uFF09"].join("\r\n")
        })
      });
      if (resp.ok)
        return true;
      console.log("resend_owner_fallback_fail", resp.status, (await resp.text()).slice(0, 200));
    } catch (e) {
      console.log("resend_owner_fallback_exc", String(e));
    }
  }
  return false;
}
__name(notifyOwner, "notifyOwner");
var json = /* @__PURE__ */ __name((data, status = 200, origin = "*") => new Response(JSON.stringify(data), {
  status,
  headers: {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": origin,
    "access-control-allow-headers": "Content-Type, Authorization",
    "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS"
  }
}), "json");
function corsOrigin(request, env) {
  const origin = request.headers.get("Origin");
  return origin === env.STORE_ORIGIN || origin === env.OPS_ORIGIN ? origin : env.STORE_ORIGIN;
}
__name(corsOrigin, "corsOrigin");
async function authorized(request, env) {
  const header = request.headers.get("Authorization") || "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!bearer)
    return false;
  try {
    const row = await env.DB.prepare(`SELECT value FROM settings WHERE key='admin_token' LIMIT 1`).first();
    if (row?.value)
      return bearer === String(row.value);
  } catch {
  }
  return !!env.ADMIN_TOKEN && bearer === env.ADMIN_TOKEN;
}
__name(authorized, "authorized");
async function body(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
__name(body, "body");
var rid = /* @__PURE__ */ __name(() => crypto.randomUUID(), "rid");
function orderNo() {
  const d = /* @__PURE__ */ new Date();
  const stamp = `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;
  return `XY-${stamp}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}
__name(orderNo, "orderNo");
async function createAgentTask(env, agent_name, task_type, priority, title, recommendation, payload = {}) {
  const id = rid();
  await env.DB.prepare(`INSERT INTO agent_tasks (id,agent_name,task_type,priority,title,recommendation,payload_json,requires_approval) VALUES (?,?,?,?,?,?,?,1)`).bind(id, agent_name, task_type, priority, title, recommendation, JSON.stringify(payload)).run();
  return id;
}
__name(createAgentTask, "createAgentTask");
async function runGrowthAgent(env) {
  const inventory = await env.DB.prepare(`SELECT p.sku,p.name AS name_en,c.slug AS category,COALESCE(i.on_hand-i.reserved,0) AS available_qty FROM products p LEFT JOIN categories c ON c.id=p.category_id LEFT JOIN inventory i ON i.product_id=p.id WHERE p.status='published'`).all();
  const lowStock = (inventory.results || []).filter((x) => Number(x.available_qty || 0) <= 10);
  const leads = await env.DB.prepare(`SELECT COUNT(*) AS count FROM leads WHERE stage IN ('new','warm')`).first();
  const tasks = [];
  if (lowStock.length)
    tasks.push(await createAgentTask(env, "Growth & Inventory Agent", "inventory_alert", "high", `${lowStock.length} \u4E2A SKU \u5E93\u5B58\u504F\u4F4E`, "\u68C0\u67E5\u8865\u8D27\u5468\u671F\u5E76\u751F\u6210\u91C7\u8D2D\u8349\u6848\uFF1BAI\u4E0D\u5F97\u76F4\u63A5\u4E0B\u91C7\u8D2D\u5355\u3002", { items: lowStock }));
  if (Number(leads?.count || 0) > 0)
    tasks.push(await createAgentTask(env, "CRM Agent", "lead_followup", "normal", `\u8DDF\u8FDB ${leads.count} \u4E2A\u6D3B\u8DC3\u6F5C\u5BA2`, "\u6839\u636E\u6765\u6E90\u3001\u5174\u8DA3\u54C1\u7C7B\u548C\u6700\u8FD1\u884C\u4E3A\u751F\u6210\u4E2A\u6027\u5316\u82F1\u6587\u8DDF\u8FDB\u8349\u7A3F\uFF0C\u53D1\u9001\u524D\u7531\u4F60\u6279\u51C6\u3002", {}));
  tasks.push(await createAgentTask(env, "Content Agent", "content_batch", "normal", "\u751F\u6210\u672C\u5468\u56DB\u5927\u54C1\u7C7B\u5185\u5BB9\u8349\u6848", "\u4E3A Coffee / Tea / Truffle / Essential Oil \u5404\u751F\u6210\u4E00\u7EC4\u5185\u5BB9\u9009\u9898\u4E0E\u6587\u6848\u8349\u7A3F\uFF0C\u4E0D\u81EA\u52A8\u53D1\u5E03\u3002", { categories: ["coffee", "tea", "truffle", "essential-oil"] }));
  return tasks;
}
__name(runGrowthAgent, "runGrowthAgent");
async function performCheckout(env, b) {
  const sessionId = String(b?.session_id || "").trim();
  if (!sessionId)
    return { error: "session_id required", status: 400 };
  const c = b?.customer || {};
  if (!c.name || !c.email || !c.phone || !c.address)
    return { error: "\u6536\u8D27\u4EBA / \u90AE\u7BB1 / \u7535\u8BDD / \u5730\u5740\u5FC5\u586B", status: 400 };
  const cartRows = await env.DB.prepare(
    `SELECT ci.id AS cart_id, ci.quantity, ci.product_id, p.id AS pid, p.sku, p.name, p.price_cents, p.weight, p.unit
       FROM cart_items ci JOIN products p ON p.id = ci.product_id
      WHERE ci.session_id = ? ORDER BY ci.created_at`
  ).bind(sessionId).all();
  const items = (cartRows.results || []).filter((r) => Number(r.quantity) > 0);
  if (!items.length)
    return { error: "\u8D2D\u7269\u8F66\u4E3A\u7A7A", status: 400 };
  let discountCents = 0;
  let couponId = null;
  const code = String(b?.coupon_code || "").trim().toUpperCase();
  let couponCode = null;
  if (code) {
    const coupon = await env.DB.prepare(`SELECT * FROM coupons WHERE UPPER(code)=? AND is_active=1 AND (starts_at IS NULL OR starts_at<=datetime('now')) AND (ends_at IS NULL OR ends_at>=datetime('now')) AND (max_uses IS NULL OR used_count<max_uses)`).bind(code).first();
    if (!coupon)
      return { error: "\u4F18\u60E0\u5238\u65E0\u6548\u6216\u5DF2\u8FC7\u671F", status: 400 };
    couponId = coupon.id;
    couponCode = coupon.code;
  }
  const subtotalCents = items.reduce((s, r) => s + Number(r.price_cents) * Math.floor(Number(r.quantity)), 0);
  if (couponId) {
    const coupon = await env.DB.prepare(`SELECT type,value,min_subtotal FROM coupons WHERE id=?`).bind(couponId).first();
    if (subtotalCents < Number(coupon.min_subtotal || 0))
      return { error: "\u672A\u8FBE\u5230\u4F18\u60E0\u5238\u6700\u4F4E\u6D88\u8D39", status: 400 };
    discountCents = coupon.type === "percentage" ? Math.round(subtotalCents * Math.min(100, Number(coupon.value)) / 100) : Math.min(Math.round(Number(coupon.value) * 100), subtotalCents);
  }
  const totalCents = Math.max(0, subtotalCents - discountCents);
  const no = orderNo();
  const noteBits = [b?.note, couponCode ? `\u4F18\u60E0\u7801:${couponCode} -${(discountCents / 100).toFixed(2)}` : ""].filter(Boolean).join(" | ");
  await env.DB.batch([
    env.DB.prepare(`INSERT INTO orders (order_no,customer_name,customer_phone,customer_email,shipping_address,status,total_cents,note) VALUES (?,?,?,?,?,'pending',?,?)`).bind(no, String(c.name), String(c.phone), String(c.email), [c.address, c.city, c.province, c.country, c.postal_code].filter(Boolean).join(", "), totalCents, noteBits || null),
    ...items.map((r) => env.DB.prepare(`INSERT INTO order_items (order_id,product_id,quantity,unit_price_cents,unit_cost_cents,line_total_cents) SELECT id,?,?,?,?,? FROM orders WHERE order_no=?`).bind(r.pid, Math.floor(Number(r.quantity)), Number(r.price_cents), 0, Number(r.price_cents) * Math.floor(Number(r.quantity)), no)),
    ...items.map((r) => env.DB.prepare(`UPDATE inventory SET reserved = reserved + ? WHERE product_id = ?`).bind(Math.floor(Number(r.quantity)), r.pid)),
    env.DB.prepare(`DELETE FROM cart_items WHERE session_id = ?`).bind(sessionId)
  ]);
  const order = await env.DB.prepare(`SELECT id FROM orders WHERE order_no=?`).bind(no).first();
  await env.DB.prepare(`INSERT INTO payments (id,order_id,provider,amount,currency,status) VALUES (?,?,?,?, 'USD','pending')`).bind(rid(), String(order.id), String(b?.payment_method || "pending_online"), totalCents / 100).run();
  const cust = await env.DB.prepare(`SELECT id FROM customers WHERE email=?`).bind(String(c.email)).first();
  if (cust) {
    await env.DB.prepare(`UPDATE customers SET updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(cust.id).run();
  } else {
    await env.DB.prepare(`INSERT INTO customers (id,email,first_name,country,language,source) VALUES (?,?,?,?,?,'storefront_checkout')`).bind(rid(), String(c.email), String(c.name), String(c.country || ""), "zh").run().catch(() => {
    });
  }
  if (couponId)
    await env.DB.prepare(`UPDATE coupons SET used_count = used_count + 1 WHERE id=?`).bind(couponId).run();
  await notifyOwner(env, `\u65B0\u8BA2\u5355 ${no} \xB7 US$${(totalCents / 100).toFixed(2)}`, [
    `\u8BA2\u5355\u53F7\uFF1A${no}`,
    `\u5BA2\u6237\uFF1A${c.name} / ${c.email} / ${c.phone}`,
    `\u6536\u8D27\u5730\u5740\uFF1A${[c.address, c.city, c.province, c.country, c.postal_code].filter(Boolean).join(", ")}`,
    `\u5546\u54C1\uFF1A${items.map((r) => `${r.name}\xD7${r.quantity} US$${(Number(r.price_cents) * Number(r.quantity) / 100).toFixed(2)}`).join("; ")}`,
    `\u5E94\u4ED8\uFF1AUS$${(totalCents / 100).toFixed(2)}${couponCode ? `\uFF08\u4F18\u60E0 ${(discountCents / 100).toFixed(2)}\uFF09` : ""}`,
    `\u5907\u6CE8\uFF1A${b?.note || "\u65E0"}`,
    "\u8BF7\u5230\u8FD0\u8425\u4E2D\u53F0\u300C\u8BA2\u5355\u300D\u786E\u8BA4\u6536\u6B3E\u5E76\u5B89\u6392\u53D1\u8D27\u3002"
  ]);
  await sendMail(env, String(c.email), `\u8BA2\u5355\u5DF2\u786E\u8BA4 ${no} \xB7 XYONG \u4E91\u5357\u7CBE\u54C1\u56ED`, [
    `\u5C0A\u656C\u7684 ${c.name}\uFF0C\u60A8\u597D\uFF01`,
    `\u611F\u8C22\u60A8\u5728 XYONG \u4E91\u5357\u7CBE\u54C1\u56ED\u4E0B\u5355\uFF0C\u8BA2\u5355\u53F7 ${no}\u3002`,
    "",
    `\u5546\u54C1\u6E05\u5355\uFF1A${items.map((r) => `${r.name} \xD7 ${Math.floor(Number(r.quantity))}`).join("\uFF1B")}`,
    `\u8BA2\u5355\u91D1\u989D\uFF1AUS$${(totalCents / 100).toFixed(2)}${couponCode ? `\uFF08\u542B\u4F18\u60E0 ${couponCode}\uFF09` : ""}`,
    `\u6536\u8D27\u5730\u5740\uFF1A${[c.address, c.city, c.province, c.country, c.postal_code].filter(Boolean).join(", ")}`,
    "",
    "\u6211\u4EEC\u786E\u8BA4\u6536\u6B3E\u540E\u5C06\u4E8E 1-2 \u4E2A\u5DE5\u4F5C\u65E5\u5185\u4E3A\u60A8\u5B89\u6392\u53D1\u8D27\uFF0C\u53D1\u8D27\u540E\u4F1A\u5C06\u7269\u6D41\u5355\u53F7\u53D1\u9001\u81F3\u672C\u90AE\u7BB1\u3002",
    "\u5982\u6709\u4EFB\u4F55\u7591\u95EE\uFF0C\u76F4\u63A5\u56DE\u590D\u672C\u90AE\u4EF6\u5373\u53EF\u3002"
  ]);
  return {
    ok: true,
    order_no: no,
    currency: "USD",
    subtotal_usd: subtotalCents / 100,
    discount_usd: discountCents / 100,
    total_usd: totalCents / 100,
    payment_provider: "pending_online"
  };
}
__name(performCheckout, "performCheckout");
var src_default = {
  async scheduled(_event, env, _ctx) {
    await runGrowthAgent(env);
  },
  async fetch(request, env) {
    const origin = corsOrigin(request, env);
    if (request.method === "OPTIONS")
      return new Response(null, { headers: { "access-control-allow-origin": origin, "access-control-allow-headers": "Content-Type, Authorization", "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS" } });
    const url = new URL(request.url);
    if (url.pathname.startsWith("/media/")) {
      const key = decodeURIComponent(url.pathname.slice("/media/".length));
      if (!key)
        return new Response("Not found", { status: 404 });
      const obj = await env.ASSETS.get(key);
      if (!obj)
        return new Response("Not found", { status: 404 });
      const headers = new Headers();
      obj.writeHttpMetadata(headers);
      headers.set("etag", obj.httpEtag);
      headers.set("cache-control", "public, max-age=86400");
      return new Response(obj.body, { headers });
    }
    if (url.pathname === "/api/health")
      return json({ ok: true, service: "xyong-commerce-api", version: "3.0.0" }, 200, origin);
    if (url.pathname === "/field" || url.pathname === "/field/") {
      return new Response(FIELD_PAGE_HTML, { headers: { "content-type": "text/html; charset=utf-8" } });
    }
    if (url.pathname === "/api/field/ping" && request.method === "POST") {
      const ok = await authorized(request, env);
      return json({ ok }, ok ? 200 : 401, origin);
    }
    if (url.pathname === "/api/field/reports" && request.method === "POST") {
      if (!await authorized(request, env))
        return json({ error: "Unauthorized" }, 401, origin);
      const body2 = await request.json().catch(() => ({}));
      const category = String(body2.category || "");
      const data = body2.data || {};
      const name = String(data.name_zh || data.name_en || "").trim();
      if (!["coffee", "tea", "truffle", "oil"].includes(category))
        return json({ error: "\u65E0\u6548\u7684\u4EA7\u54C1\u7C7B\u522B" }, 400, origin);
      if (!name)
        return json({ error: "\u7F3A\u5C11\u4EA7\u54C1\u540D\u79F0" }, 400, origin);
      const id = "FR-" + Date.now().toString(36).toUpperCase() + "-" + rid().slice(0, 4).toUpperCase();
      const photos = [];
      for (const p of (body2.photos || []).slice(0, 30)) {
        if (!p?.b64)
          continue;
        const key = `field/${id}/${p.slot || "photo"}-${photos.length}-${Date.now()}.jpg`;
        try {
          const bytes = Uint8Array.from(atob(String(p.b64)), (ch) => ch.charCodeAt(0));
          await env.ASSETS.put(key, bytes, { httpMetadata: { contentType: "image/jpeg" } });
          photos.push({ slot: String(p.slot || "extra"), key, url: `/media/${key}` });
        } catch {
        }
      }
      const docs = [];
      for (const d of (body2.docs || []).slice(0, 20)) {
        const files = [];
        for (const f of (d.files || []).slice(0, 6)) {
          if (!f?.b64)
            continue;
          const ext = String(f.mime || "").includes("pdf") ? "pdf" : "jpg";
          const key = `field/${id}/doc-${docs.length}-${files.length}-${Date.now()}.${ext}`;
          try {
            const bytes = Uint8Array.from(atob(String(f.b64)), (ch) => ch.charCodeAt(0));
            await env.ASSETS.put(key, bytes, { httpMetadata: { contentType: f.mime || "application/octet-stream" } });
            files.push({ name: String(f.name || "\u6587\u4EF6"), mime: String(f.mime || ""), key, url: `/media/${key}` });
          } catch {
          }
        }
        docs.push({ type: String(d.type || ""), no: String(d.no || ""), issuer: String(d.issuer || ""), expiry: String(d.expiry || ""), files });
      }
      await env.DB.prepare(`INSERT INTO field_reports (id,category,product_name,data_json,photos_json,docs_json,status) VALUES (?,?,?,?,?,?,'submitted')`).bind(id, category, name, JSON.stringify(data), JSON.stringify(photos), JSON.stringify(docs)).run();
      await notifyOwner(env, "\u65B0\u5B9E\u5730\u91C7\u96C6\u62A5\u544A\uFF1A" + name, [
        `\u7F16\u53F7\uFF1A${id}`,
        `\u7C7B\u522B\uFF1A${category}`,
        `\u5730\u70B9\uFF1A${String(data.origin || "")}`,
        `\u7167\u7247 ${photos.length} \u5F20 / \u5408\u89C4\u6587\u4EF6 ${docs.length} \u4EFD`,
        "\u8BF7\u5230\u8FD0\u8425\u4E2D\u53F0\u300C\u5B9E\u5730\u91C7\u96C6\u300D\u9875\u5BA1\u6838\u5E76\u8F6C\u4E3A\u5546\u54C1\u3002"
      ]);
      return json({ ok: true, id, photos: photos.length, docs: docs.length }, 201, origin);
    }
    if (url.pathname === "/api/field/reports" && request.method === "GET") {
      if (!await authorized(request, env))
        return json({ error: "Unauthorized" }, 401, origin);
      const { results } = await env.DB.prepare(`SELECT id,category,product_name,status,created_at FROM field_reports ORDER BY created_at DESC LIMIT 20`).all();
      return json({ reports: results }, 200, origin);
    }
    if (url.pathname === "/api/store/products" && request.method === "GET") {
      const { results } = await env.DB.prepare(
        `SELECT p.id AS id, p.sku AS sku,
                p.name AS name, p.name AS name_zh, p.name AS name_en,
                c.slug AS category, c.name AS brand_name,
                p.origin AS origin, p.altitude AS altitude, p.unit AS unit, p.weight AS weight,
                p.description AS description, p.description AS description_zh, p.description AS description_en,
                p.selling_points AS selling_points,
                ROUND(p.price_cents / 100.0, 2) AS price_usd, p.price_cents AS price_cents,
                COALESCE(p.currency, 'USD') AS currency,
                p.cover_url AS cover_url, p.cover_url AS image_url,
                COALESCE(i.on_hand - i.reserved, 0) AS available_qty
           FROM products p
           JOIN categories c ON c.id = p.category_id
           LEFT JOIN inventory i ON i.product_id = p.id
          WHERE p.status = 'published' AND c.active = 1
          ORDER BY p.category_id, p.id`
      ).all();
      return json({ products: results, currency: "USD" }, 200, origin);
    }
    if (url.pathname === "/api/cart" && request.method === "GET") {
      const sessionId = url.searchParams.get("session_id") || "";
      if (!sessionId)
        return json({ error: "session_id required" }, 400, origin);
      const { results } = await env.DB.prepare(
        `SELECT CAST(ci.product_id AS INTEGER) AS product_id, ci.quantity, p.sku, p.name, p.price_cents, ROUND(p.price_cents/100.0,2) AS price_usd,
                p.cover_url AS image_url, COALESCE(p.currency,'USD') AS currency,
                COALESCE(i.on_hand - i.reserved, 0) AS available_qty
           FROM cart_items ci
           JOIN products p ON p.id = ci.product_id
           LEFT JOIN inventory i ON i.product_id = p.id
          WHERE ci.session_id = ? AND p.status='published'
          ORDER BY ci.created_at`
      ).bind(sessionId).all();
      return json({ items: results, currency: "USD" }, 200, origin);
    }
    if (url.pathname === "/api/cart" && request.method === "POST") {
      const b = await body(request);
      if (!b?.session_id || !b?.product_id)
        return json({ error: "session_id / product_id required" }, 400, origin);
      const qty = Math.max(1, Math.floor(Number(b.quantity ?? 1)));
      const prod = await env.DB.prepare(`SELECT id FROM products WHERE id=? AND status='published'`).bind(String(b.product_id)).first();
      if (!prod)
        return json({ error: "\u5546\u54C1\u4E0D\u5B58\u5728\u6216\u672A\u4E0A\u67B6" }, 404, origin);
      if (b.set_quantity) {
        if (qty <= 0) {
          await env.DB.prepare(`DELETE FROM cart_items WHERE session_id=? AND product_id=?`).bind(String(b.session_id), prod.id).run();
          return json({ ok: true, removed: true }, 200, origin);
        }
        const existing2 = await env.DB.prepare(`SELECT id FROM cart_items WHERE session_id=? AND product_id=?`).bind(String(b.session_id), prod.id).first();
        if (existing2) {
          await env.DB.prepare(`UPDATE cart_items SET quantity=? WHERE id=?`).bind(qty, existing2.id).run();
          return json({ ok: true }, 200, origin);
        }
        await env.DB.prepare(`INSERT INTO cart_items (id,session_id,product_id,quantity) VALUES (?,?,?,?)`).bind(rid(), String(b.session_id), prod.id, qty).run();
        return json({ ok: true }, 201, origin);
      }
      const existing = await env.DB.prepare(`SELECT id,quantity FROM cart_items WHERE session_id=? AND product_id=?`).bind(String(b.session_id), prod.id).first();
      if (existing) {
        await env.DB.prepare(`UPDATE cart_items SET quantity=quantity+? WHERE id=?`).bind(qty, existing.id).run();
        return json({ ok: true, quantity: Number(existing.quantity) + qty }, 200, origin);
      }
      await env.DB.prepare(`INSERT INTO cart_items (id,session_id,product_id,quantity) VALUES (?,?,?,?)`).bind(rid(), String(b.session_id), prod.id, qty).run();
      return json({ ok: true, quantity: qty }, 201, origin);
    }
    if (url.pathname === "/api/cart" && request.method === "DELETE") {
      const sessionId = url.searchParams.get("session_id") || "";
      const productId = url.searchParams.get("product_id") || "";
      if (!sessionId)
        return json({ error: "session_id required" }, 400, origin);
      if (productId) {
        await env.DB.prepare(`DELETE FROM cart_items WHERE session_id=? AND product_id=?`).bind(sessionId, productId).run();
      } else {
        await env.DB.prepare(`DELETE FROM cart_items WHERE session_id=?`).bind(sessionId).run();
      }
      return json({ ok: true }, 200, origin);
    }
    if (url.pathname === "/api/checkout" && request.method === "POST") {
      const b = await body(request);
      const result = await performCheckout(env, b);
      if ("error" in result)
        return json({ error: result.error }, result.status, origin);
      return json(result, 201, origin);
    }
    if (url.pathname === "/api/coupons/validate" && request.method === "POST") {
      const b = await body(request);
      const code = String(b?.code || "").trim().toUpperCase();
      if (!code)
        return json({ valid: false, error: "\u8BF7\u8F93\u5165\u4F18\u60E0\u7801" }, 400, origin);
      const coupon = await env.DB.prepare(`SELECT code,type,value,min_subtotal FROM coupons WHERE UPPER(code)=? AND is_active=1 AND (starts_at IS NULL OR starts_at<=datetime('now')) AND (ends_at IS NULL OR ends_at>=datetime('now')) AND (max_uses IS NULL OR used_count<max_uses)`).bind(code).first();
      if (!coupon)
        return json({ valid: false, error: "\u4F18\u60E0\u5238\u65E0\u6548\u6216\u5DF2\u8FC7\u671F" }, 404, origin);
      return json({ valid: true, code: coupon.code, type: coupon.type, value: coupon.value, min_subtotal_usd: Number(coupon.min_subtotal || 0) / 100 }, 200, origin);
    }
    if (url.pathname === "/api/subscribe" && request.method === "POST") {
      const b = await body(request);
      const email = String(b?.email || "").trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        return json({ error: "\u8BF7\u8F93\u5165\u6709\u6548\u90AE\u7BB1" }, 400, origin);
      const existing = await env.DB.prepare(`SELECT id FROM leads WHERE email=?`).bind(email).first();
      if (existing) {
        await env.DB.prepare(`INSERT INTO lead_events (id,lead_id,event_type,channel,metadata_json) VALUES (?,?,?,?,?)`).bind(rid(), existing.id, "newsletter_resubscribe", "newsletter", "{}").run();
        return json({ ok: true, duplicate: true }, 200, origin);
      }
      const id = rid();
      await env.DB.prepare(`INSERT INTO leads (id,email,name,country,source,source_detail,stage,score,consent) VALUES (?,?,?,?,?,?,?,5,?)`).bind(id, email, String(b?.name || null), String(b?.country || null), "newsletter", "storefront_footer_subscribe", "new", b?.consent ? 1 : 0).run();
      await env.DB.prepare(`INSERT INTO lead_events (id,lead_id,event_type,channel,metadata_json) VALUES (?,?,?,?,?)`).bind(rid(), id, "lead_created", "newsletter", "{}").run();
      await notifyOwner(env, "\u65B0\u8BA2\u9605\u7528\u6237", [`\u90AE\u7BB1\uFF1A${email}`, `\u6765\u6E90\uFF1A\u5546\u57CE\u9875\u811A\u8BA2\u9605`]);
      return json({ ok: true, lead_id: id }, 201, origin);
    }
    if (url.pathname === "/api/contact" && request.method === "POST") {
      const b = await body(request);
      if (!b?.email && !b?.message)
        return json({ error: "\u8BF7\u7559\u4E0B\u90AE\u7BB1\u6216\u7559\u8A00" }, 400, origin);
      const id = rid();
      await env.DB.prepare(`INSERT INTO leads (id,email,name,country,source,source_detail,stage,score,notes,consent) VALUES (?,?,?,?,?,?,?,?,?,?)`).bind(id, String(b.email || null), String(b.name || null), String(b.country || null), "contact", "storefront_contact_form", "new", 10, String(b.message || ""), 0).run();
      await env.DB.prepare(`INSERT INTO lead_events (id,lead_id,event_type,channel,metadata_json) VALUES (?,?,?,?,?)`).bind(rid(), id, "inquiry", "contact_form", JSON.stringify({ message: String(b.message || "") })).run();
      await notifyOwner(env, "\u65B0\u8868\u5355\u54A8\u8BE2", [
        `\u59D3\u540D\uFF1A${b.name || "\u672A\u586B"}`,
        `\u90AE\u7BB1\uFF1A${b.email || "\u672A\u586B"}`,
        `\u56FD\u5BB6\uFF1A${b.country || "\u672A\u586B"}`,
        `\u7559\u8A00\uFF1A${b.message || "\uFF08\u7A7A\uFF09"}`
      ]);
      return json({ ok: true }, 201, origin);
    }
    if (url.pathname === "/api/acquisition/event" && request.method === "POST") {
      const b = await body(request);
      if (!b?.event_type)
        return json({ error: "event_type required" }, 400, origin);
      await env.DB.prepare(`INSERT INTO acquisition_events (id,session_id,source,medium,campaign,landing_path,event_type,product_sku,value_usd,metadata_json) VALUES (?,?,?,?,?,?,?,?,?,?)`).bind(rid(), b.session_id || null, b.source || "direct", b.medium || null, b.campaign || null, b.landing_path || null, b.event_type, b.product_sku || null, Number(b.value_usd || 0), JSON.stringify(b.metadata || {})).run();
      return json({ ok: true }, 201, origin);
    }
    if (url.pathname === "/api/leads" && request.method === "POST") {
      const b = await body(request);
      if (!b?.source)
        return json({ error: "source required" }, 400, origin);
      const id = rid();
      await env.DB.prepare(`INSERT INTO leads (id,email,name,country,source,source_detail,interest_category,interest_sku,stage,score,notes,consent) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).bind(id, b.email || null, b.name || null, b.country || null, b.source, b.source_detail || null, b.interest_category || null, b.interest_sku || null, "new", Math.max(0, Math.min(100, Number(b.score || 0))), b.notes || null, b.consent ? 1 : 0).run();
      await env.DB.prepare(`INSERT INTO lead_events (id,lead_id,event_type,channel,campaign_id,metadata_json) VALUES (?,?,?,?,?,?)`).bind(rid(), id, "lead_created", b.source, b.campaign_id || null, JSON.stringify(b.metadata || {})).run();
      return json({ ok: true, lead_id: id }, 201, origin);
    }
    if (url.pathname === "/api/ops/dashboard" && request.method === "GET") {
      if (!await authorized(request, env))
        return json({ error: "Unauthorized" }, 401, origin);
      const [orders, inventory, products, leads, campaigns, tasks, acq, recent, payments, ship] = await Promise.all([
        env.DB.prepare(`SELECT status,COUNT(*) AS count,ROUND(SUM(total_cents)/100.0,2) AS total_usd FROM orders GROUP BY status`).all(),
        env.DB.prepare(`SELECT COUNT(*) AS products,SUM(on_hand) AS units,SUM(reserved) AS reserved FROM inventory`).first(),
        env.DB.prepare(`SELECT COUNT(*) AS count FROM products WHERE status='published'`).first(),
        env.DB.prepare(`SELECT COUNT(*) AS total,SUM(CASE WHEN stage='new' THEN 1 ELSE 0 END) AS new_count,SUM(CASE WHEN stage='warm' THEN 1 ELSE 0 END) AS warm_count FROM leads`).first(),
        env.DB.prepare(`SELECT COUNT(*) AS total,SUM(CASE WHEN status='active' THEN 1 ELSE 0 END) AS active FROM campaigns`).first(),
        env.DB.prepare(`SELECT COUNT(*) AS open_count,SUM(CASE WHEN priority='high' THEN 1 ELSE 0 END) AS high_count FROM agent_tasks WHERE status='open'`).first(),
        env.DB.prepare(`SELECT source,COUNT(*) AS events,SUM(CASE WHEN event_type='purchase' THEN 1 ELSE 0 END) AS purchases FROM acquisition_events GROUP BY source ORDER BY events DESC LIMIT 10`).all(),
        env.DB.prepare(`SELECT id,order_no,customer_name,customer_email,status,total_cents,ROUND(total_cents/100.0,2) AS total_usd,created_at FROM orders ORDER BY id DESC LIMIT 10`).all(),
        env.DB.prepare(`SELECT status,COUNT(*) AS count,ROUND(SUM(amount),2) AS total_usd FROM payments GROUP BY status`).all(),
        env.DB.prepare(`SELECT status,COUNT(*) AS count FROM shipments GROUP BY status`).all()
      ]);
      return json({ currency: "USD", orders: orders.results, inventory, products, leads, campaigns, tasks, acquisition: acq.results, recent_orders: recent.results, payments: payments.results, shipments: ship.results }, 200, origin);
    }
    if (url.pathname === "/api/ops/orders" && request.method === "GET") {
      if (!await authorized(request, env))
        return json({ error: "Unauthorized" }, 401, origin);
      const { results } = await env.DB.prepare(
        `SELECT o.id,o.order_no,o.customer_name,o.customer_phone,o.customer_email,o.shipping_address,o.status,o.total_cents,
                ROUND(o.total_cents/100.0,2) AS total_usd,o.note,o.created_at,
                pay.provider AS payment_provider,pay.status AS payment_status,
                sh.carrier,sh.tracking_number,sh.status AS shipment_status
           FROM orders o
           LEFT JOIN payments pay ON CAST(pay.order_id AS INTEGER)=o.id
           LEFT JOIN shipments sh ON CAST(sh.order_id AS INTEGER)=o.id
          ORDER BY o.id DESC LIMIT 200`
      ).all();
      const items = await env.DB.prepare(
        `SELECT oi.order_id,oi.quantity,ROUND(oi.unit_price_cents/100.0,2) AS unit_usd,oi.line_total_cents,p.sku,p.name
           FROM order_items oi JOIN products p ON p.id=oi.product_id`
      ).all();
      const byOrder = {};
      for (const it of items.results) {
        (byOrder[it.order_id] ||= []).push(`${it.name}\xD7${it.quantity}(US$${it.line_total_cents / 100})`);
      }
      return json({ orders: results.map((o) => ({ ...o, items_summary: (byOrder[o.id] || []).join("; ") })), currency: "USD" }, 200, origin);
    }
    if (url.pathname.startsWith("/api/ops/orders/") && request.method === "PATCH") {
      if (!await authorized(request, env))
        return json({ error: "Unauthorized" }, 401, origin);
      const id = Number(url.pathname.split("/").pop());
      if (!Number.isFinite(id))
        return json({ error: "Invalid order id" }, 400, origin);
      const b = await body(request);
      const status = b?.status;
      if (!["pending", "processing", "shipped", "completed", "cancelled", "refunded"].includes(status))
        return json({ error: "Invalid status" }, 400, origin);
      const order = await env.DB.prepare(`SELECT id,status FROM orders WHERE id=?`).bind(id).first();
      if (!order)
        return json({ error: "\u8BA2\u5355\u4E0D\u5B58\u5728" }, 404, origin);
      const items = await env.DB.prepare(`SELECT product_id,quantity FROM order_items WHERE order_id=?`).bind(id).all();
      if (status === "cancelled" && ["pending", "processing"].includes(order.status)) {
        await env.DB.batch([
          env.DB.prepare(`UPDATE orders SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(status, id),
          ...items.results.map((r) => env.DB.prepare(`UPDATE inventory SET reserved = MAX(0, reserved - ?) WHERE product_id=?`).bind(Math.floor(Number(r.quantity)), r.product_id))
        ]);
      } else if (status === "refunded") {
        await env.DB.batch([
          env.DB.prepare(`UPDATE orders SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(status, id),
          ...items.results.map((r) => env.DB.prepare(`UPDATE inventory SET on_hand = MAX(0, on_hand - ?), reserved = MAX(0, reserved - ?) WHERE product_id=?`).bind(Math.floor(Number(r.quantity)), Math.floor(Number(r.quantity)), r.product_id))
        ]);
      } else {
        await env.DB.prepare(`UPDATE orders SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(status, id).run();
      }
      const shippedBefore = await env.DB.prepare(`SELECT shipped_at FROM shipments WHERE order_id=?`).bind(String(id)).first();
      if (b?.carrier) {
        const existing = await env.DB.prepare(`SELECT id FROM shipments WHERE order_id=?`).bind(String(id)).first();
        if (existing) {
          await env.DB.prepare(`UPDATE shipments SET carrier=?,tracking_number=?,status=?,shipped_at=COALESCE(shipped_at, CASE WHEN ?='shipped' THEN datetime('now') END) WHERE id=?`).bind(b.carrier, b.tracking_number || null, b.shipment_status || "created", status, existing.id).run();
        } else {
          await env.DB.prepare(`INSERT INTO shipments (id,order_id,carrier,tracking_number,status,shipped_at) VALUES (?,?,?,?,?,CASE WHEN ?='shipped' THEN datetime('now') END)`).bind(rid(), String(id), b.carrier, b.tracking_number || null, b.shipment_status || "created", status).run();
        }
      }
      if (status === "completed") {
        await env.DB.prepare(`UPDATE shipments SET status='delivered',delivered_at=datetime('now') WHERE order_id=? AND delivered_at IS NULL`).bind(String(id)).run();
      }
      if (status === "shipped" && !shippedBefore?.shipped_at && (b?.carrier || b?.tracking_number)) {
        const full = await env.DB.prepare(`SELECT order_no,customer_name,customer_email,note FROM orders WHERE id=?`).bind(id).first();
        if (full?.customer_email) {
          const sent = await sendMail(env, String(full.customer_email), `\u60A8\u7684\u8BA2\u5355\u5DF2\u53D1\u8D27 ${full.order_no} \xB7 XYONG \u4E91\u5357\u7CBE\u54C1\u56ED`, [
            `\u5C0A\u656C\u7684 ${full.customer_name}\uFF0C\u60A8\u597D\uFF01`,
            `\u60A8\u7684\u8BA2\u5355 ${full.order_no} \u5DF2\u53D1\u51FA\uFF0C\u7269\u6D41\u4FE1\u606F\u5982\u4E0B\uFF1A`,
            "",
            `\u627F\u8FD0\u5546\uFF1A${b?.carrier || "\u56FD\u9645\u5FEB\u9012"}`,
            `\u8FD0\u5355\u53F7\uFF1A${b?.tracking_number || "\u7A0D\u540E\u63D0\u4F9B"}`,
            "",
            "\u60A8\u53EF\u51ED\u8FD0\u5355\u53F7\u5728\u627F\u8FD0\u5546\u5B98\u7F51\u67E5\u8BE2\u5B9E\u65F6\u8F68\u8FF9\u3002\u5305\u88F9\u7B7E\u6536\u540E\u5982\u6709\u4EFB\u4F55\u95EE\u9898\uFF0C\u6B22\u8FCE\u968F\u65F6\u56DE\u590D\u672C\u90AE\u4EF6\u8054\u7CFB\u5BA2\u670D\u3002"
          ]);
          if (sent)
            await env.DB.prepare(`UPDATE orders SET note=COALESCE(note||' | ','')||'\u53D1\u8D27\u90AE\u4EF6\u5DF2\u53D1:'||datetime('now') WHERE id=?`).bind(id).run();
        }
      }
      return json({ ok: true, id, status }, 200, origin);
    }
    if (url.pathname === "/api/ops/payments" && request.method === "GET") {
      if (!await authorized(request, env))
        return json({ error: "Unauthorized" }, 401, origin);
      const { results } = await env.DB.prepare(
        `SELECT pay.id,pay.order_id,o.order_no,pay.provider,pay.transaction_id,pay.amount,ROUND(pay.amount,2) AS amount_usd,pay.currency,pay.status,pay.created_at
           FROM payments pay LEFT JOIN orders o ON o.id=CAST(pay.order_id AS INTEGER) ORDER BY pay.created_at DESC LIMIT 200`
      ).all();
      return json({ payments: results, currency: "USD" }, 200, origin);
    }
    if (url.pathname.startsWith("/api/ops/payments/") && request.method === "PATCH") {
      if (!await authorized(request, env))
        return json({ error: "Unauthorized" }, 401, origin);
      const id = url.pathname.split("/").pop();
      const b = await body(request);
      const status = b?.status;
      if (!["pending", "paid", "failed", "refunded"].includes(status))
        return json({ error: "Invalid status" }, 400, origin);
      const pay = await env.DB.prepare(`SELECT order_id FROM payments WHERE id=?`).bind(id).first();
      if (!pay)
        return json({ error: "\u652F\u4ED8\u8BB0\u5F55\u4E0D\u5B58\u5728" }, 404, origin);
      await env.DB.prepare(`UPDATE payments SET status=?,transaction_id=COALESCE(?,transaction_id) WHERE id=?`).bind(status, b?.transaction_id || null, id).run();
      if (status === "paid") {
        const order = await env.DB.prepare(`SELECT id,status FROM orders WHERE id=CAST(? AS INTEGER)`).bind(pay.order_id).first();
        if (order && order.status === "pending") {
          await env.DB.prepare(`UPDATE orders SET status='processing',updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(order.id).run();
        }
      }
      return json({ ok: true }, 200, origin);
    }
    if (url.pathname === "/api/ops/customers" && request.method === "GET") {
      if (!await authorized(request, env))
        return json({ error: "Unauthorized" }, 401, origin);
      const { results } = await env.DB.prepare(
        `SELECT cu.id,cu.email,cu.first_name,cu.last_name,cu.country,cu.language,cu.source,cu.marketing_consent,cu.created_at,
                COUNT(o.id) AS order_count, ROUND(COALESCE(SUM(o.total_cents),0)/100.0,2) AS lifetime_usd, MAX(o.created_at) AS last_order_at
           FROM customers cu LEFT JOIN orders o ON o.customer_email = cu.email
          GROUP BY cu.id ORDER BY lifetime_usd DESC, cu.created_at DESC LIMIT 200`
      ).all();
      return json({ customers: results, currency: "USD" }, 200, origin);
    }
    if (url.pathname === "/api/ops/customers" && request.method === "POST") {
      if (!await authorized(request, env))
        return json({ error: "Unauthorized" }, 401, origin);
      const b = await body(request);
      if (!b?.email)
        return json({ error: "email \u5FC5\u586B" }, 400, origin);
      const existing = await env.DB.prepare(`SELECT id FROM customers WHERE email=?`).bind(String(b.email).toLowerCase()).first();
      if (existing)
        return json({ ok: true, id: existing.id, duplicate: true }, 200, origin);
      const id = rid();
      await env.DB.prepare(`INSERT INTO customers (id,email,first_name,last_name,country,language,marketing_consent,source) VALUES (?,?,?,?,?,?,?,?)`).bind(id, String(b.email).toLowerCase(), b.first_name || null, b.last_name || null, b.country || null, b.language || "zh", b.marketing_consent ? 1 : 0, "ops_manual").run();
      return json({ ok: true, id }, 201, origin);
    }
    if (url.pathname.startsWith("/api/ops/customers/") && request.method === "PATCH") {
      if (!await authorized(request, env))
        return json({ error: "Unauthorized" }, 401, origin);
      const id = url.pathname.split("/").pop();
      const b = await body(request) || {};
      const sets = [];
      const vals = [];
      if (b.first_name !== void 0) {
        sets.push("first_name=?");
        vals.push(b.first_name);
      }
      if (b.last_name !== void 0) {
        sets.push("last_name=?");
        vals.push(b.last_name);
      }
      if (b.country !== void 0) {
        sets.push("country=?");
        vals.push(b.country);
      }
      if (b.marketing_consent !== void 0) {
        sets.push("marketing_consent=?");
        vals.push(b.marketing_consent ? 1 : 0);
      }
      if (sets.length) {
        sets.push("updated_at=CURRENT_TIMESTAMP");
        await env.DB.prepare(`UPDATE customers SET ${sets.join(",")} WHERE id=?`).bind(...vals, id).run();
      }
      return json({ ok: true }, 200, origin);
    }
    if (url.pathname === "/api/ops/leads" && request.method === "GET") {
      if (!await authorized(request, env))
        return json({ error: "Unauthorized" }, 401, origin);
      const { results } = await env.DB.prepare(
        `SELECT l.id,l.email,l.name,l.country,l.source,l.source_detail,l.stage,l.score,l.notes,l.consent,l.created_at,
                (SELECT COUNT(*) FROM lead_events e WHERE e.lead_id=l.id) AS event_count
           FROM leads l ORDER BY l.created_at DESC LIMIT 200`
      ).all();
      return json({ leads: results }, 200, origin);
    }
    if (url.pathname.startsWith("/api/ops/leads/") && request.method === "PATCH") {
      if (!await authorized(request, env))
        return json({ error: "Unauthorized" }, 401, origin);
      const id = url.pathname.split("/").pop();
      const b = await body(request);
      const stage = b?.stage;
      if (!["new", "warm", "hot", "customer", "lost"].includes(stage))
        return json({ error: "Invalid stage" }, 400, origin);
      await env.DB.prepare(`UPDATE leads SET stage=?,updated_at=CURRENT_TIMESTAMP,last_touch_at=datetime('now') WHERE id=?`).bind(stage, id).run();
      await env.DB.prepare(`INSERT INTO lead_events (id,lead_id,event_type,channel,metadata_json) VALUES (?,?,?,?,?)`).bind(rid(), id, "stage_changed", "ops", JSON.stringify({ stage })).run();
      return json({ ok: true }, 200, origin);
    }
    if (url.pathname === "/api/ops/coupons" && request.method === "GET") {
      if (!await authorized(request, env))
        return json({ error: "Unauthorized" }, 401, origin);
      const { results } = await env.DB.prepare(`SELECT id,code,type,value,min_subtotal,max_uses,used_count,is_active,ends_at,created_at FROM coupons ORDER BY created_at DESC LIMIT 100`).all();
      return json({ coupons: results }, 200, origin);
    }
    if (url.pathname === "/api/ops/coupons" && request.method === "POST") {
      if (!await authorized(request, env))
        return json({ error: "Unauthorized" }, 401, origin);
      const b = await body(request);
      const code = String(b?.code || "").trim().toUpperCase();
      if (!code)
        return json({ error: "code \u5FC5\u586B" }, 400, origin);
      const type = b.type === "fixed" ? "fixed" : "percentage";
      const value = Number(b.value || 0);
      if (!Number.isFinite(value) || value <= 0)
        return json({ error: "value \u5FC5\u987B\u5927\u4E8E 0\uFF08\u767E\u5206\u6BD4 1-100\uFF0C\u6216\u56FA\u5B9A\u7F8E\u5143\u91D1\u989D\uFF09" }, 400, origin);
      if (type === "percentage" && value > 100)
        return json({ error: "\u767E\u5206\u6BD4\u6298\u6263\u4E0D\u80FD\u8D85\u8FC7 100" }, 400, origin);
      try {
        await env.DB.prepare(`INSERT INTO coupons (id,code,type,value,min_subtotal,max_uses,ends_at,is_active) VALUES (?,?,?,?,?,?,?,?)`).bind(rid(), code, type, value, Math.round(Number(b.min_subtotal_usd || 0) * 100), b.max_uses ? Math.floor(Number(b.max_uses)) : null, b.ends_at || null, b.is_active === false ? 0 : 1).run();
      } catch {
        return json({ error: "\u4F18\u60E0\u7801\u5DF2\u5B58\u5728" }, 409, origin);
      }
      return json({ ok: true, code }, 201, origin);
    }
    if (url.pathname.startsWith("/api/ops/coupons/") && request.method === "PATCH") {
      if (!await authorized(request, env))
        return json({ error: "Unauthorized" }, 401, origin);
      const id = url.pathname.split("/").pop();
      const b = await body(request) || {};
      await env.DB.prepare(`UPDATE coupons SET is_active=? WHERE id=?`).bind(b.is_active ? 1 : 0, id).run();
      return json({ ok: true }, 200, origin);
    }
    if (url.pathname === "/api/ops/reviews" && request.method === "GET") {
      if (!await authorized(request, env))
        return json({ error: "Unauthorized" }, 401, origin);
      const { results } = await env.DB.prepare(
        `SELECT r.id,r.product_id,p.name AS product_name,r.rating,r.title,r.content,r.is_published,r.created_at
           FROM reviews r LEFT JOIN products p ON CAST(r.product_id AS INTEGER)=p.id ORDER BY r.created_at DESC LIMIT 100`
      ).all();
      return json({ reviews: results }, 200, origin);
    }
    if (url.pathname.startsWith("/api/ops/reviews/") && request.method === "PATCH") {
      if (!await authorized(request, env))
        return json({ error: "Unauthorized" }, 401, origin);
      const id = url.pathname.split("/").pop();
      const b = await body(request) || {};
      await env.DB.prepare(`UPDATE reviews SET is_published=? WHERE id=?`).bind(b.is_published ? 1 : 0, id).run();
      return json({ ok: true }, 200, origin);
    }
    if (url.pathname === "/api/ops/import" && request.method === "POST") {
      if (!await authorized(request, env))
        return json({ error: "Unauthorized" }, 401, origin);
      const b = await body(request);
      const target = String(b?.url || "").trim();
      if (!/^https?:\/\//i.test(target))
        return json({ error: "\u8BF7\u63D0\u4F9B http(s) \u5F00\u5934\u7684\u5546\u54C1\u9875\u94FE\u63A5" }, 400, origin);
      let html = "";
      let source = "direct";
      const UA = "Mozilla/5.0 (compatible; XYONG-Importer/1.0)";
      try {
        const resp = await fetch(target, { headers: { "user-agent": UA, accept: "text/html,application/xhtml+xml" }, redirect: "follow" });
        if (resp.ok)
          html = await resp.text();
        if (!html)
          throw new Error(`HTTP ${resp.status}`);
      } catch {
        const proxies = [
          { name: "reader", build: (u) => `https://r.jina.ai/${u}`, mode: "reader" },
          { name: "allorigins", build: (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`, mode: "html" },
          { name: "codetabs", build: (u) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`, mode: "html" }
        ];
        const failures = [];
        for (const proxy of proxies) {
          try {
            const proxied = await fetch(proxy.build(target), { headers: { "user-agent": UA, accept: "text/plain,text/html" }, redirect: "follow" });
            if (!proxied.ok) {
              failures.push(`${proxy.name}:${proxied.status}`);
              continue;
            }
            const text = await proxied.text();
            if (text.length < 120) {
              failures.push(`${proxy.name}:empty`);
              continue;
            }
            html = text;
            source = proxy.mode;
            break;
          } catch {
            failures.push(`${proxy.name}:err`);
          }
        }
        if (!html) {
          return json({
            error: "\u6E90\u9875\u9762\u4E0D\u53EF\u8BBF\u95EE\uFF0C\u81EA\u52A8\u4EE3\u7406\u4E5F\u672A\u53D6\u56DE\u5185\u5BB9\u3002",
            detail: failures.join(", "),
            hint: "\u53EF\u6539\u7528\u300C\u624B\u5DE5\u5F55\u5165 + \u56FE\u7247\u4E0A\u4F20\u300D\u65B9\u5F0F\u4E0A\u67B6\uFF0C\u6216\u5728\u5546\u54C1\u7BA1\u7406\u91CC\u76F4\u63A5\u7C98\u8D34\u56FE\u7247\u5730\u5740\u3002"
          }, 502, origin);
        }
      }
      const meta = /* @__PURE__ */ __name((prop) => {
        const p1 = new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`, "i").exec(html)?.[1];
        const p2 = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${prop}["']`, "i").exec(html)?.[1];
        return (p1 || p2 || "").trim();
      }, "meta");
      const decode = /* @__PURE__ */ __name((s) => s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " "), "decode");
      const cleanMd = /* @__PURE__ */ __name((s) => s.replace(/!\[[^\]]*\]\([^)]*\)/g, " ").replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/[*_`#>]/g, " ").replace(/\s+/g, " ").trim(), "cleanMd");
      let title = "";
      let description = "";
      if (source === "reader") {
        const mdTitle = html.match(/^Title:\s*(.+)$/m)?.[1] || html.match(/^#\s+(.+)$/m)?.[1] || "";
        title = cleanMd(mdTitle).slice(0, 200);
        const paragraphs = html.split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith("#") && !l.startsWith("!") && !l.startsWith("URL:") && !l.startsWith("Markdown Content"));
        description = cleanMd(paragraphs.slice(0, 3).join(" ")).slice(0, 600);
      } else {
        title = decode(meta("og:title") || html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || "").slice(0, 200);
        description = decode(meta("og:description") || meta("description") || "").slice(0, 1e3);
      }
      const imageUrls = [];
      const pushImg = /* @__PURE__ */ __name((url2) => {
        try {
          const abs = new URL(decode(url2), target).toString();
          if (/\.(jpg|jpeg|png|webp)(\?|$)/i.test(abs) && !imageUrls.includes(abs))
            imageUrls.push(abs);
        } catch {
        }
      }, "pushImg");
      if (source === "reader") {
        for (const m of html.matchAll(/!\[[^\]]*\]\(([^)\s]+)\)/g))
          pushImg(m[1]);
        for (const m of html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi))
          pushImg(m[1]);
      } else {
        const ogImg = meta("og:image");
        if (ogImg)
          pushImg(ogImg);
        for (const m of html.matchAll(/<img[^>]+(?:data-src|src)=["']([^"']+)["']/gi))
          pushImg(m[1]);
      }
      imageUrls.splice(8);
      const priceHints = [...html.matchAll(/(?:US?\$|USD|￥|¥|CNY)\s?([0-9][0-9,.]{0,12})/g)].slice(0, 8).map((m) => m[1]);
      let coverUrl = null;
      for (const candidate of imageUrls.slice(0, 3)) {
        if (coverUrl)
          break;
        for (const imgUrl of [candidate, `https://images.weserv.nl/?url=${encodeURIComponent(candidate.replace(/^https?:\/\//, ""))}`]) {
          try {
            const imgResp = await fetch(imgUrl, { headers: { "user-agent": UA }, redirect: "follow" });
            if (!imgResp.ok)
              continue;
            const contentType = imgResp.headers.get("content-type") || "image/jpeg";
            if (!contentType.startsWith("image/"))
              continue;
            const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
            const key = `import/${Date.now()}-${rid().slice(0, 8)}.${ext}`;
            await env.ASSETS.put(key, await imgResp.arrayBuffer(), { httpMetadata: { contentType } });
            coverUrl = `/media/import/${key.split("/")[1]}`;
            break;
          } catch {
          }
        }
      }
      const sku = `IMP-${Date.now().toString(36).toUpperCase()}`;
      const catSlug = String(b?.category || "coffee");
      const cat = await env.DB.prepare(`SELECT id FROM categories WHERE slug=?`).bind(catSlug).first();
      await env.DB.prepare(`INSERT INTO products (sku,name,category_id,description,unit,price_cents,cost_cents,status,cover_url,currency) VALUES (?,?,?,?,?,?,0,'draft',?,'USD')`).bind(sku, title || "\u672A\u547D\u540D\u91C7\u96C6\u5546\u54C1", cat?.id || 1, description || null, "\u4EF6", 0, coverUrl).run();
      const created = await env.DB.prepare(`SELECT id FROM products WHERE sku=?`).bind(sku).first();
      await env.DB.prepare(`INSERT INTO inventory (product_id,on_hand,reserved) VALUES (?,0,0) ON CONFLICT(product_id) DO NOTHING`).bind(created.id).run();
      return json({
        ok: true,
        sku,
        product_id: created.id,
        title,
        description,
        cover_url: coverUrl,
        candidate_images: imageUrls,
        price_hints: priceHints,
        via: source,
        message: "\u5DF2\u751F\u6210\u8349\u7A3F\u5546\u54C1\u3002\u8BF7\u5728\u4E2D\u53F0\u6838\u5BF9\u6807\u9898\u3001\u4EF7\u683C\uFF08\u7F8E\u5143\uFF09\u3001\u5206\u7C7B\u4E0E\u56FE\u7247\u540E\u624B\u52A8\u4E0A\u67B6\u3002"
      }, 201, origin);
    }
    if (url.pathname === "/api/ops/growth/overview" && request.method === "GET") {
      if (!await authorized(request, env))
        return json({ error: "Unauthorized" }, 401, origin);
      const [leads, campaigns, content, tasks, channels] = await Promise.all([
        env.DB.prepare(`SELECT stage,COUNT(*) AS count FROM leads GROUP BY stage`).all(),
        env.DB.prepare(`SELECT id,name,status,objective,category,utm_source,utm_medium,utm_campaign,budget_usd FROM campaigns ORDER BY created_at DESC LIMIT 20`).all(),
        env.DB.prepare(`SELECT channel,status,COUNT(*) AS count FROM content_items GROUP BY channel,status`).all(),
        env.DB.prepare(`SELECT id,agent_name,task_type,priority,status,title,recommendation,requires_approval,created_at FROM agent_tasks WHERE status='open' ORDER BY CASE priority WHEN 'high' THEN 1 WHEN 'normal' THEN 2 ELSE 3 END,created_at DESC LIMIT 30`).all(),
        env.DB.prepare(`SELECT source,medium,campaign,event_type,COUNT(*) AS count,SUM(value_usd) AS value FROM acquisition_events GROUP BY source,medium,campaign,event_type ORDER BY count DESC LIMIT 30`).all()
      ]);
      return json({ leads: leads.results, campaigns: campaigns.results, content: content.results, tasks: tasks.results, channels: channels.results }, 200, origin);
    }
    if (url.pathname === "/api/ops/growth/campaigns" && request.method === "POST") {
      if (!await authorized(request, env))
        return json({ error: "Unauthorized" }, 401, origin);
      const b = await body(request);
      if (!b?.name)
        return json({ error: "name required" }, 400, origin);
      const id = rid();
      const slug = (b.utm_campaign || b.name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      await env.DB.prepare(`INSERT INTO campaigns (id,name,objective,status,category,landing_path,utm_source,utm_medium,utm_campaign,budget_usd) VALUES (?,?,?,?,?,?,?,?,?,?)`).bind(id, b.name, b.objective || "traffic", "draft", b.category || null, b.landing_path || "/", b.utm_source || "manual", b.utm_medium || "organic", slug, Number(b.budget_usd || 0)).run();
      return json({ ok: true, id, utm_campaign: slug }, 201, origin);
    }
    if (url.pathname === "/api/ops/growth/content" && request.method === "POST") {
      if (!await authorized(request, env))
        return json({ error: "Unauthorized" }, 401, origin);
      const b = await body(request);
      if (!b?.channel || !b?.body)
        return json({ error: "channel and body required" }, 400, origin);
      const id = rid();
      await env.DB.prepare(`INSERT INTO content_items (id,campaign_id,channel,title,body,status,ai_generated) VALUES (?,?,?,?,?,'draft',?)`).bind(id, b.campaign_id || null, b.channel, b.title || null, b.body, b.ai_generated ? 1 : 0).run();
      return json({ ok: true, id }, 201, origin);
    }
    if (url.pathname === "/api/ops/agent/run" && request.method === "POST") {
      if (!await authorized(request, env))
        return json({ error: "Unauthorized" }, 401, origin);
      const ids = await runGrowthAgent(env);
      return json({ ok: true, created_tasks: ids }, 200, origin);
    }
    if (url.pathname === "/api/ops/agent/tasks" && request.method === "GET") {
      if (!await authorized(request, env))
        return json({ error: "Unauthorized" }, 401, origin);
      const { results } = await env.DB.prepare(`SELECT * FROM agent_tasks WHERE status='open' ORDER BY CASE priority WHEN 'high' THEN 1 WHEN 'normal' THEN 2 ELSE 3 END,created_at DESC`).all();
      return json({ tasks: results }, 200, origin);
    }
    if (url.pathname.startsWith("/api/ops/agent/tasks/") && request.method === "PUT") {
      if (!await authorized(request, env))
        return json({ error: "Unauthorized" }, 401, origin);
      const id = url.pathname.split("/").pop();
      const b = await body(request);
      const status = b?.status;
      if (!["open", "approved", "completed", "rejected"].includes(status))
        return json({ error: "Invalid status" }, 400, origin);
      await env.DB.prepare(`UPDATE agent_tasks SET status=?,completed_at=CASE WHEN ? IN ('completed','rejected') THEN CURRENT_TIMESTAMP ELSE completed_at END WHERE id=?`).bind(status, status, id).run();
      return json({ ok: true }, 200, origin);
    }
    if (url.pathname.startsWith("/api/ops/assets/") && request.method === "PUT") {
      if (!await authorized(request, env))
        return json({ error: "Unauthorized" }, 401, origin);
      const key = decodeURIComponent(url.pathname.slice("/api/ops/assets/".length)).replace(/^\/+/, "");
      if (!key || key.includes(".."))
        return json({ error: "Invalid asset key" }, 400, origin);
      const contentType = request.headers.get("Content-Type") || "application/octet-stream";
      await env.ASSETS.put(key, request.body, { httpMetadata: { contentType } });
      return json({ ok: true, key, url: `/media/${encodeURIComponent(key).replace(/%2F/g, "/")}` }, 201, origin);
    }
    if (url.pathname === "/api/ops/products" && request.method === "GET") {
      if (!await authorized(request, env))
        return json({ error: "Unauthorized" }, 401, origin);
      const { results } = await env.DB.prepare(`SELECT p.id,p.sku,p.name,c.slug AS category,c.name AS category_name,p.origin,p.altitude,p.unit,p.weight,p.description,p.selling_points,p.price_cents,ROUND(p.price_cents/100.0,2) AS price_usd,p.cost_cents,ROUND(p.cost_cents/100.0,2) AS cost_usd,COALESCE(p.currency,'USD') AS currency,p.status,p.cover_url,COALESCE(i.on_hand,0) AS on_hand,COALESCE(i.reserved,0) AS reserved,COALESCE(i.on_hand-i.reserved,0) AS available_qty FROM products p LEFT JOIN categories c ON c.id=p.category_id LEFT JOIN inventory i ON i.product_id=p.id ORDER BY CASE p.status WHEN 'published' THEN 0 WHEN 'draft' THEN 1 ELSE 2 END,p.id DESC`).all();
      const cats = await env.DB.prepare(`SELECT id,slug,name FROM categories WHERE active=1 ORDER BY id`).all();
      const imgs = await env.DB.prepare(`SELECT product_id,image_url,is_cover FROM product_images ORDER BY sort_order`).all();
      return json({ currency: "USD", products: results, categories: cats.results, images: imgs.results }, 200, origin);
    }
    if (url.pathname === "/api/ops/products" && request.method === "POST") {
      if (!await authorized(request, env))
        return json({ error: "Unauthorized" }, 401, origin);
      const p = await body(request);
      if (!p?.sku || !p?.name || !p?.category)
        return json({ error: "sku / name / category \u5FC5\u586B" }, 400, origin);
      const cat = await env.DB.prepare(`SELECT id FROM categories WHERE slug=?`).bind(p.category).first();
      if (!cat)
        return json({ error: `\u672A\u77E5\u5206\u7C7B\uFF1A${p.category}` }, 400, origin);
      const priceCents = p.price_cents != null ? Math.round(Number(p.price_cents)) : Math.round(Number(p.price_usd || 0) * 100);
      const costCents = p.cost_cents != null ? Math.round(Number(p.cost_cents)) : Math.round(Number(p.cost_usd || 0) * 100);
      await env.DB.prepare(`INSERT INTO products (sku,name,category_id,origin,altitude,description,selling_points,unit,weight,price_cents,cost_cents,safety_stock,status,cover_url,currency) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,'USD') ON CONFLICT(sku) DO UPDATE SET name=excluded.name,category_id=excluded.category_id,origin=excluded.origin,altitude=excluded.altitude,description=excluded.description,selling_points=excluded.selling_points,unit=excluded.unit,weight=excluded.weight,price_cents=excluded.price_cents,cost_cents=excluded.cost_cents,safety_stock=excluded.safety_stock,status=excluded.status,cover_url=excluded.cover_url,currency='USD',updated_at=CURRENT_TIMESTAMP`).bind(p.sku, p.name, cat.id, p.origin || null, p.altitude || null, p.description || null, p.selling_points || null, p.unit || "\u4EFD", p.weight || null, priceCents, costCents, Number(p.safety_stock || 0), p.status || "draft", p.cover_url || null).run();
      const row = await env.DB.prepare(`SELECT id FROM products WHERE sku=?`).bind(p.sku).first();
      await env.DB.prepare(`INSERT INTO inventory (product_id,on_hand,reserved) VALUES (?,?,0) ON CONFLICT(product_id) DO NOTHING`).bind(row.id, Number(p.on_hand || 0)).run();
      return json({ ok: true, id: row.id, sku: p.sku, currency: "USD" }, 201, origin);
    }
    if (url.pathname.startsWith("/api/ops/products/") && request.method === "PATCH") {
      if (!await authorized(request, env))
        return json({ error: "Unauthorized" }, 401, origin);
      const id = Number(url.pathname.split("/").pop());
      if (!Number.isFinite(id))
        return json({ error: "Invalid product id" }, 400, origin);
      const p = await body(request) || {};
      const sets = [];
      const vals = [];
      if (p.name !== void 0) {
        sets.push("name=?");
        vals.push(p.name);
      }
      if (p.description !== void 0) {
        sets.push("description=?");
        vals.push(p.description);
      }
      if (p.origin !== void 0) {
        sets.push("origin=?");
        vals.push(p.origin);
      }
      if (p.altitude !== void 0) {
        sets.push("altitude=?");
        vals.push(p.altitude);
      }
      if (p.cover_url !== void 0) {
        sets.push("cover_url=?");
        vals.push(p.cover_url);
      }
      if (p.price_usd !== void 0) {
        sets.push("price_cents=?");
        vals.push(Math.round(Number(p.price_usd) * 100));
      }
      if (p.cost_usd !== void 0) {
        sets.push("cost_cents=?");
        vals.push(Math.round(Number(p.cost_usd) * 100));
      }
      if (p.status !== void 0) {
        if (!["draft", "published", "offline"].includes(p.status))
          return json({ error: "Invalid status" }, 400, origin);
        sets.push("status=?");
        vals.push(p.status);
      }
      if (sets.length) {
        sets.push("currency='USD'");
        sets.push("updated_at=CURRENT_TIMESTAMP");
        await env.DB.prepare(`UPDATE products SET ${sets.join(",")} WHERE id=?`).bind(...vals, id).run();
      }
      if (p.available_qty !== void 0) {
        const row = await env.DB.prepare(`SELECT reserved FROM inventory WHERE product_id=?`).bind(id).first();
        if (!row)
          return json({ error: "\u5E93\u5B58\u8BB0\u5F55\u4E0D\u5B58\u5728" }, 404, origin);
        const next = Number(row.reserved) + Math.max(0, Number(p.available_qty));
        await env.DB.prepare(`UPDATE inventory SET on_hand=? WHERE product_id=?`).bind(next, id).run();
      }
      return json({ ok: true, id, currency: "USD" }, 200, origin);
    }
    if (url.pathname === "/api/ops/inventory/adjust" && request.method === "POST") {
      if (!await authorized(request, env))
        return json({ error: "Unauthorized" }, 401, origin);
      const b = await body(request);
      if (!b?.product_id)
        return json({ error: "product_id required" }, 400, origin);
      const row = await env.DB.prepare(`SELECT on_hand,reserved FROM inventory WHERE product_id=?`).bind(b.product_id).first();
      if (!row)
        return json({ error: "Inventory record not found" }, 404, origin);
      let next;
      if (b.available_qty !== void 0) {
        next = Number(row.reserved) + Math.max(0, Number(b.available_qty));
      } else {
        const qty = Number(b.quantity_delta);
        if (!Number.isFinite(qty))
          return json({ error: "Invalid inventory adjustment" }, 400, origin);
        next = Number(row.on_hand) + qty;
      }
      if (!Number.isFinite(next) || next < 0)
        return json({ error: "Inventory cannot become negative" }, 409, origin);
      await env.DB.batch([
        env.DB.prepare(`UPDATE inventory SET on_hand=? WHERE product_id=?`).bind(next, b.product_id),
        env.DB.prepare(`INSERT INTO inventory_events (id,product_id,event_type,quantity,reference_type,note) VALUES (?,?,?,?,?,?)`).bind(rid(), b.product_id, "manual_adjustment", next - Number(row.on_hand), "ops", b.note || "")
      ]);
      return json({ ok: true, on_hand: next, available_qty: next - Number(row.reserved), currency: "USD" }, 200, origin);
    }
    if (url.pathname === "/api/ops/token" && request.method === "GET") {
      if (!await authorized(request, env))
        return json({ error: "Unauthorized" }, 401, origin);
      const row = await env.DB.prepare(`SELECT value FROM settings WHERE key='admin_token' LIMIT 1`).first();
      return json({ ok: true, token: String(row?.value || env.ADMIN_TOKEN || ""), source: row?.value ? "database" : "deploy_secret" }, 200, origin);
    }
    if (url.pathname === "/api/ops/token" && request.method === "POST") {
      if (!await authorized(request, env))
        return json({ error: "Unauthorized" }, 401, origin);
      const b = await body(request);
      const nt = String(b?.new_token || "").trim();
      if (nt.length < 8)
        return json({ error: "\u65B0\u5BC6\u7801\u81F3\u5C11\u9700\u8981 8 \u4E2A\u5B57\u7B26" }, 400, origin);
      await env.DB.prepare(`INSERT INTO settings (key,value,description) VALUES ('admin_token',?,'\u8FD0\u8425\u4E2D\u53F0\u7BA1\u7406\u5BC6\u7801') ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=datetime('now')`).bind(nt).run();
      return json({ ok: true, message: "\u7BA1\u7406\u5BC6\u7801\u5DF2\u66F4\u65B0\uFF0C\u4E0B\u6B21\u767B\u5F55\u8BF7\u4F7F\u7528\u65B0\u5BC6\u7801" }, 200, origin);
    }
    if (url.pathname === "/api/ops/mail" && request.method === "GET") {
      if (!await authorized(request, env))
        return json({ error: "Unauthorized" }, 401, origin);
      const counts = await env.DB.prepare(`SELECT source,COUNT(*) AS count FROM leads GROUP BY source ORDER BY count DESC`).all();
      return json({
        mailbox: env.MAIL_BOX || "xyong@xyong.ccwu.cc",
        forward_to: env.MAIL_TO || "xynong@gmail.com",
        sender: env.MAIL_FROM || "orders@xyong.ccwu.cc",
        notify_enabled: !!env.NOTIFY_MAIL,
        customer_mail_enabled: !!(env.RESEND_API_KEY || env.SENDGRID_API_KEY),
        customer_mail_channel: env.SENDGRID_API_KEY ? "sendgrid" : env.RESEND_API_KEY ? "resend" : await getSettingValue(env, "smtp_user") ? "zoho_smtp" : "none",
        aliases: ["xyong@xyong.ccwu.cc", "hello@xyong.ccwu.cc", "support@xyong.ccwu.cc", "orders@xyong.ccwu.cc"],
        form_sources: counts.results
      }, 200, origin);
    }
    if (url.pathname === "/api/ops/mail/test" && request.method === "POST") {
      if (!await authorized(request, env))
        return json({ error: "Unauthorized" }, 401, origin);
      const b = await request.json().catch(() => ({}));
      const to = String(b.to || "").trim();
      const lines = [
        "\u8FD9\u662F\u4E00\u5C01\u6765\u81EA\u8FD0\u8425\u4E2D\u53F0\u7684\u6D4B\u8BD5\u90AE\u4EF6\u3002",
        `\u65F6\u95F4\uFF1A${(/* @__PURE__ */ new Date()).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}`,
        "\u82E5\u4F60\u6536\u5230\u672C\u90AE\u4EF6\uFF0C\u8BF4\u660E xyong@xyong.ccwu.cc \u7684\u53D1\u4FE1\u901A\u9053\u5DF2\u6253\u901A\u3002"
      ];
      const sent = to ? await sendMail(env, to, "XYONG \u90AE\u7BB1\u5916\u90E8\u6295\u9012\u6D4B\u8BD5", lines) : await notifyOwner(env, "XYONG \u90AE\u7BB1\u8FDE\u901A\u6D4B\u8BD5", lines);
      return json({
        ok: sent,
        to: to || (env.MAIL_TO || "xynong@gmail.com"),
        message: sent ? "\u90AE\u4EF6\u5DF2\u53D1\u51FA" : "\u53D1\u4FE1\u5931\u8D25\uFF1A\u6536\u4EF6\u5730\u5740\u53EF\u80FD\u672A\u9A8C\u8BC1\uFF0C\u6216\u53D1\u4FE1\u7ED1\u5B9A\u672A\u5F00\u901A"
      }, sent ? 200 : 502, origin);
    }
    if (url.pathname === "/api/ops/smtp" && request.method === "GET") {
      if (!await authorized(request, env))
        return json({ error: "Unauthorized" }, 401, origin);
      const user = await getSettingValue(env, "smtp_user");
      return json({
        configured: !!(user && await getSettingValue(env, "smtp_pass")),
        user: user ? user.replace(/^(.{3}).*(@.*)$/, "$1***$2") : "",
        host: await getSettingValue(env, "smtp_host") || "smtp.zoho.com",
        port: Number(await getSettingValue(env, "smtp_port") || 465)
      }, 200, origin);
    }
    if (url.pathname === "/api/ops/smtp" && request.method === "POST") {
      if (!await authorized(request, env))
        return json({ error: "Unauthorized" }, 401, origin);
      const b = await request.json().catch(() => ({}));
      if (b.action === "save") {
        const user = String(b.user || "").trim();
        const pass = String(b.pass || "");
        if (!user || !pass)
          return json({ ok: false, message: "\u8D26\u53F7\u548C\u5BC6\u7801\u4E0D\u80FD\u4E3A\u7A7A" }, 400, origin);
        await env.DB.prepare(`INSERT INTO settings (key,value) VALUES ('smtp_user',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value`).bind(user).run();
        await env.DB.prepare(`INSERT INTO settings (key,value) VALUES ('smtp_pass',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value`).bind(pass).run();
        if (b.host)
          await env.DB.prepare(`INSERT INTO settings (key,value) VALUES ('smtp_host',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value`).bind(String(b.host).trim()).run();
        if (b.port)
          await env.DB.prepare(`INSERT INTO settings (key,value) VALUES ('smtp_port',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value`).bind(String(Number(b.port))).run();
        return json({ ok: true, message: "SMTP \u914D\u7F6E\u5DF2\u4FDD\u5B58\uFF0C\u5BA2\u6237\u901A\u77E5\u90AE\u4EF6\u901A\u9053\u5DF2\u542F\u7528" }, 200, origin);
      }
      const to = String(b.to || "").trim();
      if (!to)
        return json({ ok: false, message: "\u8BF7\u586B\u5199\u6D4B\u8BD5\u6536\u4EF6\u5730\u5740" }, 400, origin);
      const r = await smtpSend(env, to, "XYONG \u5BA2\u6237\u90AE\u4EF6\u901A\u9053\u6D4B\u8BD5", [
        "\u8FD9\u662F\u4E00\u5C01\u5BA2\u6237\u901A\u77E5\u901A\u9053\u7684\u6D4B\u8BD5\u90AE\u4EF6\u3002",
        `\u65F6\u95F4\uFF1A${(/* @__PURE__ */ new Date()).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}`,
        "\u82E5\u6536\u5230\u672C\u90AE\u4EF6\uFF0C\u8BF4\u660E\u4E0B\u5355\u786E\u8BA4 / \u53D1\u8D27\u901A\u77E5\u53EF\u4EE5\u6B63\u5E38\u9001\u8FBE\u5BA2\u6237\u3002"
      ]);
      return json({ ok: r.ok, message: r.ok ? "\u6D4B\u8BD5\u90AE\u4EF6\u5DF2\u901A\u8FC7 SMTP \u53D1\u51FA" : `SMTP \u53D1\u9001\u5931\u8D25\uFF1A${r.error || "\u672A\u77E5\u9519\u8BEF"}` }, r.ok ? 200 : 502, origin);
    }
    if (url.pathname === "/api/ops/field/reports" && request.method === "GET") {
      if (!await authorized(request, env))
        return json({ error: "Unauthorized" }, 401, origin);
      const { results } = await env.DB.prepare(`SELECT * FROM field_reports WHERE status!='deleted' ORDER BY created_at DESC LIMIT 100`).all();
      const reports = (results || []).map((r) => {
        let data = {}, photos = [], docs = [];
        try {
          data = JSON.parse(r.data_json || "{}");
        } catch {
        }
        try {
          photos = JSON.parse(r.photos_json || "[]");
        } catch {
        }
        try {
          docs = JSON.parse(r.docs_json || "[]");
        } catch {
        }
        return {
          id: r.id,
          category: r.category,
          product_name: r.product_name,
          status: r.status,
          created_at: r.created_at,
          data,
          photos,
          docs
        };
      });
      return json({ reports }, 200, origin);
    }
    const fieldPublish = url.pathname.match(/^\/api\/ops\/field\/reports\/([^/]+)\/publish$/);
    if (fieldPublish && request.method === "POST") {
      if (!await authorized(request, env))
        return json({ error: "Unauthorized" }, 401, origin);
      try {
        const repId = fieldPublish[1];
        const rep = await env.DB.prepare(`SELECT * FROM field_reports WHERE id=?`).bind(repId).first();
        if (!rep)
          return json({ error: "\u62A5\u544A\u4E0D\u5B58\u5728" }, 404, origin);
        if (rep.status === "published")
          return json({ error: "\u8BE5\u62A5\u544A\u5DF2\u8F6C\u4E3A\u5546\u54C1" }, 400, origin);
        const data = JSON.parse(rep.data_json || "{}");
        const photos = JSON.parse(rep.photos_json || "[]");
        const docs = JSON.parse(rep.docs_json || "[]");
        const cat = await env.DB.prepare(`SELECT id FROM categories WHERE slug=?`).bind(rep.category).first();
        if (!cat)
          return json({ error: "\u5546\u54C1\u5206\u7C7B\u4E0D\u5B58\u5728\uFF1A" + rep.category }, 400, origin);
        const sku = "FLD-" + repId.replace(/^FR-/, "").replace(/-/g, "").slice(-10).toUpperCase();
        const existsSku = await env.DB.prepare(`SELECT id FROM products WHERE sku=?`).bind(sku).first();
        if (existsSku)
          return json({ error: "\u8BE5\u62A5\u544A\u5DF2\u751F\u6210\u8FC7\u5546\u54C1\uFF08SKU " + sku + "\uFF09" }, 400, origin);
        const nameEn = String(data.name_en || "").trim();
        const name = String(data.name_zh || rep.product_name || sku) + (nameEn ? " | " + nameEn : "");
        const specLines = [];
        for (const [k, v] of Object.entries(data)) {
          if (["name_zh", "name_en", "origin", "altitude", "story", "price_usd", "qty", "unit"].includes(k))
            continue;
          if (typeof v === "string" && v.trim())
            specLines.push(`${k}: ${v}`);
        }
        const description = [
          nameEn ? String(data.name_zh || "") + " \xB7 " + nameEn : String(data.name_zh || ""),
          data.season ? "\u91C7\u6536\u5B63\u8282\uFF1A" + data.season : "",
          data.story ? "\n" + data.story : "",
          specLines.length ? "\n\u89C4\u683C\u53C2\u6570\uFF1A\n" + specLines.join("\n") : ""
        ].filter(Boolean).join("\n");
        const priceCents = Math.round(Number(data.price_usd || 0) * 100);
        const coverUrl = photos[0]?.url || null;
        await env.DB.prepare(
          `INSERT INTO products (sku,name,category_id,origin,altitude,description,selling_points,unit,price_cents,status,cover_url) VALUES (?,?,?,?,?,?,?,?,?,?,?)`
        ).bind(
          sku,
          name,
          cat.id,
          String(data.origin || ""),
          String(data.altitude || ""),
          description,
          JSON.stringify({ flavor: data.flavor || data.taste || data.aroma || "", certifications: data.certifications || "" }),
          String(data.unit || "\u4EF6"),
          priceCents,
          "draft",
          coverUrl
        ).run();
        const prodRow = await env.DB.prepare(`SELECT id FROM products WHERE sku=?`).bind(sku).first();
        const prodId = Number(prodRow?.id);
        await env.DB.prepare(`INSERT OR IGNORE INTO inventory (product_id,on_hand,reserved) VALUES (?,?,0)`).bind(prodId, Number(data.qty || 0)).run();
        await env.DB.prepare(`INSERT INTO product_details (product_id,fields_json) VALUES (?,?)`).bind(prodId, JSON.stringify({ field_report: repId, ...data })).run();
        for (let i = 0; i < photos.length; i++) {
          await env.DB.prepare(`INSERT OR IGNORE INTO product_images (product_id,object_key,image_url,image_type,sort_order,is_cover) VALUES (?,?,?,?,?,?)`).bind(prodId, photos[i].key, photos[i].url, photos[i].slot || "product", i, i === 0 ? 1 : 0).run();
        }
        for (const d of docs) {
          for (const f of d.files || []) {
            await env.DB.prepare(`INSERT OR IGNORE INTO evidence_assets (product_id,file_key,file_name,file_type,summary) VALUES (?,?,?,?,?)`).bind(
              String(prodId),
              f.key,
              f.name || "\u6587\u4EF6",
              (f.mime || "").includes("pdf") ? "pdf" : "image",
              `${d.type || "\u5408\u89C4\u6587\u4EF6"}${d.no ? " \xB7 " + d.no : ""}${d.issuer ? " \xB7 " + d.issuer : ""}${d.expiry ? " \xB7 \u6709\u6548\u671F\u81F3 " + d.expiry : ""}`
            ).run();
          }
        }
        await env.DB.prepare(`UPDATE field_reports SET status='published' WHERE id=?`).bind(repId).run();
        return json({ ok: true, product_id: prodId, sku }, 201, origin);
      } catch (e) {
        return json({ error: "\u8F6C\u5546\u54C1\u5931\u8D25\uFF1A" + String(e?.message || e) }, 500, origin);
      }
    }
    const fieldDelete = url.pathname.match(/^\/api\/ops\/field\/reports\/([^/]+)$/);
    if (fieldDelete && request.method === "DELETE") {
      if (!await authorized(request, env))
        return json({ error: "Unauthorized" }, 401, origin);
      await env.DB.prepare(`UPDATE field_reports SET status='deleted' WHERE id=?`).bind(fieldDelete[1]).run();
      return json({ ok: true }, 200, origin);
    }
    if (url.pathname === "/api/ops/diagnostics" && request.method === "GET") {
      if (!authorized(request, env))
        return json({ error: "Unauthorized" }, 401, origin);
      try {
        const tableResult = await env.DB.prepare(
          `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name`
        ).all();
        const r2Result = await env.ASSETS.list({ limit: 1 });
        return json({
          ok: true,
          version: "3.0.0",
          mode: "read_only",
          checked_at: (/* @__PURE__ */ new Date()).toISOString(),
          d1: { connected: true, database: "xyong-db", table_count: tableResult.results.length, tables: tableResult.results.map((row) => row.name) },
          r2: { connected: true, bucket: "xyong-media", has_objects: r2Result.objects.length > 0, listing_truncated: r2Result.truncated }
        }, 200, origin);
      } catch (error) {
        return json({ ok: false, mode: "read_only", error: error instanceof Error ? error.message : "Infrastructure check failed" }, 500, origin);
      }
    }
    return json({ error: "Not found" }, 404, origin);
  }
};
export {
  src_default as default
};
//# sourceMappingURL=index.js.map
