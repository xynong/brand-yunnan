// 手机端实地采集页：由 Worker 在 /field 直接输出，无需构建步骤。
// 产地现场用手机拍照录入 → 提交到 /api/field/reports → 中台审核转商品。
// 注意：本字符串会作为模板字面量嵌入，页面 JS 内禁用反引号与 ${} 插值语法。
export const FIELD_PAGE_HTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<title>XYONG · 实地采集</title>
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
    <div style="font-size:30px;margin-bottom:8px">🌿</div>
    <h3 style="color:var(--g);margin-bottom:6px">XYONG 实地采集</h3>
    <p style="font-size:13px;color:var(--muted);margin-bottom:14px">请输入运营访问码（中台密钥）</p>
    <input id="gateToken" type="password" placeholder="访问码">
    <button class="go" id="gateGo">进入采集</button>
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
  <button class="out" id="btnLogout">退出</button>
</header>
<main>

<div class="card">
  <h2><span class="n">1</span>选择产品类别</h2>
  <div class="cats" id="cats"></div>
</div>

<div class="card">
  <h2><span class="n">2</span>基本信息</h2>
  <div class="fld"><label>产品名称（中文）<span class="rq">*</span></label><input id="f_name_zh" placeholder="如：保山高黎贡山精品阿拉比卡"></div>
  <div class="fld"><label>Product Name（英文）</label><input id="f_name_en" placeholder="GaoLiGong Mountain Arabica"></div>
  <div class="fld"><label>采集地点（省/市/县/庄园）<span class="rq">*</span></label><input id="f_origin" placeholder="云南省保山市隆阳区潞江镇××庄园"></div>
  <div class="row2">
    <div class="fld"><label>海拔（米）</label><input id="f_altitude" inputmode="numeric" placeholder="1500-1800"></div>
    <div class="fld"><label>采收季节 / 日期</label><input id="f_season" placeholder="2026年11月 / 11月上旬"></div>
  </div>
  <div class="row2">
    <div class="fld"><label>批号</label><input id="f_batch" placeholder="XY20261101"></div>
    <div class="fld"><label>可供货量</label><input id="f_qty" inputmode="decimal" placeholder="500"></div>
  </div>
  <div class="row2">
    <div class="fld"><label>计量单位</label><input id="f_unit" placeholder="kg / 袋 / 瓶"></div>
    <div class="fld"><label>参考单价（美元）</label><input id="f_price_usd" inputmode="decimal" placeholder="69"></div>
  </div>
  <div class="row2">
    <div class="fld"><label>保质期</label><input id="f_shelf_life" placeholder="12个月"></div>
    <div class="fld"><label>储存条件</label><input id="f_storage" placeholder="阴凉干燥、避光密封"></div>
  </div>
</div>

<div class="card">
  <h2><span class="n">3</span><span id="specTitle">类别参数</span></h2>
  <div id="specFields"></div>
</div>

<div class="card">
  <h2><span class="n">4</span>现场照片 <span class="tag">手机拍照自动压缩上传</span></h2>
  <div class="tip">四类槽位都可拍多张；现场光线复杂时尽量对准主体、避免逆光。</div>
  <div class="slots" id="slots"></div>
</div>

<div class="card">
  <h2><span class="n">5</span>合规与检测文件 <span class="tag">检测报告 / 认证证书</span></h2>
  <div class="tip">建议每款产品至少上传【产品检测报告】与【有机认证】；可拍照证书原件或扫描件。</div>
  <div id="docs"></div>
  <button class="btn-add-doc" id="btnAddDoc">＋ 添加一份合规文件</button>
</div>

<div class="card">
  <h2><span class="n">6</span>品牌故事 / 现场备注</h2>
  <div class="fld"><textarea id="f_story" placeholder="产地故事、农户信息、加工细节、想要突出给国际买家的卖点…"></textarea></div>
</div>

<div class="card">
  <h2><span class="n">7</span>本次采集记录</h2>
  <ul class="hist" id="hist"><li>暂无</li></ul>
</div>

</main>
<div class="actbar">
  <button class="save" id="btnSave">存草稿</button>
  <button class="go" id="btnSubmit">提交采集报告</button>
</div>
</div>

<div class="toast" id="toast"></div>
<div class="mask" id="doneMask"><div class="modal">
  <h3>✅ 提交成功</h3>
  <p id="doneText"></p>
  <button class="ok" id="doneOk">继续采集下一个</button>
</div></div>

<script>
(function(){
'use strict';
var API = 'https://apixyong.ccwu.cc';
var SLOT_DEFS = [
  ['featured','产品特写','单品近拍，白/素色背景'],
  ['environment','产地环境','果园/茶山/菌塘全景'],
  ['process','采摘·加工','采摘、处理、烘焙现场'],
  ['packaging','包装规格','包装、标签、整箱'],
  ['extra','更多照片','证书之外的补充照片']
];
var DOC_TYPES = ['产品检测报告','有机认证','植物检疫证书','原产地证','清真认证','HACCP / ISO22000','其他认证'];
var CATS = {
  coffee:{label:'精品咖啡',icon:'☕',fields:[
    ['variety','品种','铁皮卡 Typica / 卡蒂姆 Catimor'],
    ['process','处理法','水洗 / 日晒 / 蜜处理 / 厌氧'],
    ['roast','烘焙度','生豆 / 浅烘 / 中烘 / 深烘'],
    ['cup_score','杯测评分（SCA 满分100）','85+'],
    ['flavor','风味描述','柑橘、茉莉花香、蜂蜜甜感'],
    ['moisture','含水率（%）','10-12'],
    ['screen_size','筛网尺寸','15目以上（AA级）'],
    ['defect_rate','瑕疵率（%）','小于5']
  ]},
  tea:{label:'特级茶叶',icon:'🍵',fields:[
    ['tea_type','茶类','普洱 / 滇红 / 白茶'],
    ['tree_age','树龄','古树300年 / 大树 / 台地'],
    ['grade','等级','特级 / 一级'],
    ['craft','制作工艺','手工揉捻、日光晒干'],
    ['leaf','干茶外形','条索紧结、金毫显露'],
    ['liquor','汤色','金黄透亮'],
    ['taste','口感描述','回甘生津、蜜香明显'],
    ['brewing','冲泡指南','95°C，5g / 110ml']
  ]},
  truffle:{label:'黑松露',icon:'🍄',fields:[
    ['scientific','学名','Tuber indicum（中华黑松露）'],
    ['harvest_method','采收方式','人工采挖、松露犬寻获'],
    ['grade','等级','一级（单颗50g以上）'],
    ['appearance','外观描述','表皮黑褐色、鳞纹清晰'],
    ['aroma','香气描述','浓郁菌香、微坚果香'],
    ['firmness','硬度','坚实有弹性'],
    ['truffle_moisture','含水状态','表面微润无泥']
  ]},
  oil:{label:'高档精油',icon:'💧',fields:[
    ['botanical','植物来源','澳洲茶树 / 桉树 / 玫瑰'],
    ['plant_part','使用部位','叶片 / 花 / 果皮'],
    ['extraction','提取方式','水蒸气蒸馏法'],
    ['yield_rate','出油率（%）','1.5'],
    ['oil_appearance','外观','无色至淡黄色澄清液体'],
    ['oil_aroma','香气描述','清新草本香'],
    ['components','主要成分',''],
    ['purity','纯度（%）','100']
  ]}
};
var state = { category:'', data:{}, photos:{}, docs:[] };

function $(id){ return document.getElementById(id); }
function toast(msg, err){ var t=$('toast'); t.textContent=msg; t.className='toast show'+(err?' err':''); setTimeout(function(){t.className='toast';},2400); }
function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

/* ---------- 访问码 ---------- */
var token = localStorage.getItem('xyong_field_token') || '';
function showGate(){ $('gate').classList.remove('hide'); $('app').classList.add('hide'); }
function showApp(){ $('gate').classList.add('hide'); $('app').classList.remove('hide'); }
$('gateGo').onclick = function(){
  var v = $('gateToken').value.trim();
  if(!v){ $('gateErr').textContent='请输入访问码'; return; }
  fetch(API+'/api/field/ping',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:v})})
    .then(function(r){ return r.json(); })
    .then(function(d){
      if(d.ok){ token=v; localStorage.setItem('xyong_field_token',v); showApp(); init(); }
      else { $('gateErr').textContent='访问码不正确'; }
    })
    .catch(function(){ $('gateErr').textContent='网络不通，请确认手机有网'; });
};
$('btnLogout').onclick = function(){ localStorage.removeItem('xyong_field_token'); token=''; showGate(); };

/* ---------- 类别 ---------- */
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
  $('specTitle').textContent = cat ? cat.label+' · 专业参数' : '类别参数';
  var html = '';
  if (!cat) { $('specFields').innerHTML='<div class="tip">请先在上方选择产品类别</div>'; return; }
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

/* ---------- 基本信息 ---------- */
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

/* ---------- 照片 ---------- */
function renderSlots(){
  var html = '';
  for (var i=0;i<SLOT_DEFS.length;i++){
    var s = SLOT_DEFS[i];
    var arr = state.photos[s[0]]||[];
    var th = '';
    for (var j=0;j<arr.length;j++){
      th += '<span class="th"><img src="'+arr[j].b64+'"><button class="x" data-sl="'+s[0]+'" data-i="'+j+'">✕</button></span>';
    }
    html += '<div class="slot'+(arr.length?' full':'')+'">'
      + '<div class="st">'+s[1]+(arr.length?' · '+arr.length:'')+'</div>'
      + '<div class="sh">'+s[2]+'</div>'
      + '<label class="pick">📷 拍照/相册<input type="file" accept="image/*" capture="environment" multiple data-slot="'+s[0]+'"></label>'
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
      if (done===todo){ renderSlots(); save(); updatePct(); toast('照片已添加，共 '+arr.length+' 张'); }
    });
  }
  if (todo===0) toast('请选择图片文件', true);
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
    img.onerror = function(){ toast('有图片读取失败', true); };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
}

/* ---------- 合规文件 ---------- */
function renderDocs(){
  var html = '';
  for (var i=0;i<state.docs.length;i++){
    var d = state.docs[i];
    var files = '';
    for (var j=0;j<d.files.length;j++){
      var f = d.files[j];
      var inner = f.mime && f.mime.indexOf('image')===0
        ? '<img src="data:'+f.mime+';base64,'+f.b64+'">'
        : '<span style="font-size:16px">📄</span>';
      files += '<span class="ff">'+inner+' '+esc(f.name||'文件')+'<button data-di="'+i+'" data-fi="'+j+'" style="border:none;background:none;color:var(--req);font-size:12px">✕</button></span>';
    }
    html += '<div class="doc">'
      + '<div class="dh"><b>文件 '+(i+1)+'</b><button data-del="'+i+'">删除</button></div>'
      + '<div class="row2">'
      + '<div class="fld"><label>类型</label><select data-df="'+i+'-type">'
      + (function(){ var o=''; for(var t=0;t<DOC_TYPES.length;t++){ o+='<option'+(d.type===DOC_TYPES[t]?' selected':'')+'>'+DOC_TYPES[t]+'</option>'; } return o; })()
      + '</select></div>'
      + '<div class="fld"><label>编号 / 名称</label><input data-df="'+i+'-no" value="'+esc(d.no)+'" placeholder="报告编号"></div>'
      + '</div>'
      + '<div class="row2">'
      + '<div class="fld"><label>签发机构</label><input data-df="'+i+'-issuer" value="'+esc(d.issuer)+'" placeholder="SGS / 认证中心"></div>'
      + '<div class="fld"><label>有效期至</label><input data-df="'+i+'-expiry" value="'+esc(d.expiry)+'" placeholder="2027-11-30"></div>'
      + '</div>'
      + '<label class="pick" style="display:inline-block;background:var(--g2);color:#fff;font-size:12.5px;font-weight:600;border-radius:8px;padding:7px 14px">📷 上传证书照片/PDF<input type="file" accept="image/*,.pdf" capture="environment" multiple data-df="'+i+'-files"></label>'
      + '<div class="ffiles">'+files+'</div>'
      + '</div>';
  }
  $('docs').innerHTML = html || '<div class="tip" style="color:#b0a99f">还没有添加文件</div>';
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
        arr.push({ name:'证书照片', mime:'image/jpeg', b64:b64 });
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
  if (todo===0) toast('请选择图片或 PDF 文件', true);
  else if (failed) toast('有 PDF 超过 8MB，未加入', true);
}
$('btnAddDoc').onclick = function(){
  state.docs.push({ type:DOC_TYPES[0], no:'', issuer:'', expiry:'', files:[] });
  renderDocs(); save();
};

/* ---------- 进度 ---------- */
function updatePct(){
  var need = ['name_zh','origin'];
  var done = 0, total = need.length + 1; /* 基础必填 + 至少一张照片 */
  for (var i=0;i<need.length;i++){ if ((state.data[need[i]]||'').trim()) done++; }
  var photoCount = 0;
  for (var k in state.photos){ photoCount += state.photos[k].length; }
  if (photoCount>0) done++;
  var pct = Math.round(done*100/total);
  $('pct').textContent = pct+'%';
}

/* ---------- 草稿 ---------- */
function save(){ try{ localStorage.setItem('xyong_field_draft', JSON.stringify(state)); }catch(e){} }
function restore(){
  try{
    var raw = localStorage.getItem('xyong_field_draft');
    if (!raw) return;
    var s = JSON.parse(raw);
    if (s && s.data){ state.category=s.category||''; state.data=s.data||{}; state.photos=s.photos||{}; state.docs=s.docs||[]; }
  }catch(e){}
}

/* ---------- 历史 ---------- */
function loadHistory(){
  fetch(API+'/api/field/reports',{headers:{'Authorization':'Bearer '+token}})
    .then(function(r){ return r.json(); })
    .then(function(d){
      var list = (d && d.reports)||[];
      if (!list.length){ $('hist').innerHTML='<li>暂无</li>'; return; }
      var html='';
      for (var i=0;i<list.length && i<8;i++){
        html+='<li>'+esc(list[i].created_at||'')+' · '+esc(list[i].category)+' · '+esc(list[i].product_name)+'（'+(list[i].status==='published'?'已转商品':'待审核')+'）</li>';
      }
      $('hist').innerHTML=html;
    })
    .catch(function(){});
}

/* ---------- 提交 ---------- */
$('btnSubmit').onclick = function(){
  if (!state.category){ toast('请先选择产品类别', true); return; }
  if (!(state.data.name_zh||'').trim()){ toast('请填写产品名称', true); return; }
  if (!(state.data.origin||'').trim()){ toast('请填写采集地点', true); return; }
  var photoCount=0; for (var k in state.photos){ photoCount+=state.photos[k].length; }
  if (photoCount===0){ toast('请至少拍摄一张现场照片', true); return; }
  var btn=this; btn.disabled=true; btn.textContent='提交中…';
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
      btn.disabled=false; btn.textContent='提交采集报告';
      if (res.ok){
        $('doneText').textContent = '报告编号 '+res.d.id+'，已同步到运营中台「实地采集」。照片 '+res.d.photos+' 张、合规文件 '+res.d.docs+' 份。';
        $('doneMask').classList.add('show');
        state.category=''; state.data={}; state.photos={}; state.docs=[];
        localStorage.removeItem('xyong_field_draft');
        renderCats(); renderSpecs(); bindBasic(); renderSlots(); renderDocs(); updatePct(); loadHistory();
      } else {
        toast(res.d.error||'提交失败，请重试', true);
      }
    })
    .catch(function(){
      btn.disabled=false; btn.textContent='提交采集报告';
      toast('网络不通，草稿已保存，恢复网络后再试', true);
    });
};
$('doneOk').onclick = function(){ $('doneMask').classList.remove('show'); };
$('btnSave').onclick = function(){ save(); toast('草稿已保存到本机'); };

/* ---------- 初始化 ---------- */
function init(){
  restore();
  renderCats(); renderSpecs(); bindBasic(); renderSlots(); renderDocs(); updatePct(); loadHistory();
}
if (token) { showApp(); init(); } else { showGate(); }
})();
</script>
</body>
</html>`;
