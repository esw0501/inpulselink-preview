// 공개 사이트 모션 (GSAP 3.14 + Lenis)
// - 히어로: 배경 영상 위로 노란 큰 제목이 줄 단위로 올라오고, 배지가 차례로. 인트로 영상이 있으면 걷힐 때 시작
// - 스크롤: Lenis 부드러운 스크롤, 제목 줄 단위 올라오기(SplitText), 카드 차례 등장(batch), 흐르는 글자 띠(스크롤 속도 반응)
// 움직임 줄이기 설정이면 GSAP 연출 없이 최종 장면만 보여 준다.
(function () {
  const root = document.documentElement;

  /* ---------- 테마 전환 (모션과 무관하게 늘 동작) ---------- */
  document.querySelectorAll('[data-theme-toggle]').forEach((b) => b.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('il-theme', next); } catch (e) { /* 사생활 보호 모드 등: 이번 화면만 적용 */ }
  }));

  /* ---------- 헤더 그림자 ---------- */
  const hd = document.querySelector('.hd');
  const onScroll = () => hd && hd.classList.toggle('condensed', scrollY > 8);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const g = window.gsap;
  if (!g || reduced) {                      // GSAP이 못 뜨거나 움직임 줄이기: 정지 화면
    root.classList.remove('motion');
    return;
  }
  window.__motion = true;
  g.registerPlugin(ScrollTrigger, SplitText);

  /* ---------- 부드러운 스크롤 ---------- */
  if (window.Lenis) {
    const lenis = new Lenis({ anchors: true, lerp: 0.1 });
    lenis.on('scroll', ScrollTrigger.update);
    g.ticker.add((t) => lenis.raf(t * 1000));
    g.ticker.lagSmoothing(0);
    window.__lenis = lenis;
    if (window.ilIntroActive) lenis.stop();   // 인트로가 걷히면 intro.js가 다시 켬
  }

  /* ---------- 진행 막대 ---------- */
  g.to('.scroll-bar', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });

  // 글꼴이 다 와야 줄 나눔을 잴 수 있다(최대 1.2초 기다림)
  const fontsReady = Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise((r) => setTimeout(r, 1200))]);
  fontsReady.then(() => { hero(); reveals(); steps(); });

  /* ================= 히어로 ================= */
  function hero() {
    const sec = document.querySelector('[data-hero]');
    if (!sec) { counters(); return; }
    const vin = sec.querySelector('.vh-in'), badges = sec.querySelector('.vh-badges');
    const tl = g.timeline({ paused: true, defaults: { ease: 'expo.out' } });
    tl.set([vin, badges], { visibility: 'visible' })
      .from('.vh-kicker', { y: 20, opacity: 0, duration: 0.8 }, 0)
      .from('.vh-title .l > span', { yPercent: 115, rotation: 4, transformOrigin: '0% 100%', duration: 1.2, stagger: 0.09 }, 0.05)
      .from('.vh-lead, .vh-cta .btn', { y: 24, opacity: 0, duration: 0.9, stagger: 0.07 }, 0.45)
      .from('.vh-badges .lb', { y: 24, opacity: 0, duration: 0.8, stagger: 0.07 }, 0.6)
      .from('.vh-badges .lb svg', { scale: 0.4, opacity: 0, duration: 0.7, stagger: 0.03, ease: 'back.out(2)' }, 0.7)
      .from('.vh-replay', { opacity: 0, duration: 0.6 }, 0.9)
      .add(counters, 0.6);

    // 인트로가 떠 있으면 걷히기 시작할 때(조금 뒤에) 등장, 아니면 바로
    // ("소개 영상 다시 보기" 뒤에 걷힐 때도 매번 다시)
    document.addEventListener('intro:reveal', () => { tl.pause(0); g.delayedCall(0.45, () => tl.play(0)); });
    if (!window.ilIntroActive) tl.play();

    // 큰 화면: 스크롤하면 영상은 살짝 커지고 문구는 위로 빠짐
    g.matchMedia().add('(min-width: 861px)', () => {
      g.to('.vh-media', { scale: 1.12, yPercent: 8, ease: 'none', scrollTrigger: { trigger: sec, start: 'top top', end: 'bottom top', scrub: true } });
      g.to(vin, { yPercent: -18, opacity: 0.15, ease: 'none', scrollTrigger: { trigger: sec, start: 'top top', end: 'bottom top', scrub: true } });
    });
  }

  /* ================= 스크롤 등장 ================= */
  function reveals() {
    // 제목: 줄 단위로 가림막 아래에서 올라온다
    document.querySelectorAll('.sec-hd h2, .page-hd h1, .detail h1, .pf h1, .auth h1').forEach((h) => {
      SplitText.create(h, {
        type: 'lines', mask: 'lines', autoSplit: true,
        onSplit: (self) => g.from(self.lines, { yPercent: 110, duration: 1.1, ease: 'expo.out', stagger: 0.08, scrollTrigger: { trigger: h, start: 'top 90%', once: true } }),
      });
    });
    // 카드·목록: 화면에 들어오는 묶음끼리 차례로
    const sel = ['.sec-hd p', '.sec-hd .link', '.page-hd p', '.grid > *', '.hscroll > *', '.ticker li', '.fl-row', '.box', '.kv', '.links > a',
      '.pf .act', '.detail .cover', '.detail .badges', '.notice-bar .wrap', '.empty', '.auth .form', '.tabs2'].join(',');
    const items = g.utils.toArray(sel);
    if (!items.length) return;
    g.set(items, { opacity: 0, y: 48 });
    ScrollTrigger.batch(items, {
      start: 'top 92%', once: true,
      onEnter: (batch) => g.to(batch, { opacity: 1, y: 0, duration: 1, ease: 'expo.out', stagger: 0.07, overwrite: true }),
    });
    // 카드 이미지는 스크롤에 따라 안에서 살짝 움직인다
    g.utils.toArray('.detail .cover img, .detail .cover .ph').forEach((im) => {
      g.fromTo(im, { yPercent: -4, scale: 1.08 }, { yPercent: 4, ease: 'none', scrollTrigger: { trigger: im.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
  }

  /* ================= 진행 단계 줄: 화면에 처음 들어올 때 한 번만 차례로 켜짐(반복·흐름 없음) ================= */
  function steps() {
    const box = document.querySelector('.pstep');
    if (!box) return;
    const tl = g.timeline({ paused: true });
    tl.from(box.children, { opacity: 0, y: 10, duration: 0.35, stagger: 0.08, ease: 'power2.out' });   // 왼쪽부터 차례로 한 번
    ScrollTrigger.create({ trigger: box, start: 'top 85%', once: true, onEnter: () => tl.play() });
  }

  /* ================= 숫자 올라가기 ================= */
  function counters() {
    if (counters.done) return;
    counters.done = true;
    g.utils.toArray('[data-count]').forEach((el) => {
      const m = el.textContent.trim().match(/^([\d,.]+)(.*)$/);
      if (!m) return;
      const end = parseFloat(m[1].replace(/,/g, '')), dec = (m[1].split('.')[1] || '').length, suf = m[2], o = { v: 0 };
      g.to(o, { v: end, duration: 1.6, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 95%', once: true },
        onUpdate: () => { el.textContent = o.v.toLocaleString('ko-KR', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suf; } });
    });
  }
})();
