// 첫 방문 인트로 영상 (홈에서만)
// - 영상은 한 파일(가로/세로 두 벌), 자막은 HTML로 올리고 영상 시간(currentTime)에 맞춰 GSAP 타임라인을 맞춘다
//   → 영상이 버벅이면 자막도 같이 기다림. 장면 시간은 tools/intro/build_intro.py의 SCENES와 같아야 한다
// - 건너뛰기·ESC·끝 화면의 "홈 둘러보기" → 인트로가 위로 걷히며 홈 첫 화면이 드러남
// - 영상이 못 뜨거나(자동재생 막힘 등) 3초 안에 시작을 못 하면 바로 홈으로
// - 한 번 보면 7일 동안 다시 안 나옴. 홈의 "소개 영상 다시 보기"로 언제든 다시 재생
(function () {
  const root = document.documentElement;
  const el = document.querySelector('[data-intro]');
  const heroVideo = document.querySelector('[data-hero-video]');
  const g = window.gsap;
  const KEY = 'il-intro';

  // 장면 경계(초) — build_intro.py: LEAD 0.4 + 각 장면 길이
  const CUT = [0.4, 2.3, 3.6, 5.1, 6.6, 7.9, 9.1];

  let heroStarted = false;
  function startHeroVideo() {
    if (heroStarted || !heroVideo) return;
    heroStarted = true;
    heroVideo.querySelectorAll('source[data-src]').forEach((s) => { s.src = s.dataset.src; });
    heroVideo.load();
    heroVideo.addEventListener('playing', () => heroVideo.classList.add('on'), { once: true });
    const p = heroVideo.play();
    if (p && p.catch) p.catch(() => { /* 자동재생이 막히면 정지 그림(배경)만 보임 */ });
  }

  const signal = (name) => document.dispatchEvent(new CustomEvent(name));
  window.__intro = true;     // head 스크립트의 안전장치(4초 뒤 걷어 내기)를 멈춤

  if (!el || !g || !root.classList.contains('intro-on')) {
    root.classList.remove('intro-on');
    window.ilIntroActive = false;
    startHeroVideo();
    bindReplay();
    return;
  }
  window.ilIntroActive = true;
  open();
  bindReplay();

  function bindReplay() {
    const btn = document.querySelector('[data-intro-replay]');
    if (!btn || !el || !g) { if (btn) btn.hidden = true; return; }
    btn.addEventListener('click', () => {
      window.ilIntroActive = true;
      if (window.__lenis) window.__lenis.scrollTo(0, { immediate: true }); else scrollTo(0, 0);
      root.classList.add('intro-on');
      open();
    });
  }

  function open() {
    const video = el.querySelector('.it-video');
    const $ = (k) => el.querySelector(`[data-k="${k}"]`);
    const caps = (k) => $(k).querySelectorAll('.s');
    const prog = el.querySelector('.it-prog i');
    const timeEl = $('time'), durEl = $('dur');
    let closing = false, ended = false, autoT = 0;

    if (window.__lenis) window.__lenis.stop();
    el.classList.remove('ended');
    g.set(el, { clearProps: 'transform' });
    g.set($('end'), { clipPath: 'inset(100% 0% 0% 0%)' });
    el.querySelector('.it-skip').focus({ preventScroll: true });

    // 장면 바뀔 때 번쩍
    let flash = el.querySelector('.it-flash');
    if (!flash) {
      flash = document.createElement('div');
      flash.className = 'it-flash';
      flash.style.cssText = 'position:absolute;inset:0;background:#fff;opacity:0;pointer-events:none';
      el.querySelector('.it-layer').prepend(flash);
    }

    /* ---------- 자막 타임라인 (영상 시간에 맞춰 직접 넘김) ---------- */
    const tl = g.timeline({ paused: true, defaults: { ease: 'expo.out' } });
    const wipeIn = (k, at) => tl.fromTo(caps(k), { opacity: 1, clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.42, stagger: 0.16 }, at);
    const wipeOut = (k, at) => tl.to(caps(k), { clipPath: 'inset(0% 0% 0% 100%)', duration: 0.22, stagger: 0.04, ease: 'power3.in' }, at);
    const slam = (k, at, rot) => tl.fromTo(caps(k), { opacity: 0, scale: 1.6, rotation: rot * 2 }, { opacity: 1, scale: 1, rotation: rot, duration: 0.45, ease: 'back.out(1.6)' }, at);
    const pop = (k, at, out) => {
      const n = $(k);
      tl.fromTo(n, { opacity: 0, scale: 0.3, y: 20, rotation: g.utils.random(-10, 10) }, { opacity: 1, scale: 1, y: 0, duration: 0.45, ease: 'back.out(2.4)' }, at)
        .to(n, { y: -24, duration: out - at - 0.45, ease: 'none' }, at + 0.45)
        .to(n, { opacity: 0, scale: 0.8, duration: 0.18, ease: 'power2.in' }, out);
    };

    CUT.slice(1).forEach((t) => tl.fromTo(flash, { opacity: 0.32 }, { opacity: 0, duration: 0.22, ease: 'power2.out', immediateRender: false }, t));

    tl.fromTo($('pre'), { opacity: 0, letterSpacing: '0.6em' }, { opacity: 1, letterSpacing: '0.2em', duration: 0.3 }, 0.02)
      .to($('pre'), { opacity: 0, duration: 0.1 }, 0.34);
    // 1. 상자 개봉
    wipeIn('c1', 0.6); wipeOut('c1', 2.08);
    // 2. 링라이트: 뷰파인더 + REC
    tl.fromTo($('frame'), { opacity: 0, scale: 1.3 }, { opacity: 1, scale: 1, duration: 0.5 }, 2.32)
      .fromTo($('rec'), { opacity: 0 }, { opacity: 1, duration: 0.2 }, 2.32)
      .to($('frame'), { opacity: 0, scale: 0.92, duration: 0.2, ease: 'power2.in' }, 3.4);
    slam('c2', 2.55, 0); tl.to(caps('c2'), { opacity: 0, duration: 0.16 }, 3.42);
    // 3. 숏폼 폰 3대 ×2
    slam('c3', 3.72, -3); tl.to(caps('c3'), { opacity: 0, scale: 0.9, duration: 0.16 }, 4.95);
    pop('h1', 4.0, 4.95); pop('h2', 4.3, 4.95);
    slam('c4', 5.22, 2); tl.to(caps('c4'), { opacity: 0, scale: 0.9, duration: 0.16 }, 6.45);
    pop('h3', 5.5, 6.45); pop('h4', 5.8, 6.45);
    // 4. SNS: 해시태그(#광고 표시는 의무라 맨 먼저)
    ['t1', 't2', 't3', 't4'].forEach((k, i) => pop(k, 6.7 + i * 0.14, 7.74));
    // 5. 거리 촬영: 조회수 올라감
    wipeIn('c5', 8.0); wipeOut('c5', 8.95);
    const views = { v: 0 }, vb = $('cnt').querySelector('b');
    tl.fromTo($('cnt'), { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.4 }, 8.05)
      .fromTo(views, { v: 0 }, { v: 1284903, duration: 0.9, ease: 'power2.out', onUpdate: () => { vb.textContent = Math.round(views.v).toLocaleString('ko-KR'); } }, 8.1)
      .to($('cnt'), { opacity: 0, duration: 0.15 }, 8.95);
    // 6. 셀카
    wipeIn('c6', 9.25);
    tl.to($('rec'), { opacity: 0, duration: 0.2 }, 10.1);

    const fmt = (s) => '00:' + String(Math.floor(s)).padStart(2, '0');
    const sync = () => {
      if (ended || closing) return;
      const t = video.currentTime || 0, d = video.duration || 10.4;
      tl.time(Math.min(t, tl.duration()));
      prog.style.transform = `scaleX(${Math.min(1, t / d)})`;
      timeEl.textContent = fmt(t);
    };
    g.ticker.add(sync);

    video.addEventListener('loadedmetadata', () => { durEl.textContent = fmt(Math.round(video.duration)); }, { once: true });
    video.addEventListener('ended', showEnd, { once: true });
    video.currentTime = 0;
    const p = video.play();
    if (p && p.catch) p.catch(() => close(true));
    // 3초 안에 재생이 시작되지 않으면(느린 망·저전력 모드) 기다리게 하지 않음
    const guard = setTimeout(() => { if (video.currentTime < 0.05) close(true); }, 3000);
    video.addEventListener('playing', () => clearTimeout(guard), { once: true });

    /* ---------- 끝 화면 ---------- */
    function showEnd() {
      if (closing) return;
      ended = true;
      tl.progress(1);
      prog.style.transform = 'scaleX(1)';
      el.classList.add('ended');
      const end = $('end');
      g.timeline({ defaults: { ease: 'expo.out' } })
        .to(end, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.75, ease: 'expo.inOut' })
        .fromTo(end.querySelectorAll('h2 .l > span'), { yPercent: 110 }, { yPercent: 0, duration: 0.9, stagger: 0.08 }, 0.35)
        .fromTo(end.querySelectorAll('p, .cta .btn'), { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.7, stagger: 0.06 }, 0.75)
        .add(() => { autoT = setTimeout(() => close(), 3200); });
      // 버튼에 손이 가면 자동으로 넘어가지 않음
      end.querySelector('.cta').addEventListener('pointerenter', () => clearTimeout(autoT), { once: true });
      end.querySelector('.cta').addEventListener('focusin', () => clearTimeout(autoT), { once: true });
    }

    /* ---------- 닫기: 위로 걷히며 홈이 드러남 ---------- */
    function close(fast) {
      if (closing) return;
      closing = true;
      clearTimeout(autoT); clearTimeout(guard);
      g.ticker.remove(sync);
      document.removeEventListener('keydown', onKey);
      el.querySelectorAll('[data-intro-close]').forEach((b) => b.removeEventListener('click', onClose));
      try { localStorage.setItem(KEY, String(Date.now())); } catch (e) { /* 저장이 막혀도 그냥 진행 */ }
      startHeroVideo();
      signal('intro:reveal');
      g.to(el.querySelector('.it-layer'), { opacity: 0, duration: 0.25 });   // 멈춘 자막이 남지 않게
      const done = () => {
        video.pause();
        tl.kill();
        root.classList.remove('intro-on');
        g.set(el, { clearProps: 'transform' });
        // 다시 보기를 위해 처음 상태로(말풍선 위치는 style 속성이라 남겨 둠)
        const props = 'transform,opacity,clipPath,letterSpacing';
        g.set(el.querySelectorAll('[data-k], .s, .it-layer, .it-end h2 .l > span, .it-end p, .it-end .btn'), { clearProps: props });
        if (window.__lenis) window.__lenis.start();
        window.ilIntroActive = false;
        const rb = document.querySelector('[data-intro-replay]');
        if (rb && document.activeElement && el.contains(document.activeElement)) rb.focus({ preventScroll: true });
      };
      if (fast) { done(); return; }
      g.to(el, { yPercent: -100, duration: 1.05, ease: 'expo.inOut', onComplete: done });
    }
    function onClose(e) { e.preventDefault(); close(); }
    function onKey(e) { if (e.key === 'Escape') close(); }
    el.querySelectorAll('[data-intro-close]').forEach((b) => b.addEventListener('click', onClose));
    document.addEventListener('keydown', onKey);
  }
})();
