// 상담 신청 → SES 이메일 전송 Lambda (Node.js 20, Function URL)
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';

const ses = new SESv2Client({});
const TO   = process.env.TO_EMAIL;          // 수신: kjjlawyer@gmail.com
const FROM = process.env.FROM_EMAIL;        // 발신 (SES 검증된 주소)
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));

export const handler = async (event) => {
  const origin = event.headers?.origin || '';
  const cors = {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : (ALLOWED_ORIGINS[0] || '*'),
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  const reply = (statusCode, body) => ({ statusCode, headers: { ...cors, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

  if (event.requestContext?.http?.method === 'OPTIONS') return { statusCode: 204, headers: cors };
  if (event.requestContext?.http?.method !== 'POST') return reply(405, { error: 'method not allowed' });

  let data;
  try { data = JSON.parse(event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString() : event.body || '{}'); }
  catch { return reply(400, { error: 'invalid json' }); }

  // honeypot: 봇이 채우면 조용히 성공 응답
  if (data.website) return reply(200, { ok: true });

  const name = String(data.name || '').trim().slice(0, 50);
  const phone = String(data.phone || '').trim().slice(0, 30);
  const area = String(data.area || '미선택').trim().slice(0, 30);
  const message = String(data.message || '').trim().slice(0, 3000);
  if (!name || !phone || !message) return reply(400, { error: 'missing fields' });

  const now = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
  const subject = `[홈페이지 상담신청] ${name} / ${area}`;
  const text = `이름: ${name}\n연락처: ${phone}\n상담분야: ${area}\n접수시각: ${now}\n\n문의내용:\n${message}`;
  const html = `<h2>홈페이지 상담 신청</h2>
<table border="0" cellpadding="6" style="border-collapse:collapse;font-family:sans-serif">
<tr><td><b>이름</b></td><td>${esc(name)}</td></tr>
<tr><td><b>연락처</b></td><td><a href="tel:${esc(phone)}">${esc(phone)}</a></td></tr>
<tr><td><b>상담분야</b></td><td>${esc(area)}</td></tr>
<tr><td><b>접수시각</b></td><td>${esc(now)}</td></tr>
</table>
<h3>문의내용</h3><p style="white-space:pre-wrap;font-family:sans-serif">${esc(message)}</p>`;

  await ses.send(new SendEmailCommand({
    FromEmailAddress: FROM,
    Destination: { ToAddresses: [TO] },
    Content: { Simple: { Subject: { Data: subject, Charset: 'UTF-8' }, Body: { Text: { Data: text, Charset: 'UTF-8' }, Html: { Data: html, Charset: 'UTF-8' } } } },
  }));

  return reply(200, { ok: true });
};
