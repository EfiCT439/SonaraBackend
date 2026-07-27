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

// ─────────────────────────────────────────────────────────────────────────────
// Suno — full songs WITH vocals & lyrics (far beyond MusicGen's instrumentals).
//
// Suno has no official public API yet, so this targets a THIRD-PARTY provider
// (default: sunoapi.org, which mirrors Suno). It's unofficial — it can change or
// break, and licensing depends on Suno's EULA — so treat it as a stopgap until
// Suno's official partner API lands. Swap SUNO_API_BASE / SUNO_API_KEY in .env to
// change providers. The key stays SERVER-SIDE (never shipped in the app bundle).
// ─────────────────────────────────────────────────────────────────────────────
const SUNO_BASE = process.env.SUNO_API_BASE || 'https://api.sunoapi.org';
const SUNO_MODEL = process.env.SUNO_MODEL || 'V4_5PLUS';

function sunoHeaders() {
  return {
    Authorization: `Bearer ${process.env.SUNO_API_KEY}`,
    'Content-Type': 'application/json',
  };
}

// POST /api/ai/suno — start a Suno generation. Returns { taskId }.
router.post('/suno', async (req, res) => {
  try {
    if (!process.env.SUNO_API_KEY) {
      return res.status(500).json({ error: 'SUNO_API_KEY not set in .env' });
    }
    const { genre = 'Afrobeats', title = 'Untitled', description = '', instrumental = false } = req.body;

    // Non-custom mode: one descriptive prompt and Suno writes the whole song
    // (music + lyrics + vocals). Non-custom prompt is capped ~500 chars.
    const prompt = `${genre} song titled "${title}". ${description}`.slice(0, 480).trim();

    const { data } = await axios.post(
      `${SUNO_BASE}/api/v1/generate`,
      {
        customMode: false,
        instrumental: !!instrumental,
        model: SUNO_MODEL,
        prompt,
        // The provider requires a callback URL even though we poll below. A
        // placeholder is fine (we never rely on the push); set SUNO_CALLBACK_URL
        // to a public backend endpoint if you'd rather receive push callbacks.
        callBackUrl: process.env.SUNO_CALLBACK_URL || 'https://sonara.app/api/ai/suno/callback',
      },
      { headers: sunoHeaders() }
    );

    const taskId = data?.data?.taskId;
    if (!taskId) {
      return res.status(502).json({ error: data?.msg || 'Suno provider did not return a taskId.' });
    }
    res.json({ taskId, status: 'starting', provider: 'suno' });
  } catch (err) {
    const data = err.response?.data;
    console.error('[AI] Suno start error:', data || err.message);
    if (err.response?.status === 401) {
      return res.status(401).json({ error: 'Suno provider rejected the key. Check SUNO_API_KEY in .env.' });
    }
    res.status(err.response?.status || 500).json({ error: data?.msg || data?.error || 'Failed to start Suno generation.' });
  }
});

// GET /api/ai/suno/status/:taskId — poll a Suno generation.
// Normalized to the same shape the app already expects ({ status:'succeeded',
// audioUrl }), plus Suno extras (both tracks + cover art).
router.get('/suno/status/:taskId', async (req, res) => {
  try {
    if (!process.env.SUNO_API_KEY) {
      return res.status(500).json({ error: 'SUNO_API_KEY not set in .env' });
    }
    const { data } = await axios.get(
      `${SUNO_BASE}/api/v1/generate/record-info`,
      { headers: sunoHeaders(), params: { taskId: req.params.taskId } }
    );

    const d = data?.data || {};
    const status = d.status;
    const tracks = (d.response?.sunoData || [])
      .map((t) => ({
        id: t.id,
        title: t.title,
        audioUrl: t.audioUrl || t.streamAudioUrl,
        imageUrl: t.imageUrl,
        duration: t.duration,
      }))
      .filter((t) => t.audioUrl);

    const FAILED = ['CREATE_TASK_FAILED', 'GENERATE_AUDIO_FAILED', 'CALLBACK_EXCEPTION', 'SENSITIVE_WORD_ERROR'];

    if (status === 'SUCCESS' && tracks.length) {
      return res.json({
        status: 'succeeded',
        audioUrl: tracks[0].audioUrl,
        title: tracks[0].title,
        imageUrl: tracks[0].imageUrl,
        songs: tracks, // Suno returns two variants
      });
    }
    if (FAILED.includes(status)) {
      return res.json({ status: 'failed', error: status });
    }
    // PENDING | TEXT_SUCCESS | FIRST_SUCCESS → still generating
    res.json({ status: 'processing', stage: status });
  } catch (err) {
    console.error('[AI] Suno status error:', err.response?.data || err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
