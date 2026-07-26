// ============================================
// TRANSLATION UTILITY
// Google Translate free endpoint — no API key required.
// Uses Node's built-in https module (works on all Node versions, 8s timeout).
// ============================================

const https = require('https');

const MAX_CHARS = 4800;

// ─── Strip HTML tags from a single block's inner content ─────────────────────
function stripHtml(html) {
  if (!html || !html.trim()) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ─── Convert plain text back to <p>-wrapped HTML (fallback only) ─────────────
function textToHtml(text) {
  if (!text || !text.trim()) return '';
  return text
    .split(/\n\n+/)
    .map(para => para.trim())
    .filter(Boolean)
    .map(para => `<p>${para.replace(/\n/g, '<br>')}</p>`)
    .join('\n');
}

// ─── HTTPS GET with timeout ───────────────────────────────────────────────────
function httpsGet(url, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      let raw = '';
      res.on('data', chunk => { raw += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(raw)); }
        catch (e) { reject(new Error(`JSON parse error: ${e.message}`)); }
      });
    });
    req.setTimeout(timeoutMs, () => { req.destroy(new Error('Request timed out')); });
    req.on('error', reject);
  });
}

// ─── Split plain text into chunks ────────────────────────────────────────────
function splitIntoChunks(text) {
  if (!text || text.trim() === '') return [];
  if (text.length <= MAX_CHARS) return [text.trim()];
  const chunks = [];
  const words = text.split(/\s+/);
  let current = '';
  for (const word of words) {
    const attempt = current ? `${current} ${word}` : word;
    if (attempt.length > MAX_CHARS) {
      if (current) chunks.push(current);
      current = word;
    } else {
      current = attempt;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

// ─── Map language codes to Google Translate codes ────────────────────────────
const GOOGLE_LANG_MAP = { 'zh': 'zh-CN', 'pcm': 'en' };
function toGoogleLang(code) { return GOOGLE_LANG_MAP[code] || code; }

// ─── Translate one chunk via Google Translate ─────────────────────────────────
async function translateChunk(chunk, targetLang) {
  if (!chunk || !chunk.trim()) return chunk;
  const gl = toGoogleLang(targetLang);
  if (gl === 'en') return chunk;

  const url =
    'https://translate.googleapis.com/translate_a/single' +
    '?client=gtx&sl=en&tl=' + encodeURIComponent(gl) +
    '&dt=t&q=' + encodeURIComponent(chunk);

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const data = await httpsGet(url);
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const translated = data[0]
          .map(seg => (Array.isArray(seg) ? seg[0] : ''))
          .filter(Boolean)
          .join('');
        if (translated.trim()) return translated;
      }
      return chunk;
    } catch (err) {
      console.warn(`[translate] Attempt ${attempt} failed:`, err.message);
      if (attempt < 3) await new Promise(r => setTimeout(r, attempt * 600));
    }
  }
  return chunk;
}

// ─── Translate plain text (any length) ───────────────────────────────────────
async function translateText(text, targetLang) {
  if (!text || !text.trim()) return text;
  if (targetLang === 'en') return text;
  const chunks = splitIntoChunks(text);
  if (chunks.length === 0) return text;
  const results = [];
  for (const chunk of chunks) {
    results.push(await translateChunk(chunk, targetLang));
    if (chunks.length > 1) await new Promise(r => setTimeout(r, 100));
  }
  return results.join(' ');
}

// ─── Translate HTML content block-by-block ────────────────────────────────────
// Finds every block element (h1–h6, p, li, blockquote), translates ONLY its
// plain-text content, then reassembles clean HTML. This keeps one <p> per
// paragraph (and headings as headings) so spacing matches the English version.
async function translateHtmlContent(html, targetLang) {
  if (!html || !html.trim()) return html;
  if (targetLang === 'en') return html;

  // Match block-level tags (with optional inline attrs we discard in output)
  const blockRe = /<(h[1-6]|p|li|blockquote)(\s[^>]*)?>(\s*)([\s\S]*?)<\/\1>/gi;
  const matches = [...html.matchAll(blockRe)];

  if (matches.length === 0) {
    // No block elements found — plain text fallback
    const plain = stripHtml(html);
    const translated = await translateText(plain, targetLang);
    return textToHtml(translated);
  }

  // Translate each block's text and record replacements
  const replacements = [];

  for (const match of matches) {
    const [fullMatch, tag, , , inner] = match;
    const innerText = stripHtml(inner || '');

    if (!innerText.trim()) {
      // Empty block — keep as-is (blank paragraph spacer etc.)
      replacements.push({ index: match.index, length: fullMatch.length, replacement: `<${tag}></${tag}>` });
      continue;
    }

    const translated = await translateText(innerText, targetLang);
    replacements.push({
      index: match.index,
      length: fullMatch.length,
      // Clean tag — no inline styles, just the translated text
      replacement: `<${tag}>${translated || innerText}</${tag}>`,
    });

    // Small pause between blocks to avoid rate-limiting
    await new Promise(r => setTimeout(r, 120));
  }

  // Rebuild HTML string by applying replacements in reverse order
  // so earlier indexes aren't shifted by later replacements
  let result = html;
  for (let i = replacements.length - 1; i >= 0; i--) {
    const { index, length, replacement } = replacements[i];
    result = result.slice(0, index) + replacement + result.slice(index + length);
  }

  return result;
}

// ─── Translate array of texts (for /api/translate route) ─────────────────────
async function translateTexts(texts, targetLang) {
  const results = [];
  for (const text of texts) {
    const plain = stripHtml(text);
    results.push((await translateText(plain, targetLang)) || plain);
  }
  return results;
}

module.exports = { translateTexts, translateText, stripHtml, textToHtml, translateHtmlContent };
