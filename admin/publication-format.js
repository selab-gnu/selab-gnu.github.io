const escape = value => String(value || '').trim().replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// Keep the existing HTML list storage compatible with the public site.
export function formatPaper(fields) {
  const url = key => {
    const value = (fields[key] || '').trim();
    if (!value) return '';
    try {
      const parsed = new URL(value);
      if (!['http:', 'https:'].includes(parsed.protocol) || !parsed.hostname || parsed.username || parsed.password) throw Error();
    } catch {
      throw Error('논문과 PDF 주소는 http:// 또는 https://로 시작하는 올바른 공개 주소를 입력해주세요.');
    }
    return escape(value);
  };
  const paper = url('paper-link'), pdf = url('pdf-link');
  const title = escape(fields['paper-title']) || '논문 제목';
  const parts = [escape(fields.authors) || '저자', '“' + (paper ? '<a href="' + paper + '">' + title + '</a>' : title) + '”', '<em>' + (escape(fields.venue) || '학술지·학회명') + '</em>'];
  if (fields.volume?.trim()) parts.push('Vol. ' + escape(fields.volume));
  if (fields.issue?.trim()) parts.push('No. ' + escape(fields.issue));
  if (fields.year?.trim()) parts.push('(' + escape(fields.year) + ')');
  if (fields.pages?.trim()) parts.push(escape(fields.pages));
  return (fields.award?.trim() ? '<strong>[' + escape(fields.award) + ']</strong> ' : '') + parts.join('. ') + '.' + (pdf ? ' (<a href="' + pdf + '">PDF</a>)' : '');
}
