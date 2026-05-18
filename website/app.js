/* ============================================================
   Electron Trading — site interactions
   ============================================================ */
(() => {
  'use strict';

  /* ----- 1. Year stamp ----- */
  const yr = document.getElementById('yr');
  if (yr) yr.textContent = String(new Date().getFullYear());

  /* ----- 1b. Always land on the hero, even if a stale #hash is in the URL ----- */
  if (window.location.hash && performance.navigation?.type !== 1 /* not a reload */) {
    // remove the hash without adding a history entry, then scroll to top
    history.replaceState(null, '', window.location.pathname + window.location.search);
    window.scrollTo(0, 0);
  }

  /* ----- 1c. Safety net: force nav__mobile hidden on desktop ----- */
  const _navMobile = document.getElementById('navMobile');
  function _syncMobileNav() {
    if (!_navMobile) return;
    if (window.innerWidth > 980) _navMobile.hidden = true;
  }
  _syncMobileNav();
  window.addEventListener('resize', _syncMobileNav);

  /* ----- 2. Mobile nav toggle ----- */
  const burger = document.getElementById('navBurger');
  const navMobile = document.getElementById('navMobile');
  if (burger && navMobile) {
    burger.addEventListener('click', () => {
      const open = !navMobile.hidden;
      navMobile.hidden = open;
      burger.setAttribute('aria-expanded', String(!open));
    });
    navMobile.querySelectorAll('a').forEach(a =>
      a.addEventListener('click', () => {
        navMobile.hidden = true;
        burger.setAttribute('aria-expanded', 'false');
      })
    );
  }

  /* ----- 3. Hero ambient chart (subtle candle stream behind atom) ----- */
  const heroCanvas = document.getElementById('heroChart');
  if (heroCanvas && heroCanvas.getContext) {
    const ctx = heroCanvas.getContext('2d');
    let w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    const candles = [];
    let lastPrice = 100;

    function resize() {
      const r = heroCanvas.getBoundingClientRect();
      w = r.width; h = r.height;
      heroCanvas.width = Math.floor(w * dpr);
      heroCanvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    function newCandle() {
      const drift = (Math.random() - 0.46) * 1.4;
      const open = lastPrice;
      const close = Math.max(40, Math.min(180, open + drift + (Math.random() - 0.5) * 1.6));
      const high = Math.max(open, close) + Math.random() * 1.4;
      const low = Math.min(open, close) - Math.random() * 1.4;
      lastPrice = close;
      candles.push({ open, close, high, low });
      if (candles.length > 240) candles.shift();
    }
    for (let i = 0; i < 220; i++) newCandle();

    function draw() {
      ctx.clearRect(0, 0, w, h);
      const cw = 6;
      const gap = 2;
      const totalW = (cw + gap) * candles.length;
      const offsetX = w - totalW;
      const yMin = 30, yMax = 190;
      const scale = (v) => h - ((v - yMin) / (yMax - yMin)) * (h * 0.7) - h * 0.15;

      candles.forEach((c, i) => {
        const x = offsetX + i * (cw + gap);
        const isUp = c.close >= c.open;
        const color = isUp ? 'rgba(212,168,87,0.85)' : 'rgba(160,110,60,0.55)';
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 1;
        // wick
        ctx.beginPath();
        ctx.moveTo(x + cw / 2, scale(c.high));
        ctx.lineTo(x + cw / 2, scale(c.low));
        ctx.stroke();
        // body
        const yO = scale(c.open), yC = scale(c.close);
        const bodyTop = Math.min(yO, yC);
        const bodyH = Math.max(1.4, Math.abs(yC - yO));
        if (isUp) {
          ctx.fillRect(x, bodyTop, cw, bodyH);
        } else {
          ctx.strokeRect(x + 0.5, bodyTop + 0.5, cw - 1, bodyH - 1);
        }
      });
    }
    draw();

    let frame = 0;
    function tick() {
      frame++;
      if (frame % 10 === 0) {
        newCandle();
        draw();
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* ----- 4. Position sizer ----- */
  const acct = document.getElementById('acct');
  const riskPct = document.getElementById('riskPct');
  const entry = document.getElementById('entry');
  const stop = document.getElementById('stop');
  const target = document.getElementById('target');
  const side = document.getElementById('side');
  const kRisk = document.getElementById('kRisk');
  const kSize = document.getElementById('kSize');
  const kCap = document.getElementById('kCap');
  const kAmt = document.getElementById('kAmt');
  const kRR = document.getElementById('kRR');
  const kGain = document.getElementById('kGain');
  const rrHint = document.getElementById('rrHint');

  const fmtINR = (n) => {
    if (!isFinite(n)) return '—';
    return '₹' + Math.round(n).toLocaleString('en-IN');
  };
  const fmtNum = (n, d = 2) => isFinite(n) ? Number(n).toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d }) : '—';

  function recompute() {
    if (!acct) return;
    const A = parseFloat(acct.value) || 0;
    const Rp = (parseFloat(riskPct.value) || 0) / 100;
    const E = parseFloat(entry.value) || 0;
    const S = parseFloat(stop.value) || 0;
    const T = parseFloat(target.value) || 0;
    const isLong = side.value === 'long';

    const riskPerShare = isLong ? (E - S) : (S - E);
    const reward = isLong ? (T - E) : (E - T);
    const riskAmt = A * Rp;
    const qty = riskPerShare > 0 ? Math.floor(riskAmt / riskPerShare) : 0;
    const cap = qty * E;
    const rr = riskPerShare > 0 ? reward / riskPerShare : 0;
    const gain = qty * reward;

    if (kRisk) kRisk.textContent = riskPerShare > 0 ? '₹' + fmtNum(riskPerShare) : '—';
    if (kSize) kSize.textContent = qty > 0 ? qty.toLocaleString('en-IN') + ' sh' : '—';
    if (kCap)  kCap.textContent  = qty > 0 ? fmtINR(cap) : '—';
    if (kAmt)  kAmt.textContent  = riskAmt > 0 ? fmtINR(riskAmt) : '—';
    if (kRR)   kRR.textContent   = rr > 0 ? fmtNum(rr) + ' R' : '—';
    if (kGain) kGain.textContent = gain > 0 ? fmtINR(gain) : '—';

    if (rrHint) {
      if (riskPerShare <= 0) {
        rrHint.innerHTML = '<em>Your stop is on the wrong side of entry for this direction. Fix the geometry before sizing.</em>';
      } else if (rr >= 3) {
        rrHint.innerHTML = '<em>Excellent geometry. 3R+ is where compounding becomes obvious.</em>';
      } else if (rr >= 2) {
        rrHint.innerHTML = '<em>Solid setup. 2R minimum is the bar for a tradeable swing.</em>';
      } else if (rr > 0) {
        rrHint.innerHTML = '<em>Below 2R — your win-rate has to do all the work. Consider waiting for a better entry.</em>';
      } else {
        rrHint.innerHTML = '<em>Target is on the wrong side of entry. Re-check the trade plan.</em>';
      }
    }
  }
  ['input', 'change'].forEach(ev =>
    [acct, riskPct, entry, stop, target, side].forEach(el =>
      el && el.addEventListener(ev, recompute)
    )
  );
  recompute();

  /* ----- 5. Setup spotter (canvas) ----- */
  const setupCanvas = document.getElementById('setupChart');
  const setupTabs = document.querySelectorAll('.setup-tab');
  const setupTrigger = document.getElementById('setupTrigger');
  const setupInval = document.getElementById('setupInval');
  const setupHold = document.getElementById('setupHold');
  const setupWR = document.getElementById('setupWR');

  const setupData = {
    flag: {
      meta: {
        trigger: 'Break of flag high on vol',
        inval: 'Close below flag low',
        hold: '5–18 sessions',
        wr: 'Trend + tight flag'
      },
      build(N) {
        const pts = [];
        let p = 100;
        // strong leg up
        for (let i = 0; i < N * 0.35; i++) { p += 0.9 + Math.random() * 0.6; pts.push(p); }
        // flag — drift down/sideways
        for (let i = 0; i < N * 0.35; i++) { p += (Math.random() - 0.65) * 0.5; pts.push(p); }
        // breakout
        for (let i = 0; i < N * 0.30; i++) { p += 0.8 + Math.random() * 0.7; pts.push(p); }
        return pts;
      },
      annotate(ctx, pts, scale, N) {
        const flagStart = Math.floor(N * 0.35);
        const flagEnd = Math.floor(N * 0.70);
        const high = Math.max(...pts.slice(flagStart, flagEnd));
        const low = Math.min(...pts.slice(flagStart, flagEnd));
        return [
          { type: 'box', x1: flagStart, x2: flagEnd, y1: high, y2: low, label: 'Flag' },
          { type: 'hline', y: high, label: 'Breakout trigger', from: flagStart, to: N - 1 }
        ];
      }
    },
    base: {
      meta: {
        trigger: 'Pivot break, vol > 50d avg',
        inval: 'Loss of pivot − 3%',
        hold: '10–40 sessions',
        wr: 'Volatility contracted'
      },
      build(N) {
        const pts = [];
        let p = 100;
        // selloff
        for (let i = 0; i < N * 0.15; i++) { p -= 0.7 + Math.random() * 0.4; pts.push(p); }
        // tighter and tighter base
        let amp = 5;
        for (let i = 0; i < N * 0.65; i++) {
          amp *= 0.992;
          p += (Math.random() - 0.5) * amp * 0.4;
          pts.push(p);
        }
        // breakout
        for (let i = 0; i < N * 0.20; i++) { p += 0.9 + Math.random() * 0.5; pts.push(p); }
        return pts;
      },
      annotate(ctx, pts, scale, N) {
        const baseStart = Math.floor(N * 0.15);
        const baseEnd = Math.floor(N * 0.80);
        const pivot = Math.max(...pts.slice(baseStart, baseEnd));
        return [
          { type: 'box', x1: baseStart, x2: baseEnd,
            y1: Math.max(...pts.slice(baseStart, baseEnd)),
            y2: Math.min(...pts.slice(baseStart, baseEnd)),
            label: 'VCP base' },
          { type: 'hline', y: pivot, label: 'Pivot', from: baseStart, to: N - 1 }
        ];
      }
    },
    reversal: {
      meta: {
        trigger: 'First higher-low confirmed',
        inval: 'Break of swing low',
        hold: '8–25 sessions',
        wr: 'Confluence at S/R'
      },
      build(N) {
        const pts = [];
        let p = 140;
        // downtrend
        for (let i = 0; i < N * 0.45; i++) { p -= 0.7 + Math.random() * 0.6; pts.push(p); }
        // capitulation low
        const low = p - 4;
        // first rally
        for (let i = 0; i < N * 0.20; i++) { p += 0.9 + Math.random() * 0.5; pts.push(p); }
        // pullback higher low
        for (let i = 0; i < N * 0.15; i++) { p -= 0.5 + Math.random() * 0.4; pts.push(p); }
        // second leg up
        for (let i = 0; i < N * 0.20; i++) { p += 0.7 + Math.random() * 0.6; pts.push(p); }
        return pts;
      },
      annotate(ctx, pts, scale, N) {
        const lowIdx = pts.indexOf(Math.min(...pts));
        const pbStart = Math.floor(N * 0.65);
        const pbEnd = Math.floor(N * 0.80);
        const hlIdx = pbStart + pts.slice(pbStart, pbEnd).indexOf(Math.min(...pts.slice(pbStart, pbEnd)));
        return [
          { type: 'point', x: lowIdx, y: pts[lowIdx], label: 'Capitulation low' },
          { type: 'point', x: hlIdx, y: pts[hlIdx], label: 'Higher low (trigger)' }
        ];
      }
    },
    earnings: {
      meta: {
        trigger: 'Hold gap day-3 close',
        inval: 'Fill of gap',
        hold: '15–60 sessions',
        wr: 'Beat + raise guidance'
      },
      build(N) {
        const pts = [];
        let p = 100;
        // pre-earnings range
        for (let i = 0; i < N * 0.45; i++) { p += (Math.random() - 0.5) * 0.6; pts.push(p); }
        // gap up
        p += 8;
        pts.push(p);
        // drift up
        for (let i = 0; i < N * 0.55 - 1; i++) { p += 0.4 + Math.random() * 0.5 + (Math.random() < 0.2 ? -0.6 : 0); pts.push(p); }
        return pts;
      },
      annotate(ctx, pts, scale, N) {
        const gapIdx = Math.floor(N * 0.45);
        return [
          { type: 'vline', x: gapIdx, label: 'Earnings gap' },
          { type: 'hline', y: pts[gapIdx] - 8, label: 'Pre-gap level', from: 0, to: gapIdx }
        ];
      }
    }
  };

  let activeSetup = 'flag';
  function drawSetup(kind) {
    if (!setupCanvas) return;
    const data = setupData[kind];
    if (!data) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = setupCanvas.getBoundingClientRect();
    const w = rect.width, h = rect.height;
    setupCanvas.width = Math.floor(w * dpr);
    setupCanvas.height = Math.floor(h * dpr);
    const ctx = setupCanvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const N = 90;
    const pts = data.build(N);
    const yMin = Math.min(...pts) - 4;
    const yMax = Math.max(...pts) + 4;
    const pad = { top: 22, right: 18, bottom: 22, left: 18 };
    const innerW = w - pad.left - pad.right;
    const innerH = h - pad.top - pad.bottom;
    const sx = (i) => pad.left + (i / (N - 1)) * innerW;
    const sy = (v) => pad.top + (1 - (v - yMin) / (yMax - yMin)) * innerH;

    // grid
    ctx.strokeStyle = 'rgba(212,168,87,0.06)';
    ctx.lineWidth = 1;
    for (let g = 0; g <= 4; g++) {
      const y = pad.top + (g / 4) * innerH;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(w - pad.right, y);
      ctx.stroke();
    }

    // annotations under price
    const annots = data.annotate(ctx, pts, { sx, sy }, N);
    annots.forEach(a => {
      if (a.type === 'box') {
        ctx.fillStyle = 'rgba(212,168,87,0.08)';
        ctx.strokeStyle = 'rgba(212,168,87,0.45)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        const x1 = sx(a.x1), x2 = sx(a.x2);
        const y1 = sy(a.y1), y2 = sy(a.y2);
        ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
        ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
        ctx.setLineDash([]);
        ctx.fillStyle = '#d4a857';
        ctx.font = '11px JetBrains Mono';
        ctx.fillText(a.label, x1 + 6, y1 - 6);
      } else if (a.type === 'hline') {
        const y = sy(a.y);
        ctx.strokeStyle = 'rgba(212,168,87,0.55)';
        ctx.setLineDash([3, 4]);
        ctx.beginPath();
        ctx.moveTo(sx(a.from), y);
        ctx.lineTo(sx(a.to), y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#d4a857';
        ctx.font = '11px JetBrains Mono';
        ctx.fillText(a.label, sx(a.to) - 110, y - 6);
      } else if (a.type === 'vline') {
        const x = sx(a.x);
        ctx.strokeStyle = 'rgba(212,168,87,0.55)';
        ctx.setLineDash([3, 4]);
        ctx.beginPath();
        ctx.moveTo(x, pad.top);
        ctx.lineTo(x, h - pad.bottom);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#d4a857';
        ctx.font = '11px JetBrains Mono';
        ctx.fillText(a.label, x + 6, pad.top + 12);
      }
    });

    // price line — animated reveal
    const startTime = performance.now();
    const dur = 900;

    function frame(now) {
      const t = Math.min(1, (now - startTime) / dur);
      const upto = Math.floor(N * t);

      // re-clear price area only (we draw on top each frame)
      // simpler: redraw bg + annotations once, then animate line on top
      // For performance, redraw line + points each frame onto same canvas — annotations stay underneath
      ctx.save();
      ctx.beginPath();
      ctx.rect(pad.left, pad.top, innerW, innerH);
      ctx.clip();

      // wipe a thin band over previous line by redrawing transparent area? simpler: keep going forward
      // Use a stroke gradient
      const grad = ctx.createLinearGradient(0, 0, w, 0);
      grad.addColorStop(0, 'rgba(244,226,179,0.0)');
      grad.addColorStop(0.2, 'rgba(244,226,179,0.9)');
      grad.addColorStop(1, '#f4e2b3');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2.2;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      for (let i = 0; i <= upto; i++) {
        const x = sx(i), y = sy(pts[i]);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // head dot
      if (upto > 0 && upto < N) {
        ctx.fillStyle = '#f4e2b3';
        ctx.shadowColor = 'rgba(244,226,179,0.8)';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(sx(upto), sy(pts[upto]), 3.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      ctx.restore();

      // point labels
      annots.forEach(a => {
        if (a.type === 'point' && upto >= a.x) {
          const x = sx(a.x), y = sy(a.y);
          ctx.strokeStyle = '#d4a857';
          ctx.fillStyle = '#0a1226';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(x, y, 4.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#d4a857';
          ctx.font = '11px JetBrains Mono';
          const labelX = a.x > N * 0.6 ? x - ctx.measureText(a.label).width - 10 : x + 10;
          ctx.fillText(a.label, labelX, y - 8);
        }
      });

      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    // meta
    if (setupTrigger) setupTrigger.textContent = data.meta.trigger;
    if (setupInval)   setupInval.textContent   = data.meta.inval;
    if (setupHold)    setupHold.textContent    = data.meta.hold;
    if (setupWR)      setupWR.textContent      = data.meta.wr;
  }

  setupTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      setupTabs.forEach(t => t.classList.remove('is-active'));
      tab.classList.add('is-active');
      activeSetup = tab.dataset.setup;
      drawSetup(activeSetup);
    });
  });

  // Initial draw + redraw on resize
  function initSetup() {
    if (setupCanvas) drawSetup(activeSetup);
  }
  // Wait one frame so canvas has its layout size
  requestAnimationFrame(initSetup);
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => drawSetup(activeSetup), 200);
  });

  /* ----- 6. FAQ accordion ----- */
  document.querySelectorAll('.faq__item').forEach(item => {
    const q = item.querySelector('.faq__q');
    if (!q) return;
    q.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');
      document.querySelectorAll('.faq__item.is-open').forEach(o => o.classList.remove('is-open'));
      if (!isOpen) item.classList.add('is-open');
    });
  });

  /* ----- 7. Apply form ----- */
  const applyForm = document.getElementById('applyForm');
  const applyOk = document.getElementById('applyOk');
  if (applyForm) {
    applyForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('aName').value.trim();
      const email = document.getElementById('aEmail').value.trim();
      const agree = document.getElementById('aAgree').checked;
      if (!name || !email || !agree) {
        applyForm.reportValidity();
        return;
      }
      // Front-end only — no backend wired up yet. Show success state.
      if (applyOk) {
        applyOk.hidden = false;
        applyOk.textContent = `Received, ${name.split(' ')[0]}. We'll reach out within 24 hours over DM.`;
      }
      applyForm.querySelectorAll('input, select, button').forEach(el => el.disabled = true);
    });
  }

  /* ----- 8. Reveal on scroll (light, no library) ----- */
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          en.target.style.opacity = '1';
          en.target.style.transform = 'none';
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12 });

    document.querySelectorAll('.pillar, .deliv, .traj-step, .tier, .testi, .tool-card').forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(18px)';
      el.style.transition = 'opacity .7s ease, transform .7s ease';
      io.observe(el);
    });
  }
})();
