// ============================================
// TRANSLATION UTILITY
// Google Translate free endpoint — no API key required.
// Uses Node's built-in https module (works on all Node versions, 8s timeout).
// ============================================

const https = require('https');

const MAX_CHARS = 4800;

// ─── Strip HTML to plain text, preserving paragraph breaks ───────────────────
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

// ─── HTTPS GET with timeout (no external deps) ───────────────────────────────
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
    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error('Request timed out'));
    });
    req.on('error', reject);
  });
}

// ─── Split text into chunks at word boundaries ───────────────────────────────
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

      // Response shape: [[["translated","original",...], ...], ...]
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const translated = data[0]
          .map(seg => (Array.isArray(seg) ? seg[0] : ''))
          .filter(Boolean)
          .join('');
        if (translated.trim()) return translated;
      }

      return chunk; // Unexpected shape
    } catch (err) {
      console.warn(`[translate] Attempt ${attempt} failed:`, err.message);
      if (attempt < 3) await new Promise(r => setTimeout(r, attempt * 600));
    }
  }

  return chunk; // All attempts failed — return original
}

// ─── Translate any-length text ────────────────────────────────────────────────
async function translateText(text, targetLang) {
  if (!text || !text.trim()) return text;
  if (targetLang === 'en') return text;

  const chunks = splitIntoChunks(text);
  if (chunks.length === 0) return text;

  const results = [];
  for (const chunk of chunks) {
    const result = await translateChunk(chunk, targetLang);
    results.push(result);
    if (chunks.length > 1) await new Promise(r => setTimeout(r, 100));
  }
  return results.join(' ');
}

// ─── Translate array of texts — called by /api/translate route ───────────────
async function translateTexts(texts, targetLang) {
  const results = [];
  for (const text of texts) {
    const plain = stripHtml(text);
    const translated = await translateText(plain, targetLang);
    results.push(translated || plain);
  }
  return results;
}

module.exports = { translateTexts, translateText, stripHtml };
