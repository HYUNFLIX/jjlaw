// 상담 신청 폼 → AWS Lambda(SES) 이메일 전송
(function () {
  'use strict';

  // Lambda Function URL (deploy/deploy.sh 실행 후 출력되는 URL로 교체)
  const ENDPOINT = window.CONTACT_ENDPOINT || '';

  const form  = document.getElementById('contactForm');
  const btn   = form.querySelector('.form-submit');
  const msgEl = document.getElementById('formMessage');

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const name    = form.querySelector('#name').value.trim();
    const phone   = form.querySelector('#phone').value.trim();
    const area    = form.querySelector('#area').value;
    const message = form.querySelector('#message').value.trim();
    const website = form.querySelector('#website').value; // honeypot

    if (!name || !phone || !message) {
      showMsg('이름, 연락처, 문의 내용은 필수 항목입니다.', 'error');
      return;
    }
    if (!ENDPOINT) {
      showMsg('상담 접수 시스템이 준비 중입니다. 전화(010-3269-0158)로 문의해 주세요.', 'error');
      return;
    }

    btn.disabled = true;
    btn.textContent = '전송 중…';

    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, area: area || '미선택', message, website })
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);

      form.reset();
      showMsg('상담 신청이 완료되었습니다. 빠른 시일 내에 연락드리겠습니다.', 'success');
    } catch (err) {
      console.error(err);
      showMsg('전송 중 오류가 발생했습니다. 전화(010-3269-0158)로 문의해 주세요.', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = '상담 신청하기';
    }
  });

  function showMsg(text, type) {
    msgEl.textContent = text;
    msgEl.className = 'form-message ' + type;
    msgEl.style.display = 'block';
    setTimeout(() => { msgEl.style.display = 'none'; }, 8000);
  }
})();
