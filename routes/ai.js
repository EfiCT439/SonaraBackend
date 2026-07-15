const express = require('express');
const router = express.Router();
const axios = require('axios');

const REPLICATE_API = 'https://api.replicate.com/v1';

function getHeaders() {
  return {
    Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN}`,
    'Content-Type': 'application/json',
  };
}

function buildPrompt(genre, title, description) {
  return `${genre} song titled "${title}". ${description}. Professional studio quality, high fidelity audio production, full arrangement.`;
}

// POST /api/ai/song — start a MusicGen prediction
router.post('/song', async (req, res) => {
  try {
    const { genre = 'Afrobeats', title = 'Untitled', description = '', duration = 30 } = req.body;

    if (!process.env.REPLICATE_API_TOKEN) {
      return res.status(500).json({ error: 'REPLICATE_API_TOKEN not set in .env' });
    }

    const prompt = buildPrompt(genre, title, description);

    const response = await axios.post(
      `${REPLICATE_API}/models/meta/musicgen/predictions`,
      {
        input: {
          prompt,
          model_version: 'stereo-large',
          output_format: 'mp3',
          output_quality: 80,
          duration: Math.min(duration, 30),
          normalization_strategy: 'peak',
        },
      },
      { headers: getHeaders() }
    );

    res.json({ predictionId: response.data.id, status: 'starting' });
  } catch (err) {
    console.error('[AI] Song generation start error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to start generation. Check REPLICATE_API_TOKEN.' });
  }
});

// GET /api/ai/song/status/:id — poll prediction status
router.get('/song/status/:id', async (req, res) => {
  try {
    if (!process.env.REPLICATE_API_TOKEN) {
      return res.status(500).json({ error: 'REPLICATE_API_TOKEN not set in .env' });
    }

    const response = await axios.get(
      `${REPLICATE_API}/predictions/${req.params.id}`,
      { headers: getHeaders() }
    );

    const { status, output, error } = response.data;

    if (status === 'succeeded') {
      const audioUrl = Array.isArray(output) ? output[0] : output;
      return res.json({ status: 'succeeded', audioUrl });
    }

    if (status === 'failed' || error) {
      return res.json({ status: 'failed', error: error || 'Generation failed' });
    }

    // 'starting' | 'processing'
    res.json({ status });
  } catch (err) {
    console.error('[AI] Status poll error:', err.response?.data || err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
