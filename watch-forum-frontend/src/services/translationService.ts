// ============================================
// TRANSLATION SERVICE
// Real translation via MyMemory API (no API key required).
// translateSingleLanguage() is exported so the store can call
// it one language at a time and report progress between calls.
// HTML content is translated via DOMParser — tags are never
// sent to the API, only the text inside them is.
// ============================================

import type { BlogPostTranslation } from '@/types';
import { SUPPORTED_LANGUAGES } from '@/stores/languageStore';

const MYMEMORY_LANG_MAP: Record<string, string> = {
  es: 'es', fr: 'fr', de: 'de', ja: 'ja', zh: 'zh-CN',
  ru: 'ru', nl: 'nl', pt: 'pt', ar: 'ar', hi: 'hi', id: 'id',
  bn: 'bn', ur: 'ur', mr: 'mr',
  pcm: 'en',
};

async function translateChunk(text: string, to: string): Promise<string> {
  const langCode = MYMEMORY_LANG_MAP[to] || to;
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
  } catch { /* timeout or network error — return original */ }
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
 * Translate HTML while fully preserving structure.
 * Uses DOMParser → walks text nodes only → serialises back.
 * Tags are never sent to the translation API.
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

    for (const t of textNodes) {
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

// ─────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────

/**
 * Translate a post into ONE language and return the result.
 * Call this in a loop from the store so you can update progress
 * between each language without waiting for all 15 at once.
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
    const [transTitle, transExcerpt, transMeta, transMetaDesc] = await Promise.all([
      translatePlainText(title, langCode),
      translatePlainText(excerpt, langCode),
      translatePlainText(metaTitle, langCode),
      translatePlainText(metaDescription, langCode),
    ]);
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
