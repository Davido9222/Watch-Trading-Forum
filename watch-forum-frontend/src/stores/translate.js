// ============================================
// TRANSLATION UTILITY
// MyMemory free API — no API key required.
// Set MYMEMORY_EMAIL env var for higher limits (10k words/day vs 1k/day).
//
// MyMemory hard limit: 500 characters per single API request.
// We split any text > 480 chars into word-based chunks, translate
// each chunk individually, then rejoin.
// ============================================

const MYMEMORY_EMAIL = process.env.MYMEMORY_EMAIL || '';
const MAX_CHARS = 480; // Stay safely under MyMemory's 500-char per-request limit

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

// ─── Split any text into chunks of at most MAX_CHARS at word boundaries ───────
function splitIntoChunks(text) {
  if (!text || text.trim() === '') return [];
  if (text.length <= MAX_CHARS) return [text.trim()];

  const chunks = [];
  const words = text.split(/\s+/);
  let current = '';

  for (const word of words) {
    const attempt = current ? `${current} ${word}` : word;
    if (attempt.length > MAX_CHARS) {
      if (current) {
        chunks.push(current);
        current = word;
      } else {
        // Single word longer than MAX_CHARS — force-split by character
        for (let i = 0; i < word.length; i += MAX_CHARS) {
          chunks.push(word.slice(i, i + MAX_CHARS));
        }
        current = '';
      }
    } else {
      current = attempt;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

// ─── Call MyMemory API for one chunk (with simple retry) ─────────────────────
async function translateChunk(chunk, targetLang) {
  if (!chunk || !chunk.trim()) return chunk;

  const emailParam = MYMEMORY_EMAIL ? `&de=${encodeURIComponent(MYMEMORY_EMAIL)}` : '';
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}&langpair=en|${targetLang}${emailParam}`;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await fetch(url);
      const data = await res.json();

      if (
        data.responseStatus === 200 &&
        data.responseData?.translatedText &&
        data.responseData.translatedText.trim() !== ''
      ) {
        return data.responseData.translatedText;
      }

      // MyMemory returns 429 or quota-exceeded messages
      if (data.responseStatus === 429 || (data.responseDetails || '').includes('QUERY')) {
        console.warn(`[translate] Quota hit for "${chunk.slice(0, 30)}…"`);
        return chunk; // Return original on quota error
      }

    } catch (err) {
      console.warn(`[translate] Attempt ${attempt} failed:`, err.message);
    }

    // Small delay before retry
    if (attempt < 2) await new Promise(r => setTimeout(r, 200));
  }

  return chunk; // Fallback to original on all failures
}

// ─── Translate a full text (any length) to the target language ────────────────
async function translateText(text, targetLang) {
  if (!text || !text.trim()) return text;
  if (targetLang === 'en') return text;

  // Split the plain text into paragraphs first, then chunk each paragraph
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim());
  const translatedParagraphs = [];

  for (const paragraph of paragraphs) {
    const chunks = splitIntoChunks(paragraph.trim());
    if (chunks.length === 0) {
      translatedParagraphs.push(paragraph);
      continue;
    }

    const translatedChunks = [];
    for (const chunk of chunks) {
      const result = await translateChunk(chunk, targetLang);
      translatedChunks.push(result);
      // Small pause between chunk calls to avoid rate-limiting
      if (chunks.length > 1) await new Promise(r => setTimeout(r, 100));
    }

    translatedParagraphs.push(translatedChunks.join(' '));
  }

  return translatedParagraphs.join('\n\n');
}

// ─── Translate an array of texts (called by the translate route) ──────────────
// For the blog content (index 2), we strip HTML and translate the full plain text.
// The result is returned as plain text; BlogEditorPage wraps it in <p> tags.
async function translateTexts(texts, targetLang) {
  const results = [];
  for (const text of texts) {
    const plain = stripHtml(text);
    const translated = await translateText(plain, targetLang);
    results.push(translated);
  }
  return results;
}

module.exports = { translateTexts, translateText, stripHtml };
