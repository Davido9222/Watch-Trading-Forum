// ============================================
// TRANSLATION SERVICE
// MyMemory free API — no key required.
// Free tier: ~1000 words/day. This service:
//   • Retries each chunk up to 3 times with exponential back-off
//   • Pauses 400ms between chunks to avoid rate-limit 429s
//   • Validates that the result actually changed from the source
//     (if MyMemory hits its limit it echoes back the original)
//   • Pauses 1200ms between languages (called from the store loop)
// translateSingleLanguage() is exported so the store can update
// progress after each language completes.
// ============================================

import type { BlogPostTranslation } from '@/types';
import { SUPPORTED_LANGUAGES } from '@/stores/languageStore';

const MYMEMORY_LANG_MAP: Record<string, string> = {
  es: 'es', fr: 'fr', de: 'de', ja: 'ja', zh: 'zh-CN',
  ru: 'ru', nl: 'nl', pt: 'pt', ar: 'ar', hi: 'hi', id: 'id',
  bn: 'bn', ur: 'ur', mr: 'mr',
  pcm: 'en',
};

// ─── helpers ────────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

function splitIntoChunks(text: string, maxLen = 440): string[] {
  if (text.length <= maxLen) return [text];
  const chunks: string[] = [];
  let rest = text.trim();
  while (rest.length > 0) {
    if (rest.length <= maxLen) { chunks.push(rest); break; }
    let cut = rest.lastIndexOf(' ', maxLen);
    if (cut <= 0) cut = maxLen;
    chunks.push(rest.slice(0, cut));
    rest = rest.slice(cut).trimStart();
  }
  return chunks;
}

/**
 * Translate a single chunk string.
 * Retries up to maxRetries times on failure or on rate-limit (status 429/403).
 * Returns null if all attempts fail so the caller can use the original.
 */
async function translateChunk(
  text: string,
  to: string,
  maxRetries = 3,
): Promise<string | null> {
  const langCode = MYMEMORY_LANG_MAP[to] || to;
  if (langCode === 'en') return text;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      // Exponential back-off: 2s, 4s, 8s
      await sleep(2000 * Math.pow(2, attempt - 1));
    }
    try {
      const url =
        `https://api.mymemory.translated.net/get` +
        `?q=${encodeURIComponent(text)}&langpair=en|${langCode}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(12000) });

      if (res.status === 429 || res.status === 403) continue; // rate-limited, retry

      const data = await res.json();

      if (data.responseStatus === 200 && data.responseData?.translatedText) {
        const result: string = data.responseData.translatedText;
        // Sanity-check: if the API echoed back the original (hit quota), treat as failure
        if (result.trim().toLowerCase() === text.trim().toLowerCase()) {
          // For short/proper-noun text this is fine; for longer text it means quota hit
          if (text.length > 20) continue;
        }
        return result;
      }

      // responseStatus 429 from body
      if (data.responseStatus === 429) continue;

    } catch {
      // Network error or timeout — retry
    }
  }
  return null; // all retries failed
}

/**
 * Translate plain text, chunked, with a 400ms gap between chunks.
 * Falls back to original text on total failure.
 */
async function translatePlainText(text: string, to: string): Promise<string> {
  if (!text?.trim() || to === 'en') return text;
  const chunks = splitIntoChunks(text.trim());
  const parts: string[] = [];

  for (let i = 0; i < chunks.length; i++) {
    if (i > 0) await sleep(400); // pace between chunks
    const result = await translateChunk(chunks[i], to);
    parts.push(result ?? chunks[i]); // graceful fallback
  }
  return parts.join(' ');
}

/**
 * Translate HTML while preserving all tags and attributes.
 * Only text nodes are sent to the API — tags never leave the browser.
 */
async function translateHTMLContent(html: string, to: string): Promise<string> {
  if (!html?.trim() || to === 'en') return html;
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<body>${html}</body>`, 'text/html');

    const textNodes: Text[] = [];
    const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT, null);
    let node: Node | null;
    while ((node = walker.nextNode())) {
      const t = node as Text;
      if (t.textContent?.trim()) textNodes.push(t);
    }

    for (let i = 0; i < textNodes.length; i++) {
      if (i > 0) await sleep(400); // pace between nodes
      const t = textNodes[i];
      const original = t.textContent || '';
      const trimmed = original.trim();
      if (trimmed) {
        const translated = await translatePlainText(trimmed, to);
        t.textContent = original.replace(trimmed, translated);
      }
    }

    return doc.body.innerHTML;
  } catch {
    return html;
  }
}

// ─── public API ──────────────────────────────────────────────────────────────

/**
 * Translate a post into ONE language and return the result.
 * The store calls this in a loop (with a 1200ms sleep between calls)
 * so progress can be reported after each language.
 */
export async function translateSingleLanguage(
  langCode: string,
  title: string,
  excerpt: string,
  content: string,
  metaTitle: string,
  metaDescription: string,
  baseSlug: string,
): Promise<BlogPostTranslation> {
  try {
    // Translate short fields first (sequential, paced by their own chunk logic)
    const transTitle = await translatePlainText(title, langCode);
    await sleep(400);
    const transExcerpt = await translatePlainText(excerpt, langCode);
    await sleep(400);
    const transMeta = await translatePlainText(metaTitle, langCode);
    await sleep(400);
    const transMetaDesc = await translatePlainText(metaDescription, langCode);
    await sleep(400);

    // Content last — it's the largest piece
    const transContent = await translateHTMLContent(content, langCode);

    return {
      title: transTitle,
      slug: `${baseSlug}-${langCode}`,
      excerpt: transExcerpt,
      content: transContent,
      metaTitle: transMeta,
      metaDescription: transMetaDesc,
    };
  } catch {
    // Complete fallback: store English content under this language key
    // so the post is still usable even if translation failed entirely
    return {
      title,
      slug: `${baseSlug}-${langCode}`,
      excerpt,
      content,
      metaTitle,
      metaDescription,
    };
  }
}
