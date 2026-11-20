/* ============================================================
   XYONG 云南精品园 · motion layer
   - 滚动进场（stagger fade-up）
   - Hero / 幕间轻视差
   - 数据计数
   - 页头滚动态
   ============================================================ */

(function () {
  'use strict';

  // 有 JS 才启用"先隐藏再进场"，避免脚本失效时内容不可见
  document.documentElement.classList.add('js');

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── 1. 页头滚动态 ─────────────────────────────────── */
  var header = document.getElementById('siteHeader');
  var lastY = -1;

  function onScrollHeader() {
    var y = window.scrollY || window.pageYOffset;
    if (y === lastY) return;
    lastY = y;
    header.classList.toggle('is-scrolled', y > 32);
  }
  onScrollHeader();

  /* ── 2. 进场动画 ───────────────────────────────────── */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll('.reveal, .trace-rule'));

  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.05 });

    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ── 3. 数据计数（86.5 / 217）───────────────────────── */
  var counters = Array.prototype.slice.call(document.querySelectorAll('[data-count]'));

  function animateCount(el) {
    var target = parseFloat(el.getAttribute('data-count')) || 0;
    var decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
    var duration = 1500;
    var start = null;

    function frame(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      var value = target * eased;
      el.textContent = decimals
        ? value.toFixed(decimals)
        : Math.round(value).toLocaleString('en-US');
      if (p < 1) requestAnimationFrame(frame);
      else el.textContent = decimals ? target.toFixed(decimals) : target.toLocaleString('en-US');
    }
    requestAnimationFrame(frame);
  }

  if (counters.length) {
    if (reduce || !('IntersectionObserver' in window)) {
      counters.forEach(function (el) {
        var t = parseFloat(el.getAttribute('data-count'));
        el.textContent = el.getAttribute('data-decimals') ? t.toFixed(1) : t.toLocaleString('en-US');
      });
    } else {
      var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            cio.unobserve(entry.target);
          }
        });
      }, { threshold: 0.6 });
      counters.forEach(function (el) { cio.observe(el); });
    }
  }

  /* ── 4. 轻视差（Hero / 幕间影像）───────────────────── */
  var heroMedia = document.querySelector('.hero-media');
  var interlude = document.querySelector('.interlude');
  var interludeMedia = document.querySelector('.interlude-media');
  var ticking = false;

  function parallax() {
    var y = window.scrollY || window.pageYOffset;
    var vh = window.innerHeight;

    if (heroMedia && y < vh * 1.2) {
      heroMedia.style.transform = 'translate3d(0,' + (y * 0.16).toFixed(1) + 'px,0)';
    }

    if (interlude && interludeMedia) {
      var rect = interlude.getBoundingClientRect();
      if (rect.bottom > 0 && rect.top < vh) {
        var progress = (rect.top + rect.height / 2 - vh / 2) / vh;
        interludeMedia.style.transform = 'translate3d(0,' + (progress * 42).toFixed(1) + 'px,0)';
      }
    }
    ticking = false;
  }

  function onScroll() {
    onScrollHeader();
    if (reduce) return;
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(parallax);
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () {
    if (!reduce) parallax();
  }, { passive: true });
  if (!reduce) parallax();

  /* ── 5. 订阅表单（写入云数据库 newsletter_subscribers）─── */
  var form = document.getElementById('newsForm');
  var fine = document.getElementById('newsFine');

  function isEnUI() { return document.documentElement.lang === 'en'; }

  function say(zh, en, isError) {
    if (!fine) return;
    fine.textContent = isEnUI() ? en : zh;
    fine.style.color = isError ? '#C8794B' : '#D9C9B5';
  }

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = form.querySelector('input');
      var btn = form.querySelector('button');
      var value = (input.value || '').trim().toLowerCase();
      var ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);

      if (!ok) {
        say('邮箱格式好像不太对，再确认一下？', "That email doesn't look right — mind checking it?", true);
        input.focus();
        return;
      }

      var cloud = window.xyongCloud;
      if (!cloud || !cloud.database) {
        say('网络好像不太顺，请稍后再试一次。', 'Our signup service is unreachable — please try again shortly.', true);
        return;
      }

      if (btn) btn.disabled = true;
      say('正在寄出…', 'Sending…', false);

      cloud.database
        .from('newsletter_subscribers')
        .insert({ email: value, source: 'homepage', lang: isEnUI() ? 'en' : 'zh' })
        .then(function (res) {
          if (btn) btn.disabled = false;
          var err = res && res.error;
          if (!err) {
            say('已记下。下一封山上来信，会准时寄到 ' + value,
                'Noted — the next letter from the mountain will reach ' + value, false);
            form.reset();
            return;
          }
          if (err.code === '23505') {
            say('这个邮箱已经在名单里了，下一封不会漏掉你。',
                "You're already on the list — you won't miss the next letter.", false);
            form.reset();
            return;
          }
          say('暂时没寄出去，请稍后再试，或写信给我们。',
              "We couldn't save it just now — please retry, or write to us directly.", true);
        })
        .catch(function () {
          if (btn) btn.disabled = false;
          say('网络中断了，请稍后再试一次。', 'The connection dropped — please try again.', true);
        });
    });
  }

  /* ── 6. 双语切换（默认英文 · 跨境电商）───────────────── */
  var PAIRS = [
    ["云南精品园", "Yunnan Specialty Garden"],
    ["订阅来信", "Newsletter"],
    ["每一品，", "Every Taste,"],
    ["都是一座山的风土", "Born of One Mountain"],
    ["云岭高原，一山四季，万物共生，风土成珍", "Highland Yunnan — four seasons on one mountain, all things thriving, terroir made treasure."],
    ["探索四品精选", "Explore the Four"],
    ["了解风土溯源", "Our Mountain Story"],
    ["云蔓庄园 · 北纬 25° · 1,500m", "Yunman Estate · N 25° · 1,500 m"],
    ["PHILOSOPHY · 品牌理念", "PHILOSOPHY · OUR ORIGIN"],
    ["山不言，我们把风土", "The mountain says little —"],
    ["原原本本交到你手上", "we hand you its terroir, unaltered."],
    ["以这片山为原点：北纬 25° 火山灰庄园，咖啡杯测 89 分方入罐；哀牢山三百年古茶树，不施肥不修剪，日光晒青养出兰香蜜甜；香格里拉松栎林下，黑松露当日出土、低温直达；滇中高原香草蒸馏入瓶，成「云南气味地图」。好山好水出精品——四座山，四套标准，批次可查。",
     "With this mountain as our origin: on volcanic estates at 25° N, no coffee is jarred before it cups at 89; on the Ailao Mountains, 300-year-old tea trees grow unfertilized and unpruned, sun-dried into orchid aroma and honeyed sweetness; beneath the pine–oak woods of Shangri-La, black truffles are unearthed and shipped cold the same day; botanicals of the central Yunnan plateau are distilled into the Yunnan Scent Map. Fine mountains and pure waters yield the finest goods — four mountains, four standards, every batch traceable."],
    ["THE FOUR · 精选四品", "THE FOUR · SIGNATURE SELECTIONS"],
    ["四座山，四种收成", "Four Mountains, Four Harvests"],
    ["咨询与采购", "Inquire & Order"],
    ["云南精品咖啡", "Yunnan Specialty Coffee"],
    ["主产区：普洱 · 保山 · 怒江坝等", "Regions: Pu'er · Baoshan · Nujiang & more"],
    ["海拔 1,500–1,800m · 北纬 23°–25° 黄金带", "Alt. 1,500–1,800 m · N 23°–25° golden belt"],
    ["火山灰土壤、雪山融水灌溉的种植黄金带，云蔓庄园与多个云南咖啡品牌陆续上架——按产区、处理法与风味挑选。",
     "Grown on the volcanic-soil, snowmelt-fed golden belt — Yunman Estate and other Yunnan coffee brands are being listed. Choose by region, process and flavor."],
    ["果香", "Fruity"], ["花香", "Floral"], ["苦香", "Bittersweet"],
    ["多品牌可选", "Multiple Brands"],
    ["购买产品", "Shop Now"],
    ["云南古树茶", "Yunnan Ancient-Tree Tea"],
    ["主产区：临沧 · 普洱 · 西双版纳", "Regions: Lincang · Pu'er · Xishuangbanna"],
    ["高山云雾 · 一芽二叶 · 日光晒青", "Misty highlands · one bud two leaves · sun-dried"],
    ["三百年古茶树散生高山云雾之间，不施肥、不修剪；哈农手采一芽二叶，按山头分批晒青——按山头与树龄挑选。",
     "Three-hundred-year-old tea trees scattered in mountain mist — never fertilized, never pruned. Hani farmers hand-pick one bud and two leaves, sun-dried batch by mountain."],
    ["兰香", "Orchid"], ["蜜甜", "Honey"], ["山场气", "Terroir"],
    ["云南黑松露", "Yunnan Black Truffle"],
    ["主产区：丽江 · 香格里拉 · 曲靖", "Regions: Lijiang · Shangri-La · Qujing"],
    ["海拔约 3,000m · 松栎混交林 · 猎犬寻采", "Alt. ~3,000 m · pine–oak forest · hound-found"],
    ["松栎根系共生的山珍，只在高海拔混交林下出产；猎犬寻采、当日出土当日发货，冬季限定——按等级与批次挑选。",
     "A mountain treasure living on pine and oak roots, found only in high mixed forests — hound-hunted, unearthed and shipped the same day. Winter only."],
    ["菌香浓郁", "Deep Aroma"], ["冬季限定", "Winter Only"],
    ["云南气味地图", "Yunnan Scent Map"],
    ["种植区：昆明 · 红河 · 楚雄 · 丽江等七地", "Grown in: Kunming · Honghe · Chuxiong · Lijiang & more"],
    ["纯露打底 · 精油成香 · 四香对四山", "Hydrosol base · essential oils · four scents, four mountains"],
    ["把云南装进瓶子里：高原植物纯露打底、精油成香，四款香型对应四片山场，0 添加合成香精——按香型与山场挑选。",
     "Yunnan in a bottle: highland hydrosols layered with essential oils, four scents for four mountains — zero synthetic fragrance."],
    ["木香", "Woody"], ["礼盒装", "Gift Box"], ["0 添加", "0 Additives"],
    ["怒江 · 云蔓庄园", "Nujiang · Yunman Estate"],
    ["哀牢山 · 哈尼古茶园", "Ailao · Hani Tea Grove"],
    ["香格里拉 · 松栎混交林", "Shangri-La · Pine–Oak Woods"],
    ["滇中高原 · 植物香氛", "Central Yunnan · Botanicals"],
    ["从农户的背篓，到你的杯盏，中间只有一次诚实的手。",
     "From the forager's basket to your cup — one honest hand in between."],
    ["LETTER FROM THE MOUNTAIN · 山间来信", "LETTER FROM THE MOUNTAIN · NEWSLETTER"],
    ["每月一封，来自山上的信", "One Letter a Month, from the Mountains"],
    ["当季采收、杯测笔记与农户故事，一月一封，不催促任何人。",
     "Harvest notes, cupping reports and farmer stories — one letter a month, never in a hurry."],
    ["订 阅", "Subscribe"],
    ["我们只在你需要时出现，随时可退订。", "We write only when it matters — unsubscribe anytime."],
    ["来自云南高山的精品农产品庄园。",
     "From the highlands of Yunnan, with patience."],
    ["选品", "Collection"], ["品牌", "Brand"], ["支持", "Support"],
    ["云南气味地图 · 香氛", "Scent Map · Perfume"],
    ["品牌理念", "Our Philosophy"], ["风土溯源", "Terroir Story"],
    ["产地直送", "Direct from Origin"], ["山间来信", "Mountain Letters"],
    ["联系我们", "Contact Us"], ["产品运营入口", "Operations Portal"],
    ["批发合作", "Wholesale"], ["企业礼盒", "Corporate Gifting"],
    ["2026 XYONG 云南精品园 · 保留所有权利", "© 2026 XYONG · All rights reserved"],
    ["隐私政策 · 服务条款", "Privacy Policy · Terms of Service"]
  ];
  var ZH2EN = {}, EN2ZH = {};
  PAIRS.forEach(function (p) { ZH2EN[p[0]] = p[1]; EN2ZH[p[1]] = p[0]; });
  var ZH_TITLE = document.title;
  var EN_TITLE = "XYONG Yunnan Specialty Garden | Every Taste, Born of One Mountain";
  /* 仅首页承载完整双语；其余页面点击语言开关跳回首页对应语言 */
  var I18N_FULL = document.body.getAttribute('data-i18n') === 'full';

  function updateLangUI(toEn) {
    var opts = document.querySelectorAll('.lang-opt');
    for (var i = 0; i < opts.length; i++) {
      var isEnOpt = opts[i].getAttribute('data-set-lang') === 'en';
      opts[i].classList.toggle('is-active', isEnOpt === toEn);
    }
  }

  function setLang(lang) {
    var toEn = lang === 'en';
    if (!I18N_FULL) { updateLangUI(null); return; }
    document.documentElement.lang = toEn ? 'en' : 'zh-CN';
    document.title = toEn ? EN_TITLE : ZH_TITLE;
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    var node, map = toEn ? ZH2EN : EN2ZH;
    while ((node = walker.nextNode())) {
      var t = node.nodeValue.trim();
      if (t && map[t] !== undefined) node.nodeValue = map[t];
    }
    var email = document.getElementById('email');
    if (email) email.placeholder = toEn ? 'Enter your email' : '输入你的邮箱';
    // 英文模式下隐藏中英对照行（主行已是英文，避免重复）
    var alts = document.querySelectorAll('.interlude-en, .footer-en');
    for (var k = 0; k < alts.length; k++) alts[k].style.display = toEn ? 'none' : '';
    updateLangUI(toEn);
    try { localStorage.setItem('xyong-lang', lang); } catch (e) {}
  }

  var savedLang = null;
  try { savedLang = localStorage.getItem('xyong-lang'); } catch (e) {}
  var urlLang = new URLSearchParams(window.location.search).get('lang');
  var lang = (urlLang === 'zh' || urlLang === 'en') ? urlLang : (savedLang === 'zh' ? 'zh' : 'en');
  setLang(lang);

  var langOpts = document.querySelectorAll('.lang-opt');
  for (var li = 0; li < langOpts.length; li++) {
    (function (opt) {
      opt.addEventListener('click', function () {
        var target = opt.getAttribute('data-set-lang');
        if (!I18N_FULL) { window.location.href = 'index.html?lang=' + target; return; }
        setLang(target);
      });
    })(langOpts[li]);
  }

  /* ── 8. 产品运营入口：三层视图切换 ─────────────────── */
  var consoleTabs = Array.prototype.slice.call(document.querySelectorAll('.console-tab'));

  if (consoleTabs.length) {
    var panels = consoleTabs.map(function (tab) {
      return document.getElementById('panel-' + tab.getAttribute('data-tab'));
    });
    var tabsBar = document.querySelector('.console-tabs');

    function activateTab(key) {
      var found = false;

      consoleTabs.forEach(function (tab, i) {
        var on = tab.getAttribute('data-tab') === key;
        if (on) found = true;
        tab.classList.toggle('is-active', on);
        tab.setAttribute('aria-selected', String(on));
        if (!panels[i]) return;
        panels[i].classList.toggle('is-active', on);
        if (on) {
          Array.prototype.forEach.call(panels[i].querySelectorAll('.reveal'), function (el) {
            el.classList.add('in');
          });
        }
      });

      return found;
    }

    consoleTabs.forEach(function (tab, i) {
      tab.setAttribute('role', 'tab');
      tab.addEventListener('click', function () {
        var key = tab.getAttribute('data-tab');
        if (!activateTab(key)) return;
        if (history.replaceState) history.replaceState(null, '', '#' + key);
        if (tabsBar) {
          var y = tabsBar.getBoundingClientRect().top + window.scrollY - 92;
          window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
        }
      });
    });

    var initialTab = (window.location.hash || '').replace('#', '');
    if (!initialTab || !activateTab(initialTab)) activateTab('shop');
  }
})();
