const express = require('express');
const { auth, requireRole } = require('../middleware/auth');
const Blog = require('../models/Blog');

const router = express.Router();

const toClient = (doc) => {
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  const { _id, __v, ...rest } = obj;
  return { ...rest, id: _id.toString() };
};

// ------------------------------------------------
// SEED DATA — used by POST /api/blog/seed
// ------------------------------------------------
const SEED_POSTS = [
  {
    title: 'What Should Your First Watch Be?',
    slug: 'what-should-your-first-watch-be',
    excerpt: 'A comprehensive guide for newcomers to the watch collecting world. Learn which timepieces offer the best value for beginners and how to start your collection on the right foot.',
    content: `<h2>Starting Your Watch Journey</h2><p>Choosing your first watch is an exciting milestone. Whether you're drawn to the craftsmanship of mechanical movements or the precision of quartz, there's a perfect timepiece waiting for you.</p><h3>Consider Your Budget</h3><p>Before diving into the vast world of watches, establish a realistic budget. Entry-level mechanical watches from brands like Seiko, Orient, and Citizen offer exceptional value between $200–$500.</p><h3>Understand Watch Movements</h3><p>There are three main types of watch movements:</p><ul><li><strong>Mechanical:</strong> Powered by a mainspring, no battery needed</li><li><strong>Automatic:</strong> Self-winding mechanical movement</li><li><strong>Quartz:</strong> Battery-powered, highly accurate</li></ul><h3>Style Matters</h3><p>Consider your lifestyle and wardrobe. A versatile dress watch works for formal occasions, while a sports watch handles daily wear and outdoor activities.</p><h2>Our Top Recommendations</h2><p>For beginners, we recommend starting with brands like Seiko 5, Orient Bambino, or the Timex Weekender. These offer excellent build quality and heritage at accessible prices.</p>`,
    authorId: 'owner-1',
    authorName: 'SiteOwner',
    authorAvatar: '/avatar-owner.png',
    featuredImage: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=1200',
    tags: ['Beginner Guide', 'Watch Collecting', 'First Watch', 'Buying Guide'],
    viewCount: 1250,
    metaTitle: 'What Should Your First Watch Be?',
    metaDescription: 'A comprehensive guide for newcomers to the watch collecting world.',
  },
  {
    title: 'Understanding Rolex Reference Numbers',
    slug: 'understanding-rolex-reference-numbers',
    excerpt: 'Decode the mysterious world of Rolex reference numbers. Learn what those digits mean and how to identify different models, generations, and variations.',
    content: `<h2>The Rolex Numbering System</h2><p>Rolex uses a sophisticated reference number system that encodes information about each watch model. Understanding these numbers is essential for any serious collector.</p><h3>5-Digit vs 6-Digit References</h3><p>Older Rolex models use 5-digit references, while modern models use 6 digits. The extra digit typically indicates a new generation with updated features.</p><h3>Decoding the Numbers</h3><p>The first 2–3 digits indicate the model family:</p><ul><li>11xxx – Oyster Perpetual</li><li>12xxx – Datejust</li><li>16xxx – Datejust 36mm</li><li>116xxx – Daytona</li><li>126xxx – Submariner</li></ul><h2>Material Codes</h2><p>The last digit often indicates the material:</p><ul><li>0 – Steel</li><li>1 – Everose gold &amp; steel</li><li>3 – Yellow gold &amp; steel</li><li>4 – White gold &amp; steel</li><li>6 – Platinum</li><li>8 – Yellow gold</li><li>9 – White gold</li></ul>`,
    authorId: 'owner-1',
    authorName: 'SiteOwner',
    authorAvatar: '/avatar-owner.png',
    featuredImage: 'https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?w=1200',
    tags: ['Rolex', 'Reference Numbers', 'Education', 'Luxury Watches'],
    viewCount: 892,
    metaTitle: 'Understanding Rolex Reference Numbers',
    metaDescription: 'Decode the mysterious world of Rolex reference numbers.',
  },
  {
    title: 'Investment Watches: What Holds Value?',
    slug: 'investment-watches-what-holds-value',
    excerpt: "Discover which watches make smart investments and which ones to avoid. Learn about depreciation, appreciation, and the factors that affect a watch's resale value.",
    content: `<h2>Watches as Investments</h2><p>While most watches depreciate like cars, certain models from prestigious brands can actually appreciate over time. Understanding what drives value is crucial for collectors.</p><h3>Brands That Hold Value</h3><ul><li><strong>Rolex:</strong> The gold standard for value retention</li><li><strong>Patek Philippe:</strong> Exceptional long-term appreciation</li><li><strong>Audemars Piguet:</strong> Royal Oak models perform strongly</li><li><strong>Vacheron Constantin:</strong> Undervalued with growth potential</li></ul><h3>Factors Affecting Value</h3><ul><li>Brand heritage and reputation</li><li>Limited production numbers</li><li>Condition and completeness (box, papers)</li><li>Market demand and trends</li><li>Historical significance</li></ul><h2>Buy What You Love</h2><p>While investment potential is important, remember to buy watches you genuinely enjoy. The best investment is one you'll wear and appreciate for years to come.</p>`,
    authorId: 'owner-1',
    authorName: 'SiteOwner',
    authorAvatar: '/avatar-owner.png',
    featuredImage: 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=1200',
    tags: ['Investment', 'Value Retention', 'Buying Guide', 'Market Analysis'],
    viewCount: 2103,
    metaTitle: 'Investment Watches: What Holds Value?',
    metaDescription: "Discover which watches make smart investments and which ones to avoid.",
  },
];

// ------------------------------------------------
// POST /api/blog/seed  — owner only, idempotent
// Seeds the 3 default posts if the collection is
// empty. Safe to call multiple times.
// ------------------------------------------------
router.post('/seed', auth, requireRole('owner'), async (req, res) => {
  try {
    const count = await Blog.countDocuments();
    if (count > 0) {
      return res.json({ message: 'Already seeded', count });
    }
    const inserted = await Blog.insertMany(SEED_POSTS);
    res.status(201).json({
      message: `Seeded ${inserted.length} posts`,
      posts: inserted.map(toClient),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/blog  — public
router.get('/', async (req, res) => {
  try {
    const posts = await Blog.find().sort({ publishedAt: -1 }).lean();
    res.json(posts.map(({ _id, __v, ...p }) => ({ ...p, id: _id.toString() })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/blog/:slug  — public
router.get('/:slug', async (req, res) => {
  try {
    const post = await Blog.findOne({ slug: req.params.slug }).lean();
    if (!post) return res.status(404).json({ message: 'Post not found' });
    const { _id, __v, ...p } = post;
    res.json({ ...p, id: _id.toString() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/blog  — owner only
router.post('/', auth, requireRole('owner'), async (req, res) => {
  try {
    const { id: _ignore, ...body } = req.body;
    const post = await Blog.create(body);
    res.status(201).json(toClient(post));
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'A post with this slug already exists.' });
    }
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/blog/:id  — owner only
router.patch('/:id', auth, requireRole('owner'), async (req, res) => {
  try {
    const { id: _ignore, publishedAt: _pub, __v, ...updates } = req.body;
    const post = await Blog.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.json(toClient(post));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/blog/:id  — owner only
router.delete('/:id', auth, requireRole('owner'), async (req, res) => {
  try {
    await Blog.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/blog/:id/view  — public, fire-and-forget friendly
router.post('/:id/view', async (req, res) => {
  try {
    await Blog.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } });
    res.json({ ok: true });
  } catch {
    res.json({ ok: true });
  }
});

module.exports = router;
