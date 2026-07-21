const express = require('express');
const router = express.Router();
const axios = require('axios');

const REPLICATE_API = 'https://api.replicate.com/v1';

// meta/musicgen is a community model, not one of Replicate's "official models".
// The /v1/models/{owner}/{name}/predictions shortcut only serves official models
// and 404s for everything else, so predictions must be created against a pinned
// version id via /v1/predictions instead.
// To refresh: GET /v1/models/meta/musicgen and copy `latest_version.id`.
const MUSICGEN_VERSION = '671ac645ce5e552cc63a54a2bbff63fcf798043055d2dac5fc9e36a837eedcfb';

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
      `${REPLICATE_API}/predictions`,
      {
        version: MUSICGEN_VERSION,
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
    const data = err.response?.data;
    const status = err.response?.status;
    console.error('[AI] Song generation start error:', data || err.message);

    // Surface the cause instead of always blaming the token — a throttle means the
    // account has no payment method, which is a very different fix.
    if (status === 429) {
      return res.status(429).json({
        error: data?.detail || 'Replicate is rate limiting this account. Add a payment method at replicate.com/account/billing.',
      });
    }
    if (status === 401) {
      return res.status(401).json({ error: 'Replicate rejected the API token. Check REPLICATE_API_TOKEN in .env.' });
    }
    res.status(500).json({ error: data?.detail || 'Failed to start generation.' });
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
