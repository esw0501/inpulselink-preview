// 작은 화면 동작 모음. 프레임워크 없음.
(function () {
  const won = (n) => Number(n || 0).toLocaleString('ko-KR');
  const num = (v) => parseInt(String(v || '').replace(/[^0-9]/g, ''), 10) || 0;

  // 되돌릴 수 없는 동작은 한 번 더 묻기
  document.addEventListener('submit', (e) => {
    const f = e.target.closest('form[data-confirm]');
    if (f && !confirm(f.dataset.confirm)) e.preventDefault();
  }, true);

  // 링크 복사
  document.querySelectorAll('[data-copy]').forEach((b) => b.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(b.dataset.copy); b.textContent = '복사됨'; setTimeout(() => (b.textContent = '링크 복사'), 1500); }
    catch { prompt('주소를 복사하세요', b.dataset.copy); }
  }));

  // 전체 선택
  document.querySelectorAll('[data-check-all]').forEach((all) => all.addEventListener('change', () => {
    document.querySelectorAll(`input[name="${all.dataset.checkAll}"]`).forEach((c) => (c.checked = all.checked));
  }));

  // 충전 금액 빠른 선택
  document.querySelectorAll('[data-amount-presets] input').forEach((r) => r.addEventListener('change', () => {
    const amt = r.closest('form').querySelector('[name=amount]');
    if (amt) amt.value = r.value;
  }));

  // 출금 미리보기: 소득세 3%, 지방세는 소득세의 10%, 각각 10원 미만 버림 (서버 withholding()과 같은 규칙)
  const wh = document.querySelector('[data-withhold]');
  if (wh) {
    const out = document.querySelector('[data-withhold-out]');
    const base = out.textContent;
    const calc = () => {
      const a = num(wh.value);
      const inc = Math.floor(Math.floor(a * 3 / 100) / 10) * 10;
      const loc = Math.floor(Math.floor(inc / 10) / 10) * 10;
      out.textContent = a ? `입금 예정 ${won(a - inc - loc)}원 (소득세 ${won(inc)}원 + 지방소득세 ${won(loc)}원 공제)` : base;
    };
    wh.addEventListener('input', calc); calc();
  }

  // 캠페인 작성: 유형별 칸 보이기 + 비용 계산 (서버 campaign_slot_cost()와 같은 규칙)
  const cf = document.getElementById('cform');
  if (cf) {
    const feePct = num(cf.dataset.feePct), minFee = num(cf.dataset.minFee), balance = num(cf.dataset.balance);
    const val = (n) => cf.querySelector(`[name="${n}"]`);
    const out = (k, t) => { const el = cf.querySelector(`[data-out="${k}"]`); if (el) el.textContent = t; };
    const sync = () => {
      const type = (cf.querySelector('[name=type]:checked') || {}).value;
      cf.querySelectorAll('[data-show]').forEach((el) => { el.style.display = el.dataset.show === type ? '' : 'none'; });
      if (type === 'purchase') val('channel').value = 'shop_review';
      const price = type === 'purchase' ? num(val('product_price').value) : 0;
      const payout = price + num(val('reward_point').value);
      const fee = Math.max(Math.round(payout * feePct / 100), minFee);
      const total = (payout + fee) * num(val('recruit_count').value);
      out('payout', won(payout) + '원'); out('fee', won(fee) + '원'); out('total', won(total) + '원');
      out('short', total > balance ? `예치금이 ${won(total - balance)}원 부족해요. 임시 저장 후 충전하세요.` : '');
    };
    cf.addEventListener('input', sync); cf.addEventListener('change', sync); sync();
  }
})();
