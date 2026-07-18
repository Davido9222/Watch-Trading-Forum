import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useBlogStore } from '@/stores/blogStore';
import { useAuthStore } from '@/stores/authStore';
import { SUPPORTED_LANGUAGES } from '@/stores/languageStore';
import { getTranslationUrls } from '@/services/translationService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  X, Plus, Save, Eye, ArrowLeft, Globe,
  ExternalLink, Copy, Check, Trash2, Loader2
} from 'lucide-react';

// Google Translate language code overrides
const GT_LANG: Record<string, string> = {
  zh: 'zh-CN',
  pcm: 'en', // Nigerian Pidgin not supported — store English
};
function gtLang(code: string) { return GT_LANG[code] || code; }

const generateSlug = (t: string) =>
  t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// ─── Strip HTML to plain text ─────────────────────────────────────────────────
function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n').trim();
}

// ─── Translate a single string via Google Translate (browser fetch) ───────────
async function googleTranslate(text: string, targetCode: string): Promise<string> {
  const tl = gtLang(targetCode);
  if (tl === 'en' || !text.trim()) return text;

  // Split into ≤4800-char chunks at word boundaries
  const chunks: string[] = [];
  if (text.length <= 4800) {
    chunks.push(text);
  } else {
    const words = text.split(/\s+/);
    let cur = '';
    for (const w of words) {
      const next = cur ? `${cur} ${w}` : w;
      if (next.length > 4800) { chunks.push(cur); cur = w; }
      else cur = next;
    }
    if (cur) chunks.push(cur);
  }

  const parts: string[] = [];
  for (const chunk of chunks) {
    try {
      const url =
        'https://translate.googleapis.com/translate_a/single' +
        '?client=gtx&sl=en&tl=' + encodeURIComponent(tl) +
        '&dt=t&q=' + encodeURIComponent(chunk);
      const res = await fetch(url);
      const data = await res.json();
      // Response: [[["translated","original",...], ...], ...]
      const translated = (data[0] as [string, ...unknown[]][])
        .map(seg => seg[0] || '')
        .filter(Boolean)
        .join('');
      parts.push(translated || chunk);
    } catch {
      parts.push(chunk); // fallback to original on error
    }
    if (chunks.length > 1) await new Promise(r => setTimeout(r, 80));
  }
  return parts.join(' ');
}

type Translations = Record<string, {
  title: string; slug: string; excerpt: string;
  content: string; metaTitle: string; metaDescription: string;
}>;

export const BlogEditorPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const { currentUser, isOwner, isInitializing } = useAuthStore();
  const store = useBlogStore();

  const isEditing = !!slug;
  const existingPost = slug ? store.getOriginalPostByAnySlug(slug) : undefined;

  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState('');
  const [submitError, setSubmitError] = useState('');

  // Wait for auth to initialise before owner check
  useEffect(() => {
    if (!isInitializing && !isOwner()) navigate('/blog');
  }, [isInitializing, isOwner, navigate]);

  // Populate form when editing
  useEffect(() => {
    if (existingPost) {
      setTitle(existingPost.title);
      setExcerpt(existingPost.excerpt);
      setContent(existingPost.content);
      setFeaturedImage(existingPost.featuredImage || '');
      setTags(existingPost.tags);
      setMetaTitle(existingPost.metaTitle || '');
      setMetaDescription(existingPost.metaDescription || '');
    }
  }, [existingPost]);

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags(p => [...p, newTag.trim()]);
      setNewTag('');
    }
  };

  // ─── Build all translations directly in the browser ───────────────────────
  const buildTranslations = async (
    baseSlug: string,
    t: string, ex: string, body: string, mt: string, md: string
  ): Promise<Translations> => {
    const plain = stripHtml(body);
    const translations: Translations = {};
    const langs = SUPPORTED_LANGUAGES.filter(l => l.code !== 'en');

    for (const lang of langs) {
      setProgress(`Translating to ${lang.name} ${lang.flag}…`);
      try {
        const [tTitle, tExcerpt, tContent, tMeta, tDesc] = await Promise.all([
          googleTranslate(t, lang.code),
          googleTranslate(ex, lang.code),
          googleTranslate(plain, lang.code),
          googleTranslate(mt || t, lang.code),
          googleTranslate(md || ex, lang.code),
        ]);
        translations[lang.code] = {
          title: tTitle || t,
          slug: `${baseSlug}-${lang.code}`,
          excerpt: tExcerpt || ex,
          content: tContent || plain,
          metaTitle: tMeta || mt || t,
          metaDescription: tDesc || md || ex,
        };
      } catch {
        // Keep English as fallback so the flag still appears
        translations[lang.code] = {
          title: t, slug: `${baseSlug}-${lang.code}`,
          excerpt: ex, content: plain,
          metaTitle: mt || t, metaDescription: md || ex,
        };
      }
    }
    setProgress('');
    return translations;
  };

  // ─── Publish / Update ─────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setSubmitError('');
    if (!title.trim() || !excerpt.trim() || !content.trim()) return;
    if (!currentUser) return;
    setIsSubmitting(true);
    try {
      const postSlug = generateSlug(title);
      const postData = {
        title: title.trim(), excerpt: excerpt.trim(), content: content.trim(),
        featuredImage: featuredImage.trim() || undefined,
        tags,
        authorId: currentUser.id,
        authorName: currentUser.username,
        authorAvatar: currentUser.avatar,
        slug: postSlug,
        metaTitle: metaTitle.trim() || title.trim(),
        metaDescription: metaDescription.trim() || excerpt.trim(),
      };

      let savedId: string;
      if (isEditing && existingPost) {
        store.updatePost(existingPost.id, postData, false);
        savedId = existingPost.id;
      } else {
        const newPost = store.createPost(postData, false);
        savedId = newPost.id;
      }

      const translations = await buildTranslations(
        postSlug,
        postData.title, postData.excerpt, postData.content,
        postData.metaTitle, postData.metaDescription
      );

      if (typeof store.setPostTranslations === 'function') {
        store.setPostTranslations(savedId, translations);
      } else {
        store.updatePost(savedId, { translations } as Parameters<typeof store.updatePost>[1], false);
      }

      navigate(`/blog/${postSlug}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong.';
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (existingPost && window.confirm('Delete this post and all translations? This cannot be undone.')) {
      store.deletePostWithTranslations(existingPost.id);
      navigate('/blog');
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(`${window.location.origin}${url}`);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const handlePreview = () => {
    const w = window.open('', '_blank');
    if (w) {
      w.document.write(`<!DOCTYPE html><html><head><title>${title}</title>
        <style>body{font-family:system-ui,sans-serif;max-width:800px;margin:0 auto;padding:40px 20px;line-height:1.7}
        h1{font-size:2.2em}.excerpt{color:#555;font-style:italic;padding:16px;background:#f5f5f5;border-left:4px solid #2563eb;margin:20px 0}</style>
        </head><body><h1>${title}</h1><div class="excerpt">${excerpt}</div>
        ${featuredImage ? `<img src="${featuredImage}" style="max-width:100%;margin:20px 0">` : ''}
        <div>${content}</div></body></html>`);
    }
  };

  if (isInitializing) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;
  }
  if (!isOwner()) return null;

  const translationUrls = existingPost
    ? getTranslationUrls(existingPost.slug, existingPost.translations || {})
    : [];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <Button variant="ghost" onClick={() => navigate('/blog')}>
            <ArrowLeft className="h-4 w-4 mr-2" />Back to Blog
          </Button>
          <div className="flex items-center gap-2 flex-wrap">
            {isEditing && (
              <Button variant="destructive" size="sm" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-2" />Delete
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handlePreview}>
              <Eye className="h-4 w-4 mr-2" />Preview
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !title.trim() || !excerpt.trim() || !content.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{progress || 'Publishing…'}</>
              ) : (
                <><Save className="h-4 w-4 mr-2" />{isEditing ? 'Update' : 'Publish'}</>
              )}
            </Button>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-6">{isEditing ? 'Edit Article' : 'New Article'}</h1>

        {submitError && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm">{submitError}</div>
        )}
        {isSubmitting && progress && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-center gap-3">
            <Loader2 className="h-4 w-4 text-blue-600 animate-spin flex-shrink-0" />
            <p className="text-sm text-blue-700">{progress}</p>
          </div>
        )}

        {/* Existing translation URLs */}
        {isEditing && translationUrls.length > 1 && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800 text-base">
                <Globe className="h-5 w-5" />Translation URLs ({translationUrls.length - 1} languages)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {translationUrls.map(({ lang, flag, name, url }) => (
                  <div key={lang} className="flex items-center gap-3 p-2 bg-white rounded-lg">
                    <span className="text-xl">{flag}</span>
                    <span className="text-sm font-medium w-24 shrink-0">{name}</span>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded flex-1 truncate">{url}</code>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="sm" onClick={() => handleCopyUrl(url)}>
                        {copiedUrl === url ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                      <Link to={url} target="_blank"><Button variant="ghost" size="sm"><ExternalLink className="h-4 w-4" /></Button></Link>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Article Title</CardTitle></CardHeader>
            <CardContent>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Enter a compelling title…" className="text-lg" />
              <p className="text-sm text-gray-500 mt-2">URL: /blog/{generateSlug(title) || 'your-article-slug'}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Excerpt</CardTitle></CardHeader>
            <CardContent>
              <Textarea value={excerpt} onChange={e => setExcerpt(e.target.value)} placeholder="Short summary shown in previews…" rows={3} />
              <p className="text-sm text-gray-500 mt-2">{excerpt.length} characters</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Featured Image</CardTitle></CardHeader>
            <CardContent>
              <Input value={featuredImage} onChange={e => setFeaturedImage(e.target.value)} placeholder="https://example.com/image.jpg" />
              {featuredImage && (
                <img src={featuredImage} alt="Preview" className="mt-4 max-h-48 rounded-lg object-cover"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Article Content</CardTitle></CardHeader>
            <CardContent>
              <Textarea value={content} onChange={e => setContent(e.target.value)}
                placeholder="Write your full article here. HTML is supported." rows={20} className="font-mono text-sm" />
              <p className="text-sm text-gray-500 mt-2">HTML supported: &lt;h2&gt;, &lt;p&gt;, &lt;strong&gt;, &lt;em&gt;, &lt;a&gt;, &lt;ul&gt;, &lt;li&gt;</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Tags</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                {tags.map(tag => (
                  <Badge key={tag} className="bg-blue-100 text-blue-700">
                    {tag}
                    <button onClick={() => setTags(p => p.filter(t => t !== tag))} className="ml-2 hover:text-blue-900">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input value={newTag} onChange={e => setNewTag(e.target.value)} placeholder="Add a tag…"
                  onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addTag())} />
                <Button type="button" onClick={addTag} variant="outline"><Plus className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>SEO Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Meta Title (optional)</Label>
                <Input value={metaTitle} onChange={e => setMetaTitle(e.target.value)} placeholder={title || 'Custom title for search engines'} />
                <p className="text-sm text-gray-500 mt-1">Defaults to article title if blank</p>
              </div>
              <div>
                <Label>Meta Description (optional)</Label>
                <Textarea value={metaDescription} onChange={e => setMetaDescription(e.target.value)}
                  placeholder={excerpt || 'Custom description for search engines'} rows={2} />
                <p className="text-sm text-gray-500 mt-1">Defaults to excerpt if blank</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800 text-base">
                <Globe className="h-5 w-5" />Auto-translates into {SUPPORTED_LANGUAGES.length - 1} languages on publish
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-blue-700 mb-3">
                Translation runs directly in your browser using Google Translate — no server limits, accurate results.
              </p>
              <div className="flex flex-wrap gap-2">
                {SUPPORTED_LANGUAGES.filter(l => l.code !== 'en').map(lang => (
                  <Badge key={lang.code} variant="outline" className="bg-white text-xs">{lang.flag} {lang.name}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BlogEditorPage;
