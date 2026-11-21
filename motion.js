/* =========================================================
   Частный Мастер | Денис — motion.js
   ========================================================= */
(function () {
  'use strict';

  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  var G = window.gsap, ST = window.ScrollTrigger;

  // базовый текст заявки для MAX
  window.RM_REQUEST_TEXT = 'Здравствуйте, Денис! Нужен ремонт техники. Подскажите, когда сможете приехать?';

  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  var burger = document.getElementById('burger'), menu = document.getElementById('menu');
  if (burger && menu) {
    burger.addEventListener('click', function () { var o = menu.classList.toggle('open'); burger.setAttribute('aria-expanded', String(o)); burger.textContent = o ? '✕' : '☰'; });
    menu.addEventListener('click', function (e) { if (e.target.tagName === 'A') menu.classList.remove('open'); });
  }

  var ck = document.getElementById('ck'), seen = false;
  try { seen = localStorage.getItem('ck-ok') === '1'; } catch (e) {}
  if (ck && !seen) ck.classList.add('show');
  var ckb = document.getElementById('ckb');
  if (ckb) ckb.addEventListener('click', function () { ck.classList.remove('show'); try { localStorage.setItem('ck-ok', '1'); } catch (e) {} });

  if (G && ST && !reduce) {
    G.registerPlugin(ST);
  }

  // ---------- всплывающее уведомление ----------
  function showToast(msg) {
    var toast = document.getElementById('rm-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'rm-toast';
      toast.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%) translateY(20px);opacity:0;transition:opacity .35s ease,transform .35s ease;z-index:9999;max-width:92vw;padding:14px 20px;border-radius:10px;background:rgba(19,22,27,.92);backdrop-filter:blur(16px) saturate(1.4);-webkit-backdrop-filter:blur(16px) saturate(1.4);border:1px solid rgba(255,90,31,.45);color:#E2E8F0;font-size:.85rem;font-weight:600;display:flex;align-items:center;gap:10px;box-shadow:0 12px 40px rgba(0,0,0,.45);pointer-events:none;';
      var dot = document.createElement('span');
      dot.style.cssText = 'width:8px;height:8px;border-radius:50%;background:#FF5A1F;box-shadow:0 0 12px #FF5A1F;flex:none;';
      toast.appendChild(dot);
      var text = document.createElement('span');
      text.id = 'rm-toast-text';
      toast.appendChild(text);
      document.body.appendChild(toast);
    }
    document.getElementById('rm-toast-text').textContent = msg;
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
    clearTimeout(toast._t);
    toast._t = setTimeout(function () {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(20px)';
    }, 3200);
  }

  // ---------- обработчик кнопок MAX ----------
  function initMax() {
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href*="web.max.ru"], a[href*="max.ru"], [data-max]');
      if (!a) return;
      // только если это действительно ссылка на MAX
      var href = a.getAttribute('href') || '';
      if (href.indexOf('max.ru') === -1 && !a.hasAttribute('data-max')) return;
      e.preventDefault();
      var text = window.RM_REQUEST_TEXT || 'Здравствуйте, Денис! Нужен ремонт техники. Подскажите, когда сможете приехать?';
      var url = 'https://web.max.ru/17096045';
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          showToast('Текст заявки скопирован — вставьте его в открывшийся чат MAX');
        }).catch(function () {
          showToast('Открываю чат MAX — вставьте текст заявки вручную');
        });
      } else {
        showToast('Открываю чат MAX — вставьте текст заявки вручную');
      }
      window.open(url, '_blank', 'noopener');
    });
  }

  function splitHeadings() {
    document.querySelectorAll('[data-split]').forEach(function (el) {
      var w = el.textContent.trim().split(/\s+/);
      el.innerHTML = w.map(function (x) { return '<span class="w"><span>' + x + '</span></span>'; }).join(' ');
      if (G && ST && !reduce) {
        G.from(el.querySelectorAll('.w>span'), { yPercent: 115, duration: 1.1, ease: 'expo.out', stagger: .05, scrollTrigger: { trigger: el, start: 'top 88%' } });
      }
    });
  }

  function reveals() {
    if (G && ST && !reduce) {
      ST.batch('[data-up]', { start: 'top 90%', onEnter: function (b) { G.fromTo(b, { y: 36, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'expo.out', stagger: .08 }); }, once: true });
      G.set('[data-up]', { opacity: 0 });
    }
  }

  function counters() {
    document.querySelectorAll('[data-n]').forEach(function (el) {
      var to = +el.getAttribute('data-n') || 0;
      if (!G || reduce) { el.textContent = to; return; }
      var o = { v: 0 };
      var host = el.closest('[data-stats]') || document.getElementById('sts') || el;
      G.to(o, { v: to, ease: 'none', scrollTrigger: { trigger: host, start: 'top 92%', end: 'top 40%', scrub: .6 }, onUpdate: function () { el.textContent = Math.round(o.v); } });
    });
  }

  function bars() {
    var bars = document.querySelectorAll('[data-bar]');
    if (!bars.length) return;
    function fill(el) { var v = parseFloat(el.getAttribute('data-bar')) || 0; el.style.transform = 'scaleX(' + v + ')'; }
    if (reduce || !('IntersectionObserver' in window)) { bars.forEach(fill); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { fill(e.target); io.unobserve(e.target); } }); }, { threshold: .4 });
    bars.forEach(function (b) { io.observe(b); });
  }

  function tiltMag() {
    if (!fine || reduce) return;
    document.querySelectorAll('.tilt').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        el.style.setProperty('--mx', x * 100 + '%'); el.style.setProperty('--my', y * 100 + '%');
        el.style.transform = 'perspective(900px) rotateX(' + ((.5 - y) * 9) + 'deg) rotateY(' + ((x - .5) * 11) + 'deg) translateZ(0)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });
    document.querySelectorAll('.mag').forEach(function (b) {
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        b.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * .16) + 'px,' + ((e.clientY - r.top - r.height / 2) * .24) + 'px)';
      });
      b.addEventListener('pointerleave', function () { b.style.transform = ''; });
    });
  }

  function schematic() {
    var live = document.getElementById('plive'), pulse = document.getElementById('pulse'), rail = document.getElementById('rail');
    if (!live || !pulse || !rail) return;
    var nds = rail.querySelectorAll('.nd'), steps = document.getElementById('sp').children, len = live.getTotalLength();
    live.style.strokeDasharray = len; live.style.strokeDashoffset = len;
    var marks = [0, .333, .666, 1];
    function set(p) {
      live.style.strokeDashoffset = len * (1 - p);
      var pt = live.getPointAtLength(len * p), r = rail.getBoundingClientRect();
      pulse.style.transform = 'translate(' + (pt.x / 100 * r.width) + 'px,' + (pt.y / 1000 * r.height) + 'px)';
      pulse.style.opacity = p > 0 && p < 1 ? 1 : 0;
      for (var i = 0; i < 4; i++) {
        var on = p >= marks[i] - .001 && (i === 0 ? p > 0 : true);
        nds[i].classList.toggle('on', on); steps[i].classList.toggle('on', on);
      }
    }
    if (!G || reduce) { set(1); return; }
    set(0);
    ST.create({ trigger: '#sch', start: 'top 62%', end: 'bottom 58%', scrub: .5, onUpdate: function (s) { set(s.progress); } });
  }

  function diags() {
    var D = window.RM_DIAG;
    if (!D) return;
    document.querySelectorAll('[data-diag]').forEach(function (root) {
      var cats = Object.keys(D), cat = cats[0], idx = 0;
      var tabsEl = root.querySelector('.tabs'), listEl = root.querySelector('.syms'), cardEl = root.querySelector('.cardw');
      var cur = { v: 0 };
      function fmt(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0'); }
      function renderTabs() {
        if (!tabsEl || cats.length < 2) return;
        tabsEl.innerHTML = '';
        cats.forEach(function (c, i) {
          var b = document.createElement('button');
          b.type = 'button'; b.textContent = D[c].name; b.className = i === 0 ? 'on' : '';
          b.setAttribute('data-c', c);
          tabsEl.appendChild(b);
        });
      }
      function renderList() {
        listEl.innerHTML = '';
        D[cat].items.forEach(function (it, i) {
          var li = document.createElement('li'), b = document.createElement('button');
          b.type = 'button'; b.innerHTML = it.t + '<span>0' + (i + 1) + '</span>';
          li.appendChild(b); listEl.appendChild(li);
        });
        mark();
      }
      function mark() {
        var btns = listEl.querySelectorAll('button');
        Array.prototype.forEach.call(btns, function (b, i) { b.classList.toggle('on', i === idx); });
      }
      function paint() {
        var it = D[cat].items[idx];
        var text = 'Здравствуйте, Денис! Нужен ремонт (' + D[cat].name + '): ' + it.m + '. Подскажите, когда сможете приехать?';
        cardEl.innerHTML = '<span class="cat mono">' + D[cat].name + '</span><h3>' + it.t + '</h3><p class="why">' + it.why + '</p>' +
          '<div class="pr"><div class="v"></div></div>' +
          '<div class="rowm mono"><span>Время:<b>' + it.time + '</b></span><span>Диагностика:<b>от 500 ₽</b></span></div>' +
          '<div class="send"><a class="btn b-wa" target="_blank" rel="noopener" href="https://wa.me/79883164724?text=' + encodeURIComponent(text) + '">Отправить симптом Денису в WhatsApp</a>' +
          '<a class="btn btn-g" id="tgs" target="_blank" rel="noopener" href="https://t.me/+79883164724">Telegram</a>' +
          '<a class="btn btn-g" id="mxs" target="_blank" rel="noopener" href="https://web.max.ru/17096045" data-max>MAX</a></div>' +
          '<p class="note">Точную цену назову после диагностики. В Telegram и МАКС текст копируется автоматически — вставьте его в чат.</p>';
        var v = cardEl.querySelector('.v');
        if (!it.p) { v.innerHTML = '<small class="mono">цена</small>по осмотру'; v.style.fontSize = 'clamp(1.6rem,3.6vw,2.4rem)'; }
        else {
          v.innerHTML = '<small>работа от</small><span>0</span> ₽';
          var n = v.querySelector('span');
          if (G && !reduce) { cur.v = 0; G.to(cur, { v: it.p, duration: .9, ease: 'expo.out', onUpdate: function () { n.textContent = fmt(cur.v); } }); }
          else n.textContent = fmt(it.p);
        }
        ['tgs', 'mxs'].forEach(function (id) {
          var el = cardEl.querySelector('#' + id);
          if (el) el.addEventListener('click', function () { if (navigator.clipboard) navigator.clipboard.writeText(text).catch(function () {}); });
        });
        // обновляем текст заявки для MAX
        window.RM_REQUEST_TEXT = text;
      }
      if (cats.length > 1) renderTabs();
      renderList(); paint();

      if (tabsEl) tabsEl.addEventListener('click', function (e) {
        var b = e.target.closest('button'); if (!b) return;
        cat = b.getAttribute('data-c'); idx = 0;
        Array.prototype.forEach.call(tabsEl.children, function (x) { x.classList.toggle('on', x === b); });
        renderList(); paint();
      });
      listEl.addEventListener('click', function (e) {
        var b = e.target.closest('button'); if (!b) return;
        var i = Array.prototype.indexOf.call(listEl.querySelectorAll('button'), b);
        if (i < 0) return;
        idx = i; mark(); paint();
      });
    });
  }

  function districts() {
    var list = window.RM_DISTRICTS;
    if (!list || !list.length) return;
    document.querySelectorAll('[data-districts]').forEach(function (root) {
      var listEl = root.querySelector('[data-dlist]'), cardEl = root.querySelector('.cardw');
      var tEl = root.querySelector('[data-dtime]'), nEl = root.querySelector('[data-dname]'),
          dEl = root.querySelector('[data-dnote]'), waEl = root.querySelector('[data-dwa]');
      var idx = 0;
      function render() {
        listEl.innerHTML = '';
        list.forEach(function (d, i) {
          var li = document.createElement('li'), b = document.createElement('button');
          b.type = 'button';
          b.innerHTML = '<span>' + d.name + '</span><span>' + d.time + '</span>';
          b.className = i === 0 ? 'on' : '';
          b.setAttribute('data-id', d.id);
          li.appendChild(b); listEl.appendChild(li);
        });
        mark();
      }
      function mark() { Array.prototype.forEach.call(listEl.querySelectorAll('button'), function (b, i) { b.classList.toggle('on', i === idx); }); }
      function paint() {
        var d = list[idx];
        tEl.innerHTML = '<small>время прибытия</small>' + d.time;
        nEl.textContent = d.name;
        dEl.textContent = d.note;
        waEl.href = 'https://wa.me/79883164724?text=' + encodeURIComponent('Здравствуйте! Нужен ремонт техники. Район: ' + d.name + '.');
        window.RM_REQUEST_TEXT = 'Здравствуйте, Денис! Нужен ремонт техники. Район: ' + d.name + '. Подскажите, когда сможете приехать?';
      }
      function select(id) {
        var i = list.findIndex(function (d) { return d.id === id; });
        if (i < 0) return;
        idx = i; mark(); paint();
      }
      listEl.addEventListener('click', function (e) {
        var b = e.target.closest('button'); if (!b) return;
        var i = Array.prototype.indexOf.call(listEl.querySelectorAll('button'), b);
        if (i < 0) return;
        idx = i; mark(); paint();
      });
      listEl.addEventListener('pointerenter', function (e) {
        var b = e.target.closest('button'); if (!b) return;
        var i = Array.prototype.indexOf.call(listEl.querySelectorAll('button'), b);
        if (i < 0) return;
        idx = i; mark(); paint();
      }, true);
      document.addEventListener('rm3d:pick', function (e) { select(e.detail.id); });
      render(); paint();
    });
  }

  function scenes() {
    if (!window.RM3D) return;
    document.querySelectorAll('[data-scene]').forEach(function (el) {
      window.RM3D.mount(el, el.getAttribute('data-scene'));
    });
  }

  splitHeadings();
  reveals();
  counters();
  bars();
  tiltMag();
  schematic();
  diags();
  districts();
  initMax();
  scenes();

  if (G && ST && !reduce) addEventListener('load', function () { ST.refresh(); });
})();
