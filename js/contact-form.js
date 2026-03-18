// 상담 신청 폼 → Firebase Firestore 저장
(function () {
  const form    = document.getElementById('contactForm');
  const btn     = form.querySelector('.form-submit');
  const msgEl   = document.getElementById('formMessage');

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const name    = form.querySelector('#name').value.trim();
    const phone   = form.querySelector('#phone').value.trim();
    const area    = form.querySelector('#area').value;
    const message = form.querySelector('#message').value.trim();

    if (!name || !phone || !message) {
      showMsg('이름, 연락처, 문의 내용은 필수 항목입니다.', 'error');
      return;
    }

    btn.disabled = true;
    btn.textContent = '전송 중…';

    try {
      await db.collection('consultations').add({
        name,
        phone,
        area:      area || '미선택',
        message,
        status:    'pending',
        note:      '',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      form.reset();
      showMsg('상담 신청이 완료되었습니다. 빠른 시일 내에 연락드리겠습니다.', 'success');
    } catch (err) {
      console.error(err);
      showMsg('전송 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = '상담 신청하기';
    }
  });

  function showMsg(text, type) {
    msgEl.textContent = text;
    msgEl.className = 'form-message ' + type;
    msgEl.style.display = 'block';
    setTimeout(() => { msgEl.style.display = 'none'; }, 6000);
  }
})();
