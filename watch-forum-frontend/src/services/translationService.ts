// ============================================
// TRANSLATION SERVICE
// Real translation via MyMemory API (no API key required).
// Languages are processed ONE AT A TIME to respect rate limits.
// HTML content is translated via DOMParser so tags are never
// sent to the translation API — only the text inside them is.
// ============================================

import type { BlogPostTranslation } from '@/types';
import { SUPPORTED_LANGUAGES } from '@/stores/languageStore';

// MyMemory language codes (BCP-47)
const MYMEMORY_LANG_MAP: Record<string, string> = {
  es: 'es', fr: 'fr', de: 'de', ja: 'ja', zh: 'zh-CN',
  ru: 'ru', nl: 'nl', pt: 'pt', ar: 'ar', hi: 'hi', id: 'id',
  bn: 'bn', ur: 'ur', mr: 'mr',
  pcm: 'en', // Nigerian Pidgin — no MyMemory support, keep English
};

// ─────────────────────────────────────────────────────────────
// INTERNAL HELPERS
// ─────────────────────────────────────────────────────────────

async function translateChunk(text: string, to: string): Promise<string> {
  const langCode = MYMEMORY_LANG_MAP[to] || to;
  // If no mapping (or maps to 'en'), return original
  if (langCode === 'en') return text;
  try {
    const url =
      `https://api.mymemory.translated.net/get` +
      `?q=${encodeURIComponent(text)}&langpair=en|${langCode}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    const data = await res.json();
    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      return data.responseData.translatedText;
    }
  } catch {
    // Network error or timeout — return original
  }
  return text;
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

async function translatePlainText(text: string, to: string): Promise<string> {
  if (!text?.trim() || to === 'en') return text;
  const chunks = splitIntoChunks(text.trim());
  const parts: string[] = [];
  for (const chunk of chunks) {
    parts.push(await translateChunk(chunk, to));
  }
  return parts.join(' ');
}

/**
 * Translate HTML content while fully preserving HTML structure.
 *
 * Strategy: use DOMParser to build a real DOM tree, then walk ONLY
 * the text nodes (NodeFilter.SHOW_TEXT). Each text node's content is
 * translated as plain text — no HTML tags are ever sent to the API.
 * The serialised result (body.innerHTML) is valid HTML with translated text.
 */
async function translateHTMLContent(html: string, to: string): Promise<string> {
  if (!html?.trim() || to === 'en') return html;
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<body>${html}</body>`, 'text/html');

    // Collect every non-empty text node in document order
    const textNodes: Text[] = [];
    const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT, null);
    let node: Node | null;
    while ((node = walker.nextNode())) {
      const t = node as Text;
      if (t.textContent?.trim()) textNodes.push(t);
    }

    // Translate one node at a time (sequential inside one language to keep
    // individual request count low and avoid bursting the rate limit)
    for (const t of textNodes) {
      const original = t.textContent || '';
      const trimmed = original.trim();
      if (!trimmed) continue;
      const translated = await translatePlainText(trimmed, to);
      // Preserve any leading/trailing whitespace the node had
      t.textContent = original.replace(trimmed, translated);
    }

    return doc.body.innerHTML;
  } catch {
    return html; // Fallback: return original HTML unchanged
  }
}

// ─────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────

/**
 * Translate a blog post into every supported language.
 *
 * Languages are processed SEQUENTIALLY so we never send a burst
 * of 15 parallel batches that would exhaust the MyMemory free quota.
 *
 * Within each language the 4 short text fields (title, excerpt,
 * metaTitle, metaDescription) are translated in parallel since they
 * are independent of each other. The HTML content is translated after
 * them (text-node by text-node) to preserve markup.
 *
 * Call this AFTER the post has been saved to the backend.
 * It is intentionally async/background — the caller should NOT await
 * it before navigating; the store will patch the backend when done.
 */
export async function autoTranslateBlogPostAsync(
  title: string,
  excerpt: string,
  content: string,
  metaTitle?: string,
  metaDescription?: string,
  slug?: string,
): Promise<Record<string, BlogPostTranslation>> {
  const langs = SUPPORTED_LANGUAGES.filter(l => l.code !== 'en').map(l => l.code);
  const baseSlug =
    slug ||
    title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const translations: Record<string, BlogPostTranslation> = {};

  for (const langCode of langs) {
    try {
      // Short text fields translated in parallel (fast, few chars each)
      const [transTitle, transExcerpt, transMeta, transMetaDesc] = await Promise.all([
        translatePlainText(title, langCode),
        translatePlainText(excerpt, langCode),
        translatePlainText(metaTitle || title, langCode),
        translatePlainText(metaDescription || excerpt, langCode),
      ]);

      // HTML content translated after (sequential text-node walk)
      const transContent = await translateHTMLContent(content, langCode);

      translations[langCode] = {
        title: transTitle,
        slug: `${baseSlug}-${langCode}`,
        excerpt: transExcerpt,
        content: transContent,
        metaTitle: transMeta,
        metaDescription: transMetaDesc,
      };
    } catch {
      // On any failure keep English as fallback for this language
      translations[langCode] = {
        title,
        slug: `${baseSlug}-${langCode}`,
        excerpt,
        content,
        metaTitle: metaTitle || title,
        metaDescription: metaDescription || excerpt,
      };
    }

    // Brief pause between languages to respect MyMemory rate limits
    await new Promise(r => setTimeout(r, 250));
  }

  return translations;
}
