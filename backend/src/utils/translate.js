// ============================================
// TRANSLATION UTILITY
// Uses the Google Translate free endpoint (translate.googleapis.com).
// No API key required. Same engine as translate.google.com.
// Supports texts of any length via automatic chunking.
// ============================================

const MAX_CHARS = 4800; // Google accepts up to ~5000 chars per request

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

// ─── Split text into chunks at paragraph or word boundaries ──────────────────
function splitIntoChunks(text) {
  if (!text || text.trim() === '') return [];
  if (text.length <= MAX_CHARS) return [text.trim()];

  const chunks = [];
  const paragraphs = text.split(/\n\n+/);
  let current = '';

  for (const para of paragraphs) {
    const attempt = current ? `${current}\n\n${para}` : para;
    if (attempt.length > MAX_CHARS) {
      if (current) {
        chunks.push(current);
        current = para;
      } else {
        // Single paragraph > MAX_CHARS: split at word boundaries
        const words = para.split(/\s+/);
        let wordChunk = '';
        for (const word of words) {
          const next = wordChunk ? `${wordChunk} ${word}` : word;
          if (next.length > MAX_CHARS) {
            if (wordChunk) chunks.push(wordChunk);
            wordChunk = word;
          } else {
            wordChunk = next;
          }
        }
        if (wordChunk) current = wordChunk;
      }
    } else {
      current = attempt;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

// ─── Map language codes to Google Translate codes ────────────────────────────
const GOOGLE_LANG_MAP = {
  'zh-CN': 'zh-CN',
  'zh': 'zh-CN',
  'pcm': 'en',   // Nigerian Pidgin — Google doesn't support it; fall back to English
};

function toGoogleLang(code) {
  return GOOGLE_LANG_MAP[code] || code;
}

// ─── Call Google Translate for one chunk ─────────────────────────────────────
async function translateChunk(chunk, targetLang) {
  if (!chunk || !chunk.trim()) return chunk;

  const gl = toGoogleLang(targetLang);
  if (gl === 'en') return chunk; // No translation needed

  const url =
    `https://translate.googleapis.com/translate_a/single` +
    `?client=gtx&sl=en&tl=${encodeURIComponent(gl)}&dt=t` +
    `&q=${encodeURIComponent(chunk)}`;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; WatchForum/1.0)',
        },
      });

      if (!res.ok) {
        console.warn(`[translate] HTTP ${res.status} on attempt ${attempt}`);
        if (attempt < 3) {
          await new Promise(r => setTimeout(r, attempt * 500));
          continue;
        }
        return chunk;
      }

      const data = await res.json();

      // Google returns: [[["translated", "original", ...], ...], ...]
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const translated = data[0]
          .map(segment => (Array.isArray(segment) ? segment[0] : ''))
          .filter(Boolean)
          .join('');
        if (translated.trim()) return translated;
      }

      return chunk; // Unexpected shape — return original
    } catch (err) {
      console.warn(`[translate] Attempt ${attempt} error:`, err.message);
      if (attempt < 3) await new Promise(r => setTimeout(r, attempt * 500));
    }
  }

  return chunk; // All attempts failed — fall back to original
}

// ─── Translate a full text (any length) to the target language ────────────────
async function translateText(text, targetLang) {
  if (!text || !text.trim()) return text;
  if (targetLang === 'en') return text;

  const chunks = splitIntoChunks(text);
  if (chunks.length === 0) return text;

  const results = [];
  for (const chunk of chunks) {
    const result = await translateChunk(chunk, targetLang);
    results.push(result);
    // Small pause between chunks to stay polite
    if (chunks.length > 1) await new Promise(r => setTimeout(r, 150));
  }

  return results.join('\n\n');
}

// ─── Translate an array of texts (called by the /api/translate route) ─────────
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
