const express = require('express');
const { translateTexts } = require('../utils/translate');
const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { texts, targetLang } = req.body;
    if (!Array.isArray(texts) || !targetLang) {
      return res.status(400).json({ message: 'texts (array) and targetLang are required' });
    }
    const translations = await translateTexts(texts, targetLang);
    res.json({ translations });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
