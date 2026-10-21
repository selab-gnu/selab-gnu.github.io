import { withMemberPhoto } from './member-photo.js';
const escape = value => String(value || '').trim().replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const lines = value => escape(value).replace(/\r?\n/g, '<br>');

// Store the same inert HTML used by the existing Members page and editor.
export function formatMember(fields) {
  const name = escape(fields.name);
  if (!name) throw Error('멤버 이름을 입력해주세요.');
  const email = String(fields.email || '').trim();
  if (email && !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email)) throw Error('올바른 이메일 주소를 입력해주세요.');
  const homepage = String(fields.homepage || '').trim();
  if (homepage) {
    try {
      const url = new URL(homepage);
      if (!['https:', 'http:'].includes(url.protocol) || !url.hostname || url.username || url.password) throw Error();
    } catch {
      throw Error('개인 홈페이지는 http:// 또는 https://로 시작하는 올바른 주소를 입력해주세요.');
    }
  }
  const rows = ['<strong>' + name + (fields.degree?.trim() ? ', ' + escape(fields.degree) : '') + '</strong>'];
  for (const key of ['role', 'department', 'institution', 'room', 'address']) {
    if (fields[key]?.trim()) rows.push(lines(fields[key]));
  }
  if (email) rows.push('Email: <a href="mailto:' + escape(email) + '">' + escape(email) + '</a>');
  if (homepage) rows.push('Homepage: <a href="' + escape(homepage) + '">' + escape(homepage) + '</a>');
  if (fields.phone?.trim()) rows.push('Phone: ' + escape(fields.phone));
  if (fields.topic?.trim()) rows.push('Research Topic: ' + lines(fields.topic));
  const bio = fields.bio?.trim() ? '<p>' + lines(fields.bio) + '</p>' : '';
  return withMemberPhoto('<div><p>' + rows.join('<br>') + '</p>' + bio + '<hr></div>',fields.photo||'',fields.name);
}
