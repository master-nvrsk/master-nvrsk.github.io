/* =========================================================
   Частный Мастер | Денис — scenes.js
   Процедурные 3D-сцены (Three.js, r128):
   hero · novorossiysk · anapa · gelendzhik · business
   ========================================================= */
window.RM3D = (function () {
  'use strict';

  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  var boost = 0, lastY = window.scrollY;

  addEventListener('scroll', function () {
    var d = Math.abs(window.scrollY - lastY); lastY = window.scrollY;
    boost = Math.min(boost + d * .004, 7);
  }, { passive: true });

  /* ---------- окружение для металлических бликов ---------- */
  function makeEnv(T, ren) {
    var c = document.createElement('canvas'); c.width = 512; c.height = 256;
    var g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, '#3b4654'); gr.addColorStop(.5, '#0B0D10'); gr.addColorStop(1, '#2a1a10');
    g.fillStyle = gr; g.fillRect(0, 0, 512, 256);
    g.fillStyle = '#fff'; g.fillRect(50, 36, 110, 64); g.fillRect(340, 28, 130, 46);
    g.fillStyle = '#FF5A1F'; g.fillRect(230, 140, 70, 60);
    var et = new T.CanvasTexture(c); et.mapping = T.EquirectangularReflectionMapping; et.encoding = T.sRGBEncoding;
    var pm = new T.PMREMGenerator(ren);
    var env = pm.fromEquirectangular(et).texture;
    pm.dispose();
    return env;
  }

  /* ---------- построение сцены ---------- */
  function create(host, name) {
    if (!window.THREE || !host) return null;
    var T = THREE, small = matchMedia('(max-width:900px)').matches, ren;
    try { ren = new T.WebGLRenderer({ antialias: !small, alpha: true, powerPreference: 'high-performance' }); } catch (e) { return null; }
    ren.setPixelRatio(Math.min(devicePixelRatio || 1, small ? 1.25 : 1.75));
    ren.outputEncoding = T.sRGBEncoding;
    ren.toneMapping = T.ACESFilmicToneMapping; ren.toneMappingExposure = 1.15;
    host.insertBefore(ren.domElement, host.firstChild);

    var sc = new T.Scene();
    sc.environment = makeEnv(T, ren);
    var cam = new T.PerspectiveCamera(32, 1, .1, 80);
    cam.position.set(0, 0, 10.5);

    var key = new T.DirectionalLight(0xffffff, 1.35); key.position.set(3, 4, 6); sc.add(key);
    var org = new T.PointLight(0xff5a1f, 2.1, 26); org.position.set(-4, -2, 4); sc.add(org);
    var rim = new T.PointLight(0x9fb4d0, 1.3, 26); rim.position.set(4, 3, -3); sc.add(rim);

    var root = new T.Group(); sc.add(root);

    var M = {
      steel: new T.MeshStandardMaterial({ color: 0x9aa6b6, metalness: 1, roughness: .26 }),
      dark: new T.MeshStandardMaterial({ color: 0x3a424d, metalness: .95, roughness: .38 }),
      copper: new T.MeshStandardMaterial({ color: 0xc2692f, metalness: 1, roughness: .22 }),
      accent: new T.MeshStandardMaterial({ color: 0xff5a1f, metalness: .6, roughness: .35, emissive: 0x551800, emissiveIntensity: 1 }),
      black: new T.MeshStandardMaterial({ color: 0x15181d, metalness: .8, roughness: .5 }),
      glass: new T.MeshStandardMaterial({ color: 0x9fb4d0, metalness: .2, roughness: .1, transparent: true, opacity: .16 }),
      ghost: new T.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
    };

    var ctx = {
      T: T, ren: ren, sc: sc, cam: cam, root: root, mats: M,
      small: small, reduce: reduce, fine: fine,
      pickables: [], selected: null, update: null, pick: null
    };

    /* общие геометрии */
    ctx.gear = function (n, ro, rr, th, hole, spokes, mat) {
      var seg = small ? 8 : 16, s = new T.Shape(), st = Math.PI * 2 / n, i, a;
      function p(r, an, first) { var x = r * Math.cos(an), y = r * Math.sin(an); first ? s.moveTo(x, y) : s.lineTo(x, y); }
      for (i = 0; i < n; i++) {
        a = i * st;
        p(rr, a - .3 * st, i === 0); p(ro, a - .16 * st); p(ro, a + .16 * st); p(rr, a + .3 * st); p(rr, a + .5 * st);
      }
      var h = new T.Path(); h.absarc(0, 0, hole, 0, Math.PI * 2, true); s.holes.push(h);
      for (i = 0; i < spokes; i++) {
        var q = new T.Path(), an = i * Math.PI * 2 / spokes, rc = (hole + rr) * .56;
        q.absarc(rc * Math.cos(an), rc * Math.sin(an), (rr - hole) * .2, 0, Math.PI * 2, true); s.holes.push(q);
      }
      var geo = new T.ExtrudeGeometry(s, { depth: th, bevelEnabled: true, bevelSize: .025, bevelThickness: .025, bevelSegments: 1, curveSegments: seg });
      geo.translate(0, 0, -th / 2);
      return new T.Mesh(geo, mat);
    };
    ctx.ring = function (ro, ri, th, mat) {
      var s = new T.Shape(); s.absarc(0, 0, ro, 0, Math.PI * 2, false);
      var h = new T.Path(); h.absarc(0, 0, ri, 0, Math.PI * 2, true); s.holes.push(h);
      var geo = new T.ExtrudeGeometry(s, { depth: th, bevelEnabled: true, bevelSize: .02, bevelThickness: .02, bevelSegments: 1, curveSegments: small ? 24 : 48 });
      geo.translate(0, 0, -th / 2);
      return new T.Mesh(geo, mat);
    };
    ctx.cyl = function (r, h, mat, seg) { return new T.Mesh(new T.CylinderGeometry(r, r, h, seg || (small ? 20 : 36)), mat); };
    ctx.box = function (w, h, d, mat) { return new T.Mesh(new T.BoxGeometry(w, h, d), mat); };
    ctx.torus = function (R, r, mat, seg) { return new T.Mesh(new T.TorusGeometry(R, r, small ? 8 : 12, seg || (small ? 14 : 24)), mat); };
    ctx.sphere = function (r, mat, seg) { return new T.Mesh(new T.SphereGeometry(r, seg || (small ? 12 : 20), seg || (small ? 12 : 20)), mat); };
    ctx.floor = function (size, div) {
      var gh = new T.GridHelper(size || 34, div || 26, 0x2a323c, 0x161c23);
      gh.position.y = -2.4; root.add(gh); return gh;
    };

    var builder = builders[name];
    if (builder) builder(ctx);

    /* наклон за курсором */
    var tx = 0, ty = 0, cx = 0, cy = 0;
    if (fine) addEventListener('pointermove', function (e) {
      tx = (e.clientX / innerWidth - .5) * 2; ty = (e.clientY / innerHeight - .5) * 2;
    }, { passive: true });

    /* выбор объектов (3D → виджет) */
    if (ctx.pickables.length) {
      var ray = new T.Raycaster(), mv = new T.Vector2();
      function cast(e) {
        var r = host.getBoundingClientRect();
        mv.x = ((e.clientX - r.left) / r.width) * 2 - 1;
        mv.y = -((e.clientY - r.top) / r.height) * 2 + 1;
        ray.setFromCamera(mv, cam);
        var hits = ray.intersectObjects(ctx.pickables, false);
        return hits.length ? hits[0].object : null;
      }
      host.addEventListener('pointermove', function (e) {
        var o = cast(e);
        host.style.cursor = o ? 'pointer' : '';
        if (o && o.userData.id !== ctx.selected && ctx.pick) ctx.pick(o.userData.id, true);
      });
      host.addEventListener('click', function (e) {
        var o = cast(e);
        if (o && o.userData.id) {
          host.dispatchEvent(new CustomEvent('rm3d:pick', { bubbles: true, detail: { id: o.userData.id } }));
          if (ctx.pick) ctx.pick(o.userData.id);
        }
      });
    }

    function size() {
      var w = host.clientWidth, h = host.clientHeight; if (!w || !h) return;
      ren.setSize(w, h, false);
      cam.aspect = w / h;
      cam.position.z = (w / h < .85) ? 12.5 : 10.5;
      cam.updateProjectionMatrix();
    }
    size();
    if (window.ResizeObserver) new ResizeObserver(size).observe(host);

    var last = performance.now(), t0 = last, a = 0, raf, vis = true;
    function frame(now) {
      raf = requestAnimationFrame(frame);
      var dt = Math.min((now - last) / 1000, .05); last = now;
      boost *= Math.pow(.04, dt);
      a += ((reduce ? .1 : .45) + boost) * dt;
      if (!fine) { tx = Math.sin((now - t0) / 2400) * .5; ty = Math.cos((now - t0) / 3100) * .3; }
      cx += (tx - cx) * .06; cy += (ty - cy) * .06;
      root.rotation.y = cx * .38; root.rotation.x = cy * .26;
      if (ctx.update) ctx.update(a, dt, now / 1000);
      ren.render(sc, cam);
    }

    if (reduce) {
      if (ctx.update) ctx.update(.8, .016, 1);
      ren.render(sc, cam);
      addEventListener('resize', function () { size(); ren.render(sc, cam); });
      return ctx;
    }
    raf = requestAnimationFrame(frame);
    new IntersectionObserver(function (es) {
      var v = es[0].isIntersecting;
      if (v && !vis) { last = performance.now(); raf = requestAnimationFrame(frame); }
      if (!v && vis) cancelAnimationFrame(raf);
      vis = v;
    }).observe(host);
    return ctx;
  }

  /* =========================================================
     СЦЕНЫ
  ========================================================= */

  var builders = {};

  /* ---------- HERO: прецизионный привод ---------- */
  builders.hero = function (ctx) {
    var T = ctx.T, root = ctx.root, M = ctx.mats;
    var g1 = ctx.gear(20, 1.32, 1.12, .34, .3, 5, M.steel); g1.position.set(-.75, .75, 0);
    g1.add((function () { var b = ctx.cyl(.46, .6, M.dark); b.rotation.x = Math.PI / 2; return b; })());
    var g2 = ctx.gear(12, .84, .66, .34, .18, 0, M.dark); g2.position.set(1.2, .75, 0);
    var b2 = ctx.cyl(.3, .56, M.accent); b2.rotation.x = Math.PI / 2; g2.add(b2);
    root.add(g1, g2);

    var brg = new T.Group(); brg.position.set(-1.25, -1.55, .2);
    brg.add(ctx.ring(.95, .74, .42, M.steel));
    var inner = new T.Group(); inner.add(ctx.ring(.56, .3, .46, M.dark));
    var balls = new T.Group(), i, bm = ctx.sphere(.15, M.steel);
    for (i = 0; i < 9; i++) { var bl = bm.clone(), ba = i / 9 * Math.PI * 2; bl.position.set(Math.cos(ba) * .65, Math.sin(ba) * .65, 0); balls.add(bl); }
    brg.add(inner, balls); root.add(brg);

    var sta = new T.Group(); sta.position.set(1.15, -1.5, -.15);
    sta.add(ctx.ring(1.18, .78, .5, M.dark));
    var ct = ctx.torus(.2, .075, M.copper);
    for (i = 0; i < 12; i++) {
      var pv = new T.Object3D(), cm = ct.clone(), ca = i / 12 * Math.PI * 2;
      pv.rotation.z = ca; cm.position.set(.98, 0, 0); cm.rotation.x = Math.PI / 2; cm.scale.set(1, 1.5, 1); pv.add(cm); sta.add(pv);
    }
    var rot = ctx.cyl(.34, .8, M.steel); rot.rotation.x = Math.PI / 2; sta.add(rot);
    root.add(sta);
    root.scale.setScalar(.92);

    ctx.update = function (a) {
      g1.rotation.z = a * .6;
      g2.rotation.z = Math.PI / 12 - a * .6 * 20 / 12;
      inner.rotation.z = -a * 1.1; balls.rotation.z = -a * .55;
      rot.rotation.y = a;
    };
  };

  /* ---------- НОВОРОССИЙСК: рельеф бухты + маяки районов ---------- */
  builders.novorossiysk = function (ctx) {
    var T = ctx.T, root = ctx.root, M = ctx.mats;
    ctx.floor(56, 30);

    function h(x, z) {
      var v = Math.sin(x * .22) * Math.cos(z * .26) * 1.1 + Math.sin(x * .07 + 1.3) * 1.3 + Math.cos(z * .11) * .5;
      v -= Math.max(0, x) * .10;
      v += Math.max(0, -x - 6) * .05;
      return v;
    }

    /* море */
    var sea = new T.Mesh(new T.PlaneGeometry(70, 50), new T.MeshStandardMaterial({ color: 0x0d141b, metalness: .3, roughness: .55 }));
    sea.rotation.x = -Math.PI / 2; sea.position.y = -.95; root.add(sea);

    /* рельеф */
    var geo = new T.PlaneGeometry(48, 32, small_segments(ctx, 90, 48), small_segments(ctx, 60, 34));
    var pos = geo.attributes.position, i, x, z;
    for (i = 0; i < pos.count; i++) {
      x = pos.getX(i); z = pos.getY(i);
      pos.setZ(i, h(x, z));
    }
    geo.computeVertexNormals();
    var land = new T.Mesh(geo, new T.MeshStandardMaterial({ color: 0x1a2027, metalness: .45, roughness: .75, flatShading: true }));
    land.rotation.x = -Math.PI / 2; root.add(land);
    var wire = new T.Mesh(geo, new T.MeshBasicMaterial({ wireframe: true, color: 0xff5a1f, transparent: true, opacity: .10 }));
    wire.rotation.x = -Math.PI / 2; wire.position.y = .02; root.add(wire);

    /* маячки районов */
    var spots = [
      { id: 'yuzhny', x: -4, z: 2 }, { id: 'myskhako', x: -9, z: 6 }, { id: 'central', x: -1, z: -2 },
      { id: 'primorsky', x: -6, z: -8 }, { id: 'vostochny', x: 8, z: -4 }, { id: 'gayduk', x: 2, z: -12 },
      { id: 'abrau', x: -14, z: -6 }, { id: 'raevskaya', x: -10, z: -14 }
    ];
    var heads = [], rings = [];
    spots.forEach(function (s, k) {
      var g = new T.Group(), y = h(s.x, -s.z);
      g.position.set(s.x, y, s.z);
      var base = ctx.cyl(.55, .3, M.dark); base.position.y = .15; g.add(base);
      var pole = ctx.cyl(.06, 1.7, M.steel); pole.position.y = 1; g.add(pole);
      var head = ctx.sphere(.32, M.accent); head.position.y = 2; g.add(head);
      var ring = ctx.torus(.95, .05, new T.MeshBasicMaterial({ color: 0xff5a1f, transparent: true, opacity: .6 }));
      ring.rotation.x = -Math.PI / 2; ring.position.y = .12; g.add(ring);
      var hit = new T.Mesh(new T.CylinderGeometry(1.7, 1.7, 5, 10), M.ghost);
      hit.position.y = 1.5; hit.userData.id = s.id; g.add(hit);
      ctx.pickables.push(hit);
      heads.push(head); rings.push(ring);
      root.add(g);
      s._y = y;
    });

    root.scale.setScalar(1.05);

    ctx.pick = function (id, soft) {
      ctx.selected = id;
      spots.forEach(function (s, k) {
        var on = s.id === id;
        heads[k].scale.setScalar(on ? 1.45 : 1);
        rings[k].material.opacity = on ? .95 : .6;
      });
      if (!soft) return;
    };

    ctx.update = function (a, dt, t) {
      spots.forEach(function (s, k) {
        var p = 1 + Math.sin(t * 2 + k) * .22;
        rings[k].scale.setScalar(p);
        heads[k].position.y = 2 + Math.sin(t * 1.6 + k) * .08;
      });
      sea.position.y = -.95 + Math.sin(t * .6) * .05;
    };
  };

  /* ---------- АНАПА: климатический / гостиничный узел ---------- */
  builders.anapa = function (ctx) {
    var T = ctx.T, root = ctx.root, M = ctx.mats;
    ctx.floor(36, 24);

    /* теплообменник */
    var exch = new T.Group(); exch.position.set(.6, .4, 0);
    var shell = ctx.cyl(1.5, 5, M.steel); shell.rotation.z = Math.PI / 2; exch.add(shell);
    var cap1 = ctx.cyl(1.56, .24, M.dark); cap1.rotation.z = Math.PI / 2; cap1.position.x = -2.5; exch.add(cap1);
    var cap2 = cap1.clone(); cap2.position.x = 2.5; exch.add(cap2);
    var leg1 = ctx.box(.5, 1.6, 1.2, M.dark); leg1.position.set(-1.6, -1.9, 0); exch.add(leg1);
    var leg2 = leg1.clone(); leg2.position.x = 1.6; exch.add(leg2);
    root.add(exch);

    /* компрессор с вентилятором */
    var comp = new T.Group(); comp.position.set(-3.6, -1.1, .6);
    var body = ctx.cyl(1.05, 2.1, M.dark); comp.add(body);
    var fan = new T.Group(); fan.position.y = 1.25;
    for (var i = 0; i < 6; i++) {
      var bl = ctx.box(.95, .07, .3, M.steel);
      bl.position.set(Math.cos(i / 6 * Math.PI * 2) * .55, 0, Math.sin(i / 6 * Math.PI * 2) * .55);
      bl.rotation.y = -i / 6 * Math.PI * 2; fan.add(bl);
    }
    var hub = ctx.cyl(.22, .3, M.accent); fan.add(hub);
    comp.add(fan); root.add(comp);

    /* медные трубы */
    var pipe1 = ctx.cyl(.13, 2.6, M.copper); pipe1.rotation.z = Math.PI / 2; pipe1.position.set(-1.6, .4, .6); root.add(pipe1);
    var elbow = ctx.torus(.5, .13, M.copper); elbow.position.set(-3.05, .4, .6); elbow.rotation.y = Math.PI / 2; root.add(elbow);
    var pipe2 = ctx.cyl(.13, 1.6, M.copper); pipe2.position.set(-3.05, -.35, .6); root.add(pipe2);

    /* пульсирующие кольца давления */
    var rings = [];
    for (i = 0; i < 3; i++) {
      var r = ctx.torus(1.7, .04, new T.MeshBasicMaterial({ color: 0xff5a1f, transparent: true, opacity: .5 }));
      r.rotation.y = Math.PI / 2; r.position.copy(exch.position); root.add(r); rings.push(r);
    }

    /* индикаторы */
    var panel = ctx.box(1.1, 1.3, .5, M.black); panel.position.set(3.6, -1.2, 1.1); root.add(panel);
    var lamps = [];
    [0xff5a1f, 0x34d399, 0xff5a1f].forEach(function (c, k) {
      var s = ctx.sphere(.11, new T.MeshBasicMaterial({ color: c }));
      s.position.set(3.3 + k * .3, -.9, 1.4); root.add(s); lamps.push(s);
    });

    /* поток в трубе */
    var beads = [];
    for (i = 0; i < 4; i++) {
      var b = ctx.sphere(.09, new T.MeshBasicMaterial({ color: 0xffb38a })); root.add(b); beads.push(b);
    }

    root.scale.setScalar(.95);

    ctx.update = function (a, dt, t) {
      fan.rotation.y = a * 3.2;
      rings.forEach(function (r, k) {
        var p = ((t * .5 + k / 3) % 1);
        r.scale.setScalar(1 + p * .8);
        r.material.opacity = .55 * (1 - p);
      });
      lamps.forEach(function (l, k) { l.scale.setScalar(1 + Math.sin(t * 3 + k * 2) * .25); });
      beads.forEach(function (b, k) {
        var p = ((t * .35 + k / 4) % 1);
        b.position.set(-3.05 + p * 2.2, .4, .6);
      });
    };
  };

  /* ---------- ГЕЛЕНДЖИК: пароконвектомат / кухонный модуль ---------- */
  builders.gelendzhik = function (ctx) {
    var T = ctx.T, root = ctx.root, M = ctx.mats;
    ctx.floor(36, 24);

    var cab = new T.Group(); cab.position.y = -.2;
    var body = ctx.box(3.6, 4.4, 2.8, M.dark); cab.add(body);
    var frame = ctx.box(2.7, 3.3, .16, M.steel); frame.position.set(0, .1, 1.42); cab.add(frame);
    var glass = new T.Mesh(new T.PlaneGeometry(2.3, 2.9), M.glass); glass.position.set(0, .1, 1.51); cab.add(glass);
    var handle = ctx.cyl(.06, 2.6, M.steel); handle.position.set(1.05, .1, 1.62); cab.add(handle);
    var panel = ctx.box(2.7, .5, .12, M.black); panel.position.set(0, 1.85, 1.42); cab.add(panel);
    var dots = [];
    for (var i = 0; i < 4; i++) {
      var d = ctx.sphere(.07, new T.MeshBasicMaterial({ color: i === 1 ? 0x34d399 : 0xff5a1f }));
      d.position.set(-.9 + i * .6, 1.85, 1.5); cab.add(d); dots.push(d);
    }
    /* нагревательный контур */
    var coils = [];
    for (i = 0; i < 3; i++) {
      var coil = ctx.torus(.72, .09, M.copper.clone());
      coil.position.set(0, -.9 + i * .9, .2); cab.add(coil); coils.push(coil);
    }
    /* турбина */
    var turbine = new T.Group(); turbine.position.set(0, .2, -1.1);
    var tg = ctx.cyl(.85, .3, M.steel); tg.rotation.x = Math.PI / 2; turbine.add(tg);
    var blades = new T.Group();
    for (i = 0; i < 6; i++) {
      var bl = ctx.box(.7, .16, .05, M.dark);
      bl.position.set(Math.cos(i / 6 * Math.PI * 2) * .42, Math.sin(i / 6 * Math.PI * 2) * .42, .2);
      bl.rotation.z = i / 6 * Math.PI * 2; blades.add(bl);
    }
    turbine.add(blades); cab.add(turbine);
    root.add(cab);

    /* пар */
    var steam = [];
    for (i = 0; i < 6; i++) {
      var s = ctx.sphere(.16, new T.MeshBasicMaterial({ color: 0x9fb4d0, transparent: true, opacity: .35 }));
      s.position.set((i % 3 - 1) * .5, 2.2 + i * .3, 1.2); root.add(s); steam.push(s);
    }

    root.scale.setScalar(.95);

    ctx.update = function (a, dt, t) {
      blades.rotation.z = a * 4;
      coils.forEach(function (c, k) {
        c.material.emissive = c.material.emissive || new T.Color(0);
        c.material.emissive.setHex(0x551800);
        c.material.emissiveIntensity = .5 + Math.sin(t * 3 + k * 1.4) * .45;
      });
      dots.forEach(function (d, k) { d.scale.setScalar(1 + Math.sin(t * 2.4 + k * 1.7) * .3); });
      steam.forEach(function (s, k) {
        var p = ((t * .3 + k / 6) % 1);
        s.position.y = 2.2 + p * 2.2;
        s.material.opacity = .35 * (1 - p);
        s.scale.setScalar(1 + p * 1.6);
      });
    };
  };

  /* ---------- БИЗНЕС: ротор электродвигателя + подшипники ---------- */
  builders.business = function (ctx) {
    var T = ctx.T, root = ctx.root, M = ctx.mats;
    ctx.floor(36, 24);

    var motor = new T.Group(); root.add(motor);

    /* статор с медной обмоткой */
    motor.add(ctx.ring(1.7, 1.15, 2.2, M.dark));
    var ct = ctx.torus(.2, .075, M.copper);
    var i;
    for (i = 0; i < 12; i++) {
      var pv = new T.Object3D(), cm = ct.clone(), ca = i / 12 * Math.PI * 2;
      pv.rotation.z = ca; cm.position.set(1.42, 0, 0); cm.rotation.x = Math.PI / 2; cm.scale.set(1, 1.5, 1); pv.add(cm); motor.add(pv);
    }

    /* ротор */
    var rotor = new T.Group(); motor.add(rotor);
    var core = ctx.cyl(.95, 2.0, M.steel); core.rotation.x = Math.PI / 2; rotor.add(core);
    for (i = 0; i < 12; i++) {
      var bar = ctx.box(.12, .12, 2.1, M.copper);
      bar.position.set(Math.cos(i / 12 * Math.PI * 2) * .82, Math.sin(i / 12 * Math.PI * 2) * .82, 0);
      rotor.add(bar);
    }
    var shaft = ctx.cyl(.22, 4.6, M.steel); shaft.rotation.x = Math.PI / 2; rotor.add(shaft);

    /* подшипниковые узлы */
    var balls = [];
    [-1.7, 1.7].forEach(function (z) {
      var brg = new T.Group(); brg.position.z = z;
      brg.add(ctx.ring(.78, .46, .5, M.steel));
      var inner = ctx.ring(.4, .24, .54, M.dark); brg.add(inner);
      for (var k = 0; k < 8; k++) {
        var bl = ctx.sphere(.12, M.steel), ba = k / 8 * Math.PI * 2;
        bl.position.set(Math.cos(ba) * .62, Math.sin(ba) * .62, 0); brg.add(bl); balls.push(bl);
      }
      motor.add(brg);
    });

    /* клеммная коробка */
    var term = ctx.box(1.1, .8, 1.2, M.black); term.position.set(0, 1.9, 0); motor.add(term);
    var lamp = ctx.sphere(.1, new T.MeshBasicMaterial({ color: 0x34d399 })); lamp.position.set(.3, 2.35, 0); motor.add(lamp);

    motor.rotation.y = .35;
    root.scale.setScalar(.95);

    ctx.update = function (a, dt, t) {
      rotor.rotation.z = a * 1.15;
      balls.forEach(function (b, k) { b.position.x = Math.cos(t * 1.4 + k) * .62; b.position.y = Math.sin(t * 1.4 + k) * .62; });
      lamp.scale.setScalar(1 + Math.sin(t * 2.5) * .25);
    };
  };

  function small_segments(ctx, d, s) { return ctx.small ? s : d; }

  function mount(host, name) { return create(host, name); }
  return { mount: mount };
})();
