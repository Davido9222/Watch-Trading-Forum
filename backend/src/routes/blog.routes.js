const express = require('express');
const { auth, requireRole } = require('../middleware/auth');
const Blog = require('../models/Blog');
const { translateText, stripHtml } = require('../utils/translate');

const router = express.Router();

const toClient = (doc) => {
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  const { _id, __v, ...rest } = obj;
  return { ...rest, id: _id.toString() };
};

// Languages to translate into (all supported except English)
const TRANSLATE_LANGS = [
  { code: 'zh', gt: 'zh-CN' },
  { code: 'hi', gt: 'hi' },
  { code: 'es', gt: 'es' },
  { code: 'fr', gt: 'fr' },
  { code: 'ar', gt: 'ar' },
  { code: 'bn', gt: 'bn' },
  { code: 'pt', gt: 'pt' },
  { code: 'ru', gt: 'ru' },
  { code: 'nl', gt: 'nl' },
  { code: 'ur', gt: 'ur' },
  { code: 'id', gt: 'id' },
  { code: 'de', gt: 'de' },
  { code: 'ja', gt: 'ja' },
  { code: 'pcm', gt: 'en' }, // Nigerian Pidgin — fallback to English
  { code: 'mr', gt: 'mr' },
];

// ─── Helper: translate a post object into all languages ──────────────────────
async function translatePostObject(post) {
  const baseSlug = post.slug;
  const metaTitle = post.metaTitle || post.title;
  const metaDescription = post.metaDescription || post.excerpt;
  const plainContent = stripHtml(post.content);
  const translations = {};

  for (const { code, gt } of TRANSLATE_LANGS) {
    try {
      if (gt === 'en') {
        translations[code] = {
          title: post.title,
          slug: `${baseSlug}-${code}`,
          excerpt: post.excerpt,
          content: plainContent,
          metaTitle,
          metaDescription,
        };
        continue;
      }

      const [tTitle, tExcerpt, tContent, tMeta, tDesc] = await Promise.all([
        translateText(post.title, code),
        translateText(post.excerpt, code),
        translateText(plainContent, code),
        translateText(metaTitle, code),
        translateText(metaDescription, code),
      ]);

      translations[code] = {
        title: tTitle || post.title,
        slug: `${baseSlug}-${code}`,
        excerpt: tExcerpt || post.excerpt,
        content: tContent || plainContent,
        metaTitle: tMeta || metaTitle,
        metaDescription: tDesc || metaDescription,
      };

      await new Promise(r => setTimeout(r, 300));
    } catch (err) {
      console.error(`[translate] Failed for lang ${code}:`, err.message);
      translations[code] = {
        title: post.title,
        slug: `${baseSlug}-${code}`,
        excerpt: post.excerpt,
        content: plainContent,
        metaTitle,
        metaDescription,
      };
    }
  }

  return translations;
}

// ── GET /api/blog  — public ───────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const posts = await Blog.find().sort({ publishedAt: -1 }).lean();
    res.json(posts.map(({ _id, __v, ...p }) => ({ ...p, id: _id.toString() })));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── GET /api/blog/:slug  — public ────────────────────────────────────────────
router.get('/:slug', async (req, res) => {
  try {
    const post = await Blog.findOne({ slug: req.params.slug }).lean();
    if (!post) return res.status(404).json({ message: 'Post not found' });
    const { _id, __v, ...p } = post;
    res.json({ ...p, id: _id.toString() });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── POST /api/blog  — owner only ─────────────────────────────────────────────
router.post('/', auth, requireRole('owner'), async (req, res) => {
  try {
    const { id: _ignore, ...body } = req.body;
    const post = await Blog.create(body);
    res.status(201).json(toClient(post));
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'A post with this slug already exists.' });
    res.status(500).json({ message: err.message });
  }
});

// ── PATCH /api/blog/:id  — owner only ────────────────────────────────────────
router.patch('/:id', auth, requireRole('owner'), async (req, res) => {
  try {
    const { id: _ignore, publishedAt: _pub, __v, ...updates } = req.body;
    const post = await Blog.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true, runValidators: true });
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.json(toClient(post));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── DELETE /api/blog/:id  — owner only ───────────────────────────────────────
router.delete('/:id', auth, requireRole('owner'), async (req, res) => {
  try {
    await Blog.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── POST /api/blog/:id/view  — public ────────────────────────────────────────
router.post('/:id/view', async (req, res) => {
  try {
    await Blog.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } });
    res.json({ ok: true });
  } catch { res.json({ ok: true }); }
});

// ── POST /api/blog/:id/translate  — owner only ───────────────────────────────
// Translates a post into all 15 supported languages server-side and saves.
router.post('/:id/translate', auth, requireRole('owner'), async (req, res) => {
  try {
    const post = await Blog.findById(req.params.id).lean();
    if (!post) return res.status(404).json({ message: 'Post not found' });

    console.log(`[translate] Starting translation for post: ${post.slug}`);
    const translations = await translatePostObject(post);

    const updated = await Blog.findByIdAndUpdate(
      req.params.id,
      { $set: { translations } },
      { new: true },
    );
    console.log(`[translate] Done for post: ${post.slug}`);
    res.json(toClient(updated));
  } catch (err) {
    console.error('[translate] Error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
