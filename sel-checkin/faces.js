/* SEL 情緒臉譜：12 種情緒的向量插圖與柔和配色（學生頁與兩個看板共用）
   要改配色或描述，只需改這個檔案。 */
(function () {
  const ZONE = {
    red:    { card: '#FFECEC', face: '#FFC9C5', stroke: '#B4423F', text: '#8F2F2C', zh: '紅色・生氣區' },
    blue:   { card: '#EAF1FF', face: '#C5D9FB', stroke: '#3E65B5', text: '#2F4F94', zh: '藍色・沮喪區' },
    yellow: { card: '#FFF6D6', face: '#FFE69A', stroke: '#A67800', text: '#7A5B00', zh: '黃色・焦慮區' },
    green:  { card: '#E8F5EC', face: '#C6EBD2', stroke: '#3C8A5A', text: '#2C6B45', zh: '綠色・平和區' }
  };
  const TEAR = '#8EC5FF', BLUSH = '#FF9AA8', GOLD = '#FFC93C';
  // 共用線條樣式
  const L = s => `stroke="${s}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"`;
  const dot = (x, y, s, r) => `<circle cx="${x}" cy="${y}" r="${r || 3}" fill="${s}"/>`;
  const star = (x, y, k, c) => `<path d="M${x} ${y - 7 * k}L${x + 2 * k} ${y - 2 * k}L${x + 7 * k} ${y}L${x + 2 * k} ${y + 2 * k}L${x} ${y + 7 * k}L${x - 2 * k} ${y + 2 * k}L${x - 7 * k} ${y}L${x - 2 * k} ${y - 2 * k}Z" fill="${c}"/>`;
  const blush = `<circle cx="15" cy="41" r="4.5" fill="${BLUSH}" opacity=".5"/><circle cx="49" cy="41" r="4.5" fill="${BLUSH}" opacity=".5"/>`;

  // 每種情緒：zone（顏色區）、desc（一句話描述）、draw（臉上的五官）
  const F = {
    '生氣': { zone: 'red', desc: '心裡有一團火', draw: s =>
      `<path d="M16 20L27 25M48 20L37 25" ${L(s)}/>${dot(23, 31, s)}${dot(41, 31, s)}<path d="M23 47Q32 39 41 47" ${L(s)}/>` },
    '挫折': { zone: 'red', desc: '事情不如預期', draw: s =>
      `<path d="M18 25L27 30L18 35M46 25L37 30L46 35" ${L(s)}/><path d="M21 46Q26.5 41 32 46T43 46" ${L(s)}/><path d="M44 9q3 -4 6 0M14 9q3 -4 6 0" ${L(s)}/>` },
    '嫉妒': { zone: 'red', desc: '看到別人有，我也想要', draw: s =>
      `<path d="M16 22L27 21M37 24L48 19" ${L(s)}/><ellipse cx="23" cy="31" rx="5.5" ry="4.5" fill="#fff" stroke="${s}" stroke-width="2"/>${dot(26, 31, s, 2.4)}<ellipse cx="41" cy="31" rx="5.5" ry="4.5" fill="#fff" stroke="${s}" stroke-width="2"/>${dot(44, 31, s, 2.4)}<path d="M24 46L40 43.5" ${L(s)}/>` },
    '沮喪': { zone: 'blue', desc: '有一點提不起勁', draw: s =>
      `<path d="M16 26L27 22M48 26L37 22" ${L(s)}/>${dot(23, 32, s)}${dot(41, 32, s)}<path d="M24 47Q32 40 40 47" ${L(s)}/><path d="M47 37Q51 43 47 46Q43 43 47 37Z" fill="${TEAR}"/>` },
    '孤單': { zone: 'blue', desc: '好像沒有人陪我', draw: s =>
      `<circle cx="23" cy="31" r="5" fill="${s}"/><circle cx="41" cy="31" r="5" fill="${s}"/><circle cx="21.5" cy="29.5" r="1.7" fill="#fff"/><circle cx="39.5" cy="29.5" r="1.7" fill="#fff"/><path d="M28 46Q32 43 36 46" ${L(s)}/><path d="M19 39Q16 44 19 46Q22 44 19 39Z" fill="${TEAR}"/>` },
    '失望': { zone: 'blue', desc: '期待的事沒有發生', draw: s =>
      `<path d="M18 25Q23 22 28 25M36 25Q41 22 46 25" ${L(s)}/><path d="M18 32H28M36 32H46" ${L(s)}/><path d="M25 47Q32 41 39 47" ${L(s)}/>` },
    '焦慮': { zone: 'yellow', desc: '有些擔心與不安', draw: s =>
      `<path d="M16 26L27 21M48 26L37 21" ${L(s)}/>${dot(23, 32, s)}${dot(41, 32, s)}<path d="M21 46Q25 42 29 46T37 46T43 46" ${L(s)}/><path d="M50 9Q54.5 16 50 20Q45.5 16 50 9Z" fill="${TEAR}"/>` },
    '害怕': { zone: 'yellow', desc: '心跳好快，想躲起來', draw: s =>
      `<path d="M16 19Q22 14 28 19M36 19Q42 14 48 19" ${L(s)}/><circle cx="23" cy="30" r="5.5" fill="#fff" stroke="${s}" stroke-width="2.4"/>${dot(23, 31, s, 2)}<circle cx="41" cy="30" r="5.5" fill="#fff" stroke="${s}" stroke-width="2.4"/>${dot(41, 31, s, 2)}<ellipse cx="32" cy="47" rx="4.5" ry="5.5" fill="${s}"/>` },
    '壓力大': { zone: 'yellow', desc: '事情好多，喘不過氣', draw: s =>
      `<path d="M19 27L27 35M27 27L19 35M37 27L45 35M45 27L37 35" ${L(s)}/><path d="M21 47L25 43L29 47L33 43L37 47L41 43" ${L(s)}/><path d="M32 3V8M21 5L23.5 9.5M43 5L40.5 9.5" ${L(s)}/>` },
    '平和快樂': { zone: 'green', desc: '心裡暖暖、穩穩的', draw: s =>
      `<path d="M17 32Q22.5 25 28 32M36 32Q41.5 25 47 32" ${L(s)}/><path d="M23 41Q32 50 41 41" ${L(s)}/>${blush}` },
    '開心興奮': { zone: 'green', desc: '好想跳起來、大聲笑', draw: s =>
      `${star(23, 29, 1.1, s)}${star(41, 29, 1.1, s)}<path d="M21 40Q32 56 43 40Z" fill="#fff" stroke="${s}" stroke-width="3" stroke-linejoin="round"/>${blush}` },
    '自信自豪': { zone: 'green', desc: '我做到了，覺得很棒', draw: s =>
      `<path d="M17 24L28 23M36 21L47 24" ${L(s)}/>${dot(23, 31, s)}${dot(41, 31, s)}<circle cx="24" cy="29.8" r="1" fill="#fff"/><circle cx="42" cy="29.8" r="1" fill="#fff"/><path d="M24 42Q34 51 43 39" ${L(s)}/>${blush}${star(52, 12, 0.9, GOLD)}` }
  };

  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // 去掉開頭的表情符號與空白：'😠 生氣' → '生氣'
  const nameOf = str => String(str == null ? '' : str).replace(/^[^一-鿿]+/, '').trim();

  function svg(name, size) {
    const f = F[nameOf(name)];
    if (!f) return '';
    const z = ZONE[f.zone];
    return `<svg class="face" width="${size || 56}" height="${size || 56}" viewBox="0 0 64 64" role="img" aria-label="${esc(nameOf(name))}" style="flex:none"><circle cx="32" cy="32" r="30" fill="${z.face}"/>${f.draw(z.stroke)}</svg>`;
  }
  // 圖＋名稱（給看板、統計用）
  function html(str, size) {
    const n = nameOf(str), f = F[n];
    if (!f) return esc(str);
    return `<span style="display:inline-flex;align-items:center;gap:5px;vertical-align:middle">${svg(n, size || 22)}<span>${esc(n)}</span></span>`;
  }
  window.SELFaces = { ZONE, FACES: F, svg, html, nameOf };
})();
